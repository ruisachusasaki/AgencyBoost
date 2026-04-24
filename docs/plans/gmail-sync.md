# Gmail Sync for Automatic Email Logging

## Goal

Automatically log emails sent to and received from clients inside AgencyBoost, eliminating the manual copy-paste workflow Account Managers use today to record client email history in the Communications / notes area.

This is the same pattern used by Salesforce Inbox, HubSpot Sales Hub, Close, and Front. Treat those as design references for user experience.

## Context

**Origin of this work.** Joe Hupp asked about the best approach for logging client emails sent from Gmail. Replit's agent suggested three established patterns:

1. **BCC-to-CRM** — unique secret BCC address per user. Cheap, fast, but only captures outbound and relies on users remembering to BCC.
2. **Two-way Google Workspace sync** — OAuth connection, background sync of inbound and outbound. Complete solution. What premium CRMs do.
3. **Gmail Chrome extension / add-on** — per-thread button. Requires extension maintenance and user discipline.

**Decision.** After discussion, we decided to go directly with option 2 (Gmail sync) rather than ship option 1 first. Reasoning:

- Joe confirmed priority is **internal use** — AMs are currently manually logging emails into client notes, which is tedious and unreliable.
- Option 1 (BCC) only captures outbound emails. In typical CRM usage, inbound client replies usually outnumber outbound, so Phase 1 would only solve a fraction of the real pain.
- We have time and are not in a rush, so going straight to the real solution avoids double work.
- Google OAuth is already wired up in AgencyBoost for Google Calendar, so the auth foundation partially exists.

**Priority level.** Highest priority, per Joe's confirmation that AMs are actively manually logging emails today.

**Not yet in scope.** Google restricted-scope verification (CASA Tier 2) is not being pursued in this iteration. Users will see the "unverified app" warning when connecting Gmail. This is acceptable for internal MediaOptimizers use.

## Affected Files

**To be filled in after Claude Code briefing.** The following questions need answers from Claude Code (which has full repo read access) before we can list specific files:

1. Where is the existing Google Calendar OAuth flow implemented?
2. What is the current shape of the Communications tab on the client profile, and how do SMS and call logs get into it today?
3. Does the data model support multiple contact persons per client? If yes, how is it structured?
4. How does the existing role-based access rules system work, and where would a new admin settings page hook into it?
5. Is there an existing background job / worker system, or would this be the first one?

Once the briefing is returned, update this section with the concrete file list.

## Proposed Approach

### 1. Gmail Connection (per user)

- **Separate "Connect Gmail" button** in User Settings. Not tied to the existing Calendar OAuth connection — deliberately its own flow and its own connection state.
- Google OAuth requesting `gmail.readonly` scope only (read-only — AgencyBoost never sends or modifies emails).
- Post-connection settings UI shows:
  - Connection status (Connected / Not connected / Error)
  - Connected Gmail address
  - Last sync timestamp
  - "Disconnect Gmail" button
  - "Sync now" manual trigger button
- Any user with an AgencyBoost account can connect their own Gmail.
- On token refresh failure or disconnect, user sees a clear "Reconnect Gmail" prompt.

### 2. Admin-Only Email Logging Settings Page

A new page under the admin area called **"Email Logging Settings"**. Access controlled via the existing access rules framework — do NOT build parallel permission logic.

**Matching rules** (checkboxes, can combine):
- Match Client email addresses
- Match Lead email addresses
- Match Contact Persons under a client (if data model supports this — to be confirmed via Claude Code briefing)
- Match custom domains mapped to clients (e.g., map `@acme.com` → Acme Corp, so any email to/from that domain logs under Acme without needing a specific contact record)

**Exclusions:**
- Exclude internal domain(s) — admin specifies (e.g., don't log emails between MediaOptimizers staff)
- Exclude specific email addresses — manual blocklist, free-text list (newsletters, vendors, etc.)

**Direction:**
- Log outbound emails (sent by connected user)
- Log inbound emails (received by connected user from a matched contact)

**Scope of settings:** Global to the AgencyBoost account (not per-user). Per-user overrides are out of scope for v1.

**Defaults on first launch:**
- Match Client + Lead + Contact Persons: ON
- Custom domains: empty
- Exclusions: empty (with clear UI copy prompting admins to add their internal domain)
- Both directions: ON

### 3. Background Sync

- On first connection, pull recent email history (lookback window to be decided — one of the open questions).
- Match each email's participants (From, To, Cc) against the configured Email Logging Settings.
- For every matching email, log it against the correct client record.
- Sync continues automatically in the background — users should not need to manually refresh.
- **Threading:** Gmail threads must group together in AgencyBoost. Replies belong under their parent thread, not as disconnected entries.
- **Attachments:** At minimum, show that an attachment exists and its filename. Whether to store the actual file is an open question (storage cost).
- **Deduplication:** Use Gmail's `Message-ID` header as the unique key. Same email never logs twice, even across multiple syncs.

### 4. UI — Where Logged Emails Appear

Logged emails must appear in **both** locations on a client profile:

**A. Inside the existing Communications tab** (unified timeline alongside SMS and call logs)
- Each email shown as an entry with sender/recipient, subject, short body snippet, timestamp, email icon.
- Clicking expands or opens a side panel with the full body, attachments, and thread context.

**B. A new dedicated "Emails" tab on the client profile**
- Email history only, grouped by thread.
- Threads are collapsible with message count.
- Inside a thread: messages chronological, showing sender, timestamp, subject, body, attachments.
- Filters: direction (inbound/outbound), connected user, date range.
- Full-text search over subject and body.

Both views pull from the same underlying data and stay in sync.

## Risks & Edge Cases

**Risks:**
- Google "unverified app" warning is expected (not pursuing CASA verification yet). Document this in help text so users click "Advanced → continue to AgencyBoost" without being alarmed.
- Gmail sync is a feature where "80% working" means 20% of messages are silently missing or duplicated. Data quality bugs surface weeks after launch. Worth slowing down at the sync worker stage.
- `gmail.readonly` is a Google restricted scope. Broader rollout (external agency clients) would eventually require CASA Tier 2 assessment (~$10k–$20k, 4–12 weeks). Noted for future.

**Edge cases:**
- **Token refresh failures** → clear "Reconnect Gmail" prompt in settings plus non-intrusive notification.
- **Unmatched emails** → silently ignored (expected majority of inbox).
- **Email matching multiple clients** (group email across client companies) → log against ALL matched clients. Flagged as an open question for confirmation.
- **Gmail API rate limits** → back off gracefully, never crash the sync.
- **User disconnects Gmail** → previously logged emails remain. New syncs stop. Historical data is never deleted.
- **User emails that touch internal-only recipients** → excluded by internal-domain rule.
- **Large threads / very old threads** → bounded by initial sync lookback window.

## Open Questions

These must be answered — either by us or by Replit asking during build — before implementation is final:

1. **Initial sync lookback window** on first connection — 30 days, 90 days, or all time? Affects cost and initial sync duration.
2. **Attachment storage** — store the actual files, or just metadata (filename + size)? Storage cost implications.
3. **Multiple-client matches** — when a single email matches multiple clients, log to all? (Our current default: yes, log to all.)
4. **Default label exclusions** — should Gmail's Promotions, Social, Updates categories be excluded by default?
5. **Data model** — does AgencyBoost currently support multiple contact persons per client? Depends on Claude Code briefing.
6. **Background worker infrastructure** — does one already exist in the repo? Depends on Claude Code briefing.

## Implementation Steps

1. **Bootstrap brain files.** Confirm `CLAUDE.md`, `REPO_MAP.md`, `docs/PLANNING_CONTEXT.md` exist in the repo. If not, have Claude Code generate them.
2. **Claude Code briefing.** Run the pre-build briefing prompt in terminal Claude Code. Save the briefing output to `docs/PLANNING_CONTEXT.md` under a "Gmail Sync Pre-Build Briefing" section.
3. **Update this plan.** Fill in the "Affected Files" section and resolve open questions 5 and 6 with the briefing results.
4. **Finalize Replit prompt.** Adjust the generic Replit prompt based on repo-specific realities from the briefing.
5. **Hand to Replit.** Paste the finalized prompt into Replit. Replit should ask clarifying questions before coding.
6. **Answer Replit's clarifying questions.** Resolve any remaining open questions (1–4).
7. **Replit builds the feature.**
8. **Replit writes implementation report** to `docs/plans/gmail-sync-implementation-report.md`.
9. **Replit updates `CLAUDE.md`** with a brief section on this feature.
10. **QA pass.** Use Replit's report to manually test the feature end-to-end.
11. **Update "What Actually Happened" section** below with the real outcome.

## Status

**Planning — not yet handed to Replit.** Next immediate step: Claude Code briefing (step 2).

## What Actually Happened

*(To be filled in after Replit completes implementation. Record what was built vs. planned, surprises, assumptions made, deviations from the plan, and follow-up tasks.)*
