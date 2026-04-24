/**
 * Middleware that marks a response as fully uncacheable for live status
 * endpoints (e.g. "Last synced X ago" cards).
 *
 * Why both `Cache-Control: no-store` AND ETag stripping?
 *
 *   - `no-store` instructs the browser to never persist the response, which
 *     also means the next poll will not carry an `If-None-Match` header,
 *     so the server cannot answer with a stale 304.
 *   - However, Express's built-in `etag` setting still stamps an ETag header
 *     on every JSON response. While that header is harmless on its own under
 *     `no-store`, an intermediary cache, service worker, or future routing
 *     change could re-introduce conditional requests. Stripping the ETag at
 *     the source removes any risk of a 304-with-stale-body code path.
 *
 * `on-headers` registers a callback that runs *immediately before* response
 * headers are flushed, after Express's `res.send` has already populated the
 * ETag. That's the only safe place to remove it — if we tried to remove it
 * before `res.json()`, Express would re-add it during the send pipeline.
 */

import type { Request, Response, NextFunction } from "express";
import onHeaders from "on-headers";

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  onHeaders(res, () => {
    res.removeHeader("ETag");
  });
  next();
}
