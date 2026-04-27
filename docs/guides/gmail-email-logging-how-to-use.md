# How to use Gmail email logging

A guide for Account Managers, managers, and admins.

---

## What this feature does

AgencyBoost can automatically pull the emails you send and receive in
your Gmail inbox and show them on the matching client's profile, right
alongside that client's text messages and call history. You don't have
to forward, BCC, or copy-paste anything — once your Gmail is connected,
new mail keeps appearing on the relevant client's page on its own.

The integration is **read-only**. AgencyBoost can see your messages so
it can log them, but it cannot send email from your inbox or change
anything in Gmail.

---

## One-time setup — connect your Gmail

You only need to do this once per staff member. Each person on your team
connects their own Gmail account.

### Step 1 — Open My Profile

1. Click your name or avatar in the top-right corner of AgencyBoost.
2. Go to **My Profile** (under Settings).
3. Scroll down to the **Gmail Sync** card.

### Step 2 — Click "Connect Gmail"

You'll see a button labeled **Connect Gmail**. Click it.

The button briefly shows "Redirecting to Google…" and then opens
Google's sign-in page in the same tab.

### Step 3 — Sign in and approve access on Google

1. Pick the Google account whose inbox you want to log (this is usually
   your work email).
2. Google will show a consent screen listing what AgencyBoost is asking
   for. It's read-only access to your Gmail.
3. Click **Allow** (or **Continue**).

> **About the "unverified app" warning:** depending on how your
> AgencyBoost workspace is set up with Google, you may see a screen
> warning that the app is not verified. If you do, click **Advanced**
> and then **Go to AgencyBoost (unsafe)** to continue. This warning is
> normal for internal tools and does **not** mean anything is wrong. If
> in doubt, check with your admin before clicking through.

### Step 4 — Confirm it worked

Google sends you back to AgencyBoost. The Gmail Sync card should now
show:

- **"Connected as your.email@example.com"**
- A **Disconnect** button
- A **Sync now** button
- A status line that says when your inbox was last synced

That's it — your inbox is now connected. AgencyBoost will pull new mail
in the background every couple of minutes.

The first time you connect, AgencyBoost also pulls a window of older
mail (set by your admin — typically the last 90 days) so your client
profiles aren't empty.

---

## Where to find logged emails

Logged emails appear on the client's own profile page, mixed in with
that client's other communication.

1. Click **Clients** in the main navigation.
2. Click the client whose emails you want to see.
3. On the client's profile, find the **Communication History** card.

You'll see a list of conversation threads, newest first. Each row in
the list shows:

- The participants (names or email addresses / phone numbers)
- A short preview of the latest message
- The time of the latest activity
- A small badge telling you whether the thread is **Email**, **SMS**,
  or **Call**
- A **paperclip icon** if any message in the thread has an attachment

Email conversations are grouped the same way Gmail groups them — all
replies in the same thread show up together, not as separate items.

---

## How to read an email

1. **Click on a thread** to expand it. The thread opens to show every
   message it contains, oldest at the top.
2. For email messages, you'll see the **full email body** rendered the
   way it would look in Gmail (formatting, links, images where the
   sender included them).
3. If a message has attachments, you'll see them listed as **chips
   underneath the message**. Each chip shows the file name and size.
4. **Click an attachment chip** to download the file. Attachments are
   pulled directly from Gmail at the moment you click — they aren't
   stored inside AgencyBoost.

To collapse a thread again, click its row a second time.

---

## How to search and filter

The Communication History card has a **search box** and two rows of
**filter chips** at the top.

### Search box

Type any word or phrase. AgencyBoost searches across the messages in
this client's history, including:

- Email subjects
- Email previews (snippets)
- The full email body — both plain-text and HTML versions
- Sender and recipient email addresses, and sender names
- The text of SMS messages
- Phone numbers on calls and SMS

The search updates as you type.

### Filter chips — type

The first row lets you narrow by message type:

- **All** — show every kind of message
- **SMS** — only text messages
- **Email** — only emails

(Calls always appear when "All" is selected.)

### Filter chips — direction

The second row lets you narrow by direction:

- **All** — show everything
- **Sent** — messages sent from the agency
- **Received** — messages sent to the agency

You can mix any combination of search text + type chip + direction
chip; results refresh on each change.

### Pagination

If a client has more than about 50 conversation threads, the card
shows **Previous** / **Next** buttons at the bottom and a "Page X of Y"
label. Each page holds 50 threads.

If a client has thousands of messages and you haven't filtered or
searched, the card may show a banner letting you know it's showing the
most recent batch — narrow the view with a search term or filter to
reach older messages.

---

## Admin-only: Email Logging Settings

If you have admin (or "manage email logging") permission, you can
control how the whole agency uses this feature.

### Where to find it

1. Click **Settings** in the main navigation.
2. Open **Email Logging**.

You'll see several cards stacked on top of each other, each controlling
a different part of the feature.

### Master controls

- **Email logging enabled** — the on/off switch for the whole agency.
  Turning it off pauses all background syncing for everyone immediately.
  Already-logged emails stay where they are; only **new** mail stops
  being pulled.
- **Initial lookback (days)** — when a new staff member connects their
  Gmail for the first time, how far back AgencyBoost should reach to
  pick up older mail. The default is 90 days. Bigger numbers mean a
  longer first-time backfill.

### Category exclusions

Skip emails that Gmail itself has tagged as low-value. Each switch
controls one Gmail category:

- **Promotions**
- **Social**
- **Updates**
- **Spam**
- **Trash**

When a switch is on, mail in that category is **not** logged. By
default these are all on so promotional newsletters and marketing
blasts don't clutter client profiles.

### Body storage

Decide what part of an email AgencyBoost saves:

- **Store plain text body** — saves the plain-text version of each
  email.
- **Store HTML body** — saves the formatted (HTML) version, so emails
  look the way the sender wrote them when expanded on the client page.

Turning either of these off makes the saved record smaller but means
expanded emails will only show what's left (e.g., the short preview).

### Domain rules

Always include or always exclude messages from specific email domains.
Type a domain (for example, `example.com`), choose **Include** or
**Exclude**, and click **Add**.

- **Exclude** — never log mail from this domain, even if it would
  otherwise match a client.
- **Include** — make sure mail from this domain is logged whenever
  there's a matching client.

Useful for partner agencies you always want to capture, or noisy
notification senders (calendar invites, automated reports) you never
want on a client page.

You can remove a rule at any time by clicking the trash icon next to
it.

### Email exclusions

Skip individual email addresses entirely (handy for bots, internal
aliases, or `noreply@…` addresses). Type the full email address, click
**Add**. Remove with the trash icon.

### Connected mailboxes

A live list of every staff member who has connected their Gmail. For
each connection you can see who they are, when their inbox was last
synced, and whether the connection is healthy. There's a refresh button
in the top-right of this card if you want the timestamps to update
right now.

---

## What gets logged and what doesn't

### Gets logged

An email is logged when **all** of these are true:

1. A staff member's Gmail is connected and syncing.
2. The agency-wide master switch is on.
3. The email isn't in a category you've excluded (Promotions, Social,
   Updates, Spam, Trash by default).
4. The sender's domain isn't on the exclude list (and the sender isn't
   on the per-email exclusion list).
5. AgencyBoost can match the email to a client — for example, the
   message was sent to or from a client contact's email address, or it
   matches an "include" domain rule.

The same email can show up on more than one client's profile if it
involves multiple clients (for example, a CC'd reply to two of your
contacts at different agencies).

### Does NOT get logged

- Emails older than the lookback window when you first connect.
- Emails in excluded Gmail categories (Promotions/Social/etc.).
- Emails from excluded domains or excluded individual addresses.
- Emails that can't be matched to any client in AgencyBoost. (Personal
  email, unrelated newsletters, internal team chatter that doesn't
  mention a client, etc.)
- Anything sent or received **before** you connected your Gmail and
  outside the lookback window — there's no way to reach further back.
- Emails sent from a Gmail account that isn't connected to AgencyBoost.
  (If a teammate hasn't connected their Gmail yet, their messages
  won't appear.)

---

## Disconnecting Gmail

If you change jobs, change Gmail accounts, or just don't want
AgencyBoost reading your inbox anymore:

1. Open **My Profile** → **Gmail Sync** card.
2. Click **Disconnect**.
3. You'll see a confirmation message that says:
   _"Disconnect Gmail? Existing logged emails will be retained, but
   new mail will not be synced."_
4. Click OK.

After disconnecting:

- AgencyBoost stops fetching new mail from your inbox immediately.
- All emails that were already logged stay on their client profiles —
  nothing is deleted.
- Attachment downloads on previously logged emails will stop working,
  because attachments are pulled live from Gmail at click time. (The
  email subject, body, and the list of attachments are still visible;
  only the file download breaks.)
- You can connect again later — same Gmail or a different one — by
  clicking **Connect Gmail** again.

An admin can also force a disconnect from the **Connected mailboxes**
card on the Email Logging settings page if a staff member has left.

---

## FAQ — common questions

**How quickly does new mail show up?**
AgencyBoost checks every two minutes. You can also click **Sync now**
on your Gmail Sync card if you don't want to wait.

**Can AgencyBoost send email from my Gmail?**
No. The current integration is read-only. Sending replies from inside
AgencyBoost is planned for a future release.

**Can my admin or coworkers read my personal email?**
AgencyBoost only stores emails that match a client. Personal email
that doesn't match any client (and email in excluded categories like
Promotions or Spam) is never logged. Logged emails are visible to any
AgencyBoost user with permission to view that client.

**An email I expected to see isn't showing up. Why?**
The most common reasons, in order:
1. The client's contact email in AgencyBoost doesn't match the address
   the email was sent to/from. Check the contact's email on the client
   profile.
2. The email landed in Promotions/Social/Updates and that category is
   excluded.
3. The sender's domain is on the Exclude list.
4. The email is older than your initial lookback window.
5. The Gmail account that received it isn't connected to AgencyBoost.

**Will replies group with the original email?**
Yes. AgencyBoost groups emails the same way Gmail does, so a back-and-
forth conversation appears as a single thread.

**Can the same email appear on multiple clients?**
Yes — if the email involves contacts at more than one client, it shows
up on each of them.

**Are attachments stored in AgencyBoost?**
No. The list of attachments is stored, but the actual files are pulled
from Gmail when you click an attachment chip. This means downloads
won't work after you disconnect Gmail.

**Does turning the master switch off delete anything?**
No. It just pauses new syncing across the agency. Everything already
logged stays in place.

---

## Open questions

The following are points where the behaviour was not 100% clear to me
from what I built. They're worth confirming with whoever set up the
Google Cloud project for AgencyBoost or whoever owns the product:

1. **The "unverified app" warning** — whether end users actually see
   it depends on how the Google Cloud OAuth client is set up
   (verified, in testing, internal-only, etc.). Different setups
   produce different warnings, and someone with access to the Google
   Cloud console should confirm the exact wording staff will see.

2. **The exact name of the section/tab on the client page that shows
   Communication History** — this guide describes it as a card on the
   client profile, but the precise label and location ("Communication"
   tab vs. "Activity" tab vs. always-visible card) may vary depending
   on your tenant's configuration. Worth a screenshot pass before
   publishing.

3. **Connecting more than one Gmail to the same AgencyBoost user** —
   the Connect Gmail flow is per staff member, and the disconnect
   confirmation suggests there's only one connection at a time, but I
   didn't independently verify the exact behaviour if the same person
   tries to connect a second different Gmail address.

4. **Per-staff visibility of "Connected mailboxes"** — admins can see
   the full list. Whether non-admin staff can see who else has
   connected (for example, to know whether a teammate's mail is being
   captured) wasn't explicitly settled.

5. **Direction of email matching for outbound messages** — emails you
   *send* to a client should appear as "Sent" on the client profile.
   The matching rules cover both directions, but the exact behaviour
   for edge cases (e.g., a Gmail "Sent" copy of an email that was
   originally sent from a different connected mailbox) wasn't
   verified end-to-end.

6. **What happens to pre-existing emails from the old "Emails" tab** —
   the standalone Emails tab has been hidden in favour of Communication
   History, but if any tenants relied on the old tab's exact look, they
   should be told ahead of time so they know where to find their data
   now.

7. **Per-category default state** — this guide says "by default these
   are all on" for category exclusions; whether that's literally true
   for a brand-new tenant after the first migration is worth a quick
   spot-check.
