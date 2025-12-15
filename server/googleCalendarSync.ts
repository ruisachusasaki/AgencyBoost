/**
 * Google Calendar Sync Service
 * Handles two-way synchronization between Google Calendar and AgencyBoost
 */

import { db } from './db';
import { 
  calendarConnections, 
  calendarSyncState, 
  calendarEvents,
  clientAppointments,
  clients,
  CalendarConnection,
  CalendarSyncState
} from '@shared/schema';
import { eq, and, gte, lte, or, not, inArray } from 'drizzle-orm';
import { getUserCalendarClient } from './googleCalendarUtils';
import { calendar_v3 } from 'googleapis';

interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

/**
 * Syncs a user's Google Calendar with AgencyBoost
 */
export async function syncUserCalendar(
  userId: string,
  calendarId: string = 'primary'
): Promise<SyncResult> {
  console.log('[syncUserCalendar] Starting sync for user:', userId, 'calendar:', calendarId);
  
  const result: SyncResult = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [],
  };
  
  let connection: CalendarConnection | undefined;
  
  try {
    // Get the calendar connection
    connection = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.calendarId, calendarId)
      ),
    });
    
    console.log('[syncUserCalendar] Connection found:', !!connection, {
      id: connection?.id,
      syncEnabled: connection?.syncEnabled,
      hasAccessToken: !!connection?.accessToken
    });
    
    if (!connection || !connection.syncEnabled) {
      throw new Error('Calendar sync is not enabled');
    }
    
    // Update sync state to in_progress
    console.log('[syncUserCalendar] Updating sync state to in_progress');
    await db.update(calendarSyncState)
      .set({
        lastSyncStarted: new Date(),
        lastSyncStatus: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(calendarSyncState.connectionId, connection.id));
    
    // Get Google Calendar client
    console.log('[syncUserCalendar] Getting Google Calendar client');
    const calendar = await getUserCalendarClient(userId, calendarId);
    
    // Pull events from Google Calendar
    const pullResult = await pullGoogleEvents(calendar, connection);
    result.eventsCreated += pullResult.eventsCreated;
    result.eventsUpdated += pullResult.eventsUpdated;
    result.eventsDeleted += pullResult.eventsDeleted;
    
    // Push AgencyBoost appointments to Google Calendar (if two-way sync is enabled)
    if (connection.twoWaySync) {
      const pushResult = await pushAgencyBoostAppointments(calendar, connection);
      result.eventsCreated += pushResult.eventsCreated;
      result.eventsUpdated += pushResult.eventsUpdated;
    }
    
    // Update sync state to success
    await db.update(calendarSyncState)
      .set({
        lastSyncCompleted: new Date(),
        lastSyncStatus: 'success',
        eventsCreated: result.eventsCreated,
        eventsUpdated: result.eventsUpdated,
        eventsDeleted: result.eventsDeleted,
        lastSyncError: null,
        updatedAt: new Date(),
      })
      .where(eq(calendarSyncState.connectionId, connection.id));
    
    // Update last synced timestamp
    await db.update(calendarConnections)
      .set({
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connection.id));
    
    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    
    // Update sync state with error
    if (connection) {
      await db.update(calendarSyncState)
        .set({
          lastSyncCompleted: new Date(),
          lastSyncStatus: 'failed',
          lastSyncError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(calendarSyncState.connectionId, connection.id));
    }
  }
  
  return result;
}

/**
 * Pulls events from Google Calendar and stores them locally
 */
async function pullGoogleEvents(
  calendar: any,
  connection: CalendarConnection
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [],
  };
  
  try {
    // Set time range for sync (past 365 days to next 365 days)
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 365);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 365);
    
    console.log('[pullGoogleEvents] Fetching events from', timeMin.toISOString(), 'to', timeMax.toISOString());
    
    // List events from Google Calendar
    // Note: Cannot use syncToken with timeMin/timeMax
    const response = await calendar.events.list({
      calendarId: connection.calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 2500,  // Increased from 250 to get more events
      singleEvents: true,
      orderBy: 'startTime',
      // Don't use syncToken with time range parameters
    });
    
    const googleEvents = response.data.items || [];
    const nextSyncToken = response.data.nextSyncToken;
    
    console.log(`[pullGoogleEvents] Found ${googleEvents.length} events in Google Calendar`);
    
    // Get existing synced events
    const existingEvents = await db.query.calendarEvents.findMany({
      where: eq(calendarEvents.connectionId, connection.id),
    });
    
    console.log(`[pullGoogleEvents] Found ${existingEvents.length} existing synced events in database`);
    
    const existingEventMap = new Map(
      existingEvents.map(event => [event.googleEventId, event])
    );
    
    // Process each Google event
    for (const googleEvent of googleEvents) {
      if (!googleEvent.id) continue;
      
      const existingEvent = existingEventMap.get(googleEvent.id);
      
      // Parse event data
      const eventData = {
        connectionId: connection.id,
        googleEventId: googleEvent.id,
        summary: googleEvent.summary || 'Untitled Event',
        description: googleEvent.description || null,
        location: googleEvent.location || null,
        startTime: parseEventTime(googleEvent.start),
        endTime: parseEventTime(googleEvent.end),
        allDay: !googleEvent.start?.dateTime,
        status: googleEvent.status || 'confirmed',
        visibility: googleEvent.visibility || 'default',
        transparency: googleEvent.transparency || 'opaque',
        attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
        organizer: googleEvent.organizer ? JSON.stringify(googleEvent.organizer) : null,
        recurrence: googleEvent.recurrence ? JSON.stringify(googleEvent.recurrence) : null,
        googleHtmlLink: googleEvent.htmlLink || null,
        googleHangoutLink: googleEvent.hangoutLink || null,
      };
      
      if (existingEvent) {
        // Update existing event
        await db.update(calendarEvents)
          .set({
            ...eventData,
            syncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(calendarEvents.id, existingEvent.id));
        result.eventsUpdated++;
      } else {
        // Create new event
        const [newEvent] = await db.insert(calendarEvents)
          .values(eventData)
          .returning();
        result.eventsCreated++;
        
        // If configured, create contacts from attendees
        if (connection.createContacts && googleEvent.attendees) {
          await createContactsFromAttendees(googleEvent.attendees);
        }
        
        // If configured, trigger workflows
        if (connection.triggerWorkflows) {
          await triggerWorkflowForEvent(newEvent, 'google_calendar_event_created');
        }
      }
      
      // Remove from existing map to track deletions
      existingEventMap.delete(googleEvent.id);
    }
    
    // Delete events that no longer exist in Google Calendar
    const eventsToDelete = Array.from(existingEventMap.values());
    if (eventsToDelete.length > 0) {
      const eventIdsToDelete = eventsToDelete.map(e => e.id);
      await db.delete(calendarEvents)
        .where(inArray(calendarEvents.id, eventIdsToDelete));
      result.eventsDeleted = eventsToDelete.length;
    }
    
    // Don't update sync token when using time range parameters
    // syncToken is incompatible with timeMin/timeMax
    
    console.log(`[pullGoogleEvents] Sync complete: Created ${result.eventsCreated}, Updated ${result.eventsUpdated}, Deleted ${result.eventsDeleted} events`);
    
    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

/**
 * Pushes AgencyBoost appointments to Google Calendar
 */
async function pushAgencyBoostAppointments(
  calendar: any,
  connection: CalendarConnection
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [],
  };
  
  try {
    // Get appointments that need to be synced
    const appointments = await db.query.clientAppointments.findMany({
      where: and(
        eq(clientAppointments.assignedToId, connection.userId),
        or(
          eq(clientAppointments.googleEventId, null),
          not(eq(clientAppointments.updatedAt, clientAppointments.lastGoogleSyncAt))
        )
      ),
      with: {
        client: true,
        lead: true,
      },
    });
    
    for (const appointment of appointments) {
      try {
        const eventData = {
          summary: appointment.title,
          description: appointment.description || undefined,
          location: appointment.location || undefined,
          start: {
            dateTime: appointment.startTime.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: appointment.endTime.toISOString(),
            timeZone: 'UTC',
          },
          attendees: appointment.attendees ? JSON.parse(appointment.attendees as string) : undefined,
          reminders: {
            useDefault: false,
            overrides: appointment.reminderMinutes
              ? [{ method: 'email', minutes: appointment.reminderMinutes }]
              : undefined,
          },
        };
        
        let googleEventId: string;
        
        if (appointment.googleEventId) {
          // Update existing Google event
          const updateResult = await calendar.events.update({
            calendarId: connection.calendarId,
            eventId: appointment.googleEventId,
            requestBody: eventData,
          });
          googleEventId = updateResult.data.id;
          result.eventsUpdated++;
        } else {
          // Create new Google event
          const createResult = await calendar.events.insert({
            calendarId: connection.calendarId,
            requestBody: eventData,
          });
          googleEventId = createResult.data.id;
          result.eventsCreated++;
        }
        
        // Update appointment with Google Event ID and sync timestamp
        await db.update(clientAppointments)
          .set({
            googleEventId,
            lastGoogleSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(clientAppointments.id, appointment.id));
        
      } catch (error) {
        console.error(`Error syncing appointment ${appointment.id}:`, error);
        result.errors.push(`Failed to sync appointment: ${appointment.title}`);
      }
    }
    
    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

/**
 * Parses Google Calendar event time
 */
function parseEventTime(eventTime: any): Date {
  if (eventTime?.dateTime) {
    return new Date(eventTime.dateTime);
  } else if (eventTime?.date) {
    return new Date(eventTime.date);
  }
  return new Date();
}

/**
 * Creates contacts from event attendees
 */
async function createContactsFromAttendees(attendees: any[]) {
  for (const attendee of attendees) {
    if (!attendee.email) continue;
    
    // Check if contact already exists
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.email, attendee.email),
    });
    
    if (!existingClient) {
      // Create new client/contact
      const names = (attendee.displayName || attendee.email).split(' ');
      const firstName = names[0] || attendee.email.split('@')[0];
      const lastName = names.slice(1).join(' ') || '';
      
      await db.insert(clients).values({
        name: `${firstName} ${lastName}`.trim(),
        email: attendee.email,
        source: 'Google Calendar',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

/**
 * Triggers workflow for calendar event
 */
async function triggerWorkflowForEvent(event: any, triggerType: string) {
  // This would integrate with the existing workflow engine
  // Implementation depends on the workflow system architecture
  console.log(`Triggering workflow: ${triggerType} for event ${event.id}`);
  // TODO: Implement workflow trigger integration
}

/**
 * Gets busy times from Google Calendar for availability checking
 */
export async function getGoogleCalendarBusyTimes(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<Array<{ start: Date; end: Date }>> {
  try {
    const connections = await db.query.calendarConnections.findMany({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.syncEnabled, true)
      ),
    });
    
    const busyTimes: Array<{ start: Date; end: Date }> = [];
    
    for (const connection of connections) {
      const calendar = await getUserCalendarClient(userId, connection.calendarId);
      
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: connection.calendarId }],
        },
      });
      
      const calendarBusy = response.data.calendars?.[connection.calendarId]?.busy || [];
      
      for (const busy of calendarBusy) {
        if (busy.start && busy.end) {
          busyTimes.push({
            start: new Date(busy.start),
            end: new Date(busy.end),
          });
        }
      }
    }
    
    return busyTimes;
  } catch (error) {
    console.error('Error fetching Google Calendar busy times:', error);
    return [];
  }
}