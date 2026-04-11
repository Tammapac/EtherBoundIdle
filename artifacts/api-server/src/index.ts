import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initSocketIO, getIO } from "./lib/socketio.js";
import { initCache } from "./lib/redis.js";
import { runMigrations } from "./lib/migrations.js";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Initialize cache + DB indexes before starting server
await initCache();
await runMigrations().catch((e) => logger.warn({ err: e }, "Migration warning"));

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);
initSocketIO(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening (HTTP + WebSocket)");
});

httpServer.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, "Graceful shutdown initiated");

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info("HTTP server closed");
  });

  // Disconnect all sockets
  const io = getIO();
  if (io) {
    io.disconnectSockets(true);
    logger.info("Socket.IO connections closed");
  }

  // Drain database pool
  try {
    await pool.end();
    logger.info("Database pool drained");
  } catch (e: any) {
    logger.warn({ err: e.message }, "Pool drain error");
  }

  // Force exit after 10s if graceful shutdown stalls
  setTimeout(() => {
    logger.warn("Forced exit after 10s timeout");
    process.exit(1);
  }, 10_000).unref();

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Catch unhandled errors globally
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});
