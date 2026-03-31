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

echo "=== Step 3: Building frontend (Vite) ==="
cd artifacts/game
rm -rf dist node_modules/.vite
npx vite build
echo "Frontend built: $(ls dist/index.html 2>/dev/null && echo 'OK' || echo 'MISSING!')"

echo "=== Step 4: Building API server (copies frontend into dist/public) ==="
cd ../api-server
node build.mjs
# Remove old .mjs file if it exists (PM2 was pointing to wrong file)
rm -f dist/index.mjs
echo "Public dir: $(ls dist/public/index.html 2>/dev/null && echo 'OK' || echo 'MISSING!')"

echo "=== Step 5: Restarting PM2 ==="
cd "$REPO_DIR"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "=== DONE! ==="
echo "Clear your browser cache (Ctrl+Shift+R) and check the game."
