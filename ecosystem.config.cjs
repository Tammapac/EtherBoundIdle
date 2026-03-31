module.exports = {
  apps: [{
    name: "etherbound",
    script: "./artifacts/api-server/dist/index.js",
    cwd: "/root/EtherBoundIdle",
    node_args: "--dns-result-order=ipv4first",
    env: {
      PORT: 3000,
      DATABASE_URL: "postgresql://postgres.pdzevkhfpqldvjiyrrxk:ZitroneMelone123.@aws-1-eu-west-3.pooler.supabase.com:6543/postgres",
      NODE_ENV: "production"
    }
  }]
}
