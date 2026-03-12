import {
  getUserCalendarClient
} from "./chunk-X7MOQSE6.js";
import {
  db
} from "./chunk-ZZSCKNY3.js";
import {
  calendarConnections,
  calendarEvents,
  calendarSyncState,
  clientAppointments,
  clients
} from "./chunk-JU345PWR.js";

// server/googleCalendarSync.ts
import { eq, and, or, not, inArray } from "drizzle-orm";
async function syncUserCalendar(userId, calendarId = "primary") {
  console.log("[syncUserCalendar] Starting sync for user:", userId, "calendar:", calendarId);
  const result = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: []
  };
  let connection;
  try {
    connection = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.calendarId, calendarId)
      )
    });
    console.log("[syncUserCalendar] Connection found:", !!connection, {
      id: connection?.id,
      syncEnabled: connection?.syncEnabled,
      hasAccessToken: !!connection?.accessToken
    });
    if (!connection || !connection.syncEnabled) {
      throw new Error("Calendar sync is not enabled");
    }
    console.log("[syncUserCalendar] Updating sync state to in_progress");
    await db.update(calendarSyncState).set({
      lastSyncStarted: /* @__PURE__ */ new Date(),
      lastSyncStatus: "in_progress",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(calendarSyncState.connectionId, connection.id));
    console.log("[syncUserCalendar] Getting Google Calendar client");
    const calendar = await getUserCalendarClient(userId, calendarId);
    const pullResult = await pullGoogleEvents(calendar, connection);
    result.eventsCreated += pullResult.eventsCreated;
    result.eventsUpdated += pullResult.eventsUpdated;
    result.eventsDeleted += pullResult.eventsDeleted;
    if (connection.twoWaySync) {
      const pushResult = await pushAgencyBoostAppointments(calendar, connection);
      result.eventsCreated += pushResult.eventsCreated;
      result.eventsUpdated += pushResult.eventsUpdated;
    }
    await db.update(calendarSyncState).set({
      lastSyncCompleted: /* @__PURE__ */ new Date(),
      lastSyncStatus: "success",
      eventsCreated: result.eventsCreated,
      eventsUpdated: result.eventsUpdated,
      eventsDeleted: result.eventsDeleted,
      lastSyncError: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(calendarSyncState.connectionId, connection.id));
    await db.update(calendarConnections).set({
      lastSyncedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(calendarConnections.id, connection.id));
    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);
    if (connection) {
      await db.update(calendarSyncState).set({
        lastSyncCompleted: /* @__PURE__ */ new Date(),
        lastSyncStatus: "failed",
        lastSyncError: errorMessage,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(calendarSyncState.connectionId, connection.id));
    }
  }
  return result;
}
async function pullGoogleEvents(calendar, connection) {
  const result = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: []
  };
  try {
    const timeMin = /* @__PURE__ */ new Date();
    timeMin.setDate(timeMin.getDate() - 365);
    const timeMax = /* @__PURE__ */ new Date();
    timeMax.setDate(timeMax.getDate() + 365);
    console.log("[pullGoogleEvents] Fetching events from", timeMin.toISOString(), "to", timeMax.toISOString());
    const response = await calendar.events.list({
      calendarId: connection.calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 2500,
      // Increased from 250 to get more events
      singleEvents: true,
      orderBy: "startTime"
      // Don't use syncToken with time range parameters
    });
    const googleEvents = response.data.items || [];
    const nextSyncToken = response.data.nextSyncToken;
    console.log(`[pullGoogleEvents] Found ${googleEvents.length} events in Google Calendar`);
    const existingEvents = await db.query.calendarEvents.findMany({
      where: eq(calendarEvents.connectionId, connection.id)
    });
    console.log(`[pullGoogleEvents] Found ${existingEvents.length} existing synced events in database`);
    const existingEventMap = new Map(
      existingEvents.map((event) => [event.googleEventId, event])
    );
    for (const googleEvent of googleEvents) {
      if (!googleEvent.id) continue;
      const existingEvent = existingEventMap.get(googleEvent.id);
      const eventData = {
        connectionId: connection.id,
        googleEventId: googleEvent.id,
        summary: googleEvent.summary || "Untitled Event",
        description: googleEvent.description || null,
        location: googleEvent.location || null,
        startTime: parseEventTime(googleEvent.start),
        endTime: parseEventTime(googleEvent.end),
        allDay: !googleEvent.start?.dateTime,
        status: googleEvent.status || "confirmed",
        visibility: googleEvent.visibility || "default",
        transparency: googleEvent.transparency || "opaque",
        attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
        organizer: googleEvent.organizer ? JSON.stringify(googleEvent.organizer) : null,
        recurrence: googleEvent.recurrence ? JSON.stringify(googleEvent.recurrence) : null,
        googleHtmlLink: googleEvent.htmlLink || null,
        googleHangoutLink: googleEvent.hangoutLink || null
      };
      if (existingEvent) {
        await db.update(calendarEvents).set({
          ...eventData,
          syncedAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(calendarEvents.id, existingEvent.id));
        result.eventsUpdated++;
      } else {
        const [newEvent] = await db.insert(calendarEvents).values(eventData).returning();
        result.eventsCreated++;
        if (connection.createContacts && googleEvent.attendees) {
          await createContactsFromAttendees(googleEvent.attendees);
        }
        if (connection.triggerWorkflows) {
          await triggerWorkflowForEvent(newEvent, "google_calendar_event_created");
        }
      }
      existingEventMap.delete(googleEvent.id);
    }
    const eventsToDelete = Array.from(existingEventMap.values());
    if (eventsToDelete.length > 0) {
      const eventIdsToDelete = eventsToDelete.map((e) => e.id);
      await db.delete(calendarEvents).where(inArray(calendarEvents.id, eventIdsToDelete));
      result.eventsDeleted = eventsToDelete.length;
    }
    console.log(`[pullGoogleEvents] Sync complete: Created ${result.eventsCreated}, Updated ${result.eventsUpdated}, Deleted ${result.eventsDeleted} events`);
    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);
  }
  return result;
}
async function pushAgencyBoostAppointments(calendar, connection) {
  const result = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: []
  };
  try {
    const appointments = await db.query.clientAppointments.findMany({
      where: and(
        eq(clientAppointments.assignedToId, connection.userId),
        or(
          eq(clientAppointments.googleEventId, null),
          not(eq(clientAppointments.updatedAt, clientAppointments.lastGoogleSyncAt))
        )
      ),
      with: {
        client: true,
        lead: true
      }
    });
    for (const appointment of appointments) {
      try {
        const eventData = {
          summary: appointment.title,
          description: appointment.description || void 0,
          location: appointment.location || void 0,
          start: {
            dateTime: appointment.startTime.toISOString(),
            timeZone: "UTC"
          },
          end: {
            dateTime: appointment.endTime.toISOString(),
            timeZone: "UTC"
          },
          attendees: appointment.attendees ? JSON.parse(appointment.attendees) : void 0,
          reminders: {
            useDefault: false,
            overrides: appointment.reminderMinutes ? [{ method: "email", minutes: appointment.reminderMinutes }] : void 0
          }
        };
        let googleEventId;
        if (appointment.googleEventId) {
          const updateResult = await calendar.events.update({
            calendarId: connection.calendarId,
            eventId: appointment.googleEventId,
            requestBody: eventData
          });
          googleEventId = updateResult.data.id;
          result.eventsUpdated++;
        } else {
          const createResult = await calendar.events.insert({
            calendarId: connection.calendarId,
            requestBody: eventData
          });
          googleEventId = createResult.data.id;
          result.eventsCreated++;
        }
        await db.update(clientAppointments).set({
          googleEventId,
          lastGoogleSyncAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(clientAppointments.id, appointment.id));
      } catch (error) {
        console.error(`Error syncing appointment ${appointment.id}:`, error);
        result.errors.push(`Failed to sync appointment: ${appointment.title}`);
      }
    }
    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);
  }
  return result;
}
function parseEventTime(eventTime) {
  if (eventTime?.dateTime) {
    return new Date(eventTime.dateTime);
  } else if (eventTime?.date) {
    return new Date(eventTime.date);
  }
  return /* @__PURE__ */ new Date();
}
async function createContactsFromAttendees(attendees) {
  for (const attendee of attendees) {
    if (!attendee.email) continue;
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.email, attendee.email)
    });
    if (!existingClient) {
      const names = (attendee.displayName || attendee.email).split(" ");
      const firstName = names[0] || attendee.email.split("@")[0];
      const lastName = names.slice(1).join(" ") || "";
      await db.insert(clients).values({
        name: `${firstName} ${lastName}`.trim(),
        email: attendee.email,
        source: "Google Calendar",
        status: "Active",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
  }
}
async function triggerWorkflowForEvent(event, triggerType) {
  console.log(`Triggering workflow: ${triggerType} for event ${event.id}`);
}
async function getGoogleCalendarBusyTimes(userId, timeMin, timeMax) {
  try {
    const connections = await db.query.calendarConnections.findMany({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.syncEnabled, true)
      )
    });
    const busyTimes = [];
    for (const connection of connections) {
      const calendar = await getUserCalendarClient(userId, connection.calendarId);
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: connection.calendarId }]
        }
      });
      const calendarBusy = response.data.calendars?.[connection.calendarId]?.busy || [];
      for (const busy of calendarBusy) {
        if (busy.start && busy.end) {
          busyTimes.push({
            start: new Date(busy.start),
            end: new Date(busy.end)
          });
        }
      }
    }
    return busyTimes;
  } catch (error) {
    console.error("Error fetching Google Calendar busy times:", error);
    return [];
  }
}

export {
  syncUserCalendar,
  getGoogleCalendarBusyTimes
};
