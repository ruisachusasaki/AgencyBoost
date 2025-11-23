// Helper module to fetch and combine calendar events for display
import { db } from "./db";
import { calendarEvents, calendarConnections } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function fetchGoogleCalendarEvents(userId?: string, startDate?: Date, endDate?: Date) {
  try {
    // First check if the user has any connected calendars
    let connectionsQuery = db.select().from(calendarConnections);
    
    if (userId) {
      connectionsQuery = connectionsQuery.where(eq(calendarConnections.userId, userId));
    }
    
    const connections = await connectionsQuery;
    
    if (connections.length === 0) {
      return [];
    }
    
    // Build query for calendar events
    let eventsQuery = db
      .select({
        id: calendarEvents.id,
        calendarId: sql<string>`'google-calendar'`.as('calendarId'), // Use a placeholder calendar ID for Google events
        clientId: sql<string>`null`.as('clientId'),
        assignedTo: calendarConnections.userId,
        title: calendarEvents.summary,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        status: sql<string>`COALESCE(${calendarEvents.status}, 'confirmed')`.as('status'),
        location: calendarEvents.location,
        locationDetails: sql<string>`null`.as('locationDetails'),
        meetingLink: calendarEvents.googleHangoutLink,
        timezone: sql<string>`'UTC'`.as('timezone'), // Google Calendar returns UTC times
        bookerName: sql<string>`COALESCE(
          ${calendarEvents.organizer}->>'name',
          ${calendarEvents.organizer}->>'email'
        )`.as('bookerName'),
        bookerEmail: sql<string>`COALESCE(
          ${calendarEvents.organizer}->>'email',
          ''
        )`.as('bookerEmail'),
        bookerPhone: sql<string>`null`.as('bookerPhone'),
        customFieldData: sql<any>`null`.as('customFieldData'),
        externalEventId: calendarEvents.googleEventId,
        bookingSource: sql<string>`'google-calendar'`.as('bookingSource'),
        cancelledAt: sql<any>`CASE WHEN ${calendarEvents.status} = 'cancelled' THEN ${calendarEvents.updatedAt} ELSE null END`.as('cancelledAt'),
        cancelledBy: sql<string>`null`.as('cancelledBy'),
        cancellationReason: sql<string>`null`.as('cancellationReason'),
        createdAt: calendarEvents.createdAt,
        updatedAt: calendarEvents.updatedAt,
        type: sql<string>`'google'`.as('type'),
        leadId: sql<string>`null`.as('leadId'),
        leadName: sql<string>`null`.as('leadName'),
        leadEmail: sql<string>`null`.as('leadEmail'),
        // Additional Google Calendar specific fields
        googleHtmlLink: calendarEvents.googleHtmlLink,
        attendees: calendarEvents.attendees,
        allDay: calendarEvents.allDay,
        transparency: calendarEvents.transparency,
      })
      .from(calendarEvents)
      .innerJoin(calendarConnections, eq(calendarEvents.connectionId, calendarConnections.id));
    
    // Add conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(calendarConnections.userId, userId));
    }
    
    if (startDate) {
      conditions.push(gte(calendarEvents.startTime, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(calendarEvents.startTime, endDate));
    }
    
    // Exclude cancelled events unless specifically requested
    conditions.push(sql`${calendarEvents.status} != 'cancelled' OR ${calendarEvents.status} IS NULL`);
    
    if (conditions.length > 0) {
      eventsQuery = eventsQuery.where(and(...conditions));
    }
    
    const events = await eventsQuery;
    
    console.log(`[GoogleCalendarDisplay] Fetched ${events.length} Google Calendar events for user ${userId}`);
    
    return events;
  } catch (error) {
    console.error('[GoogleCalendarDisplay] Error fetching Google Calendar events:', error);
    return [];
  }
}