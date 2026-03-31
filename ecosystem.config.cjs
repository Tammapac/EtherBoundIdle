module.exports = {
  apps: [{
    name: "etherbound",
    script: "./artifacts/api-server/dist/index.js",
    cwd: "/root/EtherBoundIdle",
    node_args: "--dns-result-order=ipv4first",
    env: {
      PORT: 3000,
      DATABASE_URL: "postgresql://postgres:ZitroneMelone123.@db.pdzevkhfpqldvjiyrrxk.supabase.co:5432/postgres",
      NODE_ENV: "production"
    }
  }]
}
