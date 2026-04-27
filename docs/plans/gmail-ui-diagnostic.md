# Gmail UI Pre-Deployment Diagnostic

*Read-only status of the Communication History UI on the client profile,
ahead of flipping the Gmail background sync on at full volume. No code
was modified to produce this report.*

## TL;DR

The Communication History tab **does** show Gmail-synced emails today,
because `server/gmailBackgroundSync.ts` writes a thin `audit_logs` row
alongside the source-of-truth `logged_emails` row. With ≤2 messages
on screen everything looks fine. Once real volume arrives, **four
issues will become user-visible**:

1. Threading is by sender/recipient pair, not Gmail `thread_id` — same
   Gmail conversation will scatter into multiple threads as soon as
   participants change (forward, BCC, reply-all).
2. The expanded email body shown is the audit-log `details` string
   ("Sent email to X"), **not the actual message body**. The full body
   *is* stored (in `logged_emails`) but the Communications tab never
   reads from there.
3. Search reaches the sender/recipient address and the `details`
   string, but **not the subject, snippet, or body**. Real-life
   "search this client's emails" will mostly miss.
4. The Communications tab paginates threads client-side from a
   server-paginated 20-row activity-log window. With 500 emails per
   client, the user sees the first ~20 messages and nothing else.

There are also two smaller items: no attachment indicator on email
rows, and the whole tab is admin-only on the server (`requireAdmin()`).
The dedicated new "Emails" tab does not have these problems but is a
separate surface; this diagnostic only covers the Communication
History tab as requested.

---

## 1. Email display

**How emails reach the tab.** Confirmed: thin `audit_logs` rows with
`entityType='email'`, written during sync. Code:
`server/gmailBackgroundSync.ts:585-613`. Each successful insert into
`logged_emails` is followed by a best-effort `db.insert(auditLogs)`
with `action='created'`, `entityType='email'`, `entityId=<loggedEmail.id>`,
`userId=<connection owner>`, and a `newValues` payload containing:

```
{
  clientId, contactId, loggedEmailId, direction,
  from, to, subject, snippet,
  gmailMessageId, gmailThreadId,
  hasAttachments, provider: 'gmail', source: 'gmail-sync'
}
```

Note what is **not** in `newValues`: `bodyText`, `bodyHtml`, `cc`, `bcc`,
`labels`, `matchedDomain/matchedEmail`, `receivedAt`. Those exist in
`logged_emails` but are never copied into the audit row.

**Fields shown vs hidden.** The thread-list row (collapsed) shows:
`thread.participants.join(' ↔ ')` (sorted [from, to]), an "Email" badge,
the message-count badge if >1, a one-line preview built from
`(latestMsg.newValues?.message || latestMsg.details).slice(0, 100)`, and
the message date. Source: `client/src/pages/enhanced-client-detail.tsx:8283-8307`.

When expanded, an email card (`enhanced-client-detail.tsx:8369-8425`)
shows: avatar from initial of from/userName, sender name (`newValues.from`
inbound, `userName` outbound), `To:` line, status badge if present,
timestamp, optional **subject** (`newValues.subject`), and a
`dangerouslySetInnerHTML` block whose content is
`DOMPurify.sanitize(fullMessage)` where
`fullMessage = log.newValues?.message || log.details || ''`.

**The body problem.** `newValues.message` is **never** set by the Gmail
sync writer (see field list above), and `details` is just a one-line
summary like "Sent email to alice@acme.com". So the "body" rendered in
the expanded card is just that summary string — *not* the actual email
body. The real `body_text` / `body_html` is sitting in `logged_emails`
but the Communications tab does not query that table.

**Click-to-expand mechanics.** Clicking the chevron toggles
`expandedThreads` (a `Set<string>` keyed by `threadKey`), causing the
collapsed thread to render its messages inline (no modal, no side
panel). Implementation: `enhanced-client-detail.tsx:4886-4893,8310-8429`.
Inline expand is capped at `max-h-[500px] overflow-y-auto` per thread.

**HTML sanitization.** Sanitization *is* applied:
`DOMPurify.sanitize(fullMessage)` at `enhanced-client-detail.tsx:8410`.
However it uses DOMPurify's default config — no explicit `FORBID_TAGS`
or `FORBID_ATTR` allowlist. By contrast the new Emails tab
(`client-emails-tab.tsx:236-241`) explicitly forbids
`script, style, iframe, object, embed, form` and `on*` event handlers.
Today this is not a real risk because `fullMessage` is just the audit
`details` string (plain text), but if anyone later starts copying
`body_html` into `audit_logs.newValues.message` to "fix" the body issue,
the existing default-config sanitizer is the weaker of the two.

---

## 2. Threading

**SMS threading.** Sorted phone-number pair. From
`enhanced-client-detail.tsx:4848-4859`:

```
to = msg.newValues.to.trim()
from = msg.newValues.from.trim()
threadKey = `sms:${JSON.stringify([from, to].filter(Boolean).sort())}`
```

A missing pair falls back to a per-row orphan thread.

**Email threading.** Same heuristic as SMS, lowercased. From
`enhanced-client-detail.tsx:4860-4872`:

```
to = (msg.newValues.to || msg.newValues.recipientEmail || '').toLowerCase()
from = (msg.newValues.from || msg.newValues.senderEmail || '').toLowerCase()
threadKey = `email:${JSON.stringify([from, to].filter(Boolean).sort())}`
```

`gmailThreadId` is present in `newValues` but **not used**. So:

- Same Gmail thread, same two participants → grouped correctly.
- Same Gmail thread, **different participants** (forward, BCC, add
  someone on reply-all) → split into a separate "thread" per unique
  participant pair.
- `to` is stored as a single field by the sync writer, but `parsed.toEmails`
  is an **array** (`server/gmailBackgroundSync.ts:601`). When written into
  `newValues.to` it is the JSON-array form, so the heuristic above
  produces threadKeys like
  `email:["sender@x.com","[\"alice@y.com\",\"bob@y.com\"]"]` for any
  multi-recipient message — those will not collide with the same Gmail
  thread when sender/recipients shift even slightly.

The new Emails tab (`client-emails-tab.tsx:89-103`) groups by
`gmailThreadId` directly and is correct.

---

## 3. Filters

Filter chips visible: **All / SMS / Email** (type) and **All / Sent /
Received** (direction). Markup: `enhanced-client-detail.tsx:8237-8262`.
State: `commTypeFilter`, `commDirectionFilter`. Both are wired into
the `communications` memo at `enhanced-client-detail.tsx:4815-4827`.

**Type filter.** `commTypeFilter='sms'` keeps rows whose `entityType`
(or `entity_type`) is `sms`. `commTypeFilter='email'` keeps rows whose
type is `email`. **Note:** the predicate at L4814 also lets through
rows with `action='call'` regardless of the type filter — calls cannot
be filtered out via this UI. Not a Gmail problem but worth flagging.

**Direction filter.** From `enhanced-client-detail.tsx:4821-4825`:

```
const isInbound = log.newValues?.direction === 'inbound';
if (commDirectionFilter === 'inbound' && !isInbound) return false;
if (commDirectionFilter === 'outbound' && isInbound) return false;
```

Gmail sync writes `direction: 'inbound' | 'outbound'` into
`newValues.direction` (`gmailBackgroundSync.ts:599`), so the chips
work correctly for synced emails. For SMS rows that never set
`newValues.direction`, the predicate treats them as outbound by
default (anything not strictly `'inbound'`). Not a Gmail problem.

**Important caveat (see §7).** These filters operate on the in-memory
`auditLogs` array, which is itself the result of a *server-paginated*
query bounded by the activity tab's `currentPage` and `itemsPerPage=20`.
Filtering is not a re-query.

---

## 4. Search

Implementation: `enhanced-client-detail.tsx:4828-4837`.

```
const messageContent = log.newValues?.message || log.details || '';
const phoneNumber    = log.newValues?.to || log.newValues?.from || '';
const details        = log.details || '';
return messageContent.toLowerCase().includes(s)
    || phoneNumber.includes(s)
    || details.toLowerCase().includes(s);
```

For an email row (where `newValues.message` is undefined):

- `messageContent` collapses to `details` ("Sent email to alice@acme.com"
  or "Received email from alice@acme.com").
- `phoneNumber` is `newValues.to` or `newValues.from` — the recipient
  or sender address. Matches against email addresses by substring.
- `details` is the same string as above.

**What you can find:** sender/recipient email address, plus the words
"Sent email to" / "Received email from" / a matched address that
appears in `details`.

**What you cannot find:**

- Subject line — stored in `newValues.subject` but never consulted.
- Snippet — stored in `newValues.snippet` but never consulted.
- Body (plain or HTML) — not in `audit_logs` at all; lives in
  `logged_emails.body_text` / `logged_emails.body_html`.

The search box does **not** reach into `logged_emails`. Only the new
Emails tab queries that table (and its endpoint at
`server/routes.ts:18312-18320` searches `subject`, `snippet`,
`fromEmail` — but still not the body).

---

## 5. Attachments

**Sync writes metadata.** Yes. `gmailBackgroundSync.ts:573-583` inserts
one row per attachment into `logged_email_attachments` (filename,
mimeType, sizeBytes, partId, gmailAttachmentId). Schema:
`shared/schema.ts:6212-6223`.

**Audit row carries a flag.** `newValues.hasAttachments` is set to
`parsed.attachments.length > 0` (`gmailBackgroundSync.ts:606`). The
attachment list itself is **not** copied into `audit_logs`.

**UI indicator on Communication History rows.** None.
`enhanced-client-detail.tsx:8270-8429` renders the row and the email
card body, but nowhere checks `newValues.hasAttachments` and nowhere
shows a paperclip icon, badge, or attachment chip. So a user looking
at Communication History cannot tell which messages have attachments.

**On-demand download in Communication History.** Not wired up in this
tab. The download endpoint exists (`server/routes.ts:18372-18407`,
`GET /api/emails/:id/attachments/:attachmentId`) and the new Emails tab
links to it (`client-emails-tab.tsx:253-271`). The Communications tab
does not.

---

## 6. Permissions

**Tab visibility (client-side).** The Communication History card has no
`<RequirePermission>` wrapper around it
(`enhanced-client-detail.tsx:8215-8484`); it renders for anyone who
reaches the client profile.

**Server-side gating (the actual gate).** The endpoint that powers the
tab is `GET /api/audit-logs/entity/:entityType/:entityId`, defined at
`server/routes.ts:18434`:

```
app.get("/api/audit-logs/entity/:entityType/:entityId",
        requireAuth(), requireAdmin(), async (req, res) => { … })
```

So this endpoint is **admin-only**. A non-admin user who reaches the
client profile will get a 401/403 back from this query, render zero
rows, and see "No Communication Yet" (`enhanced-client-detail.tsx:8468-8480`),
even when the underlying client genuinely has SMS/email/call history.

There is no per-entity-type gating on top of `requireAdmin()` — emails
inherit the same gate as SMS and contact-update logs.

By contrast, the new Emails tab uses
`requirePermission("clients", "canView")`
(`server/routes.ts:18298,18356,18374`), which is the same gate as the
rest of the client-data endpoints. Mismatch worth flagging if Joe
expects non-admin AMs to see email history on a client profile.

---

## 7. Pre-deployment readiness

### 7a. Pagination — the headline issue

The Communication History tab **does** paginate (10 threads per page,
hard-coded `commItemsPerPage = 10` at `enhanced-client-detail.tsx:3430`),
but the data it paginates is **not the full set of messages for the
client**. It's the result of `auditLogs` — an array fetched by the
audit-logs query at `enhanced-client-detail.tsx:4773-4795`:

```
fetch(`/api/audit-logs/entity/contact/${clientId}
       ?limit=${itemsPerPage}&offset=${offset}
       ${filterParam}${userParam}${timestampParam}`)
```

with `itemsPerPage = 20` (hard-coded `enhanced-client-detail.tsx:3422`)
and `currentPage` driven by the **Activity** tab's pagination, not
the Communication History tab.

Concrete consequences:

- **Server returns at most 20 audit rows per page.** Threading and the
  "X messages in Y threads" counter operate on those 20 rows only.
- **The Communications tab inherits the Activity tab's filter / page.**
  If the user is on Activity → page 3 → filter "general", the
  Communications tab quietly shows the threading of those 20 "general"
  rows (which won't include any emails because `filter='general'`
  rewrites the WHERE to `entityType='contact'`, `routes.ts:18475-18481`).
- **Switching the type/direction chip does not refetch.** Those filters
  are client-side over the in-memory 20-row window
  (`enhanced-client-detail.tsx:4815-4827`). With 500 emails for a
  client, the user can never reach messages 21+ from this tab.
- The "Email" chip *does* update the activity-feed query (because
  it sets `activityFilter`, which is in the query key). But only if the
  user changes Activity's filter explicitly; the Communications chip
  itself doesn't.

This is the single largest pre-deploy risk. With the test mailbox
producing only ~2 emails, it's invisible. After deploy, AMs will
plausibly only see the most recent ~20 client interactions of any kind.

### 7b. Caching

The audit-logs query is configured `staleTime: 0, cacheTime: 0`
(`enhanced-client-detail.tsx:4789-4790`) and adds a busting
`&t=${Date.now()}` querystring. This will produce one network call per
filter/page change and per tab visit. At 20 rows/page this is fine; if
the limit is raised aggressively as part of a fix it should be
reconsidered.

### 7c. HTML body rendering risk path

If anyone tries to "fix" the missing-body issue (§1) by copying
`body_html` into `audit_logs.newValues.message`, the existing
`DOMPurify.sanitize(fullMessage)` call at
`enhanced-client-detail.tsx:8410` runs without an explicit allowlist —
defaults are reasonable but the new Emails tab's stricter config is
the better template. Worth coordinating before such a fix lands.

### 7d. What is working correctly

- The audit-log writer is best-effort wrapped in try/catch
  (`gmailBackgroundSync.ts:586-613`), so an audit-log failure cannot
  prevent the source-of-truth `logged_emails` row from being saved.
- Direction filter chips correctly distinguish inbound vs outbound for
  Gmail-synced emails (`newValues.direction` is consistently set).
- DOMPurify *is* invoked on the rendered body field — defense-in-depth
  against any future change that puts HTML there.
- Subject is shown in the expanded card when present
  (`enhanced-client-detail.tsx:8407-8409`).
- The dedicated Emails tab (`client-emails-tab.tsx`) handles all four
  headline issues correctly. It threads by `gmailThreadId`, renders the
  real body, searches subject/snippet/from, shows an attachment chip
  with download, and is gated on `clients.canView` so non-admins can
  see it.

### 7e. Recommended pre-deploy decisions for Joe

(Out of scope for this diagnostic, listed only so Joe knows what
follow-up tasks he might want to ask for.)

1. Decide whether the Communications tab is the supported surface for
   email history at all, or whether the new Emails tab is the only
   supported surface and the Communications tab should hide email
   entries (or render a "see Emails tab" pointer).
2. If Communications stays as the email surface: re-thread on
   `gmailThreadId`, render `logged_emails.body_html` instead of the
   audit `details` string, broaden search to subject/snippet/body,
   and either raise `itemsPerPage` significantly or replace the
   activity-feed-coupled fetch with a dedicated communications query
   that paginates server-side independent of the Activity tab.
3. Decide on the permission model — admin-only (current behaviour) or
   `clients.canView` (consistent with the new Emails tab and the rest
   of client data).
4. Add an attachment indicator (paperclip + count) on Communications
   rows so AMs can tell at a glance which messages have attachments.

---

*Diagnostic generated 2026-04-27. No code modified.*
