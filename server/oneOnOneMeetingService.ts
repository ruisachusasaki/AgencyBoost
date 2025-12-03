import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { calendars, calendarStaff, calendarAppointments, oneOnOneMeetings, staff } from "@shared/schema";
import { createOneOnOneMeetingCalendarEvent } from "./googleCalendarCreateEvent";
import { fromZonedTime } from "date-fns-tz";

interface CreateMeetingCalendarResult {
  success: boolean;
  calendarAppointmentId?: string;
  directReportAppointmentId?: string;
  calendarEventId?: string;
  meetLink?: string;
  googleSyncError?: string;
  error?: string;
  updatedMeeting?: typeof oneOnOneMeetings.$inferSelect;
}

interface CreateMeetingCalendarParams {
  meetingId: string;
  managerId: string;
  directReportId: string;
  meetingDate: string;
  meetingTime: string;
  meetingDuration: number;
}

const MEETING_TIMEZONE = 'America/New_York';

async function findOrCreatePersonalCalendar(userId: string): Promise<string> {
  const existingCalendar = await db.select()
    .from(calendars)
    .innerJoin(calendarStaff, eq(calendars.id, calendarStaff.calendarId))
    .where(and(
      eq(calendarStaff.staffId, userId),
      eq(calendars.type, 'personal')
    ))
    .limit(1);

  if (existingCalendar.length > 0) {
    return existingCalendar[0].calendars.id;
  }

  const calendarUrl = `calendar-${userId.replace(/-/g, '').substring(0, 8)}-${Date.now().toString(36)}`;
  const [newCalendar] = await db.insert(calendars)
    .values({
      name: "My Calendar",
      type: "personal",
      customUrl: calendarUrl,
      duration: 60,
      durationUnit: "minutes",
      location: "google_meet",
      createdBy: userId,
    })
    .returning();

  await db.insert(calendarStaff)
    .values({
      calendarId: newCalendar.id,
      staffId: userId,
      isActive: true,
    });

  console.log(`[1-on-1 Meeting] Created default calendar for user ${userId}`);
  return newCalendar.id;
}

export async function createOneOnOneMeetingCalendars(params: CreateMeetingCalendarParams): Promise<CreateMeetingCalendarResult> {
  const { meetingId, managerId, directReportId, meetingDate, meetingTime, meetingDuration } = params;

  let managerAppointmentId: string | null = null;
  let directReportAppointmentId: string | null = null;
  
  try {
    const [manager] = await db.select()
      .from(staff)
      .where(eq(staff.id, managerId));
    
    const [directReport] = await db.select()
      .from(staff)
      .where(eq(staff.id, directReportId));

    if (!manager || !directReport) {
      return { success: false, error: "Manager or direct report not found" };
    }

    const managerName = `${manager.firstName} ${manager.lastName}`;
    const directReportName = `${directReport.firstName} ${directReport.lastName}`;
    const appointmentTitle = `1-on-1: ${managerName} & ${directReportName}`;
    const appointmentDescription = `1-on-1 meeting between ${managerName} (Manager) and ${directReportName} (Direct Report)`;

    const isoDateTimeString = `${meetingDate}T${meetingTime}:00`;
    const startTime = fromZonedTime(isoDateTimeString, MEETING_TIMEZONE);
    const endTime = new Date(startTime.getTime() + meetingDuration * 60 * 1000);

    const managerCalendarId = await findOrCreatePersonalCalendar(managerId);
    const directReportCalendarId = await findOrCreatePersonalCalendar(directReportId);

    const [managerAppointment] = await db.insert(calendarAppointments)
      .values({
        calendarId: managerCalendarId,
        assignedTo: managerId,
        title: appointmentTitle,
        description: appointmentDescription,
        startTime,
        endTime,
        status: 'confirmed',
        timezone: MEETING_TIMEZONE,
        bookerEmail: manager.email || 'noreply@agencyflow.com',
        bookerName: managerName,
        bookingSource: 'admin',
      })
      .returning();

    managerAppointmentId = managerAppointment.id;
    console.log(`[1-on-1 Meeting] Created manager calendar appointment: ${managerAppointmentId}`);

    const [drAppointment] = await db.insert(calendarAppointments)
      .values({
        calendarId: directReportCalendarId,
        assignedTo: directReportId,
        title: appointmentTitle,
        description: appointmentDescription,
        startTime,
        endTime,
        status: 'confirmed',
        timezone: MEETING_TIMEZONE,
        bookerEmail: directReport.email || 'noreply@agencyflow.com',
        bookerName: directReportName,
        bookingSource: 'admin',
      })
      .returning();

    directReportAppointmentId = drAppointment.id;
    console.log(`[1-on-1 Meeting] Created direct report calendar appointment: ${directReportAppointmentId}`);

    const [updatedMeeting] = await db.update(oneOnOneMeetings)
      .set({
        calendarAppointmentId: managerAppointment.id,
        updatedAt: new Date()
      })
      .where(eq(oneOnOneMeetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      await db.delete(calendarAppointments).where(eq(calendarAppointments.id, managerAppointment.id));
      await db.delete(calendarAppointments).where(eq(calendarAppointments.id, drAppointment.id));
      managerAppointmentId = null;
      directReportAppointmentId = null;
      return { success: false, error: "Failed to link appointment to meeting" };
    }

    let googleSyncError: string | undefined;
    let googleEventId: string | undefined;
    let meetLink: string | undefined;
    let finalMeeting = updatedMeeting;

    try {
      const googleResult = await createOneOnOneMeetingCalendarEvent({
        userId: managerId,
        meetingDate,
        meetingTime,
        meetingDuration,
        managerName,
        directReportName,
        directReportEmail: directReport.email || undefined,
      });

      console.log('[1-on-1 Meeting] Google Calendar sync result:', googleResult);

      if (googleResult.success && googleResult.calendarEventId) {
        const [updated] = await db.update(oneOnOneMeetings)
          .set({
            calendarEventId: googleResult.calendarEventId,
            updatedAt: new Date()
          })
          .where(eq(oneOnOneMeetings.id, meetingId))
          .returning();

        await db.update(calendarAppointments)
          .set({
            googleEventId: googleResult.calendarEventId,
            syncedToGoogle: true,
            meetingLink: googleResult.meetLink || null,
            updatedAt: new Date()
          })
          .where(eq(calendarAppointments.id, managerAppointment.id));

        await db.update(calendarAppointments)
          .set({
            meetingLink: googleResult.meetLink || null,
            updatedAt: new Date()
          })
          .where(eq(calendarAppointments.id, drAppointment.id));

        googleEventId = googleResult.calendarEventId;
        meetLink = googleResult.meetLink;
        if (updated) {
          finalMeeting = updated;
        }
      } else if (!googleResult.success) {
        googleSyncError = googleResult.error;
      }
    } catch (googleError) {
      console.error('[1-on-1 Meeting] Google Calendar sync error (non-fatal):', googleError);
      googleSyncError = googleError instanceof Error ? googleError.message : "Google Calendar sync failed";
    }

    return {
      success: true,
      calendarAppointmentId: managerAppointment.id,
      directReportAppointmentId: drAppointment.id,
      calendarEventId: googleEventId,
      meetLink,
      googleSyncError,
      updatedMeeting: finalMeeting
    };

  } catch (error) {
    console.error('[1-on-1 Meeting] Calendar creation failed:', error);
    
    if (managerAppointmentId) {
      try {
        await db.delete(calendarAppointments).where(eq(calendarAppointments.id, managerAppointmentId));
        console.log(`[1-on-1 Meeting] Cleaned up orphaned manager appointment: ${managerAppointmentId}`);
      } catch (cleanupError) {
        console.error('[1-on-1 Meeting] Failed to cleanup orphaned manager appointment:', cleanupError);
      }
    }
    
    if (directReportAppointmentId) {
      try {
        await db.delete(calendarAppointments).where(eq(calendarAppointments.id, directReportAppointmentId));
        console.log(`[1-on-1 Meeting] Cleaned up orphaned direct report appointment: ${directReportAppointmentId}`);
      } catch (cleanupError) {
        console.error('[1-on-1 Meeting] Failed to cleanup orphaned direct report appointment:', cleanupError);
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create calendar appointment" 
    };
  }
}
