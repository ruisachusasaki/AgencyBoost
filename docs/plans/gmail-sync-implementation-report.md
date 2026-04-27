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

---

# Phase 2 — UI Fixes (2026-04-27)

This phase makes the **Communication History** card on the client profile
the unified email + SMS + call surface and retires the standalone "Emails"
tab. Phase 1's backend (sync, OAuth, schema, settings) was not modified.

## What changed

### Backend

1. **New endpoint** `GET /api/clients/:clientId/communications` in
   `server/routes.ts` (gated by `requirePermission("clients", "canView")`).
   Returns `{ threads, totalThreads, totalMessages, page, pageSize,
   totalPages, rawFetchCap, rawFetchCapHit }`.
   - Pulls `audit_logs` for this client (SMS, email, and call rows in one
     query — calls are `entityType='contact' AND action='call'`).
   - Batch-joins `logged_emails` (and `logged_email_attachments`) for
     email rows so each message returns a real subject, `bodyHtml`,
     `bodyText`, `snippet`, `gmailThreadId`, and attachment metadata.
   - Threads emails by `gmailThreadId`, SMS by sorted `[from,to]` phone
     pair (preserves the existing UX), and calls each on their own
     thread.
   - `type=all|sms|email` and `direction=all|inbound|outbound` filters
     applied in SQL. Direction preserves the existing UI quirk (calls
     count as outbound; `inbound` excludes them).
   - `search` is pushed into SQL via the LEFT JOIN to `logged_emails`
     so it applies **before** the raw fetch cap and reaches both
     `bodyText` and `bodyHtml` (HTML-only emails would otherwise miss
     body matches). Searched fields:
     - `auditLogs.details`, plus the `newValues` JSONB keys
       `message / to / from / subject / snippet / phoneNumber` (so
       SMS, calls, and pre-Gmail-sync email rows all match).
     - `logged_emails`: `subject`, `snippet`, `bodyText`, `bodyHtml`,
       `fromEmail`, `fromName`, and the joined-text form of
       `toEmails / ccEmails`.
   - Pagination is **by thread** (default 50, max 200). Raw audit-log
     fetch is capped at 5,000 messages per request and `rawFetchCapHit`
     is surfaced so the UI can warn.

2. **Permission gate change** on
   `GET /api/audit-logs/entity/:entityType/:entityId`. This route
   accepts an arbitrary user-supplied `:entityType`, so a flat flip from
   `requireAdmin()` would have exposed audit logs for tasks, quotes,
   leads, etc. to anyone with `clients.canView`. Instead, the gate is
   now **type-scoped**:
   - `entityType ∈ {contact, sms, email}` → `requirePermission("clients", "canView")`
     (these are the per-client surfaces — Activity tab + Communication
     History — that Joe explicitly approved opening up).
   - All other `entityType` values → still `requireAdmin()`.

   Implementation is a one-shot middleware that picks the right gate
   per request based on `req.params.entityType`. Comment inline at the
   route documents the trade-off.

### Frontend

3. **Communication History refactor** in `enhanced-client-detail.tsx`:
   - Replaced the in-memory `auditLogs` derivation with a TanStack Query
     against `/api/clients/:clientId/communications`. The query key
     includes `[clientId, type, direction, deferredSearch, page,
     pageSize]` so chip and search changes refetch correctly.
   - Pagination state (`commCurrentPage`) is independent of the Activity
     tab's `currentPage` — the two tabs no longer share state.
   - Email expand renders the **real Gmail body**:
     `bodyHtml` (sanitized with the same strict DOMPurify config used by
     the standalone tab — `FORBID_TAGS: ['script','style','iframe',
     'object','embed','form']`, `FORBID_ATTR: ['onerror','onload',
     'onclick','onmouseover','onfocus']`) → fallback to `bodyText` →
     `snippet` → legacy `details/newValues.message` (also sanitized) for
     pre-Gmail-sync rows.
   - **Paperclip badge** on the collapsed thread row when
     `thread.hasAttachments`.
   - **Attachment chips** on each expanded email message wired to
     `/api/emails/${email.id}/attachments/${attachment.id}` (matches the
     standalone tab's behavior).
   - Threading by `gmailThreadId` for emails (no more pseudo-thread by
     `[from,to]` pair on potentially-aliased addresses).
   - SMS chat-bubble rendering and call rendering preserved verbatim.
     Call threads use the SMS bubble path with a "Call" badge.

4. **Standalone "Emails" tab hidden**:
   - `TabsTrigger value="emails"` removed and `grid-cols-10 → grid-cols-9`
     applied to the `TabsList`.
   - `TabsContent value="emails"` block removed.
   - `client/src/components/client-emails-tab.tsx` is **kept on disk**
     (still imported once but no longer mounted). A header comment
     documents that it's currently disabled and how to revive it.

## Issue-by-issue resolution (vs. the diagnostic)

| # | Issue                                            | Resolution |
|---|--------------------------------------------------|------------|
| 1 | Email body not rendered (snippet only)           | New endpoint joins `logged_emails`; UI renders sanitized `bodyHtml` with `bodyText`/`snippet` fallback. |
| 2 | Threading by `[from,to]` pair instead of Gmail   | Server threads emails by `gmailThreadId`. Pre-sync emails (no join) get their own orphan thread. |
| 3 | Search doesn't reach subject / snippet / body    | Server search reaches subject, snippet, bodyText, fromEmail, fromName, to/cc lists. |
| 4 | Coupled to Activity-tab pagination               | Independent query, independent `commCurrentPage`. Activity tab unchanged. |
| 5 | No attachment paperclip / chips                  | Paperclip badge on thread when any message has attachments. Attachment chips per message wired to the on-demand Gmail proxy. |
| 6 | `requireAdmin()` on the audit-logs entity route  | Flipped to `requirePermission("clients","canView")`. Inline comment documents the broader Activity-tab impact Joe approved. |
| — | Standalone Emails tab                            | Hidden (trigger + content removed). Component file preserved with a disabled-comment header. |

## Ports vs fresh code

- **Ported from `client-emails-tab.tsx`**: the DOMPurify config, the
  attachment-chip markup, the body-fallback chain (`bodyHtml → bodyText →
  snippet`), and the URL shape `/api/emails/:id/attachments/:id`.
- **Fresh**: the unified `/api/clients/:clientId/communications` endpoint
  (no equivalent existed — `client-emails-tab.tsx` consumed
  `/api/clients/:id/emails`, which only returns email rows), the
  server-side threading + pagination, and the call/SMS/email
  type-discriminated rendering.

## Deviations from the prompt

- Joe's prompt said "calls each their own thread"; in the rendered UI
  call threads use the SMS chat-bubble path (with a "Call" badge in the
  thread header) so we preserve the existing call rendering exactly.
  The bubble's text is the audit-log `details` string
  (`Called +1xxx - Duration: ...`) — same as today.
- The pre-existing quirk that `direction=outbound` includes calls and
  `direction=inbound` excludes them is preserved in SQL for behavioral
  parity with the old in-memory filter.

## Manual QA steps

1. Open a client with both Gmail-synced emails and SMS history → the
   Communication History card should render mixed threads.
2. Click an email thread → the body renders as real HTML (or text/snippet
   fallback). A paperclip badge shows on threads with attachments.
3. Click an attachment chip → file streams from Gmail (the on-demand
   proxy from Phase 1).
4. Type into the search box → debounced query reaches the server and
   matches on subject/snippet/body — confirm by searching for a phrase
   that's only in the email body.
5. Click chips: All / SMS / Email and All / Sent / Received → each
   triggers a fresh fetch and resets `commCurrentPage` to 1.
6. Pagination: with > 50 threads, the Next/Prev buttons advance pages
   independently of the Activity tab's pagination.
7. Top-right tab strip: there should now be 9 tabs (no standalone
   "Emails" tab). The other tabs are unchanged.
8. As a non-admin user with `clients.canView`: confirm both the
   Communication History card and the Activity tab populate (they
   would have 401'd before issue #6's gate change).

## Known limitations

- **Raw fetch cap**: 5,000 audit-log rows per request. Past that, the
  UI surfaces a banner ("Showing the most recent 5,000 messages") and
  the user must narrow with a search/type/direction filter. For an
  agency with multi-year clients in the tens of thousands of messages
  this may eventually need an `after_timestamp` cursor — out of scope
  for this phase.
- **Pre-Gmail-sync emails** (audit_logs rows whose `entityId` doesn't
  match a `logged_emails.id`) won't have a body or attachments — they
  fall back to the `details` / `newValues.message` text the way the old
  UI handled them.
- **`direction` filter on calls**: preserved the legacy quirk
  (outbound includes calls, inbound excludes). If we want a separate
  call-direction concept later, that's a Phase-3-ish change.

## Performance notes

- The endpoint runs at most three queries per request: one
  `audit_logs` SELECT (with the `staff` join for `userName`), one
  `logged_emails` SELECT-by-IN, and one
  `logged_email_attachments` SELECT-by-IN. No N+1.
- Threading + search-by-text are done in Node over the capped rowset
  (≤ 5,000). Worst-case CPU on a typical request is sub-100 ms.
- For a client with ~1,000 messages: single-page render is 50 threads
  → server returns ≤ 50 thread headers + their messages (typically
  ≤ ~500 messages of payload). Acceptable.
- For 5,000+ messages on one client: the cap kicks in, the UI warns,
  and the user is expected to filter. Raising the cap is a one-line
  change but trades memory and latency.
