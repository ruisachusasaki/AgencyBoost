/**
 * Gmail Background Sync Service
 *
 * In-process scheduler that, every interval, walks all enabled gmail
 * connections and pulls new messages incrementally using Gmail's history API.
 *
 * - Initial sync: list messages from the configured lookback window
 *   (default 90 days), fetch them in batches, match against clients, and
 *   insert one logged_emails row per (message, client) match (dedup via the
 *   unique constraint on (gmail_message_id, client_id)).
 * - Incremental sync: use the stored historyId to fetch deltas only.
 * - Audit-log mirror: each new logged email also creates a thin audit_logs
 *   row (entityType='email', newValues.clientId=<client>) so the existing
 *   Communications tab continues to surface the email.
 */

import { db } from './db';
import {
  gmailConnections,
  gmailSyncState,
  loggedEmails,
  loggedEmailAttachments,
  emailLoggingSettings,
  emailLoggingDomainRules,
  emailLoggingExclusions,
  clients as clientsTable,
  clientContacts as clientContactsTable,
  auditLogs,
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { gmail_v1 } from 'googleapis';
import { getUserGmailClient } from './gmailUtils';
import { classifyAndMatch, type ClientLite, type ContactLite } from './gmailMatcher';

const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const STARTUP_DELAY_MS = 15_000; // 15s to let server warm up

let syncIntervalId: NodeJS.Timeout | null = null;
let isRunning = false;

export function startGmailBackgroundSync() {
  if (syncIntervalId) {
    console.log('[GmailSync] Already running');
    return;
  }
  console.log('[GmailSync] Starting background Gmail sync service');

  setTimeout(() => {
    runSyncCycle().catch(err => console.error('[GmailSync] Initial cycle error:', err));
  }, STARTUP_DELAY_MS);

  syncIntervalId = setInterval(() => {
    runSyncCycle().catch(err => console.error('[GmailSync] Cycle error:', err));
  }, SYNC_INTERVAL_MS);

  console.log(`[GmailSync] Scheduled to run every ${SYNC_INTERVAL_MS / 1000}s`);
}

export function stopGmailBackgroundSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[GmailSync] Stopped');
  }
}

async function runSyncCycle() {
  if (isRunning) {
    console.log('[GmailSync] Cycle already in progress, skipping');
    return;
  }
  isRunning = true;
  try {
    const settings = await getSettingsRow();
    if (!settings.enabled) {
      console.log('[GmailSync] Disabled by admin settings, skipping cycle');
      return;
    }

    const conns = await db.select().from(gmailConnections).where(eq(gmailConnections.syncEnabled, true));
    console.log(`[GmailSync] ${conns.length} connection(s) to process`);

    for (const conn of conns) {
      try {
        await syncUserGmail(conn.id);
        await new Promise(r => setTimeout(r, 500)); // gentle spacing
      } catch (err) {
        console.error(`[GmailSync] Error syncing connection ${conn.id}:`, err);
      }
    }
  } finally {
    isRunning = false;
  }
}

/**
 * Sync a single Gmail connection. Public so /api/gmail/sync-now can call it.
 */
export async function syncUserGmail(connectionId: string): Promise<{
  scanned: number;
  logged: number;
}> {
  const conn = await db.query.gmailConnections.findFirst({
    where: eq(gmailConnections.id, connectionId),
  });
  if (!conn) throw new Error(`Gmail connection ${connectionId} not found`);

  // Mark in_progress
  await upsertSyncStateStart(connectionId);

  try {
    const settings = await getSettingsRow();
    const { gmail, email: ownerEmail } = await getUserGmailClient(conn.userId);

    // Load matching context: clients + contacts + exclusions.
    const ctx = await loadMatchingContext();

    const state = await db.query.gmailSyncState.findFirst({
      where: eq(gmailSyncState.connectionId, connectionId),
    });

    let scanned = 0;
    let logged = 0;

    if (!state?.initialSyncCompleted || !state?.historyId) {
      const r = await runInitialSync(gmail, conn, ownerEmail, settings, ctx);
      scanned += r.scanned;
      logged += r.logged;
    } else {
      const r = await runIncrementalSync(gmail, conn, ownerEmail, state.historyId, settings, ctx);
      scanned += r.scanned;
      logged += r.logged;
    }

    await upsertSyncStateSuccess(connectionId, scanned, logged);
    await db.update(gmailConnections)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(gmailConnections.id, connectionId));

    console.log(`[GmailSync] ${ownerEmail} synced: scanned=${scanned}, logged=${logged}`);
    return { scanned, logged };
  } catch (err: any) {
    console.error(`[GmailSync] Failed connection ${connectionId}:`, err?.message || err);
    await upsertSyncStateFailure(connectionId, err?.message || String(err));
    throw err;
  }
}

// ---------- Sync strategies -------------------------------------------------

interface MatchingContext {
  clients: ClientLite[];
  contacts: ContactLite[];
  excludedEmails: Set<string>;
  excludedDomains: Set<string>;
  includedDomains: Set<string>;
}

async function loadMatchingContext(): Promise<MatchingContext> {
  const [clientRows, contactRows, exclEmailRows, domainRows] = await Promise.all([
    db.select({ id: clientsTable.id, email: clientsTable.email }).from(clientsTable),
    db.select({ id: clientContactsTable.id, clientId: clientContactsTable.clientId, email: clientContactsTable.email }).from(clientContactsTable),
    db.select({ email: emailLoggingExclusions.email }).from(emailLoggingExclusions),
    db.select({ domain: emailLoggingDomainRules.domain, ruleType: emailLoggingDomainRules.ruleType }).from(emailLoggingDomainRules),
  ]);

  const excludedEmails = new Set(exclEmailRows.map(r => (r.email || '').trim().toLowerCase()));
  const excludedDomains = new Set<string>();
  const includedDomains = new Set<string>();
  for (const r of domainRows) {
    const d = (r.domain || '').trim().toLowerCase();
    if (!d) continue;
    if (r.ruleType === 'exclude') excludedDomains.add(d);
    else if (r.ruleType === 'include') includedDomains.add(d);
  }

  return {
    clients: clientRows.map(r => ({ id: r.id, email: r.email })),
    contacts: contactRows.map(r => ({ id: r.id, clientId: r.clientId, email: r.email })),
    excludedEmails,
    excludedDomains,
    includedDomains,
  };
}

function buildGmailQuery(settings: SettingsRow): string {
  const parts: string[] = [];
  // Lookback window
  const cutoffSec = Math.floor((Date.now() - settings.initialLookbackDays * 24 * 60 * 60 * 1000) / 1000);
  parts.push(`after:${cutoffSec}`);
  if (settings.excludePromotions) parts.push('-category:promotions');
  if (settings.excludeSocial) parts.push('-category:social');
  if (settings.excludeUpdates) parts.push('-category:updates');
  if (settings.excludeSpam) parts.push('-in:spam');
  if (settings.excludeTrash) parts.push('-in:trash');
  return parts.join(' ');
}

async function runInitialSync(
  gmail: gmail_v1.Gmail,
  conn: typeof gmailConnections.$inferSelect,
  ownerEmail: string,
  settings: SettingsRow,
  ctx: MatchingContext,
): Promise<{ scanned: number; logged: number }> {
  console.log(`[GmailSync] Initial sync for ${ownerEmail} (lookback=${settings.initialLookbackDays}d)`);
  const q = buildGmailQuery(settings);
  let pageToken: string | undefined;
  let scanned = 0;
  let logged = 0;
  let latestHistoryId: string | null = null;

  do {
    const list = await gmail.users.messages.list({
      userId: 'me',
      q,
      maxResults: 100,
      pageToken,
    });

    const ids = (list.data.messages || []).map(m => m.id!).filter(Boolean);
    if (ids.length === 0) break;

    for (const id of ids) {
      scanned++;
      const r = await processMessage(gmail, id, conn, ownerEmail, settings, ctx);
      logged += r.logged;
      if (r.historyId) latestHistoryId = r.historyId;
    }

    pageToken = list.data.nextPageToken || undefined;
  } while (pageToken);

  // Always grab a current historyId to anchor incremental sync, even if we
  // logged nothing during initial pass.
  if (!latestHistoryId) {
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      latestHistoryId = profile.data.historyId || null;
    } catch (err) {
      console.warn('[GmailSync] getProfile failed:', err);
    }
  }

  await db.update(gmailSyncState)
    .set({
      historyId: latestHistoryId,
      initialSyncCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(gmailSyncState.connectionId, conn.id));

  return { scanned, logged };
}

async function runIncrementalSync(
  gmail: gmail_v1.Gmail,
  conn: typeof gmailConnections.$inferSelect,
  ownerEmail: string,
  startHistoryId: string,
  settings: SettingsRow,
  ctx: MatchingContext,
): Promise<{ scanned: number; logged: number }> {
  let pageToken: string | undefined;
  let scanned = 0;
  let logged = 0;
  let latestHistoryId: string | null = startHistoryId;
  const seenIds = new Set<string>();

  try {
    do {
      const hist = await gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded'],
        pageToken,
        maxResults: 500,
      });

      const events = hist.data.history || [];
      for (const ev of events) {
        for (const ma of ev.messagesAdded || []) {
          const id = ma.message?.id;
          if (!id || seenIds.has(id)) continue;
          seenIds.add(id);
          scanned++;
          const r = await processMessage(gmail, id, conn, ownerEmail, settings, ctx);
          logged += r.logged;
          if (r.historyId) latestHistoryId = r.historyId;
        }
      }

      if (hist.data.historyId) latestHistoryId = hist.data.historyId;
      pageToken = hist.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (err: any) {
    // 404 from history API means startHistoryId is too old → fall back to initial sync.
    if (err?.code === 404 || err?.response?.status === 404) {
      console.warn(`[GmailSync] historyId expired for ${ownerEmail}, falling back to initial sync`);
      await db.update(gmailSyncState)
        .set({ initialSyncCompleted: false, historyId: null, updatedAt: new Date() })
        .where(eq(gmailSyncState.connectionId, conn.id));
      return runInitialSync(gmail, conn, ownerEmail, settings, ctx);
    }
    throw err;
  }

  await db.update(gmailSyncState)
    .set({ historyId: latestHistoryId, updatedAt: new Date() })
    .where(eq(gmailSyncState.connectionId, conn.id));

  return { scanned, logged };
}

// ---------- Per-message processing -----------------------------------------

async function processMessage(
  gmail: gmail_v1.Gmail,
  messageId: string,
  conn: typeof gmailConnections.$inferSelect,
  ownerEmail: string,
  settings: SettingsRow,
  ctx: MatchingContext,
): Promise<{ logged: number; historyId: string | null }> {
  // Quick existence check: if this messageId is already logged for ANY client,
  // we still need to check for new client matches (multi-client). The unique
  // constraint covers it on insert; we only skip if we'd insert nothing new.
  let logged = 0;
  let historyId: string | null = null;

  let msg: gmail_v1.Schema$Message;
  try {
    const r = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    msg = r.data;
  } catch (err: any) {
    console.warn(`[GmailSync] messages.get failed for ${messageId}:`, err?.message || err);
    return { logged: 0, historyId: null };
  }

  historyId = msg.historyId || null;
  const parsed = parseMessage(msg);
  if (!parsed) return { logged: 0, historyId };

  // Trash/Spam guard (some history events leak through).
  const labels = parsed.labels;
  if (settings.excludeTrash && labels.includes('TRASH')) return { logged: 0, historyId };
  if (settings.excludeSpam && labels.includes('SPAM')) return { logged: 0, historyId };
  if (settings.excludePromotions && labels.includes('CATEGORY_PROMOTIONS')) return { logged: 0, historyId };
  if (settings.excludeSocial && labels.includes('CATEGORY_SOCIAL')) return { logged: 0, historyId };
  if (settings.excludeUpdates && labels.includes('CATEGORY_UPDATES')) return { logged: 0, historyId };

  const { direction, matches } = classifyAndMatch({
    fromEmail: parsed.fromEmail,
    toEmails: parsed.toEmails,
    ccEmails: parsed.ccEmails,
    bccEmails: parsed.bccEmails,
    ownerEmail,
    clients: ctx.clients,
    contacts: ctx.contacts,
    excludedEmails: ctx.excludedEmails,
    excludedDomains: ctx.excludedDomains,
    includedDomains: ctx.includedDomains,
  });

  if (matches.length === 0) return { logged: 0, historyId };

  for (const match of matches) {
    try {
      const inserted = await db.insert(loggedEmails).values({
        connectionId: conn.id,
        userId: conn.userId,
        clientId: match.clientId,
        contactId: match.contactId ?? null,
        gmailMessageId: parsed.id,
        gmailThreadId: parsed.threadId,
        fromEmail: parsed.fromEmail,
        fromName: parsed.fromName,
        toEmails: parsed.toEmails,
        ccEmails: parsed.ccEmails,
        bccEmails: parsed.bccEmails,
        subject: parsed.subject,
        snippet: parsed.snippet,
        bodyText: settings.storeBodyText ? parsed.bodyText : null,
        bodyHtml: settings.storeBodyHtml ? parsed.bodyHtml : null,
        direction,
        labels,
        hasAttachments: parsed.attachments.length > 0,
        matchedDomain: match.matchedDomain,
        matchedEmail: match.matchedEmail,
        receivedAt: parsed.receivedAt,
      })
        .onConflictDoNothing({ target: [loggedEmails.gmailMessageId, loggedEmails.clientId] })
        .returning();

      if (inserted.length === 0) continue; // already logged for this client

      logged++;

      // Persist attachment metadata
      if (parsed.attachments.length > 0) {
        await db.insert(loggedEmailAttachments).values(parsed.attachments.map(a => ({
          loggedEmailId: inserted[0].id,
          gmailAttachmentId: a.attachmentId,
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          partId: a.partId,
        })));
      }

      // Thin audit_logs mirror so the existing Communications tab continues to render this email.
      try {
        await db.insert(auditLogs).values({
          action: 'created',
          entityType: 'email',
          entityId: inserted[0].id,
          entityName: parsed.subject ? `Email: ${parsed.subject}` : `Email from ${parsed.fromEmail}`,
          userId: conn.userId,
          details: `${direction === 'outbound' ? 'Sent' : 'Received'} email ${direction === 'outbound' ? 'to' : 'from'} ${match.matchedEmail}`,
          oldValues: null,
          newValues: {
            clientId: match.clientId,
            contactId: match.contactId ?? null,
            loggedEmailId: inserted[0].id,
            direction,
            from: parsed.fromEmail,
            to: parsed.toEmails,
            subject: parsed.subject,
            snippet: parsed.snippet,
            gmailMessageId: parsed.id,
            gmailThreadId: parsed.threadId,
            hasAttachments: parsed.attachments.length > 0,
            provider: 'gmail',
            source: 'gmail-sync',
          },
        });
      } catch (auditErr) {
        console.warn('[GmailSync] audit log insert failed:', auditErr);
      }
    } catch (insertErr: any) {
      console.warn(`[GmailSync] Insert failed for msg=${parsed.id} client=${match.clientId}:`, insertErr?.message || insertErr);
    }
  }

  return { logged, historyId };
}

// ---------- Message parsing ------------------------------------------------

interface ParsedMessage {
  id: string;
  threadId: string;
  fromEmail: string;
  fromName: string | null;
  toEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  labels: string[];
  receivedAt: Date;
  attachments: Array<{
    attachmentId: string;
    filename: string;
    mimeType: string | null;
    sizeBytes: number | null;
    partId: string | null;
  }>;
}

function parseMessage(msg: gmail_v1.Schema$Message): ParsedMessage | null {
  if (!msg.id || !msg.threadId) return null;

  const headers = msg.payload?.headers || [];
  const getHeader = (name: string): string => {
    const h = headers.find(h => (h.name || '').toLowerCase() === name.toLowerCase());
    return h?.value || '';
  };

  const fromRaw = getHeader('From');
  const { email: fromEmail, name: fromName } = parseAddress(fromRaw);
  const toEmails = parseAddressList(getHeader('To'));
  const ccEmails = parseAddressList(getHeader('Cc'));
  const bccEmails = parseAddressList(getHeader('Bcc'));
  const subject = getHeader('Subject') || null;

  // Prefer internalDate (epoch ms as string)
  let receivedAt: Date;
  if (msg.internalDate) {
    const ms = parseInt(msg.internalDate, 10);
    receivedAt = Number.isFinite(ms) ? new Date(ms) : new Date();
  } else {
    const dateHdr = getHeader('Date');
    receivedAt = dateHdr ? new Date(dateHdr) : new Date();
  }

  const labels = msg.labelIds || [];

  // Walk body parts
  let bodyText: string | null = null;
  let bodyHtml: string | null = null;
  const attachments: ParsedMessage['attachments'] = [];

  function walk(part: gmail_v1.Schema$MessagePart | undefined) {
    if (!part) return;
    const mime = part.mimeType || '';
    const filename = part.filename || '';
    const body = part.body;

    if (filename && body?.attachmentId) {
      attachments.push({
        attachmentId: body.attachmentId,
        filename,
        mimeType: mime || null,
        sizeBytes: typeof body.size === 'number' ? body.size : null,
        partId: part.partId || null,
      });
    } else if (mime === 'text/plain' && body?.data && !bodyText) {
      bodyText = decodeBase64Url(body.data);
    } else if (mime === 'text/html' && body?.data && !bodyHtml) {
      bodyHtml = decodeBase64Url(body.data);
    }

    for (const child of part.parts || []) walk(child);
  }
  walk(msg.payload || undefined);

  return {
    id: msg.id,
    threadId: msg.threadId,
    fromEmail: fromEmail.toLowerCase(),
    fromName,
    toEmails,
    ccEmails,
    bccEmails,
    subject,
    snippet: msg.snippet || null,
    bodyText,
    bodyHtml,
    labels,
    receivedAt,
    attachments,
  };
}

function decodeBase64Url(data: string): string {
  try {
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function parseAddress(raw: string): { email: string; name: string | null } {
  if (!raw) return { email: '', name: null };
  // "Name <email@x.com>" or "email@x.com"
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<\s*([^>]+)\s*>\s*$/);
  if (m) {
    return { email: m[2].trim(), name: m[1].trim() || null };
  }
  return { email: raw.trim(), name: null };
}

function parseAddressList(raw: string): string[] {
  if (!raw) return [];
  return raw.split(',')
    .map(s => parseAddress(s).email)
    .filter(Boolean)
    .map(e => e.toLowerCase());
}

// ---------- Settings + sync state helpers ----------------------------------

type SettingsRow = typeof emailLoggingSettings.$inferSelect;

async function getSettingsRow(): Promise<SettingsRow> {
  const rows = await db.select().from(emailLoggingSettings).limit(1);
  if (rows.length > 0) return rows[0];
  // Defensive: if migration didn't seed, insert a default row.
  const [row] = await db.insert(emailLoggingSettings).values({ enabled: true }).returning();
  return row;
}

async function upsertSyncStateStart(connectionId: string) {
  const existing = await db.query.gmailSyncState.findFirst({
    where: eq(gmailSyncState.connectionId, connectionId),
  });
  const patch = {
    lastSyncStarted: new Date(),
    lastSyncStatus: 'in_progress' as const,
    lastSyncError: null,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(gmailSyncState).set(patch).where(eq(gmailSyncState.connectionId, connectionId));
  } else {
    await db.insert(gmailSyncState).values({ connectionId, ...patch });
  }
}

async function upsertSyncStateSuccess(connectionId: string, scanned: number, logged: number) {
  await db.update(gmailSyncState)
    .set({
      lastSyncCompleted: new Date(),
      lastSyncStatus: 'success',
      lastSyncError: null,
      emailsScanned: sql`${gmailSyncState.emailsScanned} + ${scanned}`,
      emailsLogged: sql`${gmailSyncState.emailsLogged} + ${logged}`,
      updatedAt: new Date(),
    })
    .where(eq(gmailSyncState.connectionId, connectionId));
}

async function upsertSyncStateFailure(connectionId: string, error: string) {
  await db.update(gmailSyncState)
    .set({
      lastSyncCompleted: new Date(),
      lastSyncStatus: 'failed',
      lastSyncError: error.slice(0, 1000),
      updatedAt: new Date(),
    })
    .where(eq(gmailSyncState.connectionId, connectionId));
}
