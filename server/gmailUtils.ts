/**
 * Gmail Utilities
 * OAuth2 client + authenticated Gmail client for the per-user two-way sync.
 */

import { OAuth2Client } from 'google-auth-library';
import { google, gmail_v1 } from 'googleapis';
import { db } from './db';
import { gmailConnections } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { EncryptionService } from './encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Read-only access plus userinfo to identify the connecting account.
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

function getRedirectUri(): string {
  const path = '/api/gmail/oauth/callback';
  if (process.env.GMAIL_REDIRECT_URI) {
    return process.env.GMAIL_REDIRECT_URI;
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

export function createGmailOAuth2Client(): OAuth2Client {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, getRedirectUri());
}

/**
 * Build an authenticated Gmail client for a given user. Decrypts stored tokens,
 * registers a tokens listener so refreshed access tokens get persisted.
 */
export async function getUserGmailClient(userId: string): Promise<{
  gmail: gmail_v1.Gmail;
  connectionId: string;
  email: string;
}> {
  const connection = await db.query.gmailConnections.findFirst({
    where: eq(gmailConnections.userId, userId),
  });

  if (!connection || !connection.accessToken) {
    throw new Error('No Gmail connection found for user');
  }

  const accessToken = EncryptionService.decrypt(connection.accessToken);
  const refreshToken = connection.refreshToken
    ? EncryptionService.decrypt(connection.refreshToken)
    : null;

  const oauth2Client = createGmailOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const updateData: any = {
        accessToken: EncryptionService.encrypt(tokens.access_token),
        updatedAt: new Date(),
      };
      if (tokens.expiry_date) {
        updateData.expiresAt = new Date(tokens.expiry_date);
      }
      if (tokens.refresh_token) {
        updateData.refreshToken = EncryptionService.encrypt(tokens.refresh_token);
      }
      await db.update(gmailConnections)
        .set(updateData)
        .where(eq(gmailConnections.id, connection.id));
    }
  });

  return {
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
    connectionId: connection.id,
    email: connection.email,
  };
}

export function getGmailRedirectUri(): string {
  return getRedirectUri();
}
