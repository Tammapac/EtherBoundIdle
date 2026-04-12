module.exports = {
  apps: [{
    name: "etherbound",
    script: "./artifacts/api-server/dist/index.js",
    cwd: "/root/EtherBoundIdle",
    node_args: "--dns-result-order=ipv4first",

    // Cluster mode: uses all available CPU cores
    // Set to 1 for single-process mode (no Redis needed)
    // Set to "max" to use all CPU cores (requires REDIS_URL)
    instances: process.env.REDIS_URL ? (process.env.PM2_INSTANCES || "max") : 1,
    exec_mode: process.env.REDIS_URL ? "cluster" : "fork",

    // Graceful restart
    kill_timeout: 10000,
    listen_timeout: 10000,
    wait_ready: false,

    // Auto-restart on crash
    max_restarts: 10,
    restart_delay: 1000,

    // Memory limit (restart if exceeded)
    max_memory_restart: process.env.PM2_MAX_MEMORY || "512M",

    env: {
      PORT: process.env.PORT || 3000,
      NODE_ENV: "production",

      // Database — update this to your PostgreSQL server
      // Local:  postgresql://postgres:password@localhost:5432/etherbound
      // Remote: postgresql://postgres:password@DB_SERVER_IP:5432/etherbound
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres.pdzevkhfpqldvjiyrrxk:ZitroneMelone123.@aws-1-eu-west-3.pooler.supabase.com:6543/postgres",

      // DB pool size per worker (lower when running multiple instances)
      DB_POOL_MAX: process.env.DB_POOL_MAX || "10",

      // Redis — enables cluster mode, shared cache, Socket.IO adapter
      // Format: redis://[:password@]host:port[/db]
      // Leave empty to run single-process with in-memory cache
      REDIS_URL: process.env.REDIS_URL || "",

      // Rate limits (increase for load testing)
      API_RATE_LIMIT: process.env.API_RATE_LIMIT || "300",
      AUTH_RATE_LIMIT: process.env.AUTH_RATE_LIMIT || "60",
      FIGHT_RATE_LIMIT: process.env.FIGHT_RATE_LIMIT || "10",
    }
  }]
}
