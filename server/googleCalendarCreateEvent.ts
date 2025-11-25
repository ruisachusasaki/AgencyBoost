import { Request, Response } from 'express';
import { google } from 'googleapis';
import { db } from './db';
import { calendarConnections, calendarEvents, calendarAppointments, calendars } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  addGoogleMeet?: boolean;
  syncToGoogle?: boolean;
}

export async function createCalendarEvent(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, location, startTime, endTime, addGoogleMeet, syncToGoogle } = req.body as CreateEventRequest;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    console.log('[CreateEvent] Creating event:', { userId, title, startTime, endTime, addGoogleMeet, syncToGoogle });

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
        // Create OAuth2 client with the user's tokens
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
          access_token: connection.accessToken,
          refresh_token: connection.refreshToken,
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

        // Add Google Meet conference if requested
        if (addGoogleMeet && connection.twoWaySyncEnabled) {
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
              attendees: [],
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
        
        // If token expired, try to refresh
        if (googleError.code === 401) {
          return res.status(401).json({ 
            error: 'Google Calendar authentication expired. Please reconnect your calendar.',
            needsReauth: true 
          });
        }
        
        // Fall back to creating local event only
        console.log('[CreateEvent] Falling back to local event creation');
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
