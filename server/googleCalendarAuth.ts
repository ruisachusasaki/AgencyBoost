/**
 * Google Calendar OAuth Authentication Service
 * Handles per-user OAuth authentication with Google Calendar API
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from './db';
import { calendarConnections, calendarSyncState } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Environment variables needed for OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/integrations/google-calendar/callback`
  : 'http://localhost:5000/api/integrations/google-calendar/callback';

// Scopes required for Google Calendar integration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Simple encryption/decryption for tokens (should use proper KMS in production)
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

function encrypt(text: string): string {
  const algorithm = 'aes-256-ctr';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.concat([Buffer.from(ENCRYPTION_KEY), Buffer.alloc(32)], 32), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const algorithm = 'aes-256-ctr';
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.concat([Buffer.from(ENCRYPTION_KEY), Buffer.alloc(32)], 32), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

/**
 * Creates an OAuth2 client for Google Calendar
 */
export function createOAuth2Client(): OAuth2Client {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }
  
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

/**
 * Generates the OAuth authorization URL for a user to grant calendar access
 */
export function getAuthorizationUrl(userId: string): string {
  const oauth2Client = createOAuth2Client();
  
  // Generate state parameter to prevent CSRF attacks and track the user
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    scope: SCOPES,
    state: state
  });
}

/**
 * Exchanges authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(code: string, state: string): Promise<{
  userId: string;
  tokens: any;
}> {
  // Decode and validate state
  const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  const userId = stateData.userId;
  
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }
  
  return { userId, tokens };
}

/**
 * Stores user's Google Calendar connection in the database
 */
export async function saveCalendarConnection(
  userId: string,
  tokens: any,
  userInfo: { email: string; calendarId?: string }
) {
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token!);
  
  // Check if connection already exists
  const existingConnection = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.calendarId, userInfo.calendarId || 'primary')
    ),
  });
  
  const connectionData = {
    userId,
    calendarId: userInfo.calendarId || 'primary',
    calendarName: userInfo.email,
    email: userInfo.email,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiresAt: new Date(Date.now() + (tokens.expiry_date || Date.now() + 3600000)),
    scope: tokens.scope || SCOPES.join(' '),
    syncEnabled: true,
    twoWaySync: true,
    createContacts: false,
    triggerWorkflows: false,
  };
  
  let connectionId: string;
  
  if (existingConnection) {
    // Update existing connection
    await db.update(calendarConnections)
      .set({
        ...connectionData,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, existingConnection.id));
    connectionId = existingConnection.id;
  } else {
    // Create new connection
    const [newConnection] = await db.insert(calendarConnections)
      .values(connectionData)
      .returning();
    connectionId = newConnection.id;
    
    // Initialize sync state
    await db.insert(calendarSyncState).values({
      connectionId,
      lastSyncStatus: 'pending',
    });
  }
  
  return connectionId;
}

/**
 * Gets an authenticated Google Calendar client for a user
 */
export async function getUserCalendarClient(userId: string, calendarId: string = 'primary'): Promise<any> {
  const connection = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.calendarId, calendarId)
    ),
  });
  
  if (!connection) {
    throw new Error('Google Calendar not connected for this user');
  }
  
  const oauth2Client = createOAuth2Client();
  
  // Decrypt tokens
  const accessToken = decrypt(connection.accessToken);
  const refreshToken = decrypt(connection.refreshToken);
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  // Check if token is expired and refresh if needed
  if (new Date(connection.expiresAt) < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens in database
    await db.update(calendarConnections)
      .set({
        accessToken: encrypt(credentials.access_token!),
        expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connection.id));
    
    oauth2Client.setCredentials(credentials);
  }
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Disconnects a user's Google Calendar
 */
export async function disconnectCalendar(userId: string, calendarId: string = 'primary'): Promise<void> {
  const connection = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.calendarId, calendarId)
    ),
  });
  
  if (connection) {
    // Revoke access token
    try {
      const oauth2Client = createOAuth2Client();
      const accessToken = decrypt(connection.accessToken);
      await oauth2Client.revokeToken(accessToken);
    } catch (error) {
      console.error('Error revoking Google token:', error);
    }
    
    // Delete from database
    await db.delete(calendarConnections)
      .where(eq(calendarConnections.id, connection.id));
  }
}

/**
 * Gets all calendar connections for a user
 */
export async function getUserCalendarConnections(userId: string) {
  const connections = await db.query.calendarConnections.findMany({
    where: eq(calendarConnections.userId, userId),
  });
  
  // Don't expose encrypted tokens
  return connections.map(conn => ({
    id: conn.id,
    calendarId: conn.calendarId,
    calendarName: conn.calendarName,
    email: conn.email,
    syncEnabled: conn.syncEnabled,
    twoWaySync: conn.twoWaySync,
    createContacts: conn.createContacts,
    triggerWorkflows: conn.triggerWorkflows,
    lastSyncedAt: conn.lastSyncedAt,
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt,
  }));
}

/**
 * Updates calendar connection settings
 */
export async function updateConnectionSettings(
  userId: string,
  calendarId: string,
  settings: {
    syncEnabled?: boolean;
    twoWaySync?: boolean;
    createContacts?: boolean;
    triggerWorkflows?: boolean;
  }
) {
  await db.update(calendarConnections)
    .set({
      ...settings,
      updatedAt: new Date(),
    })
    .where(and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.calendarId, calendarId)
    ));
}