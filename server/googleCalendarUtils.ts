/**
 * Google Calendar Utilities
 * Provides helper functions for Google Calendar authentication and API access
 */

import { OAuth2Client } from 'google-auth-library';
import { google, calendar_v3 } from 'googleapis';
import { db } from './db';
import { calendarConnections } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { EncryptionService } from './encryption';

// Get OAuth configuration from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Helper function to get redirect URI
function getRedirectUri(): string {
  const path = '/api/google-calendar/oauth/callback';
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  if (process.env.NODE_ENV === 'production') {
    if (process.env.BASE_URL) {
      return `${process.env.BASE_URL.replace(/\/$/, '')}${path}`;
    }
    if (process.env.REPLIT_DOMAINS) {
      return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}${path}`;
    }
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}${path}`;
  }
  return `http://localhost:5000${path}`;
}

// Create OAuth2 client
export function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

/**
 * Get an authenticated Google Calendar client for a user
 * This function retrieves the stored tokens and creates an authenticated client
 */
export async function getUserCalendarClient(
  userId: string, 
  calendarId: string = 'primary'
): Promise<calendar_v3.Calendar> {
  // Get the user's calendar connection
  const connection = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.calendarId, calendarId)
    ),
  });
  
  if (!connection || !connection.accessToken) {
    throw new Error('No valid calendar connection found');
  }
  
  // Decrypt tokens
  const accessToken = EncryptionService.decrypt(connection.accessToken);
  let refreshToken: string | null = null;
  
  // Only decrypt refresh token if it exists
  if (connection.refreshToken) {
    refreshToken = EncryptionService.decrypt(connection.refreshToken);
  }
  
  // Create OAuth2 client with tokens
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  // Handle token refresh if needed
  oauth2Client.on('tokens', async (tokens) => {
    // If we get new tokens, update them in the database
    if (tokens.access_token) {
      const encryptedAccessToken = EncryptionService.encrypt(tokens.access_token);
      
      const updateData: any = {
        accessToken: encryptedAccessToken,
        updatedAt: new Date(),
      };
      
      // Only update refresh token if we get a new one
      if (tokens.refresh_token) {
        updateData.refreshToken = EncryptionService.encrypt(tokens.refresh_token);
      }
      
      await db.update(calendarConnections)
        .set(updateData)
        .where(eq(calendarConnections.id, connection.id));
    }
  });
  
  // Return the calendar service
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Refresh tokens if needed
 */
export async function refreshTokenIfNeeded(oauth2Client: OAuth2Client): Promise<void> {
  try {
    const tokenInfo = await oauth2Client.getAccessToken();
    if (!tokenInfo.token) {
      await oauth2Client.refreshAccessToken();
    }
  } catch (error) {
    // If token refresh fails, we may need user to re-authenticate
    console.error('Token refresh failed:', error);
    throw new Error('Token refresh failed. Please reconnect your Google Calendar.');
  }
}