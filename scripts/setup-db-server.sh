#!/bin/bash
# =============================================================================
# EtherBound Idle — Remote Database + Redis Server Setup
# =============================================================================
# Run this script on the NEW VPS (the database/redis server).
# It installs PostgreSQL 16, Redis, and configures remote access.
#
# Usage:
#   1. SSH into your new VPS
#   2. Run: bash setup-db-server.sh
#   3. It will output the connection strings to use in ecosystem.config.cjs
# =============================================================================

set -e

DB_NAME="etherbound"
DB_USER="etherbound"
DB_PASS=$(openssl rand -hex 16)
REDIS_PASS=$(openssl rand -hex 16)

echo "============================================"
echo "  EtherBound DB + Redis Server Setup"
echo "============================================"
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"
echo ""

# ── Install PostgreSQL 16 ──────────────────────────────────────────────────
echo "=== Installing PostgreSQL 16 ==="
apt-get update -qq
apt-get install -y -qq postgresql postgresql-contrib > /dev/null

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# Allow remote connections
PG_VERSION=$(pg_config --version | grep -oP '\d+' | head -1)
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Listen on all interfaces
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"

# Allow password auth from any IP (the game server)
if ! grep -q "host.*$DB_NAME.*$DB_USER.*0.0.0.0/0" "$PG_HBA"; then
  echo "host    $DB_NAME    $DB_USER    0.0.0.0/0    scram-sha-256" >> "$PG_HBA"
fi

# Performance tuning for game workload
cat >> "$PG_CONF" << 'PGCONF'

# === EtherBound Performance Tuning ===
shared_buffers = '1GB'
effective_cache_size = '3GB'
work_mem = '16MB'
maintenance_work_mem = '256MB'
max_connections = 200
max_worker_processes = 4
max_parallel_workers_per_gather = 2
wal_buffers = '16MB'
random_page_cost = 1.1
effective_io_concurrency = 200
PGCONF

systemctl restart postgresql
echo "PostgreSQL installed and configured."

# ── Install Redis ──────────────────────────────────────────────────────────
echo ""
echo "=== Installing Redis ==="
apt-get install -y -qq redis-server > /dev/null

# Configure Redis
REDIS_CONF="/etc/redis/redis.conf"

# Listen on all interfaces
sed -i "s/^bind 127.0.0.1/bind 0.0.0.0/" "$REDIS_CONF"
sed -i "s/^# bind 0.0.0.0/bind 0.0.0.0/" "$REDIS_CONF"

# Set password
sed -i "s/^# requirepass .*/requirepass $REDIS_PASS/" "$REDIS_CONF"
sed -i "s/^requirepass .*/requirepass $REDIS_PASS/" "$REDIS_CONF"

# Memory limit (use 512MB max, evict least recently used)
sed -i "s/^# maxmemory .*/maxmemory 512mb/" "$REDIS_CONF"
sed -i "s/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/" "$REDIS_CONF"

systemctl enable redis-server
systemctl restart redis-server
echo "Redis installed and configured."

# ── Firewall (if ufw is active) ───────────────────────────────────────────
if command -v ufw &> /dev/null && ufw status | grep -q "active"; then
  echo ""
  echo "=== Configuring firewall ==="
  ufw allow 5432/tcp comment "PostgreSQL"
  ufw allow 6379/tcp comment "Redis"
  echo "Firewall rules added for PostgreSQL (5432) and Redis (6379)."
fi

# ── Output connection strings ──────────────────────────────────────────────
echo ""
echo "============================================"
echo "  SETUP COMPLETE!"
echo "============================================"
echo ""
echo "Add these to your game server's environment:"
echo ""
echo "  DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$SERVER_IP:5432/$DB_NAME"
echo "  REDIS_URL=redis://:$REDIS_PASS@$SERVER_IP:6379"
echo ""
echo "Or update ecosystem.config.cjs on your game server with:"
echo ""
echo "  DATABASE_URL: \"postgresql://$DB_USER:$DB_PASS@$SERVER_IP:5432/$DB_NAME\","
echo "  REDIS_URL: \"redis://:$REDIS_PASS@$SERVER_IP:6379\","
echo ""
echo "Then run deploy.sh on the game server to apply changes."
echo ""
echo "=== Credentials (SAVE THESE) ==="
echo "  DB User:     $DB_USER"
echo "  DB Password: $DB_PASS"
echo "  DB Name:     $DB_NAME"
echo "  Redis Pass:  $REDIS_PASS"
echo "  Server IP:   $SERVER_IP"
echo "============================================"
