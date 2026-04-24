# Gmail Two-Way Sync — Implementation Report

Status: **complete** · Plan: [`gmail-sync.md`](./gmail-sync.md) · Date: 2026-04-24

## Scope delivered

- Per-user Gmail OAuth (read-only `gmail.readonly` scope) with encrypted
  token storage reusing the existing `EncryptionService`.
- In-process background sync (2-minute interval, 90-day initial lookback,
  Promotions / Social / Updates / Spam / Trash excluded by default).
- Hybrid storage: `logged_emails` is the source-of-truth; a thin
  `audit_logs` mirror keeps the existing Communications tab populated.
- Multi-client matching: a single message can be logged against several
  clients when matched via different recipients/domains. Dedup is enforced
  by a unique constraint on `(gmail_message_id, client_id)`.
- Admin-only "Email Logging" settings page (master switch, lookback,
  category exclusions, body-storage toggles, domain rules, per-email
  exclusions, and a connections overview).
- Per-staff "Connect Gmail" card in My Profile.
- New "Emails" tab on the client profile, threaded by Gmail thread id, with
  filter (all/inbound/outbound), free-text search, body preview and
  on-demand attachment download.
- Idempotent startup migration that creates all 7 new tables and seeds the
  settings singleton if missing.

## File map

| Layer | File | Purpose |
|---|---|---|
| Schema | `shared/schema.ts` (appended) | 7 new tables + insert schemas/types |
| Permissions | `shared/permission-templates.ts`, `shared/role-templates.ts` | `settings.email_logging.{view,manage}` + manager template |
| Server – auth | `server/gmailUtils.ts` | OAuth client factory + token-refresh helper |
| Server – auth | `server/gmailOAuth.ts` | `/api/gmail/{auth,oauth/callback,disconnect,status,sync-now}` |
| Server – setup | `server/gmailSetup.ts` | mounts router |
| Server – sync | `server/gmailMatcher.ts` | pure classifier `classifyAndMatch(...)` |
| Server – sync | `server/gmailBackgroundSync.ts` | 2-min loop, initial + history-based incremental |
| Server – API | `server/routes.ts` | settings + per-client emails + on-demand attachments |
| Server – boot | `server/index.ts` | `ensureGmailSyncTables()` + `startGmailBackgroundSync()` |
| Frontend | `client/src/pages/settings/email-logging.tsx` | admin settings UI |
| Frontend | `client/src/pages/settings.tsx`, `client/src/App.tsx` | settings tile + route |
| Frontend | `client/src/pages/settings/my-profile.tsx` | `<GmailConnectionCard />` |
| Frontend | `client/src/components/client-emails-tab.tsx` | Emails tab on client profile |
| Frontend | `client/src/pages/enhanced-client-detail.tsx` | tab trigger + content for "Emails" |

## Data model (tl;dr)

- `gmail_connections` — one row per (staff, gmail address). Encrypted access
  + refresh tokens, scope, expiry, sync-enabled flag.
- `gmail_sync_state` — per-connection cursor: `historyId`,
  `initial_sync_completed`, last status/error, running totals.
- `logged_emails` — one row per (gmail message, client) match. Stores
  headers, snippet, bodies (text/html, gated by settings), labels,
  matched_email/matched_domain, direction, received_at. Unique
  `(gmail_message_id, client_id)`.
- `logged_email_attachments` — metadata only (filename, mime, size,
  Gmail attachment id). Binaries are pulled on demand from Gmail.
- `email_logging_settings` — singleton row of admin toggles.
- `email_logging_domain_rules` — `{include|exclude}` overrides per domain.
- `email_logging_exclusions` — per-email skip list.

## Sync flow

```
boot ─► ensureGmailSyncTables (idempotent CREATE TABLE IF NOT EXISTS)
     ─► startGmailBackgroundSync (setInterval 2 min, isRunning guard)

cycle ─► getSettingsRow → if disabled, skip
      ─► for each enabled gmail_connections row:
         ─► getUserGmailClient (refresh tokens if expired)
         ─► loadMatchingContext (clients + contacts + rules — one query/cycle)
         ─► initial vs incremental (decided by gmail_sync_state)
            initial    ─► messages.list?q=after:<cutoff> ‑category:promotions ‑category:social ‑category:updates …
            incremental ─► history.list?startHistoryId=<stored>; 404 → fall back to initial
         ─► per message: messages.get(format=full) → parseMessage → classifyAndMatch
         ─► for each match: insert loggedEmails ON CONFLICT DO NOTHING
                            (+ attachments metadata + thin audit_logs row)
         ─► persist new historyId
```

## Security & privacy

- OAuth scope is `gmail.readonly`. Tokens are encrypted with AES-256-GCM
  before insertion via the existing `EncryptionService`.
- OAuth `state` is a cryptographically random 32-byte nonce stored in the
  user's session and verified with `crypto.timingSafeEqual` on callback,
  with a 10-minute TTL and single-use clearing — prevents CSRF-style
  account-linking attacks. The callback trusts the **session-bound** userId,
  never a value from the state blob.
- Email body HTML is sanitized with DOMPurify on the client before render
  (forbidden tags: `script`, `style`, `iframe`, `object`, `embed`, `form`;
  forbidden attrs: `on*` event handlers) — defense in depth even though
  Gmail returns "safe" HTML.
- Attachments are never persisted — the `/api/emails/:id/attachments/:id`
  endpoint streams bytes straight from Gmail.
- Settings endpoints are gated by granular permissions; per-client emails
  and attachments use the existing `clients.canView` permission, consistent
  with the rest of the client-data endpoints.
- Admin "master switch" in `email_logging_settings.enabled` immediately
  pauses all syncs without touching tokens.

## Migration / rollout

1. The startup migration is **idempotent** (`CREATE TABLE IF NOT EXISTS`),
   safe to re-run. It also seeds the settings singleton on first boot.
2. Add `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` to env (and the OAuth
   callback `<HOST>/api/gmail/oauth/callback` to the Google Cloud client's
   authorized redirect URIs) before staff can connect.
3. Existing `ENCRYPTION_KEY` is reused — no rotation required.

## Manual test plan

1. Visit `/settings/email-logging` as admin → master switch + lookback
   editable; non-admins (without the granular perm) cannot reach the page.
2. Visit `/settings/my-profile` as a staff user → "Gmail Sync" card →
   click *Connect Gmail* → consent → callback redirects with
   `?gmail=connected`, status switches to "connected".
3. Wait ≤2 minutes (or click *Sync now*); status counter updates.
4. Open a client whose primary email matches a synced inbound/outbound
   message → "Emails" tab shows the thread, search & filter work,
   attachment chip downloads bytes on click.
5. Add a domain to *Exclude* in settings → on the next cycle that domain
   stops being logged.

## Known follow-ups

- `gmail.send` scope is **not** added; outbound composition stays in the
  existing Communications tab. A future increment can layer send-from-Gmail
  on top of this read-only foundation.
- Per-staff backfill quotas are not throttled beyond a 500 ms
  inter-connection sleep — for tenants with many large mailboxes you may
  want explicit per-cycle caps.
- Push notifications via Pub/Sub (`watch()`) are intentionally out of
  scope; the 2-minute polling interval is the documented contract.
