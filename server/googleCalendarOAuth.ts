import { Router, Request, Response } from 'express';
import { db } from './db';
import { calendarConnections, calendarSyncState, calendarEvents } from '@shared/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { EncryptionService } from './encryption';
import { createOAuth2Client } from './googleCalendarUtils';

const router = Router();

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Calendar scopes needed for full sync
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Start OAuth flow
router.get('/auth', (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const client = createOAuth2Client();
  
  // Store user ID in state parameter for callback
  const state = Buffer.from(JSON.stringify({
    userId: req.session.userId,
    timestamp: Date.now()
  })).toString('base64');

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent' // Force consent to get refresh token
  });

  res.json({ authUrl });
});

// OAuth callback
router.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect('/calendar-settings?error=missing_params');
  }

  try {
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;

    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return res.redirect('/calendar-settings?error=missing_tokens');
    }

    // Set credentials and get user info
    client.setCredentials(tokens);
    
    // Get user email from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = await response.json();

    // Store encrypted tokens in database
    const connectionData = {
      userId, // This is UUID from staff.id
      calendarId: 'primary',
      calendarName: `${userInfo.name}'s Calendar`,
      email: userInfo.email,
      accessToken: EncryptionService.encrypt(tokens.access_token),
      refreshToken: EncryptionService.encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      scope: tokens.scope || SCOPES.join(' '),
      syncEnabled: true,
      twoWaySync: true,
      createContacts: false,
      triggerWorkflows: false
    };

    // Check if connection already exists
    const existing = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.calendarId, 'primary')
      )
    });

    if (existing) {
      // Update existing connection
      await db.update(calendarConnections)
        .set(connectionData)
        .where(eq(calendarConnections.id, existing.id));
    } else {
      // Create new connection
      const [connection] = await db.insert(calendarConnections)
        .values(connectionData)
        .returning();

      // Initialize sync state
      await db.insert(calendarSyncState).values({
        connectionId: connection.id,
        lastSyncStatus: 'pending'
      });
    }

    res.redirect('/calendar-settings?success=connected');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/calendar-settings?error=auth_failed');
  }
});

// Disconnect calendar (support both DELETE and POST for frontend compatibility)
router.post('/disconnect', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { calendarId = 'primary' } = req.query;

  try {
    const connection = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, req.session.userId),
        eq(calendarConnections.calendarId, calendarId as string)
      )
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Revoke access token with Google
    const accessToken = EncryptionService.decrypt(connection.accessToken);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Delete from database
    await db.delete(calendarConnections)
      .where(eq(calendarConnections.id, connection.id));

    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

// Get connection status
router.get('/status', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const connections = await db.query.calendarConnections.findMany({
      where: eq(calendarConnections.userId, req.session.userId)
    });

    const connectionsWithStatus = await Promise.all(
      connections.map(async (conn) => {
        const syncState = await db.query.calendarSyncState.findFirst({
          where: eq(calendarSyncState.connectionId, conn.id)
        });

        return {
          id: conn.id,
          calendarId: conn.calendarId,
          calendarName: conn.calendarName,
          email: conn.email,
          syncEnabled: conn.syncEnabled,
          twoWaySync: conn.twoWaySync,
          lastSyncedAt: conn.lastSyncedAt,
          syncStatus: syncState?.lastSyncStatus || 'never_synced',
          lastSyncError: syncState?.lastSyncError
        };
      })
    );

    res.json({ connections: connectionsWithStatus });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

// Sync calendar events (runs in background to avoid timeout)
router.post('/sync', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Check if user has a connected calendar
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, req.session.userId));
    
    if (connections.length === 0) {
      return res.status(400).json({ error: 'No Google Calendar connected' });
    }

    // Check if sync is already in progress
    const syncState = await db.query.calendarSyncState.findFirst({
      where: eq(calendarSyncState.connectionId, connections[0].id)
    });

    if (syncState?.lastSyncStatus === 'in_progress') {
      const timeSinceStart = Date.now() - (syncState.lastSyncStarted?.getTime() || 0);
      if (timeSinceStart < 120000) { // If sync started less than 2 minutes ago
        return res.json({ 
          success: true,
          message: 'Sync already in progress',
          status: 'in_progress'
        });
      }
    }

    // Import the sync function
    const { syncUserCalendar } = await import('./googleCalendarSync');
    
    // Start sync in background (don't await)
    syncUserCalendar(req.session.userId, 'primary')
      .then(result => {
        console.log(`[Sync Complete] User ${req.session?.userId}: ${result.eventsCreated} created, ${result.eventsUpdated} updated, ${result.eventsDeleted} deleted`);
      })
      .catch(error => {
        console.error('[Sync Error]', error);
      });
    
    // Return immediately with success
    res.json({ 
      success: true, 
      message: 'Sync started. This may take a few moments for large calendars.',
      status: 'started'
    });
  } catch (error) {
    console.error('Sync error details:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      userId: req.session?.userId
    });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start sync' });
  }
});

// Get synced Google Calendar events for display in calendar view
router.get('/events', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Check if user has a connected calendar
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, req.session.userId));
    
    if (connections.length === 0) {
      return res.json({ events: [] });
    }

    // Get synced events from calendar_events table
    const events = await db
      .select({
        id: calendarEvents.id,
        calendarId: sql<string>`'google-calendar'`.as('calendarId'),
        connectionId: calendarEvents.connectionId,
        googleEventId: calendarEvents.googleEventId,
        title: calendarEvents.summary,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        location: calendarEvents.location,
        status: calendarEvents.status,
        allDay: calendarEvents.allDay,
        transparency: calendarEvents.transparency,
        attendees: calendarEvents.attendees,
        organizer: calendarEvents.organizer,
        googleHtmlLink: calendarEvents.googleHtmlLink,
        googleHangoutLink: calendarEvents.googleHangoutLink,
        type: sql<string>`'google'`.as('type'),
      })
      .from(calendarEvents)
      .where(eq(calendarEvents.connectionId, connections[0].id))
      .orderBy(asc(calendarEvents.startTime));

    console.log(`[Google Calendar Events] Returning ${events.length} events for user ${req.session.userId}`);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch Google Calendar events' });
  }
});

export default router;