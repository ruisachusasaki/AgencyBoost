// Test endpoint to verify Google Calendar events
import { Router } from 'express';
import { db } from './db';
import { calendarConnections, calendarEvents } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Test endpoint that doesn't require authentication
router.get('/test-google-events', async (req, res) => {
  try {
    // Get Rui's connection directly
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.email, 'rui@themediaoptimizers.com'));
    
    if (connections.length === 0) {
      return res.json({ 
        success: false, 
        message: "No Google Calendar connection found for rui@themediaoptimizers.com" 
      });
    }

    // Get synced events
    const events = await db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.summary,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        location: calendarEvents.location,
        status: calendarEvents.status,
      })
      .from(calendarEvents)
      .where(eq(calendarEvents.connectionId, connections[0].id))
      .limit(10);

    res.json({ 
      success: true,
      connectionId: connections[0].id,
      userEmail: connections[0].email,
      totalEvents: events.length,
      sampleEvents: events.slice(0, 5).map(e => ({
        title: e.title,
        startTime: e.startTime
      }))
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;