// Google Calendar Incremental Sync - Uses syncToken for efficient updates
import { google, calendar_v3 } from 'googleapis';
import { db } from './db';
import { calendarConnections, calendarEvents, calendarSyncState, calendarEventCache } from '@shared/schema';
import { eq, and, lte, gte, sql, inArray } from 'drizzle-orm';
import { decrypt } from './encryption';
import { contactCreator } from './googleCalendarContactCreation';

const SYNC_WINDOW_PAST_DAYS = 90;
const SYNC_WINDOW_FUTURE_DAYS = 365;
const CACHE_DAYS_AHEAD = 7;
const MAX_RESULTS_PER_PAGE = 250;

interface SyncResult {
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  syncToken?: string;
  error?: string;
}

export class GoogleCalendarIncrementalSync {
  private calendar: calendar_v3.Calendar;
  
  constructor() {
    this.calendar = google.calendar('v3');
  }

  // Main sync method - uses syncToken for incremental updates
  async syncUserCalendar(connectionId: string): Promise<SyncResult> {
    const result: SyncResult = {
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
    };

    try {
      // Get connection details
      const connection = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, connectionId))
        .limit(1);

      if (!connection.length || !connection[0].syncEnabled) {
        throw new Error('Connection not found or sync disabled');
      }

      const conn = connection[0];
      const accessToken = decrypt(conn.accessToken);
      
      // Set up OAuth client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      // Get or create sync state
      let syncState = await db
        .select()
        .from(calendarSyncState)
        .where(eq(calendarSyncState.connectionId, connectionId))
        .limit(1);

      const isInitialSync = !syncState.length || !syncState[0]?.nextSyncToken;
      
      // Update sync start time
      if (syncState.length) {
        await db
          .update(calendarSyncState)
          .set({
            lastSyncStarted: new Date(),
            lastSyncStatus: 'in_progress',
          })
          .where(eq(calendarSyncState.connectionId, connectionId));
      } else {
        await db.insert(calendarSyncState).values({
          connectionId,
          lastSyncStarted: new Date(),
          lastSyncStatus: 'in_progress',
        });
      }

      // Sync parameters
      const syncParams: calendar_v3.Params$Resource$Events$List = {
        calendarId: conn.calendarId || 'primary',
        maxResults: MAX_RESULTS_PER_PAGE,
        showDeleted: true, // Important for incremental sync
        singleEvents: true, // Expand recurring events
      };

      if (isInitialSync) {
        // Initial sync - get events within time window
        const now = new Date();
        const timeMin = new Date(now);
        timeMin.setDate(now.getDate() - SYNC_WINDOW_PAST_DAYS);
        const timeMax = new Date(now);
        timeMax.setDate(now.getDate() + SYNC_WINDOW_FUTURE_DAYS);
        
        syncParams.timeMin = timeMin.toISOString();
        syncParams.timeMax = timeMax.toISOString();
        syncParams.orderBy = 'startTime';
        
        // Use pageToken for initial sync if available
        if (conn.pageToken) {
          syncParams.pageToken = conn.pageToken;
        }
        
        console.log(`📅 Initial sync for ${conn.email}: ${timeMin.toDateString()} to ${timeMax.toDateString()}`);
      } else {
        // Incremental sync - use syncToken
        syncParams.syncToken = syncState[0].nextSyncToken;
        console.log(`🔄 Incremental sync for ${conn.email} using syncToken`);
      }

      // Process all pages
      let pageToken: string | undefined;
      let nextSyncToken: string | undefined;
      const processedEventIds = new Set<string>();

      do {
        if (pageToken) {
          syncParams.pageToken = pageToken;
        }

        const response = await this.calendar.events.list({
          ...syncParams,
          auth: oauth2Client,
        });

        const items = response.data.items || [];
        nextSyncToken = response.data.nextSyncToken;
        pageToken = response.data.nextPageToken;

        // Save pageToken for resume capability during initial sync
        if (isInitialSync && pageToken) {
          await db
            .update(calendarConnections)
            .set({ pageToken })
            .where(eq(calendarConnections.id, connectionId));
        }

        // Process each event
        for (const event of items) {
          if (!event.id) continue;
          
          processedEventIds.add(event.id);

          // Check if event is deleted
          if (event.status === 'cancelled') {
            // Delete from our database
            const deleted = await db
              .delete(calendarEvents)
              .where(
                and(
                  eq(calendarEvents.connectionId, connectionId),
                  eq(calendarEvents.googleEventId, event.id)
                )
              );
            
            if (deleted) {
              result.eventsDeleted++;
            }
            continue;
          }

          // Skip events outside our window (for incremental sync)
          if (!isInitialSync) {
            const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
            const now = new Date();
            const windowStart = new Date(now);
            windowStart.setDate(now.getDate() - SYNC_WINDOW_PAST_DAYS);
            const windowEnd = new Date(now);
            windowEnd.setDate(now.getDate() + SYNC_WINDOW_FUTURE_DAYS);
            
            if (eventStart < windowStart || eventStart > windowEnd) {
              continue;
            }
          }

          // Prepare event data (including Google Meet link)
          const eventData = {
            connectionId,
            googleEventId: event.id,
            summary: event.summary || 'Untitled',
            description: event.description || null,
            location: event.location || null,
            startTime: new Date(event.start?.dateTime || event.start?.date || ''),
            endTime: new Date(event.end?.dateTime || event.end?.date || ''),
            allDay: !event.start?.dateTime,
            status: event.status || 'confirmed',
            transparency: event.transparency || 'opaque',
            googleHangoutLink: event.hangoutLink || null,
            googleHtmlLink: event.htmlLink || null,
            attendees: conn.createContacts && event.attendees 
              ? event.attendees.map(a => ({
                  email: a.email,
                  name: a.displayName,
                  responseStatus: a.responseStatus,
                }))
              : null,
            organizer: event.organizer ? {
              email: event.organizer.email,
              displayName: event.organizer.displayName,
              self: event.organizer.self,
            } : null,
            organizerEmail: event.organizer?.email,
            etag: event.etag,
            lastModified: event.updated ? new Date(event.updated) : new Date(),
            isRecurring: !!event.recurringEventId,
            syncedAt: new Date(),
            updatedAt: new Date(),
          };

          // Upsert event
          const existing = await db
            .select()
            .from(calendarEvents)
            .where(
              and(
                eq(calendarEvents.connectionId, connectionId),
                eq(calendarEvents.googleEventId, event.id)
              )
            )
            .limit(1);

          if (existing.length) {
            // Update existing event
            await db
              .update(calendarEvents)
              .set(eventData)
              .where(eq(calendarEvents.id, existing[0].id));
            result.eventsUpdated++;
          } else {
            // Create new event
            await db.insert(calendarEvents).values(eventData);
            result.eventsCreated++;
          }
          
          // Process attendees to create contacts if enabled (for both new and updated events)
          if (conn.createContacts && event.attendees && event.attendees.length > 0) {
            const attendeeResult = await contactCreator.processEventAttendees(
              event.attendees.map(a => ({
                email: a.email || '',
                displayName: a.displayName,
                responseStatus: a.responseStatus
              })),
              connectionId,
              event.summary
            );
            
            if (attendeeResult.contactsCreated > 0) {
              console.log(`📧 Created ${attendeeResult.contactsCreated} contacts from event attendees`);
            }
            if (attendeeResult.contactsUpdated > 0) {
              console.log(`📝 Updated ${attendeeResult.contactsUpdated} existing contacts from event attendees`);
            }
          }
        }

        // Clear pageToken when page is complete during initial sync
        if (isInitialSync && !pageToken) {
          await db
            .update(calendarConnections)
            .set({ pageToken: null })
            .where(eq(calendarConnections.id, connectionId));
        }

      } while (pageToken);

      // Store the syncToken for next incremental sync
      if (nextSyncToken) {
        await db
          .update(calendarSyncState)
          .set({
            lastSyncCompleted: new Date(),
            lastSyncStatus: 'success',
            eventsCreated: result.eventsCreated,
            eventsUpdated: result.eventsUpdated,
            eventsDeleted: result.eventsDeleted,
            nextSyncToken,
          })
          .where(eq(calendarSyncState.connectionId, connectionId));
        
        await db
          .update(calendarConnections)
          .set({
            syncToken: nextSyncToken,
            lastSyncedAt: new Date(),
            pageToken: null, // Clear pageToken on successful completion
          })
          .where(eq(calendarConnections.id, connectionId));

        result.syncToken = nextSyncToken;
      }

      // Clean up old events outside window
      await this.cleanupOldEvents(connectionId);
      
      // Update cache for next 7 days
      await this.updateEventCache(conn.userId);

      console.log(`✅ Sync complete for ${conn.email}: +${result.eventsCreated}, ~${result.eventsUpdated}, -${result.eventsDeleted}`);
      
      return result;
      
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update sync state with error
      await db
        .update(calendarSyncState)
        .set({
          lastSyncStatus: 'failed',
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(calendarSyncState.connectionId, connectionId));
      
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  // Clean up events outside the sync window
  private async cleanupOldEvents(connectionId: string) {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - SYNC_WINDOW_PAST_DAYS);
    
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.connectionId, connectionId),
          lte(calendarEvents.endTime, cutoffDate)
        )
      );
  }

  // Update the event cache for fast availability checks
  private async updateEventCache(userId: string) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + CACHE_DAYS_AHEAD);

    // Get all connections for this user
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));

    if (!connections.length) return;

    // Process each day in the cache window
    for (let d = 0; d < CACHE_DAYS_AHEAD; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      date.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Get all busy slots for this day across all calendars
      const events = await db
        .select({
          startTime: calendarEvents.startTime,
          endTime: calendarEvents.endTime,
        })
        .from(calendarEvents)
        .where(
          and(
            inArray(calendarEvents.connectionId, connections.map(c => c.id)),
            gte(calendarEvents.startTime, date),
            lte(calendarEvents.startTime, dayEnd),
            eq(calendarEvents.transparency, 'opaque'), // Only busy events
            eq(calendarEvents.status, 'confirmed')
          )
        );

      // Merge overlapping slots
      const busySlots = this.mergeOverlappingSlots(
        events.map(e => ({ start: e.startTime, end: e.endTime }))
      );

      // Upsert cache entry
      const dateStr = date.toISOString().split('T')[0];
      await db
        .insert(calendarEventCache)
        .values({
          userId,
          date: dateStr,
          busySlots,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [calendarEventCache.userId, calendarEventCache.date],
          set: {
            busySlots,
            lastUpdated: new Date(),
          },
        });
    }
  }

  // Merge overlapping time slots for efficient availability checking
  private mergeOverlappingSlots(slots: Array<{ start: Date; end: Date }>): any[] {
    if (!slots.length) return [];
    
    // Sort by start time
    slots.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    const merged = [slots[0]];
    
    for (let i = 1; i < slots.length; i++) {
      const current = slots[i];
      const last = merged[merged.length - 1];
      
      if (current.start <= last.end) {
        // Overlapping or adjacent - merge
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      } else {
        // Non-overlapping - add as new slot
        merged.push(current);
      }
    }
    
    return merged.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    }));
  }

  // Check if a time slot is available
  async checkAvailability(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const dateStr = startTime.toISOString().split('T')[0];
    
    // Check cache first
    const cache = await db
      .select()
      .from(calendarEventCache)
      .where(
        and(
          eq(calendarEventCache.userId, userId),
          eq(calendarEventCache.date, dateStr)
        )
      )
      .limit(1);

    if (cache.length) {
      const busySlots = cache[0].busySlots as any[];
      
      // Check if requested time overlaps with any busy slot
      for (const slot of busySlots) {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        
        if (startTime < slotEnd && endTime > slotStart) {
          return false; // Conflict found
        }
      }
      return true; // No conflicts
    }

    // Cache miss - query database directly
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));

    if (!connections.length) return true;

    const conflicts = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          inArray(calendarEvents.connectionId, connections.map(c => c.id)),
          lte(calendarEvents.startTime, endTime),
          gte(calendarEvents.endTime, startTime),
          eq(calendarEvents.transparency, 'opaque'),
          eq(calendarEvents.status, 'confirmed')
        )
      )
      .limit(1);

    return conflicts.length === 0;
  }
}

export const incrementalSync = new GoogleCalendarIncrementalSync();