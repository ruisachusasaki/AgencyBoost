// Google Calendar Integration for AgencyFlow Appointments
import { Router, Request, Response } from 'express';
import { db } from './db';
import { 
  calendarAppointments,
  calendarConnections,
  staff
} from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { availabilityChecker } from './googleCalendarAvailability';
import { twoWaySync } from './googleCalendarTwoWaySync';
import { incrementalSync } from './googleCalendarIncrementalSync';

const router = Router();

// Middleware to check availability before creating/updating appointments
export async function checkAvailabilityMiddleware(req: Request, res: Response, next: Function) {
  const { assignedTo, startTime, endTime, id } = req.body;

  if (!assignedTo || !startTime || !endTime) {
    return next(); // Skip if not enough data
  }

  try {
    // Validate appointment time
    const validation = await availabilityChecker.validateAppointmentTime({
      assignedTo,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      id
    });

    if (!validation.valid) {
      return res.status(409).json({
        error: 'Time slot not available',
        reason: validation.reason
      });
    }

    next();
  } catch (error) {
    console.error('Availability check error:', error);
    // Continue anyway if check fails - don't block appointment creation
    next();
  }
}

// Hook to sync appointment to Google Calendar after creation
export async function syncAppointmentToGoogle(appointmentId: string) {
  try {
    // Check if appointment should be synced
    const appointment = await db
      .select({
        appointment: calendarAppointments,
        staff: staff
      })
      .from(calendarAppointments)
      .leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id))
      .where(eq(calendarAppointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) return;

    const appt = appointment[0].appointment;
    const assignedStaff = appointment[0].staff;

    if (!assignedStaff) return;

    // Check if staff has two-way sync enabled
    const connection = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.userId, assignedStaff.id),
          eq(calendarConnections.twoWaySync, true)
        )
      )
      .limit(1);

    if (connection.length > 0) {
      // Sync to Google Calendar
      const result = await twoWaySync.pushAppointmentToGoogle(appointmentId);
      
      if (result.success) {
        console.log(`✅ Appointment ${appointmentId} synced to Google Calendar`);
      } else {
        console.error(`Failed to sync appointment to Google: ${result.error}`);
      }
    }
  } catch (error) {
    console.error('Error syncing appointment to Google:', error);
  }
}

// Hook to delete appointment from Google Calendar
export async function deleteAppointmentFromGoogle(appointmentId: string) {
  try {
    const result = await twoWaySync.deleteAppointmentFromGoogle(appointmentId);
    
    if (result.success) {
      console.log(`✅ Appointment ${appointmentId} deleted from Google Calendar`);
    } else if (result.error) {
      console.error(`Failed to delete appointment from Google: ${result.error}`);
    }
  } catch (error) {
    console.error('Error deleting appointment from Google:', error);
  }
}

// Get available time slots for a user
router.get('/availability/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date, duration = 30 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const targetDate = new Date(date as string);
    const slotDuration = parseInt(duration as string) || 30;

    // Get available slots
    const slots = await availabilityChecker.getAvailableSlots(
      userId,
      targetDate,
      slotDuration
    );

    res.json({
      date: targetDate.toISOString().split('T')[0],
      slotDuration,
      availableSlots: slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// Check availability for a specific time slot
router.post('/check-availability', async (req: Request, res: Response) => {
  try {
    const { userId, startTime, endTime, excludeAppointmentId } = req.body;

    if (!userId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const availability = await availabilityChecker.checkUserAvailability(
      userId,
      new Date(startTime),
      new Date(endTime),
      excludeAppointmentId
    );

    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Force sync Google Calendar for a user
router.post('/sync/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get all connections for this user
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));

    if (!connections.length) {
      return res.status(404).json({ error: 'No Google Calendar connections found' });
    }

    const results = [];
    for (const connection of connections) {
      const result = await incrementalSync.syncUserCalendar(connection.id);
      results.push({
        connectionId: connection.id,
        email: connection.email,
        ...result
      });
    }

    // Refresh cache after sync
    await availabilityChecker.refreshUserCache(userId);

    res.json({
      message: 'Sync completed',
      connections: results
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

// Process Google Calendar webhook notifications
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const channelId = req.headers['x-goog-channel-id'] as string;
    const resourceState = req.headers['x-goog-resource-state'] as string;
    const resourceId = req.headers['x-goog-resource-id'] as string;

    console.log(`📨 Google Calendar webhook: channel=${channelId}, state=${resourceState}, resource=${resourceId}`);

    if (resourceState === 'sync') {
      // Initial sync notification
      res.status(200).send();
      return;
    }

    // Find connection by webhook channel ID
    const connection = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.webhookChannelId, channelId))
      .limit(1);

    if (connection.length > 0) {
      // Trigger incremental sync for this connection
      console.log(`Triggering sync for connection ${connection[0].id} (${connection[0].email})`);
      
      // Run sync asynchronously
      incrementalSync.syncUserCalendar(connection[0].id)
        .then(result => {
          console.log(`Webhook-triggered sync complete: +${result.eventsCreated}, ~${result.eventsUpdated}, -${result.eventsDeleted}`);
        })
        .catch(error => {
          console.error('Webhook sync error:', error);
        });
    }

    res.status(200).send();
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send();
  }
});

// Get sync status for a user
router.get('/sync-status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const connections = await db
      .select({
        connection: calendarConnections,
        syncState: calendarSyncState
      })
      .from(calendarConnections)
      .leftJoin(calendarSyncState, eq(calendarConnections.id, calendarSyncState.connectionId))
      .where(eq(calendarConnections.userId, userId));

    const status = connections.map(conn => ({
      email: conn.connection.email,
      calendarId: conn.connection.calendarId,
      syncEnabled: conn.connection.syncEnabled,
      twoWaySync: conn.connection.twoWaySync,
      lastSyncedAt: conn.connection.lastSyncedAt,
      syncStatus: conn.syncState?.lastSyncStatus || 'never',
      eventsCreated: conn.syncState?.eventsCreated || 0,
      eventsUpdated: conn.syncState?.eventsUpdated || 0,
      eventsDeleted: conn.syncState?.eventsDeleted || 0,
      lastError: conn.syncState?.lastSyncError
    }));

    res.json(status);
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

export default router;
export const googleCalendarAppointmentRouter = router;