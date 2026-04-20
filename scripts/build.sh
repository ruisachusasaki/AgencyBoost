#!/bin/bash
# Full production build - rebuilds frontend, main server bundle, AND worker bundles.
#
# IMPORTANT: The production deployment is a two-process setup:
#   1. dist/prodEntry.js  -> runs first, proxies requests
#   2. dist/appWorker.js  -> the actual application worker (serves all API routes)
#
# The default `npm run build` ONLY bundles dist/index.js and does NOT rebuild the
# worker/prodEntry bundles. If you skip this script before publishing, production
# will keep running whatever worker bundle was committed last, silently ignoring
# any server-side code changes.
#
# ALWAYS run this script before clicking Publish on a deploy that touches
# server/** code.

set -euo pipefail

echo "[build.sh] Running main build (vite + dist/index.js)..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "[build.sh] Rebuilding worker bundles (appWorker + prodEntry)..."
npx esbuild \
  server/appWorker.ts \
  server/prodEntry.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist

echo "[build.sh] Verifying worker bundle freshness..."
ls -la dist/index.js dist/appWorker.js dist/prodEntry.js

echo "[build.sh] ✅ Build complete. Safe to publish."
