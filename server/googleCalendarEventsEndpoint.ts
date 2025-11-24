import { Request, Response } from 'express';
import { db } from './db';
import { eq, inArray, sql } from 'drizzle-orm';
import { calendarEvents, calendarConnections, staff } from '@shared/schema';

// Get Google Calendar events for calendar view (supports multi-user and organization-wide viewing)
export async function getGoogleCalendarEventsForView(req: Request, res: Response) {
  try {
    const currentUserId = req.session?.userId;
    const { userIds } = req.query; // Accept multiple user IDs
    
    console.log('[GoogleCalendarEvents] Request received:', { 
      currentUserId, 
      userIds,
      queryParams: req.query 
    });
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // If specific userIds are provided, use them; otherwise get all events for the current user
    let events = [];
    
    if (userIds && typeof userIds === 'string') {
      const userIdList = userIds.split(',').filter(id => id.trim());
      
      // Get staff to check organization membership
      const currentStaff = await db
        .select()
        .from(staff)
        .where(eq(staff.id, currentUserId));
      
      const currentUserOrgId = currentStaff[0]?.organizationId;
      
      // Get all selected users' staff records
      const selectedStaff = await db
        .select()
        .from(staff)
        .where(inArray(staff.id, userIdList));
      
      // For each user, determine what level of detail to show
      const eventsPromises = userIdList.map(async (userId) => {
        const userStaff = selectedStaff.find(s => s.id === userId);
        const isSameOrg = userStaff?.organizationId === currentUserOrgId;
        const isCurrentUser = userId === currentUserId;
        
        console.log('[GoogleCalendarEvents] Processing user:', {
          userId,
          isCurrentUser,
          isSameOrg,
          userStaff: userStaff?.email
        });
        
        // Get events for this user by joining with calendar connections
        // Note: calendarEvents table only has: summary, startTime, endTime, allDay, status, transparency, attendees, organizerEmail, isRecurring, createdInAgencyFlow
        const userEvents = await db
          .select({
            id: calendarEvents.id,
            googleEventId: calendarEvents.googleEventId,
            connectionId: calendarEvents.connectionId,
            // Show full details for own events or same org, otherwise show "Busy"
            title: isCurrentUser || isSameOrg 
              ? sql<string>`COALESCE(${calendarEvents.summary}, 'Untitled Event')`.as('title')
              : sql<string>`'Busy'`.as('title'),
            description: sql<string>`''`.as('description'), // Not stored in optimized schema
            startTime: calendarEvents.startTime,
            endTime: calendarEvents.endTime,
            location: sql<string>`''`.as('location'), // Not stored in optimized schema
            status: calendarEvents.status,
            allDay: calendarEvents.allDay,
            transparency: calendarEvents.transparency,
            organizerEmail: isCurrentUser || isSameOrg 
              ? calendarEvents.organizerEmail 
              : sql<string>`''`.as('organizerEmail'),
            organizerName: sql<string>`''`.as('organizerName'), // Not stored in optimized schema
            attendees: isCurrentUser || isSameOrg 
              ? calendarEvents.attendees 
              : sql<any>`'[]'::jsonb`.as('attendees'),
            isRecurring: calendarEvents.isRecurring,
            createdInAgencyFlow: calendarEvents.createdInAgencyFlow,
            // CRITICAL: Use the connection's userId (which is the staff ID who owns this calendar)
            userId: calendarConnections.userId,
            assignedTo: calendarConnections.userId
          })
          .from(calendarEvents)
          .innerJoin(calendarConnections, eq(calendarEvents.connectionId, calendarConnections.id))
          .where(eq(calendarConnections.userId, userId));
        
        console.log('[GoogleCalendarEvents] Found events for user:', {
          userId,
          eventCount: userEvents.length,
          firstEvent: userEvents[0]?.title
        });
        
        return userEvents;
      });
      
      const allEvents = await Promise.all(eventsPromises);
      events = allEvents.flat();
    } else {
      // No specific users selected, return all events for the current user
      // Note: calendarEvents table only has: summary, startTime, endTime, allDay, status, transparency, attendees, organizerEmail, isRecurring, createdInAgencyFlow
      const userEvents = await db
        .select({
          id: calendarEvents.id,
          googleEventId: calendarEvents.googleEventId,
          connectionId: calendarEvents.connectionId,
          title: sql<string>`COALESCE(${calendarEvents.summary}, 'Untitled Event')`.as('title'),
          description: sql<string>`''`.as('description'), // Not stored in optimized schema
          startTime: calendarEvents.startTime,
          endTime: calendarEvents.endTime,
          location: sql<string>`''`.as('location'), // Not stored in optimized schema
          status: calendarEvents.status,
          allDay: calendarEvents.allDay,
          transparency: calendarEvents.transparency,
          organizerEmail: calendarEvents.organizerEmail,
          organizerName: sql<string>`''`.as('organizerName'), // Not stored in optimized schema
          attendees: calendarEvents.attendees,
          isRecurring: calendarEvents.isRecurring,
          createdInAgencyFlow: calendarEvents.createdInAgencyFlow,
          // Include userId and assignedTo
          userId: calendarConnections.userId,
          assignedTo: calendarConnections.userId
        })
        .from(calendarEvents)
        .innerJoin(calendarConnections, eq(calendarEvents.connectionId, calendarConnections.id))
        .where(eq(calendarConnections.userId, currentUserId));
      
      events = userEvents;
    }
    
    // Transform events to match the frontend format
    const transformedEvents = events.map(event => ({
      ...event,
      // Ensure compatibility with frontend expectations
      bookerName: event.organizerName || '',
      bookerEmail: event.organizerEmail || '',
      bookerPhone: null,
      clientId: null,
      timezone: 'UTC',
      customFieldData: null,
      externalEventId: event.googleEventId,
      bookingSource: 'google-calendar',
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      type: 'google'
    }));
    
    console.log('[GoogleCalendarEvents] Returning events:', {
      totalCount: transformedEvents.length,
      userIds: userIds || 'none',
      sampleEvents: transformedEvents.slice(0, 2).map(e => ({
        title: e.title,
        assignedTo: e.assignedTo,
        userId: e.userId,
        type: typeof e.assignedTo
      }))
    });
    
    res.json({ events: transformedEvents });
  } catch (error) {
    console.error("[GoogleCalendarEvents] Error fetching Google Calendar events for calendar view:", error);
    res.status(500).json({ error: "Failed to fetch Google Calendar events", details: error.message });
  }
}