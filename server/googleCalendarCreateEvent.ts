import { Request, Response } from 'express';
import { google } from 'googleapis';
import { db } from './db';
import { calendarConnections, calendarEvents, calendarAppointments, calendars, eventTimeEntries, staff, tasks, oneOnOneMeetings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { EncryptionService } from './encryption';
import { createOAuth2Client } from './googleCalendarUtils';
import { findFathomRecording } from './fathomService';
import { storage as appStorage } from './storage';

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
  clientId?: string; // Optional client association for time tracking
}

export async function createCalendarEvent(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, location, startTime, endTime, addGoogleMeet, syncToGoogle, guests, clientId } = req.body as CreateEventRequest;

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
              clientId: clientId || null,
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
              createdInAgencyBoost: true,
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

    // Create local calendar appointment (supports clientId)
    const newAppointment = await db
      .insert(calendarAppointments)
      .values({
        id: randomUUID(),
        calendarId: defaultCalendar.id,
        clientId: clientId || null,
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

interface UpdateAppointmentStatusRequest {
  appointmentStatus: 'confirmed' | 'showed' | 'no_show' | 'cancelled';
}

// Update appointment status and auto-create time entry when "Showed"
export async function updateCalendarEventStatus(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { eventId } = req.params;
    const { appointmentStatus } = req.body as UpdateAppointmentStatusRequest;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!appointmentStatus || !['confirmed', 'showed', 'no_show', 'cancelled'].includes(appointmentStatus)) {
      return res.status(400).json({ error: 'Valid appointment status is required (confirmed, showed, no_show, cancelled)' });
    }

    console.log('[UpdateEventStatus] Updating event status:', { userId, eventId, appointmentStatus });

    // Get the calendar event
    const [existingEvent] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId))
      .limit(1);

    if (!existingEvent) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    // Check if user has access to this event (via connection)
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.id, existingEvent.connectionId))
      .limit(1);

    if (!connection || connection.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this event' });
    }

    // Update the event status
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({
        appointmentStatus,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, eventId))
      .returning();

    // If status changed to "showed" and time entry hasn't been created yet, create a task with time tracking
    if (appointmentStatus === 'showed' && !existingEvent.timeEntryCreated) {
      try {
        // Calculate duration in minutes
        const startTime = new Date(existingEvent.startTime);
        const endTime = new Date(existingEvent.endTime);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));

        // Create a task named "Meeting: {event_name}" with the time entry
        const taskId = randomUUID();
        const timeEntryId = randomUUID();
        const eventTitle = existingEvent.summary || 'Untitled Event';
        
        const timeEntry = {
          id: timeEntryId,
          userId: userId,
          userName: '', // Will be populated by the UI
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: durationMinutes,
          description: `Auto-logged from calendar event: ${eventTitle}`,
          source: 'calendar_auto',
        };

        // Try to find Fathom recording for this event
        let fathomRecordingUrl: string | null = null;
        try {
          // Get user's Fathom API key from staff record
          const [staffRecord] = await db
            .select()
            .from(staff)
            .where(eq(staff.id, userId))
            .limit(1);

          if ((staffRecord as any)?.fathomApiKey) {
            console.log('[UpdateEventStatus] Searching for Fathom recording...');
            fathomRecordingUrl = await findFathomRecording(
              (staffRecord as any).fathomApiKey,
              startTime,
              endTime,
              eventTitle
            );
            if (fathomRecordingUrl) {
              console.log('[UpdateEventStatus] Found Fathom recording:', fathomRecordingUrl);
            } else {
              console.log('[UpdateEventStatus] No Fathom recording found for this event');
            }
          }
        } catch (fathomError) {
          console.error('[UpdateEventStatus] Error fetching Fathom recording:', fathomError);
          // Continue without Fathom recording
        }

        // Find linked 1-on-1 meeting (if this Google event is from a 1-on-1 meeting)
        // Note: 1-on-1 meetings store the google_event_id, not the internal database ID
        let linkedMeetingId: string | null = null;
        try {
          const [linkedMeeting] = await db
            .select({ id: oneOnOneMeetings.id, recordingLink: oneOnOneMeetings.recordingLink })
            .from(oneOnOneMeetings)
            .where(eq(oneOnOneMeetings.calendarEventId, existingEvent.googleEventId))
            .limit(1);

          if (linkedMeeting) {
            linkedMeetingId = linkedMeeting.id;
            console.log('[UpdateEventStatus] Found linked 1-on-1 meeting:', linkedMeetingId);

            // If Fathom recording found and meeting doesn't already have a recording link, update it
            if (fathomRecordingUrl && !linkedMeeting.recordingLink) {
              await db
                .update(oneOnOneMeetings)
                .set({
                  recordingLink: fathomRecordingUrl,
                  updatedAt: new Date(),
                })
                .where(eq(oneOnOneMeetings.id, linkedMeetingId));
              console.log('[UpdateEventStatus] Updated 1-on-1 meeting with Fathom recording link');
            }
          }
        } catch (meetingLinkError) {
          console.error('[UpdateEventStatus] Error linking to 1-on-1 meeting:', meetingLinkError);
        }

        // Create the task with time tracking
        const [createdTask] = await db
          .insert(tasks)
          .values({
            id: taskId,
            title: `Meeting: ${eventTitle}`,
            description: existingEvent.description || `Time tracked from calendar event on ${startTime.toLocaleDateString()}`,
            status: 'completed', // Meeting happened, so task is completed
            priority: 'normal',
            assignedTo: userId,
            clientId: existingEvent.clientId,
            dueDate: startTime,
            startDate: startTime,
            timeEstimate: durationMinutes,
            timeTracked: durationMinutes * 60,
            visibleToClient: false,
            fathomRecordingUrl: fathomRecordingUrl,
            calendarEventId: eventId,
            oneOnOneMeetingId: linkedMeetingId,
          } as any)
          .returning();

        // Insert per-row time entry into normalized task_time_entries table.
        await appStorage.appendTaskTimeEntry({
          id: timeEntry.id,
          taskId,
          userId,
          taskTitle: `Meeting: ${eventTitle}`,
          userName: timeEntry.userName,
          startTime,
          endTime,
          duration: durationMinutes * 60,
          isRunning: false,
          source: 'auto',
          notes: timeEntry.description,
        });

        // Also create an event_time_entries record for backup/tracking
        await db
          .insert(eventTimeEntries)
          .values({
            id: timeEntryId,
            calendarEventId: eventId,
            userId: userId,
            clientId: existingEvent.clientId,
            title: eventTitle,
            description: existingEvent.description || null,
            startTime: startTime,
            endTime: endTime,
            duration: durationMinutes,
            source: 'auto',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        // Mark the event as having a time entry created
        await db
          .update(calendarEvents)
          .set({
            timeEntryCreated: true,
            updatedAt: new Date(),
          })
          .where(eq(calendarEvents.id, eventId));

        console.log('[UpdateEventStatus] Auto-created task with time tracking:', { 
          taskId: createdTask.id,
          taskTitle: createdTask.title,
          duration: durationMinutes,
          clientId: existingEvent.clientId,
          linkedMeetingId 
        });

        return res.json({
          success: true,
          event: { ...updatedEvent, timeEntryCreated: true },
          task: createdTask,
          linkedMeetingId: linkedMeetingId,
          fathomRecordingLinkedToMeeting: linkedMeetingId && fathomRecordingUrl ? true : false,
          message: `Task "${createdTask.title}" created with ${durationMinutes} minutes tracked${linkedMeetingId ? ' and linked to 1-on-1 meeting' : ''}`,
        });
      } catch (taskError: any) {
        console.error('[UpdateEventStatus] Error creating task:', taskError);
        // Event status was updated, but task creation failed - still return success with warning
        return res.json({
          success: true,
          event: updatedEvent,
          warning: 'Event status updated, but failed to create task with time tracking',
        });
      }
    }

    return res.json({
      success: true,
      event: updatedEvent,
    });

  } catch (error: any) {
    console.error('[UpdateEventStatus] Error updating event status:', error);
    return res.status(500).json({ error: 'Failed to update event status', details: error.message });
  }
}

// Get event time entries for a user (for time tracking reports)
export async function getEventTimeEntries(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { startDate, endDate, clientId } = req.query;

    console.log('[GetEventTimeEntries] Fetching entries:', { userId, startDate, endDate, clientId });

    let query = db
      .select()
      .from(eventTimeEntries)
      .where(eq(eventTimeEntries.userId, userId));

    const entries = await query;

    // Filter by date range if provided
    let filteredEntries = entries;
    if (startDate) {
      const start = new Date(startDate as string);
      filteredEntries = filteredEntries.filter(e => new Date(e.startTime) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      filteredEntries = filteredEntries.filter(e => new Date(e.startTime) <= end);
    }
    if (clientId) {
      filteredEntries = filteredEntries.filter(e => e.clientId === clientId);
    }

    // Calculate total time
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + e.duration, 0);

    return res.json({
      entries: filteredEntries,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    });

  } catch (error: any) {
    console.error('[GetEventTimeEntries] Error fetching entries:', error);
    return res.status(500).json({ error: 'Failed to fetch time entries', details: error.message });
  }
}

export interface CreateOneOnOneEventParams {
  userId: string;
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:mm
  meetingDuration: number; // minutes
  managerName: string;
  directReportName: string;
  directReportEmail?: string;
}

export interface CreateOneOnOneEventResult {
  success: boolean;
  calendarEventId?: string;
  meetLink?: string;
  error?: string;
}

export async function createOneOnOneMeetingCalendarEvent(
  params: CreateOneOnOneEventParams
): Promise<CreateOneOnOneEventResult> {
  const { userId, meetingDate, meetingTime, meetingDuration, managerName, directReportName, directReportEmail } = params;
  
  console.log('[CreateOneOnOneEvent] Creating calendar event for 1-on-1 meeting:', params);
  
  try {
    // Check if user has a Google Calendar connection with two-way sync enabled
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.syncEnabled, true),
        eq(calendarConnections.twoWaySync, true)
      ))
      .limit(1);

    if (!connection) {
      console.log('[CreateOneOnOneEvent] No Google Calendar connection with two-way sync found for user');
      return { success: false, error: 'No Google Calendar connection with two-way sync enabled' };
    }

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
        console.log('[CreateOneOnOneEvent] Updated tokens in database');
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate start and end times
    const [hours, minutes] = meetingTime.split(':').map(Number);
    const startDateTime = new Date(meetingDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + meetingDuration);

    // Build the event object
    const eventResource: any = {
      summary: `1-on-1: ${managerName} & ${directReportName}`,
      description: `1-on-1 meeting between ${managerName} (Manager) and ${directReportName}.\n\nCreated by AgencyBoost CRM.`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    // Add direct report as attendee if they have an email
    if (directReportEmail) {
      eventResource.attendees = [{
        email: directReportEmail,
        displayName: directReportName,
      }];
    }

    console.log('[CreateOneOnOneEvent] Creating Google Calendar event:', eventResource);

    // Create the event in Google Calendar
    const googleEvent = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventResource,
      conferenceDataVersion: 1, // Always include Meet link for 1-on-1s
      sendUpdates: directReportEmail ? 'all' : 'none', // Send invitation email if attendee added
    });

    if (googleEvent.data) {
      const googleEventId = googleEvent.data.id || null;
      const meetLink = googleEvent.data.hangoutLink || null;

      console.log('[CreateOneOnOneEvent] Google Calendar event created:', {
        id: googleEventId,
        meetLink,
        htmlLink: googleEvent.data.htmlLink
      });

      // Store the event in the calendar_events table
      await db
        .insert(calendarEvents)
        .values({
          id: randomUUID(),
          connectionId: connection.id,
          googleEventId: googleEventId!,
          clientId: null,
          summary: eventResource.summary,
          description: eventResource.description,
          location: null,
          startTime: startDateTime,
          endTime: endDateTime,
          status: 'confirmed',
          googleHangoutLink: meetLink,
          googleHtmlLink: googleEvent.data.htmlLink || null,
          organizerEmail: connection.email,
          attendees: directReportEmail ? [directReportEmail] : [],
          allDay: false,
          transparency: 'opaque',
          isRecurring: false,
          createdInAgencyBoost: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return {
        success: true,
        calendarEventId: googleEventId || undefined,
        meetLink: meetLink || undefined,
      };
    }

    return { success: false, error: 'Failed to create Google Calendar event' };
  } catch (error: any) {
    console.error('[CreateOneOnOneEvent] Error creating calendar event:', error);
    
    // Check for authentication errors
    const isInvalidGrant = error.message?.includes('invalid_grant') || 
      error.response?.data?.error === 'invalid_grant';
    const isTokenExpired = error.code === 401;
    
    if (isInvalidGrant || isTokenExpired) {
      // Mark connection as needing re-authentication
      await db.update(calendarConnections)
        .set({ 
          syncEnabled: false,
          updatedAt: new Date() 
        })
        .where(and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.syncEnabled, true)
        ));
      
      return { success: false, error: 'Google Calendar authentication expired. Please reconnect your calendar.' };
    }
    
    return { success: false, error: error.message || 'Unknown error' };
  }
}
