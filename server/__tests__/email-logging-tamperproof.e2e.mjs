#!/usr/bin/env node
/**
 * Task #50 — Tamper-proof Email Logging "last synced" — Browser E2E.
 *
 * Drives a real headless Chromium against the running dev server and
 * verifies, in actual rendered DOM, that:
 *
 *   1. The admin "Connected mailboxes" card (/settings/email-logging) shows
 *      a recent "last synced X ago" string for the test connection (NOT
 *      "hours ago").
 *   2. The same card's manual Refresh button fires a real network call
 *      to /api/settings/email-logging/connections.
 *   3. After waiting ~35 seconds, the displayed label has either
 *      progressed (live tick) or been re-anchored by a fresh poll, but
 *      in no case does it become "hours ago".
 *   4. Both /api/settings/email-logging/connections and /api/gmail/status
 *      respond with `Cache-Control: no-store` and NO `ETag` header
 *      (validated by intercepting the network response in the same
 *      browser session).
 *   5. The same guarantees hold for the Gmail Sync card on My Profile
 *      (/settings/my-profile), including its own manual Refresh button.
 *
 * No credentials in source.
 *   The test reads its session cookie from the env var `E2E_SESSION_COOKIE`
 *   (full Cookie-header value, e.g. "connect.sid=s%3A...."). Without it the
 *   script aborts. The connection email is configurable via
 *   `E2E_TEST_EMAIL` (default "rui@themediaoptimizers.com"), the chromium
 *   binary path via `CHROMIUM_PATH` (default `/usr/bin/chromium` resolved
 *   from `which chromium`).
 *
 * Usage:
 *   E2E_SESSION_COOKIE="connect.sid=s%3A..." \
 *   CHROMIUM_PATH="$(which chromium)" \
 *     node server/__tests__/email-logging-tamperproof.e2e.mjs
 */

import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import pg from 'pg';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5000';
const COOKIE_HEADER = process.env.E2E_SESSION_COOKIE;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'rui@themediaoptimizers.com';
const TICK_WAIT_MS = Number(process.env.E2E_TICK_WAIT_MS || 75000);
const DATABASE_URL = process.env.DATABASE_URL;

if (!COOKIE_HEADER) {
  console.error(
    'E2E_SESSION_COOKIE env var is required (full Cookie header value).\n' +
      'Example: E2E_SESSION_COOKIE="connect.sid=s%3A...."'
  );
  process.exit(2);
}

function resolveChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    return execSync('command -v chromium', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const CHROME = resolveChromium();
if (!CHROME) {
  console.error(
    'No chromium binary found. Install chromium (Nix/system) or set CHROMIUM_PATH.'
  );
  process.exit(2);
}

const RESULTS = [];
function check(name, ok, detail) {
  RESULTS.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

function parseCookieHeader(header) {
  return header.split(';').map((kv) => {
    const i = kv.indexOf('=');
    return { name: kv.slice(0, i).trim(), value: kv.slice(i + 1).trim() };
  });
}

const HOURS_RE = /\bhours?\b|\ban hour\b/i;
const AGO_RE = /\bago\b/i;

/**
 * Parse a relative-time label into an approximate "minutes ago" bucket so
 * we can assert the live tick has progressed. Returns NaN if unparseable.
 *
 * Examples:
 *   "less than a minute ago" -> 0
 *   "a minute ago" / "1 minute ago" -> 1
 *   "5 minutes ago" -> 5
 *   "an hour ago" / "1 hour ago" -> 60
 *   "2 hours ago" -> 120
 */
function parseAgoMinutes(text) {
  if (typeof text !== 'string') return NaN;
  const t = text.toLowerCase();
  if (/less than (a|1) minute ago/.test(t)) return 0;
  let m = t.match(/^(?:about\s+)?(\d+)\s+seconds?\s+ago$/);
  if (m) return 0;
  m = t.match(/^(?:about\s+)?(?:a|an|1)\s+minute\s+ago$/);
  if (m) return 1;
  m = t.match(/^(?:about\s+)?(\d+)\s+minutes?\s+ago$/);
  if (m) return Number(m[1]);
  m = t.match(/^(?:about\s+)?(?:a|an|1)\s+hour\s+ago$/);
  if (m) return 60;
  m = t.match(/^(?:about\s+)?(\d+)\s+hours?\s+ago$/);
  if (m) return Number(m[1]) * 60;
  return NaN;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const ctx = await browser.newContext();

  const baseUrl = new URL(BASE);
  const cookies = parseCookieHeader(COOKIE_HEADER).map((c) => ({
    name: c.name,
    value: c.value,
    domain: baseUrl.hostname,
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  }));
  await ctx.addCookies(cookies);

  // Capture all responses so we can assert on cache headers and refresh hits.
  const apiResponses = [];
  ctx.on('response', (resp) => {
    const url = resp.url();
    if (
      url.includes('/api/settings/email-logging/connections') ||
      url.includes('/api/gmail/status')
    ) {
      apiResponses.push({
        url,
        status: resp.status(),
        cacheControl: resp.headers()['cache-control'],
        etag: resp.headers()['etag'],
        ts: Date.now(),
      });
    }
  });

  const page = await ctx.newPage();

  // ---------------- Admin page ----------------
  await page.goto(BASE + '/settings/email-logging', { waitUntil: 'networkidle' });
  check('admin page loaded (no redirect to login)', !/\/login/i.test(page.url()), `url=${page.url()}`);

  // The connection row may take a beat after networkidle to render.
  const adminLastSyncedSelector = `[data-testid$="-last-synced"]`;
  await page.waitForSelector(adminLastSyncedSelector, { timeout: 15000 });
  // Find the row whose visible text contains TEST_EMAIL, then its last-synced child.
  const adminText1 = await page.evaluate((email) => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="connection-"]'));
    const row = rows.find((r) => r.textContent && r.textContent.includes(email));
    if (!row) return null;
    const label = row.querySelector('[data-testid$="-last-synced"]');
    return label ? label.textContent.trim() : null;
  }, TEST_EMAIL);
  check(
    'admin: rendered last-synced label is recent (not "hours ago")',
    adminText1 !== null && AGO_RE.test(adminText1) && !HOURS_RE.test(adminText1),
    `text="${adminText1}"`
  );

  // Cache headers from the GET that loaded the row.
  const adminApi1 = apiResponses.findLast?.((r) =>
    r.url.includes('/api/settings/email-logging/connections')
  ) || apiResponses.slice().reverse().find((r) =>
    r.url.includes('/api/settings/email-logging/connections')
  );
  check(
    'admin endpoint network response: status 200',
    adminApi1 && adminApi1.status === 200,
    `status=${adminApi1?.status}`
  );
  check(
    'admin endpoint network response: Cache-Control includes no-store',
    adminApi1 && /no-store/i.test(adminApi1.cacheControl || ''),
    `cache-control=${adminApi1?.cacheControl}`
  );
  check(
    'admin endpoint network response: no ETag header',
    adminApi1 && (adminApi1.etag === undefined || adminApi1.etag === null),
    `etag=${adminApi1?.etag}`
  );

  // ---------------- Manual Refresh on admin page ----------------
  const refreshBtn = await page.$('[data-testid="refresh-connections"]');
  check('admin: Refresh button present', !!refreshBtn);
  if (refreshBtn) {
    const beforeCount = apiResponses.filter((r) =>
      r.url.includes('/api/settings/email-logging/connections')
    ).length;
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/settings/email-logging/connections') && r.status() === 200,
        { timeout: 10000 }
      ),
      refreshBtn.click(),
    ]);
    const afterCount = apiResponses.filter((r) =>
      r.url.includes('/api/settings/email-logging/connections')
    ).length;
    check(
      'admin: Refresh click triggered a fresh GET',
      afterCount > beforeCount,
      `before=${beforeCount}, after=${afterCount}`
    );
    // Re-read label after refresh.
    const adminText2 = await page.evaluate((email) => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="connection-"]'));
      const row = rows.find((r) => r.textContent && r.textContent.includes(email));
      const label = row?.querySelector('[data-testid$="-last-synced"]');
      return label ? label.textContent.trim() : null;
    }, TEST_EMAIL);
    check(
      'admin: label after Refresh is still recent (not "hours ago")',
      adminText2 !== null && AGO_RE.test(adminText2) && !HOURS_RE.test(adminText2),
      `text="${adminText2}"`
    );
  }

  // ---------------- Wait ~75s and verify the live tick or a poll fired ----------------
  // The frontend re-renders every 30s and the React Query polls every 30s,
  // so a 75-second wait guarantees at least one of:
  //   (a) the rendered relative-time bucket has incremented, or
  //   (b) at least one fresh /api/...connections poll fired (which would
  //       re-anchor the label to the new lastSyncedAt).
  // Either is acceptance: the user-visible label is provably alive.
  const adminTextBeforeTick = await page.evaluate((email) => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="connection-"]'));
    const row = rows.find((r) => r.textContent && r.textContent.includes(email));
    const label = row?.querySelector('[data-testid$="-last-synced"]');
    return label ? label.textContent.trim() : null;
  }, TEST_EMAIL);
  const pollsBeforeTick = apiResponses.filter((r) =>
    r.url.includes('/api/settings/email-logging/connections')
  ).length;
  await page.waitForTimeout(TICK_WAIT_MS);
  const adminTextAfterTick = await page.evaluate((email) => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="connection-"]'));
    const row = rows.find((r) => r.textContent && r.textContent.includes(email));
    const label = row?.querySelector('[data-testid$="-last-synced"]');
    return label ? label.textContent.trim() : null;
  }, TEST_EMAIL);
  const pollsAfterTick = apiResponses.filter((r) =>
    r.url.includes('/api/settings/email-logging/connections')
  ).length;
  const pollsDuringTick = pollsAfterTick - pollsBeforeTick;

  const beforeMin = parseAgoMinutes(adminTextBeforeTick);
  const afterMin = parseAgoMinutes(adminTextAfterTick);
  const labelAdvanced =
    Number.isFinite(beforeMin) && Number.isFinite(afterMin) && afterMin > beforeMin;
  const labelStable = adminTextBeforeTick === adminTextAfterTick;

  check(
    `admin: after ${TICK_WAIT_MS}ms label still NOT "hours ago"`,
    adminTextAfterTick !== null &&
      AGO_RE.test(adminTextAfterTick) &&
      !HOURS_RE.test(adminTextAfterTick),
    `before="${adminTextBeforeTick}", after="${adminTextAfterTick}"`
  );
  check(
    `admin: live tick OR background poll fired during ${TICK_WAIT_MS}ms wait`,
    labelAdvanced || pollsDuringTick >= 1 || (labelStable && pollsDuringTick >= 1),
    `before="${adminTextBeforeTick}" (${beforeMin}m) → after="${adminTextAfterTick}" (${afterMin}m), polls=${pollsDuringTick}`
  );

  // ---------------- DB-backed recency assertion ----------------
  if (DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
    try {
      const { rows } = await pool.query(
        `SELECT last_synced_at FROM gmail_connections WHERE email = $1 LIMIT 1`,
        [TEST_EMAIL]
      );
      if (rows.length === 0) {
        check('DB recency: row exists for test email', false, `no gmail_connections row for ${TEST_EMAIL}`);
      } else {
        const lastSync = new Date(rows[0].last_synced_at);
        const ageMin = (Date.now() - lastSync.getTime()) / 60000;
        check(
          'DB recency: gmail_connections.last_synced_at is < 30 min old',
          ageMin < 30,
          `last_synced_at=${lastSync.toISOString()}, ageMin=${ageMin.toFixed(2)}`
        );
        // The rendered label minutes should not lie about reality by more
        // than a few minutes. The user's bug was "3 hours displayed" with
        // the DB at <1 min. This assertion catches that exact failure mode.
        if (Number.isFinite(afterMin)) {
          const skewMin = Math.abs(afterMin - ageMin);
          check(
            'DB vs UI: rendered label is within ±5 min of true last_synced_at',
            skewMin <= 5,
            `renderedMin=${afterMin}, dbAgeMin=${ageMin.toFixed(2)}, skew=${skewMin.toFixed(2)}`
          );
        }
      }
    } catch (e) {
      check('DB recency: query succeeded', false, `error=${e.message}`);
    } finally {
      await pool.end();
    }
  } else {
    console.log('[SKIP] DB recency assertion (DATABASE_URL not set)');
  }

  // ---------------- My Profile page ----------------
  await page.goto(BASE + '/settings/my-profile', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="gmail-last-synced"]', { timeout: 15000 });
  const profileText1 = await page.textContent('[data-testid="gmail-last-synced"]');
  check(
    'my-profile: gmail-last-synced is recent (not "hours ago")',
    profileText1 && AGO_RE.test(profileText1) && !HOURS_RE.test(profileText1),
    `text="${profileText1?.trim()}"`
  );

  const statusApi = apiResponses.slice().reverse().find((r) =>
    r.url.includes('/api/gmail/status')
  );
  check(
    '/api/gmail/status: 200 OK + no-store + no ETag',
    statusApi &&
      statusApi.status === 200 &&
      /no-store/i.test(statusApi.cacheControl || '') &&
      (statusApi.etag === undefined || statusApi.etag === null),
    `status=${statusApi?.status}, cc=${statusApi?.cacheControl}, etag=${statusApi?.etag}`
  );

  const refreshBtn2 = await page.$('[data-testid="button-gmail-refresh-status"]');
  check('my-profile: Refresh button present', !!refreshBtn2);
  if (refreshBtn2) {
    const before = apiResponses.filter((r) => r.url.includes('/api/gmail/status')).length;
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/gmail/status') && r.status() === 200,
        { timeout: 10000 }
      ),
      refreshBtn2.click(),
    ]);
    const after = apiResponses.filter((r) => r.url.includes('/api/gmail/status')).length;
    check(
      'my-profile: Refresh click triggered a fresh GET',
      after > before,
      `before=${before}, after=${after}`
    );
    const profileText2 = await page.textContent('[data-testid="gmail-last-synced"]');
    check(
      'my-profile: label after Refresh is still recent (not "hours ago")',
      profileText2 && AGO_RE.test(profileText2) && !HOURS_RE.test(profileText2),
      `text="${profileText2?.trim()}"`
    );
  }

  await browser.close();

  const failed = RESULTS.filter((r) => !r.ok);
  console.log(`\n${RESULTS.length - failed.length}/${RESULTS.length} checks passed`);
  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  process.exit(0);
})().catch((err) => {
  console.error('E2E error:', err);
  process.exit(2);
});
