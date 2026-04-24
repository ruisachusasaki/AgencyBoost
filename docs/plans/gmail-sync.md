# Gmail Sync for Automatic Email Logging

## Goal

Automatically log emails sent to and received from clients inside AgencyBoost, eliminating the manual copy-paste workflow Account Managers use today to record client email history.

Design references: Salesforce Inbox, HubSpot Sales Hub, Close, Front.

## Context

**Origin.** Joe Hupp asked about the best approach for logging client emails sent from Gmail. Three options were evaluated: BCC-to-CRM, two-way Gmail sync, and Chrome extension. We chose two-way Gmail sync (option 2) directly rather than shipping BCC first, because option 1 only captures outbound emails and Joe confirmed inbound client replies are just as important — AMs are manually logging both sides into client notes today.

**Priority.** Highest — replaces an active manual workflow that's consuming AM time and producing incomplete client history.

**Not in scope (yet).** Google CASA Tier 2 verification. Users will see the "unverified app" warning; acceptable for internal MediaOptimizers use. Pursue CASA later if we open Gmail connection to external agency clients.

**Pre-build briefing completed.** Claude Code performed a read-only briefing of the repo on 2026-04-24, documented in `docs/PLANNING_CONTEXT.md` under "Gmail Sync Pre-Build Briefing." Findings integrated below.

## Affected Files

### Files to model Gmail integration on (do NOT modify these — they are the templates)

- `server/googleCalendarOAuth.ts` — OAuth router pattern (endpoints: `/auth`, `/oauth/callback`, `/disconnect`, `/status`)
- `server/googleCalendarUtils.ts` — `createOAuth2Client()`, per-user client helpers, token refresh
- `server/googleCalendarSetup.ts` — router mounting in `server/index.ts`
- `server/googleCalendarBackgroundSync.ts` — canonical `setInterval` background worker pattern (double-start guard + overlap guard)

### New files to create

- `server/gmailOAuth.ts` — mirrors `googleCalendarOAuth.ts` with `gmail.readonly` scope
- `server/gmailUtils.ts` — mirrors `googleCalendarUtils.ts` for Gmail client construction
- `server/gmailSetup.ts` — mirrors `googleCalendarSetup.ts`, mounts router at `/api/gmail`
- `server/gmailBackgroundSync.ts` — mirrors `googleCalendarBackgroundSync.ts`, polls connected Gmail accounts and logs matching emails
- `server/gmailMatcher.ts` (or equivalent helper) — pure function that takes an email's participants + the configured matching rules and returns matched client IDs
- `client/src/pages/settings/email-logging.tsx` — admin-only Email Logging Settings page
- New Connect Gmail section — location to be chosen by Replit (existing integrations page, or new dedicated page)
- New Emails tab component for the client profile — filename following the existing pattern in `enhanced-client-detail.tsx`

### Files to modify

- `server/index.ts` (around L2666) — register `startGmailBackgroundSync()` in the startup block alongside existing services
- `server/encryption.ts` — reuse as-is for Gmail token encryption
- `server/routes.ts` — add Gmail admin settings endpoints gated by the new granular permission
- `shared/schema.ts` — add tables for Gmail connections, sync state, logged emails, attachment metadata, email logging settings, domain rules, and exclusions. Exact table split to follow existing schema conventions (Replit's call).
- `shared/permission-templates.ts` — add new granular key `settings.email_logging.manage`
- `shared/role-templates.ts` — grant the new key to Admin role
- `client/src/pages/settings.tsx` — add settings grid tile for Email Logging
- `client/src/App.tsx` — add route for `/settings/email-logging`
- `client/src/pages/enhanced-client-detail.tsx` — add new Emails tab; existing Communications tab continues to render emails via `audit_logs` entries with no changes needed
- `client/src/pages/settings/my-profile.tsx` or `integrations.tsx` — add "Connect Gmail" section

### Unchanged but relevant

- `shared/schema.ts:156` — `clientContacts` table (already supports multiple contacts per client — no change needed, just query it for matching)
- `client/src/components/RequirePermission.tsx` — reuse as-is for access gating
- `client/src/hooks/use-has-permission.ts` — reuse as-is

## Proposed Approach

### Data model: hybrid storage

**`logged_emails` table** is the source of truth. Holds full email data: `message_id` (unique), `thread_id`, `from_address`, `to_addresses[]`, `cc_addresses[]`, `subject`, `body_plain`, `body_html`, `direction` (inbound/outbound), `gmail_internal_date`, `gmail_history_id`, `gmail_user_id` (the connected AgencyBoost user whose Gmail this came from), `client_id` (matched client), `created_at`. Attachments metadata in a child table `logged_email_attachments` (filename, size, mime_type, Gmail attachment ID for on-demand fetch).

**Also** write a thin `audit_logs` row per email (matching how SMS/calls do it today) so the existing Communications tab picks up emails automatically with **zero changes** to that tab's code. The `audit_logs` row's `newValues` contains a minimal subset (from, to, subject snippet, direction, link back to the `logged_emails` row).

This hybrid means:
- Existing Communications tab keeps working exactly as is.
- The new dedicated Emails tab reads from `logged_emails` for rich data (full body, attachments, thread grouping by Gmail's real `thread_id`).
- Both views stay in sync by construction since both writes happen during the same sync transaction.

**If an email matches multiple clients:** write one `logged_emails` row per matched client (same Message-ID, different client_id). Unique constraint on `(message_id, client_id)` prevents duplicates.

### 1. Gmail Connection (per user)

- **Separate "Connect Gmail" button** in User Settings (not bundled with Calendar OAuth).
- Google OAuth requesting only `gmail.readonly` scope.
- Any user with an AgencyBoost account can connect.
- Post-connection settings UI shows:
  - Connection status (Connected / Not connected / Error)
  - Connected Gmail address
  - Last sync timestamp
  - "Disconnect Gmail" button
  - "Sync now" manual trigger button
- Token refresh failures → clear "Reconnect Gmail" prompt + non-intrusive notification.
- Access gating: server-side `requirePermission('integrations', 'canEdit')`, client-side `<RequirePermission module="integrations">`.

### 2. Admin-Only Email Logging Settings Page

- Route: `/settings/email-logging`
- New granular permission key: `settings.email_logging.manage`
- Added to `shared/permission-templates.ts` and granted to Admin in `shared/role-templates.ts`
- Page gated with `<RequirePermission module="settings" permission="settings.email_logging.manage">`
- All admin write endpoints gated with `requireGranularPermission('settings.email_logging.manage')`

**Matching rules** (checkboxes, combinable):
- Match Client email addresses
- Match Lead email addresses
- Match Contact Persons (via `clientContacts` table)
- Match custom domains mapped to clients (e.g., `@acme.com` → Acme Corp)

**Exclusions:**
- Internal domain(s) — admin-specified, excludes internal staff-to-staff emails
- Specific email address blocklist — free-text list

**Direction:**
- Log outbound
- Log inbound

**Gmail category exclusions:**
- Exclude Promotions: ON by default
- Exclude Social: ON by default
- Exclude Updates: ON by default
- (Admin can disable any of these)

**Scope:** Global to the AgencyBoost account. No per-user overrides in v1.

**Defaults on first launch:**
- Match Client + Lead + Contact Persons: ON
- Custom domains: empty
- Internal domain exclusion: empty (with prominent UI copy prompting admin to fill this in)
- Address blocklist: empty
- Both directions: ON
- Gmail categories Promotions/Social/Updates: excluded

### 3. Background Sync

- Model directly on `server/googleCalendarBackgroundSync.ts`.
- Register in `server/index.ts` inside the `runStartupMigrations().then(...)` block alongside existing services.
- In-process `setInterval`. No Redis, no BullMQ.
- Per-user loop with 500ms spacing (match Calendar pattern, respect Gmail API rate limits).
- Persist `history_id` per connection to Gmail sync state for incremental sync.
- **Initial sync lookback: 90 days** (from first connection timestamp).
- **Deduplication:** unique constraint on `(message_id, client_id)` in `logged_emails`. Use `INSERT ... ON CONFLICT DO NOTHING`.
- **Threading:** group by Gmail's native `thread_id` (not the client-side address-pair heuristic the current Communications tab uses).
- **Attachment storage: metadata only** for v1 (filename, size, mime_type, Gmail attachment ID). Actual file bytes fetched on-demand from Gmail API when the user clicks "download" in the UI.
- **Email address normalization before matching:**
  - Lowercase all addresses
  - Strip `+tag` plus-addressing
  - Trim whitespace

### 4. UI — Where Logged Emails Appear

**A. Existing Communications tab** (no changes needed — emails flow in via the thin `audit_logs` row)

**B. New dedicated "Emails" tab on the client profile**
- Reads from `logged_emails` table directly
- Grouped by Gmail `thread_id` (real threading, not address-pair heuristic)
- Collapsible threads with message count
- Within thread: chronological, showing sender, timestamp, subject, body (sanitized HTML), attachments
- Filters: direction (inbound/outbound), connected user who logged it, date range
- Full-text search over subject + body
- Attachments show as chips with filename + size; click triggers on-demand fetch from Gmail API

## Risks & Edge Cases

**Risks:**
- Google "unverified app" warning is expected. Document in help text.
- Gmail sync is a "80% working = 20% silently missing" feature. Build carefully, test thoroughly.
- Email address case sensitivity and plus-addressing can cause silent match misses. Normalize consistently.
- Large initial sync (90 days) for heavy Gmail users could be slow. Consider showing progress UI.

**Edge cases:**
- Token refresh failure → "Reconnect Gmail" state.
- Unmatched emails → silently ignored (expected majority).
- Email matches multiple clients → log one `logged_emails` row per client (same Message-ID, different client_id).
- Gmail API rate limits → back off gracefully using the per-user spacing already in the Calendar pattern.
- User disconnects Gmail → previously logged emails remain. New syncs stop. No historical data deletion.
- Gmail Promotions/Social/Updates labels → excluded by default via category check.
- Internal staff-to-staff emails → excluded via internal-domain rule.
- Plus-addressing (`user+tag@domain.com`) → normalized to `user@domain.com` before matching.
- Case differences in email addresses → lowercased before matching.

## Open Questions

**All resolved during planning:**

1. ✅ **Initial sync lookback window:** 90 days.
2. ✅ **Attachment storage:** metadata only; fetch on-demand from Gmail API.
3. ✅ **Multi-client match behavior:** log to all matched clients (one row per client, same Message-ID).
4. ✅ **Default label exclusions:** exclude Promotions/Social/Updates by default; admin can toggle.
5. ✅ **Multiple contact persons per client:** yes, supported via `clientContacts` table (resolved by Claude Code briefing).
6. ✅ **Background worker infrastructure:** yes, in-process `setInterval` pattern exists; model on `googleCalendarBackgroundSync.ts` (resolved by Claude Code briefing).
7. ✅ **Storage table strategy:** dedicated `logged_emails` table as source of truth + thin `audit_logs` row for Communications tab compatibility.

## Implementation Steps

1. ✅ Bootstrap brain files (`CLAUDE.md`, `REPO_MAP.md`, `docs/PLANNING_CONTEXT.md`) — done.
2. ✅ Claude Code pre-build briefing — done.
3. ✅ Update this plan with briefing findings — done.
4. ✅ Resolve open questions — done.
5. **Hand finalized prompt to Replit.** (Next step.)
6. Replit builds the feature following the references and patterns in this plan.
7. Replit writes implementation report to `docs/plans/gmail-sync-implementation-report.md`.
8. Replit updates `CLAUDE.md` with a brief section on this feature.
9. Manual QA pass using Replit's report as the test script.
10. Update "What Actually Happened" section below with the real outcome, deviations, and follow-up tasks.

## Status

**Ready for Replit.** All open questions resolved, affected files identified, architecture decisions made.

## What Actually Happened

*(To be filled in after Replit completes implementation.)*
