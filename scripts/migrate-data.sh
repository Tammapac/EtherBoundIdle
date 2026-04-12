#!/bin/bash
# =============================================================================
# EtherBound Idle — Migrate Data from Supabase to New PostgreSQL Server
# =============================================================================
# Run this from the GAME SERVER (where the app runs).
# It dumps data from Supabase and imports it into the new database.
#
# Usage:
#   bash scripts/migrate-data.sh <OLD_DATABASE_URL> <NEW_DATABASE_URL>
#
# Example:
#   bash scripts/migrate-data.sh \
#     "postgresql://postgres.xxx:pass@supabase.com:6543/postgres" \
#     "postgresql://etherbound:pass@NEW_VPS_IP:5432/etherbound"
# =============================================================================

set -e

OLD_URL="${1:?Usage: migrate-data.sh <OLD_DATABASE_URL> <NEW_DATABASE_URL>}"
NEW_URL="${2:?Usage: migrate-data.sh <OLD_DATABASE_URL> <NEW_DATABASE_URL>}"
DUMP_FILE="/tmp/etherbound_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "============================================"
echo "  EtherBound Data Migration"
echo "============================================"
echo "  From: ${OLD_URL%%@*}@..."
echo "  To:   ${NEW_URL%%@*}@..."
echo "  Dump: $DUMP_FILE"
echo "============================================"
echo ""

# Step 1: Dump from old database
echo "=== Step 1: Dumping data from old database ==="
pg_dump "$OLD_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  > "$DUMP_FILE"
echo "Dump complete: $(du -h $DUMP_FILE | cut -f1)"

# Step 2: Import into new database
echo ""
echo "=== Step 2: Importing into new database ==="
psql "$NEW_URL" < "$DUMP_FILE"
echo "Import complete!"

# Step 3: Verify
echo ""
echo "=== Step 3: Verifying ==="
TABLE_COUNT=$(psql "$NEW_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Tables in new database: $TABLE_COUNT"

CHAR_COUNT=$(psql "$NEW_URL" -t -c "SELECT COUNT(*) FROM characters;" 2>/dev/null || echo "0")
echo "Characters migrated: $CHAR_COUNT"

USER_COUNT=$(psql "$NEW_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
echo "Users migrated: $USER_COUNT"

echo ""
echo "============================================"
echo "  Migration complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Update DATABASE_URL in ecosystem.config.cjs to point to new database"
echo "  2. Run: bash deploy.sh"
echo "  3. Test the game"
echo ""
echo "Dump file kept at: $DUMP_FILE (delete when confirmed working)"
echo "============================================"
