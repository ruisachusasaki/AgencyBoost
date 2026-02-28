import {
  syncUserCalendar
} from "./chunk-5CPRU4P6.js";
import "./chunk-SP2DH5L6.js";
import "./chunk-BGP47S4B.js";
import {
  db
} from "./chunk-5WD7MEUZ.js";
import {
  calendarConnections
} from "./chunk-J6ODQMC3.js";
import "./chunk-MLKGABMK.js";

// server/googleCalendarBackgroundSync.ts
import { eq, and, lt, or, isNull } from "drizzle-orm";
var SYNC_INTERVAL_MS = 2 * 60 * 1e3;
var STALE_SYNC_THRESHOLD_MS = 3 * 60 * 1e3;
var syncIntervalId = null;
var isRunning = false;
function startBackgroundSync() {
  if (syncIntervalId) {
    console.log("[BackgroundSync] Already running");
    return;
  }
  console.log("[BackgroundSync] Starting background calendar sync service");
  setTimeout(() => {
    syncAllCalendars().catch((err) => {
      console.error("[BackgroundSync] Initial sync error:", err);
    });
  }, 1e4);
  syncIntervalId = setInterval(() => {
    syncAllCalendars().catch((err) => {
      console.error("[BackgroundSync] Sync interval error:", err);
    });
  }, SYNC_INTERVAL_MS);
  console.log(`[BackgroundSync] Scheduled to run every ${SYNC_INTERVAL_MS / 1e3} seconds`);
}
function stopBackgroundSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log("[BackgroundSync] Stopped background calendar sync service");
  }
}
async function syncAllCalendars() {
  if (isRunning) {
    console.log("[BackgroundSync] Sync already in progress, skipping");
    return;
  }
  isRunning = true;
  console.log("[BackgroundSync] Starting sync for all connected calendars");
  try {
    const staleThreshold = new Date(Date.now() - STALE_SYNC_THRESHOLD_MS);
    const connections = await db.query.calendarConnections.findMany({
      where: and(
        eq(calendarConnections.syncEnabled, true),
        or(
          isNull(calendarConnections.lastSyncedAt),
          lt(calendarConnections.lastSyncedAt, staleThreshold)
        )
      )
    });
    console.log(`[BackgroundSync] Found ${connections.length} calendars needing sync`);
    for (const connection of connections) {
      try {
        console.log(`[BackgroundSync] Syncing calendar for user ${connection.userId}`);
        await syncUserCalendar(connection.userId, connection.calendarId);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[BackgroundSync] Error syncing calendar for user ${connection.userId}:`, error);
      }
    }
    console.log("[BackgroundSync] Completed sync cycle");
  } catch (error) {
    console.error("[BackgroundSync] Error in sync cycle:", error);
  } finally {
    isRunning = false;
  }
}
async function forceSyncUserCalendar(userId) {
  console.log(`[BackgroundSync] Force syncing calendar for user ${userId}`);
  const connections = await db.query.calendarConnections.findMany({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.syncEnabled, true)
    )
  });
  for (const connection of connections) {
    try {
      await syncUserCalendar(userId, connection.calendarId);
    } catch (error) {
      console.error(`[BackgroundSync] Error force syncing for user ${userId}:`, error);
    }
  }
}
export {
  forceSyncUserCalendar,
  startBackgroundSync,
  stopBackgroundSync
};
