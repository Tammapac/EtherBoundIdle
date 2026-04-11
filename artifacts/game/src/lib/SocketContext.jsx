import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io as ioClient } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const SocketContext = createContext(null);

export function SocketProvider({ children, character, onCharacterUpdate }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Connect when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = ioClient(window.location.origin, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      setConnected(true);
      console.log("[WS] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[WS] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
    });

    // ── Real-time event handlers ──────────────────────────────────

    // Character stat updates (gold, exp, gems, hp, mp, etc.)
    socket.on("character:update", (data) => {
      if (onCharacterUpdate && data) {
        onCharacterUpdate(data);
      }
    });

    // Inventory changed — invalidate inventory queries
    socket.on("inventory:update", () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    });

    // Quest progress updated
    socket.on("quest:update", () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    });

    // Season pass / mission progress
    socket.on("season:update", () => {
      queryClient.invalidateQueries({ queryKey: ["season-pass"] });
      queryClient.invalidateQueries({ queryKey: ["season-missions"] });
    });

    // Guild boss damage feed
    socket.on("guild:boss-hit", (data) => {
      // data: { attackerName, damage, bossHpLeft, bossHpMax }
      // Dispatched as custom event so GuildBoss component can listen
      window.dispatchEvent(new CustomEvent("guild-boss-hit", { detail: data }));
    });

    socket.on("guild:boss-defeated", (data) => {
      queryClient.invalidateQueries({ queryKey: ["guild"] });
      window.dispatchEvent(new CustomEvent("guild-boss-defeated", { detail: data }));
    });

    // Combat events
    socket.on("combat:update", (data) => {
      window.dispatchEvent(new CustomEvent("combat-update", { detail: data }));
    });

    // Loot dropped
    socket.on("loot:drop", (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      window.dispatchEvent(new CustomEvent("loot-drop", { detail: data }));
    });

    // World boss events
    socket.on("worldboss:update", () => {
      queryClient.invalidateQueries({ queryKey: ["world-boss"] });
    });

    // Chat message (real-time push — invalidate all chat/whisper queries)
    socket.on("chat:message", (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["whispers"] });
      window.dispatchEvent(new CustomEvent("chat-message", { detail: data }));
    });

    // Party updates (real-time push — instant invite/join/leave/disband notifications)
    socket.on("party:update", (data) => {
      queryClient.invalidateQueries({ queryKey: ["party"] });
      queryClient.invalidateQueries({ queryKey: ["partyInvites"] });
      queryClient.invalidateQueries({ queryKey: ["party-invites"] });
      window.dispatchEvent(new CustomEvent("party-update", { detail: data }));
    });

    // Party combat: shared enemy spawned by leader (instant push to non-leaders)
    socket.on("party:enemy_spawn", (data) => {
      window.dispatchEvent(new CustomEvent("party-enemy-spawn", { detail: data }));
    });

    // Party combat: HP sync + turn-based attack target after damage report
    socket.on("party:enemy_hp", (data) => {
      window.dispatchEvent(new CustomEvent("party-enemy-hp", { detail: data }));
    });

    // Resources (life skills)
    socket.on("resources:update", () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    });

    // Presence updates (online/offline status of other players)
    socket.on("presence:update", (data) => {
      window.dispatchEvent(new CustomEvent("presence-update", { detail: data }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated]);

  // Select character on socket when character changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected || !character?.id) return;
    socket.emit("character:select", String(character.id));
  }, [connected, character?.id]);

  // Keep onCharacterUpdate reference fresh
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (data) => {
      if (onCharacterUpdate && data) {
        onCharacterUpdate(data);
      }
    };

    // Replace the handler
    socket.off("character:update");
    socket.on("character:update", handler);
  }, [onCharacterUpdate]);

  const joinGuild = useCallback((guildId) => {
    socketRef.current?.emit("guild:join", String(guildId));
  }, []);

  const leaveGuild = useCallback((guildId) => {
    socketRef.current?.emit("guild:leave", String(guildId));
  }, []);

  const value = {
    socket: socketRef.current,
    connected,
    joinGuild,
    leaveGuild,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || { socket: null, connected: false, joinGuild: () => {}, leaveGuild: () => {} };
}
