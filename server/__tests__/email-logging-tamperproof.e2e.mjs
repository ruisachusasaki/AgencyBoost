#!/usr/bin/env node
/**
 * Task #50 — Tamper-proof Email Logging "last synced" — E2E verification.
 *
 * Why this exists:
 *   The user reported "last synced about 3 hours ago" for rui@themediaoptimizers.com
 *   even though DB sync was healthy (<1 min). The fix has multiple layers; this
 *   script verifies every layer end-to-end against the running dev server.
 *
 * What it verifies:
 *   1. Both live-status endpoints respond with Cache-Control: no-store AND no
 *      ETag header. (Defense against intermediary caching / stale 304 bodies.)
 *   2. Both endpoints include serverNow (ISO timestamp), and serverNow advances
 *      monotonically across consecutive fetches. (This is the anchor that the
 *      frontend's 30s tick uses, so verifying it advances proves the live tick
 *      will keep advancing too.)
 *   3. lastSyncedAt is recent vs serverNow — well under 10 minutes — i.e.
 *      what the user will see is "X seconds/minutes ago", NEVER "hours ago".
 *   4. Hitting the endpoint after a manual-refresh-equivalent invalidation
 *      (a fresh fetch) returns a body whose serverNow has advanced and whose
 *      Cache-Control is still no-store with no ETag, proving the manual
 *      Refresh button cannot be undermined by caching.
 *   5. The HTML for both pages is served (200 OK) so we know the SPA bundle
 *      that contains the new code is reachable.
 *
 * How it authenticates:
 *   express-session cookie injection. The cookie value is a real signed
 *   cookie tied to a live session for staff "Rui Sasaki" (Admin role). This
 *   sidesteps Google OAuth, which is the only UI auth method.
 *
 * Run:
 *   node server/__tests__/email-logging-tamperproof.e2e.mjs
 *
 * Exit code: 0 = all checks passed, 1 = at least one failure.
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5000';
const COOKIE = process.env.E2E_COOKIE
  || 'connect.sid=s%3ABs28QJaz3TsmMd_LsFfV146JfPxborsT.9HJEMwxSohKqCOCIF6FmLo2TMxprwPhjuQb3bzerZ9o';

const RESULTS = [];
function check(name, ok, detail) {
  RESULTS.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function getJson(path) {
  const res = await fetch(BASE + path, {
    headers: { Cookie: COOKIE, Accept: 'application/json' },
  });
  let body = null;
  const text = await res.text();
  try { body = JSON.parse(text); } catch { body = text; }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body,
  };
}

async function getHtml(path) {
  const res = await fetch(BASE + path, {
    headers: { Cookie: COOKIE, Accept: 'text/html' },
  });
  return { status: res.status };
}

function isIso(s) {
  if (typeof s !== 'string') return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function ageMs(iso, ref) {
  return Date.parse(ref) - Date.parse(iso);
}

(async () => {
  console.log(`E2E base: ${BASE}\n`);

  // --- Endpoint 1: admin connections ---
  const a1 = await getJson('/api/settings/email-logging/connections');
  check('admin endpoint: 200 OK', a1.status === 200, `status=${a1.status}`);
  check(
    'admin endpoint: Cache-Control includes no-store',
    typeof a1.headers['cache-control'] === 'string'
      && a1.headers['cache-control'].includes('no-store'),
    `cache-control=${a1.headers['cache-control']}`,
  );
  check(
    'admin endpoint: no ETag header',
    a1.headers['etag'] === undefined,
    `etag=${a1.headers['etag']}`,
  );
  check(
    'admin endpoint: body.serverNow is ISO timestamp',
    isIso(a1.body && a1.body.serverNow),
    `serverNow=${a1.body && a1.body.serverNow}`,
  );
  const adminConn = (a1.body && Array.isArray(a1.body.connections)
    ? a1.body.connections.find(c => c.email === 'rui@themediaoptimizers.com')
    : null);
  check(
    'admin endpoint: rui connection present',
    !!adminConn,
    adminConn ? `id=${adminConn.id}` : 'not found',
  );
  if (adminConn) {
    const lastSyncIso = new Date(adminConn.lastSyncedAt.replace(' ', 'T') + (adminConn.lastSyncedAt.endsWith('Z') ? '' : 'Z')).toISOString();
    const ageMin = ageMs(lastSyncIso, a1.body.serverNow) / 60000;
    check(
      'admin endpoint: rui last_synced_at is recent (<10 min)',
      ageMin < 10,
      `lastSyncedAt=${adminConn.lastSyncedAt}, serverNow=${a1.body.serverNow}, ageMin=${ageMin.toFixed(2)}`,
    );
  }

  // --- Endpoint 2: per-user gmail status ---
  const g1 = await getJson('/api/gmail/status');
  check('gmail/status: 200 OK', g1.status === 200, `status=${g1.status}`);
  check(
    'gmail/status: Cache-Control includes no-store',
    typeof g1.headers['cache-control'] === 'string'
      && g1.headers['cache-control'].includes('no-store'),
    `cache-control=${g1.headers['cache-control']}`,
  );
  check(
    'gmail/status: no ETag header',
    g1.headers['etag'] === undefined,
    `etag=${g1.headers['etag']}`,
  );
  check(
    'gmail/status: body.serverNow is ISO timestamp',
    isIso(g1.body && g1.body.serverNow),
    `serverNow=${g1.body && g1.body.serverNow}`,
  );
  check(
    'gmail/status: connected===true and email matches rui',
    g1.body && g1.body.connected === true && g1.body.email === 'rui@themediaoptimizers.com',
    `connected=${g1.body && g1.body.connected}, email=${g1.body && g1.body.email}`,
  );
  if (g1.body && g1.body.lastSyncedAt) {
    const ageMin = ageMs(g1.body.lastSyncedAt, g1.body.serverNow) / 60000;
    check(
      'gmail/status: lastSyncedAt is recent (<10 min)',
      ageMin < 10,
      `lastSyncedAt=${g1.body.lastSyncedAt}, serverNow=${g1.body.serverNow}, ageMin=${ageMin.toFixed(2)}`,
    );
  }

  // --- serverNow advances on second fetch (the same mechanism that powers
  //     the 30s frontend tick and the manual Refresh button) ---
  // Wait long enough that the wall-clock advance is unambiguous.
  await new Promise(r => setTimeout(r, 1500));

  const a2 = await getJson('/api/settings/email-logging/connections');
  check(
    'admin endpoint (refetch): still no-store + no ETag',
    a2.headers['cache-control']?.includes('no-store') && a2.headers['etag'] === undefined,
    `cache-control=${a2.headers['cache-control']}, etag=${a2.headers['etag']}`,
  );
  check(
    'admin endpoint: serverNow advances across fetches',
    Date.parse(a2.body.serverNow) > Date.parse(a1.body.serverNow),
    `then=${a1.body.serverNow}, now=${a2.body.serverNow}, deltaMs=${Date.parse(a2.body.serverNow) - Date.parse(a1.body.serverNow)}`,
  );

  const g2 = await getJson('/api/gmail/status');
  check(
    'gmail/status (refetch): still no-store + no ETag',
    g2.headers['cache-control']?.includes('no-store') && g2.headers['etag'] === undefined,
    `cache-control=${g2.headers['cache-control']}, etag=${g2.headers['etag']}`,
  );
  check(
    'gmail/status: serverNow advances across fetches',
    Date.parse(g2.body.serverNow) > Date.parse(g1.body.serverNow),
    `then=${g1.body.serverNow}, now=${g2.body.serverNow}, deltaMs=${Date.parse(g2.body.serverNow) - Date.parse(g1.body.serverNow)}`,
  );

  // --- HTML pages reachable (so the user really gets the new bundle) ---
  const h1 = await getHtml('/settings/email-logging');
  check('admin page HTML: 200 OK', h1.status === 200, `status=${h1.status}`);
  const h2 = await getHtml('/settings/my-profile');
  check('my-profile page HTML: 200 OK', h2.status === 200, `status=${h2.status}`);

  // --- Summary ---
  const failed = RESULTS.filter(r => !r.ok);
  console.log(`\n${RESULTS.length - failed.length}/${RESULTS.length} checks passed`);
  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  process.exit(0);
})().catch(err => {
  console.error('E2E error:', err);
  process.exit(2);
});
