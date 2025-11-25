import { Request, Response } from 'express';
import { google } from 'googleapis';
import { db } from './db';
import { calendarConnections, calendarEvents, calendarAppointments, calendars } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { EncryptionService } from './encryption';
import { createOAuth2Client } from './googleCalendarUtils';

interface Guest {
  id: string;
  name: string;
  email: string;
}

interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  addGoogleMeet?: boolean;
  syncToGoogle?: boolean;
  guests?: Guest[];
}

export async function createCalendarEvent(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, location, startTime, endTime, addGoogleMeet, syncToGoogle, guests } = req.body as CreateEventRequest;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    console.log('[CreateEvent] Creating event:', { userId, title, startTime, endTime, addGoogleMeet, syncToGoogle, guestCount: guests?.length || 0 });

    let googleEventId: string | null = null;
    let googleHangoutLink: string | null = null;
    let googleHtmlLink: string | null = null;
    let syncedToGoogle = false;

    // Check if user has a Google Calendar connection
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.syncEnabled, true)
      ))
      .limit(1);

    // If user has Google Calendar sync enabled and wants to sync
    if (connection && syncToGoogle) {
      try {
        // Decrypt the stored tokens
        const accessToken = EncryptionService.decrypt(connection.accessToken);
        let refreshToken: string | null = null;
        if (connection.refreshToken) {
          refreshToken = EncryptionService.decrypt(connection.refreshToken);
        }

        // Create OAuth2 client with the user's decrypted tokens
        const oauth2Client = createOAuth2Client();
        oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Handle token refresh - save new tokens to database
        oauth2Client.on('tokens', async (tokens) => {
          if (tokens.access_token) {
            const updateData: any = {
              accessToken: EncryptionService.encrypt(tokens.access_token),
              updatedAt: new Date(),
            };
            if (tokens.refresh_token) {
              updateData.refreshToken = EncryptionService.encrypt(tokens.refresh_token);
            }
            await db.update(calendarConnections)
              .set(updateData)
              .where(eq(calendarConnections.id, connection.id));
            console.log('[CreateEvent] Updated tokens in database');
          }
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Build the event object
        const eventResource: any = {
          summary: title,
          description: description || '',
          location: location || '',
          start: {
            dateTime: startTime,
            timeZone: 'UTC',
          },
          end: {
            dateTime: endTime,
            timeZone: 'UTC',
          },
        };

        // Add attendees/guests if provided
        if (guests && guests.length > 0) {
          eventResource.attendees = guests.map(guest => ({
            email: guest.email,
            displayName: guest.name,
          }));
          console.log('[CreateEvent] Adding attendees:', eventResource.attendees);
        }

        // Add Google Meet conference if requested
        if (addGoogleMeet && connection.twoWaySync) {
          eventResource.conferenceData = {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          };
        }

        console.log('[CreateEvent] Creating Google Calendar event:', eventResource);

        // Create the event in Google Calendar
        const googleEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventResource,
          conferenceDataVersion: addGoogleMeet ? 1 : 0,
          sendUpdates: guests && guests.length > 0 ? 'all' : 'none', // Send email invitations to guests
        });

        if (googleEvent.data) {
          googleEventId = googleEvent.data.id || null;
          googleHangoutLink = googleEvent.data.hangoutLink || null;
          googleHtmlLink = googleEvent.data.htmlLink || null;
          syncedToGoogle = true;

          console.log('[CreateEvent] Google Calendar event created:', {
            id: googleEventId,
            hangoutLink: googleHangoutLink,
            htmlLink: googleHtmlLink
          });

          // Store the event in the calendar_events table (for synced events)
          const attendeeEmails = guests?.map(g => g.email) || [];
          const newCalendarEvent = await db
            .insert(calendarEvents)
            .values({
              id: randomUUID(),
              connectionId: connection.id,
              googleEventId: googleEventId!,
              summary: title,
              description: description || null,
              location: location || null,
              startTime: new Date(startTime),
              endTime: new Date(endTime),
              status: 'confirmed',
              googleHangoutLink: googleHangoutLink,
              googleHtmlLink: googleHtmlLink,
              organizerEmail: connection.email,
              attendees: attendeeEmails,
              allDay: false,
              transparency: 'opaque',
              isRecurring: false,
              createdInAgencyFlow: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          return res.json({
            success: true,
            event: newCalendarEvent[0],
            syncedToGoogle: true,
            googleEventId,
            meetingLink: googleHangoutLink,
          });
        }
      } catch (googleError: any) {
        console.error('[CreateEvent] Google Calendar API error:', googleError);
        
        // Check for authentication errors that require re-authentication
        const isInvalidGrant = googleError.message?.includes('invalid_grant') || 
          googleError.response?.data?.error === 'invalid_grant';
        const isTokenExpired = googleError.code === 401;
        
        if (isInvalidGrant || isTokenExpired) {
          // Mark connection as needing re-authentication
          await db.update(calendarConnections)
            .set({ 
              syncEnabled: false,
              updatedAt: new Date() 
            })
            .where(eq(calendarConnections.id, connection.id));
          
          console.log('[CreateEvent] Google Calendar auth expired - connection disabled');
          
          return res.status(401).json({ 
            error: 'Your Google Calendar connection has expired. Please disconnect and reconnect your Google Calendar in Settings.',
            needsReauth: true 
          });
        }
        
        // Fall back to creating local event only for other errors
        console.log('[CreateEvent] Falling back to local event creation due to error:', googleError.message);
      }
    }

    // If no Google sync or Google sync failed, create a local appointment
    // First, get or create a default calendar for the user
    let [defaultCalendar] = await db
      .select()
      .from(calendars)
      .where(eq(calendars.createdBy, userId))
      .limit(1);

    if (!defaultCalendar) {
      // Create a default calendar for the user
      const newCalendar = await db
        .insert(calendars)
        .values({
          id: randomUUID(),
          name: 'My Calendar',
          description: 'Default calendar',
          type: 'personal',
          customUrl: `calendar-${userId.slice(0, 8)}`,
          isActive: true,
          color: '#00C9C6',
          duration: 30,
          createdBy: userId,
        })
        .returning();
      
      defaultCalendar = newCalendar[0];
    }

    // Create local calendar appointment (supports null clientId)
    const newAppointment = await db
      .insert(calendarAppointments)
      .values({
        id: randomUUID(),
        calendarId: defaultCalendar.id,
        clientId: null,
        assignedTo: userId,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'confirmed',
        location: location || null,
        meetingLink: googleHangoutLink,
        timezone: 'UTC',
        bookerName: null,
        bookerEmail: '',
        bookingSource: 'agencyflow',
        externalEventId: googleEventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.json({
      success: true,
      event: newAppointment[0],
      syncedToGoogle,
      googleEventId,
      meetingLink: googleHangoutLink,
    });

  } catch (error: any) {
    console.error('[CreateEvent] Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
}
