/**
 * Gmail → Client matcher.
 *
 * Pure functions only. Given a parsed Gmail message and a snapshot of clients
 * + contacts + domain rules + exclusions, return all (clientId, contactId,
 * matchedEmail, matchedDomain) tuples that should be logged.
 *
 * Multi-client rule: a single message can match multiple clients (same email
 * sent to people at two different orgs). One row per match is emitted by the
 * background sync — the dedup key is (gmail_message_id, client_id).
 */

export interface ClientLite {
  id: string;
  email: string | null;
}

export interface ContactLite {
  id: string;
  clientId: string;
  email: string | null;
}

export interface MatchInput {
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  /** All staff/connection email addresses we own — used to detect outbound. */
  ownerEmail: string;
  clients: ClientLite[];
  contacts: ContactLite[];
  excludedEmails: Set<string>;     // lowercased
  excludedDomains: Set<string>;    // lowercased - never log
  includedDomains: Set<string>;    // lowercased - always log even if generally excluded
}

export interface MatchResult {
  clientId: string;
  contactId?: string | null;
  matchedEmail: string;
  matchedDomain: string;
}

export interface ClassifiedMessage {
  /** 'inbound' if the connection's email is among recipients; else 'outbound'. */
  direction: 'inbound' | 'outbound';
  /** Empty if no client matched OR the message is excluded. */
  matches: MatchResult[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normEmail(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase();
}

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase();
}

/**
 * Classify direction + compute matches against clients/contacts. Excluded
 * emails/domains are skipped unless an `included` domain rule overrides.
 */
export function classifyAndMatch(input: MatchInput): ClassifiedMessage {
  const ownerEmail = normEmail(input.ownerEmail);
  const fromEmail = normEmail(input.fromEmail);
  const allRecipients = [...input.toEmails, ...input.ccEmails, ...input.bccEmails]
    .map(normEmail)
    .filter(e => EMAIL_RE.test(e));

  // Direction: outbound if owner is the sender, else inbound.
  const direction: 'inbound' | 'outbound' = fromEmail === ownerEmail ? 'outbound' : 'inbound';

  // Counterparty addresses (i.e. NOT the owner).
  const counterparties = new Set<string>();
  if (direction === 'outbound') {
    for (const r of allRecipients) if (r && r !== ownerEmail) counterparties.add(r);
  } else {
    if (fromEmail) counterparties.add(fromEmail);
  }

  // Build O(1) lookup maps.
  const contactByEmail = new Map<string, ContactLite>();
  for (const c of input.contacts) {
    const e = normEmail(c.email);
    if (e) contactByEmail.set(e, c);
  }
  const clientByEmail = new Map<string, ClientLite>();
  const clientsByDomain = new Map<string, ClientLite[]>();
  for (const cl of input.clients) {
    const e = normEmail(cl.email);
    if (!e) continue;
    clientByEmail.set(e, cl);
    const d = domainOf(e);
    if (!d) continue;
    const arr = clientsByDomain.get(d);
    if (arr) arr.push(cl);
    else clientsByDomain.set(d, [cl]);
  }

  const matches = new Map<string, MatchResult>(); // dedup by clientId

  for (const cp of counterparties) {
    if (!cp) continue;

    const dom = domainOf(cp);
    const isIncluded = input.includedDomains.has(dom);

    // Apply exclusions unless explicitly included.
    if (!isIncluded) {
      if (input.excludedEmails.has(cp)) continue;
      if (input.excludedDomains.has(dom)) continue;
    }

    // 1) exact contact-email match
    const contact = contactByEmail.get(cp);
    if (contact) {
      if (!matches.has(contact.clientId)) {
        matches.set(contact.clientId, {
          clientId: contact.clientId,
          contactId: contact.id,
          matchedEmail: cp,
          matchedDomain: dom,
        });
      }
      continue;
    }

    // 2) exact client-email match
    const client = clientByEmail.get(cp);
    if (client) {
      if (!matches.has(client.id)) {
        matches.set(client.id, {
          clientId: client.id,
          contactId: null,
          matchedEmail: cp,
          matchedDomain: dom,
        });
      }
      continue;
    }

    // 3) domain-only match against client primary email domain
    const sameDomainClients = clientsByDomain.get(dom);
    if (sameDomainClients && sameDomainClients.length > 0) {
      for (const sdc of sameDomainClients) {
        if (!matches.has(sdc.id)) {
          matches.set(sdc.id, {
            clientId: sdc.id,
            contactId: null,
            matchedEmail: cp,
            matchedDomain: dom,
          });
        }
      }
    }
  }

  return { direction, matches: Array.from(matches.values()) };
}
