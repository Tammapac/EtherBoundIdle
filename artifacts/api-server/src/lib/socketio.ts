import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { getSession, getSessionId, SESSION_COOKIE } from "./auth.js";
import { logger } from "./logger.js";
import cookie from "cookie";

let io: SocketIOServer | null = null;

// Map: characterId -> Set<socketId>  (a user can have multiple tabs)
const characterSockets = new Map<string, Set<string>>();
// Map: socketId -> characterId
const socketCharacter = new Map<string, string>();

export async function initSocketIO(httpServer: HttpServer): Promise<SocketIOServer> {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  // Attach Redis adapter for multi-process/multi-server support
  if (process.env.REDIS_URL) {
    try {
      const { createAdapter } = await import("@socket.io/redis-adapter" as any);
      const { default: Redis } = await import("ioredis" as any);
      const pubClient = new Redis(process.env.REDIS_URL);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.IO Redis adapter attached (multi-process ready)");
    } catch (e: any) {
      logger.warn({ err: e.message }, "Socket.IO Redis adapter not available — single-process only");
    }
  }

  // Auth middleware — validate session cookie before allowing connection
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const sid = cookies[SESSION_COOKIE] || socket.handshake.auth?.token;
      if (!sid) {
        return next(new Error("No session"));
      }
      const session = await getSession(sid);
      if (!session?.user?.id) {
        return next(new Error("Invalid session"));
      }
      // Attach user to socket data
      (socket as any).userId = session.user.id;
      (socket as any).user = session.user;
      next();
    } catch (err) {
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId as string;
    logger.info({ socketId: socket.id, userId }, "Socket connected");

    // Client tells us which character they're playing
    socket.on("character:select", (characterId: string) => {
      if (!characterId) return;

      // Clean up old character mapping for this socket
      const oldCharId = socketCharacter.get(socket.id);
      if (oldCharId) {
        socket.leave(`char:${oldCharId}`);
        const sockets = characterSockets.get(oldCharId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            characterSockets.delete(oldCharId);
            // Broadcast offline status when last socket disconnects
            io!.emit("presence:update", { characterId: oldCharId, status: "offline", onlineCount: characterSockets.size });
          }
        }
      }

      // Set up new mapping
      socketCharacter.set(socket.id, characterId);
      const wasOnline = characterSockets.has(characterId);
      if (!characterSockets.has(characterId)) {
        characterSockets.set(characterId, new Set());
      }
      characterSockets.get(characterId)!.add(socket.id);

      // Join character-specific room
      socket.join(`char:${characterId}`);
      // Join user-level room (all characters of this user)
      socket.join(`user:${userId}`);

      // Broadcast online status when first socket connects for this character
      if (!wasOnline) {
        io!.emit("presence:update", { characterId, status: "online", onlineCount: characterSockets.size });
      }

      // Send current online count to the newly connected socket
      socket.emit("presence:online_count", { onlineCount: characterSockets.size });

      logger.info({ socketId: socket.id, characterId }, "Character selected on socket");
    });

    // Join guild room for real-time guild events
    socket.on("guild:join", (guildId: string) => {
      if (!guildId) return;
      socket.join(`guild:${guildId}`);
    });

    socket.on("guild:leave", (guildId: string) => {
      if (!guildId) return;
      socket.leave(`guild:${guildId}`);
    });

    socket.on("disconnect", (reason) => {
      const charId = socketCharacter.get(socket.id);
      if (charId) {
        const sockets = characterSockets.get(charId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            characterSockets.delete(charId);
            // Broadcast offline when last socket for this character disconnects
            io!.emit("presence:update", { characterId: charId, status: "offline", onlineCount: characterSockets.size });
          }
        }
        socketCharacter.delete(socket.id);
      }
      logger.info({ socketId: socket.id, userId, reason }, "Socket disconnected");
    });
  });

  logger.info("Socket.IO initialized");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// ── Emit helpers ────────────────────────────────────────────────────────────

/** Send event to all sockets for a specific character */
export function emitToCharacter(characterId: string, event: string, data: any) {
  if (!io) return;
  io.to(`char:${characterId}`).emit(event, data);
}

/** Send event to all sockets of a user (all their characters) */
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/** Send event to all members of a guild */
export function emitToGuild(guildId: string, event: string, data: any) {
  if (!io) return;
  io.to(`guild:${guildId}`).emit(event, data);
}

/** Broadcast to everyone */
export function emitToAll(event: string, data: any) {
  if (!io) return;
  io.emit(event, data);
}

/** Check how many sockets are connected for a character */
export function getCharacterSocketCount(characterId: string): number {
  return characterSockets.get(characterId)?.size || 0;
}

/** Get all connected character IDs */
export function getOnlineCharacterIds(): string[] {
  return Array.from(characterSockets.keys());
}
