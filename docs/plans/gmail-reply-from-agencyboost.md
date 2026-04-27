# Phase 3 — Reply-from-AgencyBoost (Gmail send) — Stub

> Status: **planned, not started**. This document is a placeholder so the
> work item is captured. No implementation in this repo yet.

## Why this exists

Phase 1 of the Gmail integration brought **read-only** sync (per-staff
OAuth, background polling, `logged_emails` storage with attachments,
client-profile rendering). Phase 2 unified the Communication History tab
to render that synced data alongside SMS and call rows, including real
HTML bodies and attachment chips.

Phase 3 closes the loop by letting staff **reply to a Gmail thread (or
compose a new email) from inside AgencyBoost** and have the message
delivered through the connected user's Gmail account, with the response
captured by the existing background sync the next cycle.

## Scope (proposed — to be agreed before any code is written)

- Add `gmail.send` to the OAuth scope set requested by
  `server/gmailOAuth.ts` (existing connections will need a re-auth — must
  be communicated to staff before rolling out).
- New endpoint `POST /api/clients/:clientId/emails` that:
  - Accepts `{ to, cc?, bcc?, subject, bodyHtml, bodyText?, replyTo?,
    attachments? }`.
  - When `replyTo` is the id of a `logged_emails` row, looks up the
    `gmailThreadId`, `gmailMessageId`, `Message-Id` / `References` /
    `In-Reply-To` headers, and threads the new send into Gmail
    natively (so the reply lands in the same Gmail conversation).
  - Builds a MIME message (`googleapis` `gmail.users.messages.send`),
    optionally with attachments.
  - Writes a `logged_emails` row immediately with `direction='outbound'`
    so the UI shows the message before the next sync cycle picks it up.
- Reply UI in the Communication History card (the existing "Reply"
  button stub in `enhanced-client-detail.tsx` becomes wired up), reusing
  the existing `RichTextEditor` + merge-tag selector.
- Attachment uploads: reuse the existing `multer`/`objectStorage` flow,
  attach the bytes inline to the outbound MIME message (no new bucket
  layout required).

## Open questions (need Joe's call before scoping)

1. **Sender identity**: always send as the connected user's Gmail
   address, or allow a "send-as" alias (e.g., `support@agency.com`)?
2. **Reply-to a non-Gmail-synced email** (one logged manually): do we
   build a brand-new thread, or treat it as not-replyable?
3. **Audit-log granularity**: a single `auditLogs` row per send (matches
   today), or a richer audit trail capturing who clicked Send, the full
   recipient list, and attachment count?
4. **Failure handling**: if Gmail rejects the send (quota,
   authentication), do we surface a toast and leave the draft, or
   persist a `logged_emails` row with `direction='outbound'` +
   `status='failed'`?
5. **Templates / scheduled sending**: are these in scope for v1, or do
   they wait for a v2?

## Non-goals (explicitly out of scope for Phase 3)

- Push-based receive (Gmail `watch()` / Pub/Sub) — sticking with the
  2-minute polling Phase 1 contract.
- Per-user signature management — could come later as a small Phase 3.5.
- Scheduled or sequenced sending — separate effort, would layer on top.

## Dependencies on prior phases

- Phase 1's OAuth + token-refresh path. Phase 3 only needs to add the
  `gmail.send` scope and bump existing connections through re-consent.
- Phase 2's unified Communication History card. The reply UI hooks into
  the per-message `Reply` button already present.

## Rough sequencing

1. Decide answers to the open questions above.
2. Add `gmail.send` scope and a re-consent flow (existing connections
   get a "permission upgrade required" banner on the connections page).
3. Build `POST /api/clients/:clientId/emails` and unit-coverage the MIME
   builder + threading-headers logic.
4. Wire the existing `Reply` button in Communication History to a
   composer modal that calls the new endpoint.
5. Add a "Compose" button at the top of Communication History for a
   fresh outbound email (no `replyTo`).
6. QA: send a real reply, verify it lands in the correct Gmail thread
   for the recipient and is picked up by the next sync cycle as an
   outbound row.
