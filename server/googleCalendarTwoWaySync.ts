// Two-way sync: Push AgencyFlow appointments to Google Calendar
import { google, calendar_v3 } from 'googleapis';
import { db } from './db';
import { 
  calendarConnections, 
  calendarAppointments,
  calendarEvents,
  staff,
  clients,
  leads
} from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { decrypt } from './encryption';

export class GoogleCalendarTwoWaySync {
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.calendar = google.calendar('v3');
  }

  // Push an AgencyFlow appointment to Google Calendar
  async pushAppointmentToGoogle(appointmentId: string): Promise<{ success: boolean; googleEventId?: string; error?: string }> {
    try {
      // Get appointment details
      const appointment = await db
        .select({
          appointment: calendarAppointments,
          assignedStaff: staff,
        })
        .from(calendarAppointments)
        .leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id))
        .where(eq(calendarAppointments.id, appointmentId))
        .limit(1);

      if (!appointment.length) {
        return { success: false, error: 'Appointment not found' };
      }

      const appt = appointment[0].appointment;
      const staffMember = appointment[0].assignedStaff;

      if (!staffMember) {
        return { success: false, error: 'Assigned staff not found' };
      }

      // Get Google Calendar connection for the assigned staff
      const connection = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.userId, staffMember.id),
            eq(calendarConnections.twoWaySync, true)
          )
        )
        .limit(1);

      if (!connection.length) {
        console.log(`No two-way sync connection for staff ${staffMember.email}`);
        return { success: false, error: 'No Google Calendar connection with two-way sync enabled' };
      }

      const conn = connection[0];
      const accessToken = decrypt(conn.accessToken);

      // Set up OAuth client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      // Get client details if applicable
      let attendees: calendar_v3.Schema$EventAttendee[] = [];
      if (appt.clientId) {
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, appt.clientId))
          .limit(1);

        if (client.length && client[0].email) {
          attendees.push({
            email: client[0].email,
            displayName: client[0].name,
          });
        }
      }

      // Add booker as attendee if different from client
      if (appt.bookerEmail && (!attendees.length || attendees[0].email !== appt.bookerEmail)) {
        attendees.push({
          email: appt.bookerEmail,
          displayName: appt.bookerName || appt.bookerEmail,
        });
      }

      // Create or update Google Calendar event
      const eventData: calendar_v3.Schema$Event = {
        summary: appt.title,
        description: appt.description || '',
        location: appt.location || '',
        start: {
          dateTime: appt.startTime.toISOString(),
          timeZone: appt.timezone,
        },
        end: {
          dateTime: appt.endTime.toISOString(),
          timeZone: appt.timezone,
        },
        attendees: attendees.length > 0 ? attendees : undefined,
        status: appt.status === 'cancelled' ? 'cancelled' : 'confirmed',
        // Add AgencyFlow metadata
        extendedProperties: {
          private: {
            agencyFlowId: appointmentId,
            agencyFlowSource: 'appointment',
          },
        },
      };

      // Add meeting link if virtual
      if (appt.meetingLink) {
        eventData.conferenceData = {
          entryPoints: [{
            entryPointType: 'video',
            uri: appt.meetingLink,
          }],
        };
      }

      let googleEvent: calendar_v3.Schema$Event;
      
      if (appt.googleEventId) {
        // Update existing Google event
        console.log(`Updating Google Calendar event ${appt.googleEventId}`);
        const response = await this.calendar.events.update({
          calendarId: conn.calendarId || 'primary',
          eventId: appt.googleEventId,
          requestBody: eventData,
          auth: oauth2Client,
          sendUpdates: 'all', // Send update emails to attendees
        });
        googleEvent = response.data;
      } else {
        // Create new Google event
        console.log(`Creating new Google Calendar event for appointment ${appointmentId}`);
        const response = await this.calendar.events.insert({
          calendarId: conn.calendarId || 'primary',
          requestBody: eventData,
          auth: oauth2Client,
          sendUpdates: 'all', // Send invitation emails to attendees
          conferenceDataVersion: appt.meetingLink ? 1 : undefined,
        });
        googleEvent = response.data;

        // Update appointment with Google event ID
        if (googleEvent.id) {
          await db
            .update(calendarAppointments)
            .set({
              googleEventId: googleEvent.id,
              googleCalendarId: conn.calendarId || 'primary',
              syncedToGoogle: true,
              externalEventId: googleEvent.id, // Also set the generic external ID
            })
            .where(eq(calendarAppointments.id, appointmentId));

          // Also create/update in calendarEvents table
          await this.syncEventToLocalCache(conn.id, googleEvent, appointmentId);
        }
      }

      return { success: true, googleEventId: googleEvent.id || undefined };
      
    } catch (error) {
      console.error('Error pushing appointment to Google:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete an appointment from Google Calendar
  async deleteAppointmentFromGoogle(appointmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get appointment details
      const appointment = await db
        .select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, appointmentId))
        .limit(1);

      if (!appointment.length || !appointment[0].googleEventId) {
        return { success: true }; // Already not in Google
      }

      const appt = appointment[0];

      // Get connection for the assigned staff
      const connection = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.userId, appt.assignedTo),
            eq(calendarConnections.twoWaySync, true)
          )
        )
        .limit(1);

      if (!connection.length) {
        return { success: false, error: 'No Google Calendar connection found' };
      }

      const conn = connection[0];
      const accessToken = decrypt(conn.accessToken);

      // Set up OAuth client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      // Delete from Google Calendar
      await this.calendar.events.delete({
        calendarId: appt.googleCalendarId || conn.calendarId || 'primary',
        eventId: appt.googleEventId,
        auth: oauth2Client,
        sendUpdates: 'all', // Send cancellation emails
      });

      // Remove from local cache
      await db
        .delete(calendarEvents)
        .where(
          and(
            eq(calendarEvents.connectionId, conn.id),
            eq(calendarEvents.googleEventId, appt.googleEventId)
          )
        );

      // Clear Google event ID from appointment
      await db
        .update(calendarAppointments)
        .set({
          googleEventId: null,
          googleCalendarId: null,
          syncedToGoogle: false,
          externalEventId: null,
        })
        .where(eq(calendarAppointments.id, appointmentId));

      return { success: true };
      
    } catch (error) {
      console.error('Error deleting appointment from Google:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Sync a Google event to local cache
  private async syncEventToLocalCache(
    connectionId: string,
    googleEvent: calendar_v3.Schema$Event,
    appointmentId?: string
  ) {
    if (!googleEvent.id) return;

    const eventData = {
      connectionId,
      googleEventId: googleEvent.id,
      appointmentId,
      summary: googleEvent.summary || 'Untitled',
      startTime: new Date(googleEvent.start?.dateTime || googleEvent.start?.date || ''),
      endTime: new Date(googleEvent.end?.dateTime || googleEvent.end?.date || ''),
      allDay: !googleEvent.start?.dateTime,
      status: googleEvent.status || 'confirmed',
      transparency: googleEvent.transparency || 'opaque',
      attendees: googleEvent.attendees
        ? googleEvent.attendees.map(a => ({
            email: a.email,
            name: a.displayName,
            responseStatus: a.responseStatus,
          }))
        : null,
      organizerEmail: googleEvent.organizer?.email,
      etag: googleEvent.etag,
      lastModified: googleEvent.updated ? new Date(googleEvent.updated) : new Date(),
      isRecurring: !!googleEvent.recurringEventId,
      createdInAgencyFlow: true,
      syncedAt: new Date(),
    };

    // Upsert event in cache
    const existing = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.connectionId, connectionId),
          eq(calendarEvents.googleEventId, googleEvent.id)
        )
      )
      .limit(1);

    if (existing.length) {
      await db
        .update(calendarEvents)
        .set(eventData)
        .where(eq(calendarEvents.id, existing[0].id));
    } else {
      await db.insert(calendarEvents).values(eventData);
    }
  }

  // Convert Google Calendar event to AgencyFlow appointment
  async createAppointmentFromGoogleEvent(
    googleEvent: calendar_v3.Schema$Event,
    connectionId: string
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
      // Get connection details
      const connection = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, connectionId))
        .limit(1);

      if (!connection.length) {
        return { success: false, error: 'Connection not found' };
      }

      const conn = connection[0];

      // Check if we should create full appointment or just block time
      if (!conn.blockAsAppointments) {
        // Just store in calendarEvents for blocking, don't create appointment
        await this.syncEventToLocalCache(connectionId, googleEvent);
        return { success: true };
      }

      // Check if appointment already exists
      const existing = await db
        .select()
        .from(calendarAppointments)
        .where(
          or(
            eq(calendarAppointments.googleEventId, googleEvent.id || ''),
            eq(calendarAppointments.externalEventId, googleEvent.id || '')
          )
        )
        .limit(1);

      if (existing.length) {
        return { success: true, appointmentId: existing[0].id };
      }

      // Get or create client based on attendees
      let clientId: string | null = null;
      const attendees = googleEvent.attendees || [];
      
      if (conn.createContacts && attendees.length > 0) {
        // Find the first attendee that's not the organizer
        const primaryAttendee = attendees.find(a => a.email !== googleEvent.organizer?.email) || attendees[0];
        
        if (primaryAttendee?.email) {
          // Check if client exists
          const existingClient = await db
            .select()
            .from(clients)
            .where(eq(clients.email, primaryAttendee.email))
            .limit(1);

          if (existingClient.length) {
            clientId = existingClient[0].id;
          } else {
            // Create new client
            const newClient = await db
              .insert(clients)
              .values({
                name: primaryAttendee.displayName || primaryAttendee.email,
                email: primaryAttendee.email,
                phone: '',
                status: 'active',
              })
              .returning();
            
            if (newClient.length) {
              clientId = newClient[0].id;
            }
          }
        }
      }

      // Create appointment
      const startTime = new Date(googleEvent.start?.dateTime || googleEvent.start?.date || '');
      const endTime = new Date(googleEvent.end?.dateTime || googleEvent.end?.date || '');
      
      const appointment = await db
        .insert(calendarAppointments)
        .values({
          calendarId: conn.calendarId || 'primary',
          clientId,
          assignedTo: conn.userId,
          title: googleEvent.summary || 'Google Calendar Event',
          description: googleEvent.description || '',
          startTime,
          endTime,
          status: googleEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
          location: googleEvent.location,
          meetingLink: googleEvent.hangoutLink,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          bookerName: googleEvent.organizer?.displayName || googleEvent.organizer?.email || '',
          bookerEmail: googleEvent.organizer?.email || '',
          googleEventId: googleEvent.id,
          googleCalendarId: conn.calendarId || 'primary',
          syncedToGoogle: true,
          externalEventId: googleEvent.id,
          bookingSource: 'google',
        })
        .returning();

      if (appointment.length) {
        // Store in cache with appointment link
        await this.syncEventToLocalCache(connectionId, googleEvent, appointment[0].id);

        // Trigger workflows if enabled
        if (conn.triggerWorkflows) {
          await this.triggerWorkflowsForEvent('appointment_created', appointment[0].id);
        }

        return { success: true, appointmentId: appointment[0].id };
      }

      return { success: false, error: 'Failed to create appointment' };
      
    } catch (error) {
      console.error('Error creating appointment from Google event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Trigger workflows for calendar events
  private async triggerWorkflowsForEvent(trigger: string, appointmentId: string) {
    // This would integrate with the automation system
    // For now, just log
    console.log(`Would trigger workflow: ${trigger} for appointment ${appointmentId}`);
    
    // TODO: Integrate with automation system
    // Example:
    // await automationEngine.triggerWorkflow({
    //   trigger: 'google_calendar_event_created',
    //   entityType: 'appointment',
    //   entityId: appointmentId,
    // });
  }
}

export const twoWaySync = new GoogleCalendarTwoWaySync();