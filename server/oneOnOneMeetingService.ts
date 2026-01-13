import { db } from "./db";
import { eq, and, or, inArray } from "drizzle-orm";
import { calendars, calendarStaff, calendarAppointments, oneOnOneMeetings, staff } from "@shared/schema";
import { createOneOnOneMeetingCalendarEvent } from "./googleCalendarCreateEvent";
import { deleteAppointmentFromGoogleCalendar, syncAppointmentToGoogleCalendar } from "./googleCalendar";
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

interface DeleteMeetingCalendarResult {
  success: boolean;
  error?: string;
  googleDeleteError?: string;
}

export async function deleteOneOnOneMeetingCalendars(meeting: {
  id: string;
  calendarAppointmentId: string | null;
  calendarEventId: string | null;
  directReportId: string;
}): Promise<DeleteMeetingCalendarResult> {
  let googleDeleteError: string | undefined;

  try {
    // Delete Google Calendar event if exists
    if (meeting.calendarEventId) {
      try {
        const result = await deleteAppointmentFromGoogleCalendar(meeting.calendarEventId);
        if (!result.success) {
          googleDeleteError = result.error;
          console.warn('[1-on-1 Meeting] Google Calendar delete failed (non-fatal):', result.error);
        } else {
          console.log(`[1-on-1 Meeting] Deleted Google Calendar event: ${meeting.calendarEventId}`);
        }
      } catch (googleError) {
        googleDeleteError = googleError instanceof Error ? googleError.message : "Google Calendar delete failed";
        console.warn('[1-on-1 Meeting] Google Calendar delete error (non-fatal):', googleError);
      }
    }

    // Delete internal calendar appointments (both manager's and direct report's)
    if (meeting.calendarAppointmentId) {
      // Get the appointment to find its title for matching the direct report's appointment
      const [managerAppointment] = await db.select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, meeting.calendarAppointmentId));

      if (managerAppointment) {
        // Find and delete direct report's appointment with matching title and time
        await db.delete(calendarAppointments)
          .where(and(
            eq(calendarAppointments.title, managerAppointment.title),
            eq(calendarAppointments.startTime, managerAppointment.startTime),
            eq(calendarAppointments.assignedTo, meeting.directReportId)
          ));
        console.log(`[1-on-1 Meeting] Deleted direct report's calendar appointment`);
      }

      // Delete manager's appointment
      await db.delete(calendarAppointments)
        .where(eq(calendarAppointments.id, meeting.calendarAppointmentId));
      console.log(`[1-on-1 Meeting] Deleted manager's calendar appointment: ${meeting.calendarAppointmentId}`);
    }

    return {
      success: true,
      googleDeleteError,
    };
  } catch (error) {
    console.error('[1-on-1 Meeting] Calendar deletion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete calendar appointments",
      googleDeleteError,
    };
  }
}

interface UpdateMeetingCalendarResult {
  success: boolean;
  error?: string;
  googleSyncError?: string;
}

interface UpdateMeetingCalendarParams {
  meetingId: string;
  managerId: string;
  directReportId: string;
  calendarAppointmentId: string | null;
  calendarEventId: string | null;
  meetingDate: string;
  meetingTime: string;
  meetingDuration: number;
}

export async function updateOneOnOneMeetingCalendars(params: UpdateMeetingCalendarParams): Promise<UpdateMeetingCalendarResult> {
  const { meetingId, managerId, directReportId, calendarAppointmentId, calendarEventId, meetingDate, meetingTime, meetingDuration } = params;

  let googleSyncError: string | undefined;

  try {
    const [manager] = await db.select().from(staff).where(eq(staff.id, managerId));
    const [directReport] = await db.select().from(staff).where(eq(staff.id, directReportId));

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

    // Update internal calendar appointments
    if (calendarAppointmentId) {
      // Get current appointment to find matching direct report appointment
      const [currentAppointment] = await db.select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, calendarAppointmentId));

      if (currentAppointment) {
        // Update manager's appointment
        await db.update(calendarAppointments)
          .set({
            startTime,
            endTime,
            title: appointmentTitle,
            description: appointmentDescription,
            updatedAt: new Date(),
          })
          .where(eq(calendarAppointments.id, calendarAppointmentId));
        console.log(`[1-on-1 Meeting] Updated manager's calendar appointment`);

        // Find and update direct report's matching appointment
        await db.update(calendarAppointments)
          .set({
            startTime,
            endTime,
            title: appointmentTitle,
            description: appointmentDescription,
            updatedAt: new Date(),
          })
          .where(and(
            eq(calendarAppointments.title, currentAppointment.title),
            eq(calendarAppointments.startTime, currentAppointment.startTime),
            eq(calendarAppointments.assignedTo, directReportId)
          ));
        console.log(`[1-on-1 Meeting] Updated direct report's calendar appointment`);
      }
    }

    // Update Google Calendar event
    if (calendarEventId) {
      try {
        const result = await syncAppointmentToGoogleCalendar({
          id: meetingId,
          title: appointmentTitle,
          description: appointmentDescription,
          startTime,
          endTime,
          attendeeEmails: directReport.email ? [directReport.email] : undefined,
          googleEventId: calendarEventId,
        });

        if (!result.success) {
          googleSyncError = result.error;
          console.warn('[1-on-1 Meeting] Google Calendar update failed (non-fatal):', result.error);
        } else {
          console.log(`[1-on-1 Meeting] Updated Google Calendar event: ${calendarEventId}`);
        }
      } catch (googleError) {
        googleSyncError = googleError instanceof Error ? googleError.message : "Google Calendar update failed";
        console.warn('[1-on-1 Meeting] Google Calendar update error (non-fatal):', googleError);
      }
    }

    return {
      success: true,
      googleSyncError,
    };
  } catch (error) {
    console.error('[1-on-1 Meeting] Calendar update failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update calendar appointments",
      googleSyncError,
    };
  }
}
