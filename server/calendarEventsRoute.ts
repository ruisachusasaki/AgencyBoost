// API route to fetch all calendar events including Google Calendar synced events
import { Router } from "express";
import { db } from "./db";
import { calendarAppointments, leadAppointments, leads } from "@shared/schema";
import { eq, asc, sql } from "drizzle-orm";
import { fetchGoogleCalendarEvents } from "./googleCalendarDisplay";

const router = Router();

// Helper function for merge tag interpolation (copied from routes.ts)
function interpolateAppointmentMergeTags(text: string | null | undefined, appointment: any): string {
  if (!text) return '';
  
  return text
    .replace(/\[lead_name\]/g, appointment.leadName || appointment.bookerName || '')
    .replace(/\[lead_email\]/g, appointment.leadEmail || appointment.bookerEmail || '')
    .replace(/\[appointment_date\]/g, new Date(appointment.startTime).toLocaleDateString())
    .replace(/\[appointment_time\]/g, new Date(appointment.startTime).toLocaleTimeString());
}

// Get all calendar events including Google Calendar synced events
router.get("/calendar-events-all", async (req, res) => {
  try {
    const { calendarId, staffId, startDate, endDate, includeLeadAppointments } = req.query;
    const userId = (req as any).session?.userId;

    console.log("[CalendarEventsRoute] Fetching all calendar events for user:", userId);

    // Get regular calendar appointments
    let calendarQuery = db
      .select({
        id: calendarAppointments.id,
        calendarId: calendarAppointments.calendarId,
        clientId: calendarAppointments.clientId,
        assignedTo: calendarAppointments.assignedTo,
        title: calendarAppointments.title,
        description: calendarAppointments.description,
        startTime: calendarAppointments.startTime,
        endTime: calendarAppointments.endTime,
        status: calendarAppointments.status,
        location: calendarAppointments.location,
        locationDetails: calendarAppointments.locationDetails,
        meetingLink: calendarAppointments.meetingLink,
        timezone: calendarAppointments.timezone,
        bookerName: calendarAppointments.bookerName,
        bookerEmail: calendarAppointments.bookerEmail,
        bookerPhone: calendarAppointments.bookerPhone,
        customFieldData: calendarAppointments.customFieldData,
        externalEventId: calendarAppointments.externalEventId,
        bookingSource: calendarAppointments.bookingSource,
        cancelledAt: calendarAppointments.cancelledAt,
        cancelledBy: calendarAppointments.cancelledBy,
        cancellationReason: calendarAppointments.cancellationReason,
        createdAt: calendarAppointments.createdAt,
        updatedAt: calendarAppointments.updatedAt,
        type: sql<string>`'calendar'`.as('type'),
        leadId: sql<string>`null`.as('leadId'),
        leadName: sql<string>`null`.as('leadName'),
        leadEmail: sql<string>`null`.as('leadEmail'),
      })
      .from(calendarAppointments);

    if (calendarId) {
      calendarQuery = calendarQuery.where(eq(calendarAppointments.calendarId, calendarId as string));
    }

    const regularAppointments = await calendarQuery.orderBy(asc(calendarAppointments.startTime));

    // Get lead appointments if requested
    let allAppointments = regularAppointments;
    
    if (includeLeadAppointments === 'true') {
      let leadQuery = db
        .select({
          id: leadAppointments.id,
          calendarId: leadAppointments.calendarId,
          clientId: sql<string>`null`.as('clientId'),
          assignedTo: leadAppointments.assignedTo,
          title: leadAppointments.title,
          description: leadAppointments.description,
          startTime: leadAppointments.startTime,
          endTime: leadAppointments.endTime,
          status: leadAppointments.status,
          location: leadAppointments.location,
          locationDetails: sql<string>`null`.as('locationDetails'),
          meetingLink: sql<string>`null`.as('meetingLink'),
          timezone: sql<string>`'America/New_York'`.as('timezone'),
          bookerName: leads.name,
          bookerEmail: leads.email,
          bookerPhone: leads.phone,
          customFieldData: sql<any>`null`.as('customFieldData'),
          externalEventId: sql<string>`null`.as('externalEventId'),
          bookingSource: sql<string>`'lead'`.as('bookingSource'),
          cancelledAt: sql<any>`null`.as('cancelledAt'),
          cancelledBy: sql<string>`null`.as('cancelledBy'),
          cancellationReason: sql<string>`null`.as('cancellationReason'),
          createdAt: leadAppointments.createdAt,
          updatedAt: leadAppointments.updatedAt,
          type: sql<string>`'lead'`.as('type'),
          leadId: leadAppointments.leadId,
          leadName: leads.name,
          leadEmail: leads.email,
        })
        .from(leadAppointments)
        .leftJoin(leads, eq(leadAppointments.leadId, leads.id));

      if (calendarId) {
        leadQuery = leadQuery.where(eq(leadAppointments.calendarId, calendarId as string));
      }

      const leadAppointmentsData = await leadQuery.orderBy(asc(leadAppointments.startTime));
      
      // Apply merge tag interpolation to lead appointments
      const interpolatedLeadAppointments = leadAppointmentsData.map(apt => ({
        ...apt,
        title: interpolateAppointmentMergeTags(apt.title, apt),
        description: interpolateAppointmentMergeTags(apt.description, apt),
      }));
      
      // Add lead appointments
      allAppointments = [...regularAppointments, ...interpolatedLeadAppointments];
    }

    // Get Google Calendar synced events
    const googleEvents = await fetchGoogleCalendarEvents(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    console.log(`[CalendarEventsRoute] Fetched ${regularAppointments.length} regular appointments, ${allAppointments.length - regularAppointments.length} lead appointments, and ${googleEvents.length} Google Calendar events`);

    // Combine all events
    allAppointments = [...allAppointments, ...googleEvents];
    
    // Sort by start time
    allAppointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    console.log(`[CalendarEventsRoute] Returning total of ${allAppointments.length} calendar events`);
    
    res.json(allAppointments);
  } catch (error) {
    console.error('[CalendarEventsRoute] Error fetching calendar events:', error);
    res.status(500).json({ message: "Failed to fetch calendar events" });
  }
});

export default router;