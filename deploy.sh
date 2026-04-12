#!/bin/bash
# EtherBound Idle - Deploy Script
# Run from anywhere: bash ~/EtherBoundIdle/deploy.sh

set -e

REPO_DIR="$HOME/EtherBoundIdle"
cd "$REPO_DIR"
echo "=== Working in $REPO_DIR ==="

echo "=== Step 1: Pulling latest code ==="
git pull origin main

echo "=== Step 2: Installing dependencies ==="
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "=== Step 3: Building shared libraries (db) ==="
npx tsc --build lib/db
echo "DB lib built: $(ls lib/db/dist/schema/game.js 2>/dev/null && echo 'OK' || echo 'MISSING!')"

echo "=== Step 3b: Pushing DB schema changes ==="
cd "$REPO_DIR/lib/db"
npx drizzle-kit push --config ./drizzle.config.ts --force 2>/dev/null || echo "DB push skipped (no DATABASE_URL or already up to date)"

echo "=== Step 4: Building frontend (Vite) ==="
cd "$REPO_DIR/artifacts/game"
rm -rf dist node_modules/.vite
npx vite build
echo "Frontend built: $(ls dist/index.html 2>/dev/null && echo 'OK' || echo 'MISSING!')"

echo "=== Step 5: Building API server (copies frontend into dist/public) ==="
cd "$REPO_DIR/artifacts/api-server"
node build.mjs
# Remove old .mjs file if it exists (PM2 was pointing to wrong file)
rm -f dist/index.mjs
echo "Public dir: $(ls dist/public/index.html 2>/dev/null && echo 'OK' || echo 'MISSING!')"

echo "=== Step 6: Restarting PM2 ==="
cd "$REPO_DIR"
# Use reload for zero-downtime restart in cluster mode, fall back to restart
if pm2 describe etherbound > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 delete all 2>/dev/null || true
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo ""
echo "=== DONE! ==="
echo "Clear your browser cache (Ctrl+Shift+R) and check the game."
