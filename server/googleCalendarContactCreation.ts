// Contact Creation from Google Calendar Attendees
import { db } from './db';
import { clients, leads, calendarConnections } from '@shared/schema';
import { eq, or, and } from 'drizzle-orm';
import { calendar_v3 } from 'googleapis';

export interface AttendeeContact {
  email: string;
  name?: string;
  displayName?: string;
  responseStatus?: string;
}

export class GoogleCalendarContactCreation {
  
  // Create or update contacts from Google Calendar event attendees
  async processEventAttendees(
    attendees: AttendeeContact[],
    connectionId: string,
    eventSummary?: string
  ): Promise<{ contactsCreated: number; contactsUpdated: number }> {
    let contactsCreated = 0;
    let contactsUpdated = 0;

    // Get connection settings
    const connection = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.id, connectionId))
      .limit(1);

    if (!connection.length || !connection[0].createContacts) {
      return { contactsCreated, contactsUpdated };
    }

    for (const attendee of attendees) {
      if (!attendee.email) continue;

      // Skip organizer's own email
      if (attendee.email === connection[0].email) continue;

      // Check if contact exists (as client or lead)
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.email, attendee.email))
        .limit(1);

      const existingLead = await db
        .select()
        .from(leads)
        .where(eq(leads.email, attendee.email))
        .limit(1);

      if (existingClient.length > 0) {
        // Update existing client if needed
        const client = existingClient[0];
        const updates: any = {};

        // Update name if we have a better one
        if (!client.name || client.name === attendee.email) {
          const newName = this.extractBestName(attendee);
          if (newName && newName !== client.name) {
            updates.name = newName;
          }
        }

        // Add calendar meeting to notes if not already there
        if (eventSummary) {
          const meetingNote = `Met via calendar: ${eventSummary}`;
          if (!client.notes?.includes(meetingNote)) {
            updates.notes = client.notes 
              ? `${client.notes}\n${meetingNote}`
              : meetingNote;
          }
        }

        if (Object.keys(updates).length > 0) {
          await db
            .update(clients)
            .set({
              ...updates,
              updatedAt: new Date()
            })
            .where(eq(clients.id, client.id));
          contactsUpdated++;
        }
      } else if (existingLead.length > 0) {
        // Update existing lead if needed
        const lead = existingLead[0];
        const updates: any = {};

        // Update name if we have a better one
        if (!lead.name || lead.name === attendee.email) {
          const newName = this.extractBestName(attendee);
          if (newName && newName !== lead.name) {
            updates.name = newName;
          }
        }

        // Add meeting note
        if (eventSummary) {
          const meetingNote = `Met via calendar: ${eventSummary}`;
          // Note: Leads table might not have notes field, so we'll add to custom data
          updates.customData = {
            ...(lead.customData as any || {}),
            calendarMeetings: [
              ...((lead.customData as any)?.calendarMeetings || []),
              {
                date: new Date().toISOString(),
                event: eventSummary
              }
            ]
          };
        }

        if (Object.keys(updates).length > 0) {
          await db
            .update(leads)
            .set({
              ...updates,
              updatedAt: new Date()
            })
            .where(eq(leads.id, lead.id));
          contactsUpdated++;
        }
      } else {
        // Create new lead from attendee
        const name = this.extractBestName(attendee) || attendee.email;
        
        try {
          const newLead = await db
            .insert(leads)
            .values({
              name,
              email: attendee.email,
              status: 'new',
              source: 'Google Calendar',
              customData: eventSummary ? {
                calendarMeetings: [{
                  date: new Date().toISOString(),
                  event: eventSummary,
                  responseStatus: attendee.responseStatus
                }]
              } : {},
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          if (newLead.length > 0) {
            contactsCreated++;
            console.log(`✅ Created new lead from calendar attendee: ${name} (${attendee.email})`);
          }
        } catch (error) {
          // Handle duplicate email error gracefully
          if (error instanceof Error && error.message.includes('duplicate')) {
            console.log(`Email ${attendee.email} already exists, skipping`);
          } else {
            console.error(`Error creating lead for ${attendee.email}:`, error);
          }
        }
      }
    }

    return { contactsCreated, contactsUpdated };
  }

  // Extract the best name from attendee data
  private extractBestName(attendee: AttendeeContact): string | null {
    // Priority: displayName > name > email username
    if (attendee.displayName && attendee.displayName !== attendee.email) {
      return attendee.displayName;
    }
    
    if (attendee.name && attendee.name !== attendee.email) {
      return attendee.name;
    }

    // Try to extract name from email
    const emailParts = attendee.email.split('@')[0];
    const nameParts = emailParts.split(/[._-]/);
    
    if (nameParts.length > 1) {
      // Capitalize each part and join
      return nameParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    return null;
  }

  // Deduplicate contacts across clients and leads
  async deduplicateContacts(email: string): Promise<{
    isDuplicate: boolean;
    existingType?: 'client' | 'lead';
    existingId?: string;
  }> {
    // Check clients first (higher priority)
    const client = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.email, email))
      .limit(1);

    if (client.length > 0) {
      return {
        isDuplicate: true,
        existingType: 'client',
        existingId: client[0].id
      };
    }

    // Check leads
    const lead = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.email, email))
      .limit(1);

    if (lead.length > 0) {
      return {
        isDuplicate: true,
        existingType: 'lead',
        existingId: lead[0].id
      };
    }

    return { isDuplicate: false };
  }

  // Convert lead to client when appointment is booked
  async convertLeadToClient(leadId: string): Promise<string | null> {
    try {
      const lead = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (!lead.length) {
        return null;
      }

      const leadData = lead[0];

      // Check if client already exists with this email
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.email, leadData.email))
        .limit(1);

      if (existingClient.length > 0) {
        // Delete the lead since client already exists
        await db.delete(leads).where(eq(leads.id, leadId));
        return existingClient[0].id;
      }

      // Create new client from lead data
      const newClient = await db
        .insert(clients)
        .values({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone || '',
          company: leadData.company || '',
          status: 'active',
          contactType: 'client',
          contactSource: leadData.source || 'Google Calendar',
          notes: `Converted from lead on ${new Date().toLocaleDateString()}\n${leadData.notes || ''}`,
          tags: ['converted-from-lead', 'calendar-booking'],
          createdAt: leadData.createdAt,
          updatedAt: new Date()
        })
        .returning();

      if (newClient.length > 0) {
        // Delete the lead after successful conversion
        await db.delete(leads).where(eq(leads.id, leadId));
        console.log(`✅ Converted lead ${leadData.name} to client ${newClient[0].id}`);
        return newClient[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error converting lead to client:', error);
      return null;
    }
  }

  // Batch process multiple events' attendees
  async batchProcessAttendees(
    events: Array<{
      attendees?: AttendeeContact[];
      summary?: string;
      connectionId: string;
    }>
  ): Promise<{ totalCreated: number; totalUpdated: number }> {
    let totalCreated = 0;
    let totalUpdated = 0;

    for (const event of events) {
      if (!event.attendees || event.attendees.length === 0) continue;

      const result = await this.processEventAttendees(
        event.attendees,
        event.connectionId,
        event.summary
      );

      totalCreated += result.contactsCreated;
      totalUpdated += result.contactsUpdated;
    }

    return { totalCreated, totalUpdated };
  }
}

export const contactCreator = new GoogleCalendarContactCreation();