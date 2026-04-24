# PLANNING_CONTEXT.md

> **Placeholder — fill this in before your next real planning session.**
>
> This file gives Claude the short-term context that can't be inferred from the code. Treat it as living: update it when priorities shift, reset it when a milestone ends. Keep it skimmable — bullet points beat paragraphs.

---

## Current priorities

*What are you actively trying to ship or improve right now? One sentence each. The top 3–5 items only.*

- _(e.g. "Ship multi-tenant AWS deployment by end of Q2")_
- _(e.g. "Reduce proposal signing friction — current drop-off is ~40% at the payment step")_
- _(e.g. "Stabilize Google Calendar two-way sync — recurring events still drift")_

---

## Constraints

*What do I NOT want touched, changed, or expanded right now? Hard no-gos.*

- _(e.g. "No schema migrations in `clients` table until the multi-tenant plan is ratified")_
- _(e.g. "Keep Stripe integration single-account — don't add Connect before legal review")_
- _(e.g. "Don't introduce a queue/worker system yet — keep background services in-process")_
- _(e.g. "Permissions model is frozen — new features must fit existing dot-notation keys, not invent new categories")_

---

## Known pain points

*Bugs, UX frustrations, tech debt the team is living with but hasn't fixed. Claude should be aware of these so it doesn't re-discover them from scratch.*

- _(e.g. "`server/routes.ts` is ~47k lines and hard to navigate — don't add to it if a sub-router is feasible")_
- _(e.g. "`tasks.timeTracked` is deprecated but still in the schema for deploy-diff safety — reads/writes go to `task_time_entries`")_
- _(e.g. "Quote/Proposal vocabulary overload — `quotes` table carries the whole proposal lifecycle")_
- _(e.g. "No test runner — validation is manual via `docs/qa/` checklists")_

---

## What 'done' looks like for this cycle

*One paragraph. What would make this a successful week/sprint/quarter?*

_(e.g. "Onboarding drop-off below 15%, zero P1 bugs in tickets, and multi-tenant plan has a signed-off phase-1 scope.")_

---

## Who's working on what

*Optional. If multiple humans are in the repo, note who owns what so Claude doesn't step on someone's branch.*

- _(e.g. "Joe: multi-tenant infra")_
- _(e.g. "Rui: proposal flow fixes")_

---

## Gmail Sync Pre-Build Briefing

*Evidence-based answers to the 5 pre-build questions in [`docs/plans/gmail-sync.md`](./plans/gmail-sync.md). Captured 2026-04-24 by a read-only briefing pass over the current `main` branch. Use this to fill in the plan's "Affected Files" section before handing to Replit.*

### 1. Where is the existing Google Calendar OAuth flow implemented?

Three files carry the per-user Calendar OAuth flow (separate from the "Sign in with Google" login path):

- **`server/googleCalendarOAuth.ts`** — Express router with the user-facing endpoints: `GET /auth` (builds the Google consent URL with `access_type=offline`, `prompt=consent`, state-parameter round-tripping the user ID), `GET /oauth/callback` (exchanges code for tokens, looks up the Google user info, upserts `calendar_connections` row + creates `calendar_sync_state` row), `POST /disconnect` (revokes the token via `oauth2.googleapis.com/revoke`, deletes the connection), `GET /status` (returns connection+sync state for the current session user).
- **`server/googleCalendarUtils.ts`** — Shared helpers. `createOAuth2Client()` (builds the `google-auth-library` `OAuth2Client` with env-derived redirect URI), `getUserCalendarClient(userId)` (loads the user's encrypted tokens, decrypts, attaches refresh handler). Redirect URI resolution order: `GOOGLE_REDIRECT_URI` env → `BASE_URL` env → `REPLIT_DOMAINS[0]` → `REPLIT_DEV_DOMAIN` → `http://localhost:5000`.
- **`server/googleCalendarSetup.ts`** — Called from `server/index.ts` during boot. Mounts the OAuth router at `/api/google-calendar`.

**Storage:** tokens are encrypted via `server/encryption.ts` (`EncryptionService.encrypt/decrypt`) and stored on `calendar_connections` (`accessToken`, `refreshToken`, `expiresAt`, `scope`, plus per-connection flags `syncEnabled`, `twoWaySync`, `createContacts`, `triggerWorkflows`). Sync watermark + last status live on `calendar_sync_state`.

**Env vars used:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (shared with the login OAuth in `server/googleAuth.ts`), plus the redirect-URI vars above.

**Implication for Gmail sync:** these three files are your template. Gmail should follow the same pattern with its own `server/gmailOAuth.ts`, its own `gmailConnections` + `gmailSyncState` tables (do **not** overload `calendar_connections` — the plan explicitly calls for a separate flow), and its own `gmail.readonly` scope set.

### 2. Communications tab on the client profile

Rendered in **`client/src/pages/enhanced-client-detail.tsx`** (single mega-page that owns the whole client detail UI — the tab panel body is around line 8253+; supporting memos start at ~L4811).

**There is no dedicated communications table.** The tab is entirely a client-side filtered view over `audit_logs`, fetched via `GET /api/audit-logs/entity/contact/:clientId`. The filter predicate:

```
log.entityType === 'sms' || log.entityType === 'email' || log.action === 'call'
```

SMS entries are written to `audit_logs` with `entityType='sms'` when Twilio sends a message; email entries are written with `entityType='email'` when Mailgun sends/receives; calls log with `action='call'`. Payload lives in `log.newValues` (`to`, `from`, `message`/`body`, `direction`, plus any other fields the writer chose).

**Threading** is done client-side in the `threadedCommunications` memo (~L4840): SMS groups by sorted phone-number pair, email groups by sorted email-address pair. Thread key format: `sms:["+15551234","+15559999"]` or `email:["a@x.com","b@y.com"]`.

**Implication for Gmail sync:** the minimum-disruption path to making Gmail-logged emails appear in the existing Communications tab is to **write one `audit_logs` row per Gmail message** with `entityType='email'` and `newValues={from, to, subject, message, direction, threadId, messageId, ...}`. They will thread automatically, show up for free, and respect the existing direction/search/type filters. The plan's requested new "Emails" tab can be a second view over the same data, with Gmail-specific affordances (attachment list, full thread grouping by Gmail's `threadId` rather than the email-pair heuristic, label filtering).

**Writing into `audit_logs` is not free:** the table is already large and general-purpose. If the plan expects richer fields (attachments, HTML bodies, label metadata, thread IDs, full history-token state), strongly consider a dedicated `logged_emails` table keyed on `Message-ID` with a thin audit-log write alongside for the Communications tab. Recommend deciding this before Replit starts work.

### 3. Multiple contact persons per client

**Yes, already supported.** Table `clientContacts` (`shared/schema.ts:156`):

```
id, clientId → clients.id, firstName, lastName, email, phone,
title, isPrimary, notes, createdBy → staff.id, createdAt, updatedAt
```

CRUD surface (from `server/routes.ts`): `GET/POST /api/clients/:clientId/contacts`, `PUT/DELETE /api/clients/:clientId/contacts/:contactId`, plus `PATCH /api/clients/:clientId/contacts/:contactId/set-primary`. UI component: `client/src/components/client-contacts.tsx`. Any number of contacts per client; one marked primary.

**Implication:** the "Match Contact Persons under a client" rule in the admin settings can be implemented by joining Gmail message participant addresses (`from`, `to`, `cc`) against `clientContacts.email`. No schema change needed. Watch for case sensitivity and plus-addressing (`user+tag@domain.com`) — normalize on lowercase and strip `+tag` before matching.

### 4. Role-based access rules system

Two-tier check, all on the server in `server/auth.ts`, mirrored client-side.

**Tier 1 — module/action check (`requirePermission(module, action)`, `server/auth.ts:364`):**
- `action` is one of: `canView | canCreate | canEdit | canDelete | canManage`.
- `module` is a string keyed into the role's granted-module map.
- Existing modules in `routes.ts`: `calendars, campaigns, clients, departments, files, hr, integrations, knowledge_base, leads, products, reporting, reports, settings, social_media, staff, tasks, training, webhooks, workflows`.

**Tier 2 — granular permission check (`requireGranularPermission('dot.key')`, `server/auth.ts:393`):**
- Used when a single module has multiple distinct capabilities that should toggle independently. Example keys in the wild: `hr.time_off.create`, `training.view_analytics`.
- Catalog is enumerated in `shared/permission-templates.ts` (~64 KB). New keys must be added there to appear in the Roles UI.

**Client side:**
- Hook: `useHasPermission(permissionKey)` at `client/src/hooks/use-has-permission.ts`, with a legacy-key migration map (e.g., `clients.view_list` → `clients.list.view`) so old DB rows still work.
- Gate components: `<RequirePermission module="..." permission="...">` (`client/src/components/RequirePermission.tsx`) and `<PermissionGate>`. Used throughout `client/src/pages/settings/*` and wrapper routes in `App.tsx`.

**Recommended hookup for the Gmail feature:**

- **Per-user "Connect Gmail" button** in User Settings (`client/src/pages/settings/my-profile.tsx` or `integrations.tsx`): gate on `requirePermission('integrations', 'canEdit')` server-side, `<RequirePermission module="integrations">` client-side. This matches the pattern used by Slack/Stripe/Mailgun key management.
- **Admin-only "Email Logging Settings" page:** add a new route `/settings/email-logging` in `App.tsx`, add a tile to the Settings grid (`client/src/pages/settings.tsx`), create the page at `client/src/pages/settings/email-logging.tsx`. Gate client-side with `<RequirePermission module="settings" permission="settings.email_logging.manage">`. Gate all admin write endpoints with `requireGranularPermission('settings.email_logging.manage')`. **You will need to add the new granular key** `settings.email_logging.manage` (plus a `settings.email_logging.view` if non-admins should see read-only state) **to `shared/permission-templates.ts`**, grant it to the Admin role template in `shared/role-templates.ts`, and surface it in the Roles UI — this is the canonical way to add admin-only gating without inventing a parallel framework.

### 5. Background job / worker system

**Not the first — there's an established pattern.** All background work runs **in-process via `setInterval`**, started from `server/index.ts:2666-2707` inside `runStartupMigrations().then(...)`. Existing services:

| Service | File | Purpose |
|---|---|---|
| `googleCalendarBackgroundSync` | `server/googleCalendarBackgroundSync.ts` | Syncs connected calendars every 2 min; stale threshold 3 min. **Most directly analogous to Gmail sync.** |
| `weeklyHoursCheckService` | `server/weeklyHoursCheckService.ts` | Alerts managers on low weekly logged hours. |
| `longRunningTimerService` | `server/longRunningTimerService.ts` | Alerts on / auto-stops stale timers. |
| `proposalReminderService` | `server/proposalReminderService.ts` | Nudges clients on unsigned proposals. |
| `recurringTaskService` | `server/recurringTaskService.ts` | Spawns recurring task instances. |
| `onboardingNotificationService` | `server/services/onboardingNotificationService.ts` | Day-unlock + behind-schedule alerts. |
| `hiredNotificationService` | `server/services/hiredNotificationService.ts` | Drains `scheduled_hired_emails`; uses atomic-claim pattern. |

**Canonical service shape** (copied from `googleCalendarBackgroundSync.ts`):

```ts
let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

export function startXxx() {
  if (intervalId) return;               // double-start guard
  setTimeout(() => runOnce().catch(…), 10000);  // initial delayed run
  intervalId = setInterval(() => runOnce().catch(…), INTERVAL_MS);
}

async function runOnce() {
  if (isRunning) return;                // overlap guard
  isRunning = true;
  try { … } finally { isRunning = false; }
}
```

**Things to carry forward for Gmail sync specifically:**

- **No queue / Redis.** Don't try to introduce BullMQ — that's explicitly off-path per current architecture.
- **Restarts reset timers.** Don't rely on in-memory state across restarts. Persist sync watermarks to DB (Gmail's `history_id` per connection, or the latest `internalDate` processed).
- **Idempotency at the row level.** Follow the `scheduled_hired_emails` / `client_task_generations` precedent — use Gmail's `Message-ID` header as the unique key on your logged-emails table so re-syncs never double-insert. Use `INSERT … ON CONFLICT DO NOTHING` or check-before-insert.
- **Per-user rate limiting.** `googleCalendarBackgroundSync` spaces users with `await new Promise(resolve => setTimeout(resolve, 500))` between syncs to stay under Google's per-second API ceiling. Do the same for Gmail or switch to Gmail's watch+push-notifications API for near-real-time without polling (more complex; decide based on cost of initial build).
- **Bootstrap registration.** New services are imported and started in `server/index.ts:2666` inside the `.then(...)` block after `runStartupMigrations()`. Add a matching `startGmailBackgroundSync()` call there.

### Open questions from the plan that this briefing resolves

- **Q5 ("multiple contact persons per client") — RESOLVED, YES.** `clientContacts` table with `isPrimary`, full CRUD, already wired into the UI. No schema change needed for matching.
- **Q6 ("existing background worker system") — RESOLVED, YES.** In-process `setInterval` pattern with 7 existing services; model Gmail sync on `googleCalendarBackgroundSync.ts`.

### Open questions this briefing does NOT resolve (for human or Replit clarification)

- **Q1** initial sync lookback window.
- **Q2** attachment storage (metadata only vs. full files).
- **Q3** multi-client matching behaviour.
- **Q4** default exclusion of Gmail Promotions/Social/Updates categories.
- **New** whether logged emails live on `audit_logs` only (quick, limits future features) or on a dedicated `logged_emails` table (correct long-term, more schema work). Recommend settling this before Replit starts.

---

*Last updated: 2026-04-24 — Gmail Sync Pre-Build Briefing added.*
