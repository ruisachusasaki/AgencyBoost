/**
 * Google Calendar Background Sync Service
 * Automatically syncs all connected calendars at regular intervals
 */

import { db } from './db';
import { calendarConnections, calendarSyncState, CalendarConnection } from '@shared/schema';
import { eq, and, lt, or, isNull } from 'drizzle-orm';
import { syncUserCalendar } from './googleCalendarSync';

const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const STALE_SYNC_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes - sync if older than this

let syncIntervalId: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the background sync scheduler
 */
export function startBackgroundSync() {
  if (syncIntervalId) {
    console.log('[BackgroundSync] Already running');
    return;
  }
  
  console.log('[BackgroundSync] Starting background calendar sync service');
  
  // Run initial sync after a short delay to let the server start
  setTimeout(() => {
    syncAllCalendars().catch(err => {
      console.error('[BackgroundSync] Initial sync error:', err);
    });
  }, 10000); // 10 second delay for initial sync
  
  // Set up recurring sync
  syncIntervalId = setInterval(() => {
    syncAllCalendars().catch(err => {
      console.error('[BackgroundSync] Sync interval error:', err);
    });
  }, SYNC_INTERVAL_MS);
  
  console.log(`[BackgroundSync] Scheduled to run every ${SYNC_INTERVAL_MS / 1000} seconds`);
}

/**
 * Stop the background sync scheduler
 */
export function stopBackgroundSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[BackgroundSync] Stopped background calendar sync service');
  }
}

/**
 * Sync all connected calendars that need syncing
 */
async function syncAllCalendars() {
  if (isRunning) {
    console.log('[BackgroundSync] Sync already in progress, skipping');
    return;
  }
  
  isRunning = true;
  console.log('[BackgroundSync] Starting sync for all connected calendars');
  
  try {
    const staleThreshold = new Date(Date.now() - STALE_SYNC_THRESHOLD_MS);
    
    // Get all enabled calendar connections that need syncing
    const connections = await db.query.calendarConnections.findMany({
      where: and(
        eq(calendarConnections.syncEnabled, true),
        or(
          isNull(calendarConnections.lastSyncedAt),
          lt(calendarConnections.lastSyncedAt, staleThreshold)
        )
      ),
    });
    
    console.log(`[BackgroundSync] Found ${connections.length} calendars needing sync`);
    
    // Sync each connection (with a small delay between each to avoid rate limits)
    for (const connection of connections) {
      try {
        console.log(`[BackgroundSync] Syncing calendar for user ${connection.userId}`);
        await syncUserCalendar(connection.userId, connection.calendarId);
        
        // Small delay between syncs to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[BackgroundSync] Error syncing calendar for user ${connection.userId}:`, error);
        // Continue with other calendars even if one fails
      }
    }
    
    console.log('[BackgroundSync] Completed sync cycle');
  } catch (error) {
    console.error('[BackgroundSync] Error in sync cycle:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Force sync a specific user's calendar (called after page load or manual trigger)
 */
export async function forceSyncUserCalendar(userId: string): Promise<void> {
  console.log(`[BackgroundSync] Force syncing calendar for user ${userId}`);
  
  const connections = await db.query.calendarConnections.findMany({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.syncEnabled, true)
    ),
  });
  
  for (const connection of connections) {
    try {
      await syncUserCalendar(userId, connection.calendarId);
    } catch (error) {
      console.error(`[BackgroundSync] Error force syncing for user ${userId}:`, error);
    }
  }
}
