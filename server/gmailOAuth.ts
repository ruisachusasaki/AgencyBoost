/**
 * Gmail OAuth + per-user sync trigger endpoints.
 * Mounted at /api/gmail. All routes require an authenticated session.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { gmailConnections, gmailSyncState } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { EncryptionService } from './encryption';
import { createGmailOAuth2Client, GMAIL_SCOPES } from './gmailUtils';

const router = Router();

function getUserId(req: Request): string | undefined {
  return (req as any).session?.userId;
}

// 1. Start OAuth flow → returns auth URL for the frontend to redirect to.
// Uses a cryptographically random nonce stored in the session to prevent CSRF
// (an attacker can't trick a victim into linking the attacker's Gmail account
// because the callback rejects any state nonce that wasn't issued to *this* session).
router.get('/auth', (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const client = createGmailOAuth2Client();
  const nonce = crypto.randomBytes(32).toString('hex');
  (req.session as any).gmailOAuthNonce = nonce;
  (req.session as any).gmailOAuthUserId = userId;

  const state = Buffer.from(JSON.stringify({
    nonce,
    timestamp: Date.now(),
  })).toString('base64url');

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state,
    prompt: 'consent', // Force consent so we always get a refresh_token
  });

  res.json({ authUrl });
});

// 2. OAuth callback - Google redirects here with `code`.
router.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect('/settings/my-profile?gmail=missing_params');
  }

  try {
    const stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString());
    const sessionNonce = (req.session as any).gmailOAuthNonce as string | undefined;
    const sessionUserId = (req.session as any).gmailOAuthUserId as string | undefined;

    // Verify the state nonce matches what we issued to *this* session.
    // Use timingSafeEqual to prevent timing-based discovery attacks.
    if (
      !sessionNonce ||
      !sessionUserId ||
      typeof stateData.nonce !== 'string' ||
      stateData.nonce.length !== sessionNonce.length ||
      !crypto.timingSafeEqual(Buffer.from(stateData.nonce), Buffer.from(sessionNonce))
    ) {
      return res.redirect('/settings/my-profile?gmail=invalid_state');
    }

    // Reject stale state (>10 minutes old) — covers replay attacks where a stale URL is reused.
    if (typeof stateData.timestamp !== 'number' || Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return res.redirect('/settings/my-profile?gmail=expired_state');
    }

    // Single-use: clear the nonce immediately so the same callback URL can't be replayed.
    delete (req.session as any).gmailOAuthNonce;
    delete (req.session as any).gmailOAuthUserId;

    // Trust the session-bound userId (NOT a value from the state blob).
    const userId = sessionUserId;

    const client = createGmailOAuth2Client();
    const { tokens } = await client.getToken(code as string);

    if (!tokens.access_token) {
      return res.redirect('/settings/my-profile?gmail=missing_tokens');
    }

    // Lookup the user's email from Google to store on the connection row
    const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResp.json();

    if (!userInfo?.email) {
      return res.redirect('/settings/my-profile?gmail=no_email');
    }

    const existing = await db.query.gmailConnections.findFirst({
      where: eq(gmailConnections.userId, userId),
    });

    const connectionData = {
      userId,
      email: userInfo.email,
      accessToken: EncryptionService.encrypt(tokens.access_token),
      // Reuse existing refresh token if Google didn't issue a new one (it usually only issues one on first consent).
      refreshToken: tokens.refresh_token
        ? EncryptionService.encrypt(tokens.refresh_token)
        : (existing?.refreshToken || ''),
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      scope: tokens.scope || GMAIL_SCOPES.join(' '),
      syncEnabled: true,
    };

    if (!connectionData.refreshToken) {
      return res.redirect('/settings/my-profile?gmail=no_refresh_token');
    }

    if (existing) {
      await db.update(gmailConnections)
        .set({ ...connectionData, updatedAt: new Date() })
        .where(eq(gmailConnections.id, existing.id));
    } else {
      const [conn] = await db.insert(gmailConnections)
        .values(connectionData)
        .returning();
      await db.insert(gmailSyncState).values({
        connectionId: conn.id,
        lastSyncStatus: 'pending',
      });
    }

    return res.redirect('/settings/my-profile?gmail=connected');
  } catch (error) {
    console.error('[Gmail OAuth] Callback error:', error);
    return res.redirect('/settings/my-profile?gmail=auth_failed');
  }
});

// 3. Disconnect Gmail for the current user.
router.post('/disconnect', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const connection = await db.query.gmailConnections.findFirst({
      where: eq(gmailConnections.userId, userId),
    });

    if (!connection) {
      return res.status(404).json({ error: 'No Gmail connection found' });
    }

    // Best-effort token revocation with Google. We don't fail the request if Google rejects it.
    try {
      const accessToken = EncryptionService.decrypt(connection.accessToken);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (e) {
      console.warn('[Gmail OAuth] Token revoke failed (non-fatal):', e);
    }

    await db.delete(gmailConnections).where(eq(gmailConnections.id, connection.id));
    res.json({ message: 'Gmail disconnected' });
  } catch (error) {
    console.error('[Gmail OAuth] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

// 4. Per-user connection status (used by frontend integration card).
router.get('/status', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const connection = await db.query.gmailConnections.findFirst({
      where: eq(gmailConnections.userId, userId),
    });

    if (!connection) {
      // Apply the same no-store + serverNow contract on the disconnected
      // branch so the frontend gets a consistent shape regardless of state.
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json({ connected: false, serverNow: new Date().toISOString() });
    }

    const state = await db.query.gmailSyncState.findFirst({
      where: eq(gmailSyncState.connectionId, connection.id),
    });

    // Live status endpoint: never let a browser/proxy serve a stale cached
    // body, otherwise the My Profile card can display "last synced 3 hours
    // ago" long after the underlying sync state has changed. `no-store`
    // prevents the browser from even storing the response, which means no
    // If-None-Match round-trip and no risk of a stale 304.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      connected: true,
      email: connection.email,
      syncEnabled: connection.syncEnabled,
      lastSyncedAt: connection.lastSyncedAt,
      syncStatus: state?.lastSyncStatus || 'never_synced',
      lastSyncError: state?.lastSyncError,
      initialSyncCompleted: state?.initialSyncCompleted ?? false,
      emailsLogged: state?.emailsLogged ?? 0,
      emailsScanned: state?.emailsScanned ?? 0,
      // Live counters for the in-flight run. Updated per Gmail page so the UI
      // can show "Currently syncing — N scanned, M logged" without waiting
      // for the whole sync cycle to complete.
      currentRunScanned: state?.currentRunScanned ?? 0,
      currentRunLogged: state?.currentRunLogged ?? 0,
      lastSyncStarted: state?.lastSyncStarted ?? null,
      // Server's current clock so the frontend can render the "last synced X
      // ago" label against trusted server time, not the user's possibly-skewed
      // browser clock.
      serverNow: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Gmail OAuth] Status error:', error);
    res.status(500).json({ error: 'Failed to read Gmail status' });
  }
});

// 5. Trigger an immediate sync for this user (returns immediately; sync runs in background).
router.post('/sync-now', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const connection = await db.query.gmailConnections.findFirst({
      where: eq(gmailConnections.userId, userId),
    });

    if (!connection) {
      return res.status(404).json({ error: 'No Gmail connection found' });
    }

    const { tryStartGmailSync } = await import('./gmailBackgroundSync');

    // Atomic acquire-or-409. tryStartGmailSync's lock check + acquire run
    // synchronously before any await, so two simultaneous requests cannot
    // both receive a non-null promise — the second one is guaranteed to
    // get the 409 response below.
    const syncPromise = tryStartGmailSync(connection.id);
    if (!syncPromise) {
      return res.status(409).json({
        ok: false,
        message: 'Sync already in progress. Please wait for it to finish.',
      });
    }

    // Fire-and-forget the actual work; the lock is already held by us at
    // this point, so any rejection here is a real sync error worth logging.
    syncPromise.catch(err => {
      console.error('[Gmail OAuth] Manual sync error:', err);
    });

    res.json({ success: true, message: 'Gmail sync started in background' });
  } catch (error) {
    console.error('[Gmail OAuth] Sync-now error:', error);
    res.status(500).json({ error: 'Failed to trigger Gmail sync' });
  }
});

export default router;
