import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import RoleBadge from "@/components/game/RoleBadge";
import { useAuth } from "@/lib/AuthContext";

function getConversationId(idA, idB) {
  return [idA, idB].sort().join("_");
}

const TABS = [
  { key: "global", label: "Global" },
  { key: "guild", label: "Guild" },
  { key: "whisper", label: "Whisper" },
];

export default function ChatWindow({ character, channel = "global", guildId = null }) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(channel);
  const [whisperError, setWhisperError] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --- Chat Messages query (global / guild) ---
  const chatQuery = activeTab === "guild" && guildId
    ? { channel: "guild", guild_id: guildId }
    : { channel: "global" };

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["chat", activeTab === "whisper" ? "global" : activeTab, guildId],
    queryFn: () => base44.entities.ChatMessage.filter(
      activeTab === "guild" && guildId ? chatQuery : { channel: "global" },
      "-created_date",
      50
    ),
    refetchInterval: 3000,
    enabled: activeTab !== "whisper",
  });

  // --- Private Messages query (whisper tab) ---
  const { data: whisperMessages = [] } = useQuery({
    queryKey: ["whispers", character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const [sent, received] = await Promise.all([
        base44.entities.PrivateMessage.filter({ from_character_id: character.id }),
        base44.entities.PrivateMessage.filter({ to_character_id: character.id }),
      ]);
      return [...sent, ...received].sort(
        (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
      );
    },
    refetchInterval: 5000,
    enabled: !!character?.id,
  });

  // --- Send chat message mutation ---
  const sendChatMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.ChatMessage.create({
        channel: activeTab === "whisper" ? "global" : activeTab,
        sender_name: character?.name || "Unknown",
        sender_class: character?.class || "warrior",
        sender_level: character?.level || 1,
        sender_role: user?.role || null,
        content,
        ...(guildId && activeTab === "guild" ? { guild_id: guildId } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", activeTab, guildId] });
      setMessage("");
    },
    onError: (err) => {
      // Server returns 403 with mute/ban message
      setWhisperError(err?.message || "Failed to send message");
    },
  });

  // --- Send whisper mutation ---
  const sendWhisperMutation = useMutation({
    mutationFn: async ({ recipientName, content }) => {
      // Look up recipient by name (cross-player search)
      const chars = await base44.functions.invoke("lookupPlayerByName", { name: recipientName });
      if (!chars || chars.length === 0) {
        throw new Error(`Player "${recipientName}" not found.`);
      }
      const recipient = chars[0];
      if (recipient.id === character.id) {
        throw new Error("You cannot whisper to yourself.");
      }
      const convId = getConversationId(character.id, recipient.id);
      await base44.entities.PrivateMessage.create({
        from_character_id: character.id,
        from_name: character.name,
        from_class: character.class || "warrior",
        from_level: character.level || 1,
        to_character_id: recipient.id,
        to_name: recipient.name,
        to_class: recipient.class || "warrior",
        to_level: recipient.level || 1,
        content,
        conversation_id: convId,
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whispers", character?.id] });
      setMessage("");
      setWhisperError("");
    },
    onError: (err) => {
      setWhisperError(err.message || "Failed to send whisper.");
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, whisperMessages, activeTab]);

  // Polling handles real-time updates via refetchInterval above

  // Clear whisper error when switching tabs or typing
  useEffect(() => {
    setWhisperError("");
  }, [activeTab]);

  const inputRef = useRef(null);

  // Listen for whisper events from FriendPanel
  useEffect(() => {
    const handler = (e) => {
      const name = e.detail?.name;
      if (name) {
        setIsOpen(true);
        setActiveTab("whisper");
        const hasSpace = name.includes(" ");
        setMessage(hasSpace ? `/w "${name}" ` : `/w ${name} `);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener("eb-whisper", handler);
    return () => window.removeEventListener("eb-whisper", handler);
  }, []);

  // --- Handle send ---
  const handleSend = () => {
    if (!message.trim() || !character) return;

    // Mute/ban is enforced server-side on ChatMessage creation (entities.ts)
    // No client-side block here — server returns 403 if muted/banned

    const trimmed = message.trim();

    // Check for /w command from any tab
    // Supports: /w "Player Name" message  OR  /w PlayerName message
    const whisperQuoted = trimmed.match(/^\/w\s+"([^"]+)"\s+(.+)$/i);
    const whisperSimple = trimmed.match(/^\/w\s+(\S+)\s+(.+)$/i);
    const whisperMatch = whisperQuoted || whisperSimple;
    if (whisperMatch) {
      const recipientName = whisperMatch[1];
      const content = whisperMatch[2];
      sendWhisperMutation.mutate({ recipientName, content });
      return;
    }

    // If on whisper tab without /w syntax, show hint
    if (activeTab === "whisper") {
      setWhisperError('Use /w PlayerName message  or  /w "Player Name" message');
      return;
    }

    // Normal chat send
    sendChatMutation.mutate(trimmed);
  };

  // --- Render messages for current tab ---
  const renderMessages = () => {
    if (activeTab === "whisper") {
      // Show last 50 whisper messages
      const recent = whisperMessages.slice(-50);
      if (recent.length === 0) {
        return (
          <p className="text-center text-muted-foreground text-xs mt-8">
            No whispers yet. Use <span className="font-mono text-purple-400">/w PlayerName message</span> to send one.
          </p>
        );
      }
      return recent.map((msg) => {
        const isSent = msg.from_character_id === character?.id;
        const otherName = isSent ? msg.to_name : msg.from_name;
        const direction = isSent ? "To" : "From";
        return (
          <div key={msg.id} className="text-xs italic" style={{ color: "#c084fc" }}>
            <span className="font-semibold" style={{ color: "#a855f7" }}>
              [{direction} {otherName}]
            </span>
            <span style={{ color: "#d8b4fe" }}> {msg.content}</span>
          </div>
        );
      });
    }

    // Global or guild chat
    const sorted = [...chatMessages].reverse();
    if (sorted.length === 0) {
      return (
        <p className="text-center text-muted-foreground text-xs mt-8">No messages yet.</p>
      );
    }
    return sorted.map((msg) => {
      const cls = CLASSES[msg.sender_class];
      return (
        <div key={msg.id} className="text-xs">
          <span className={`font-semibold ${cls?.color || "text-foreground"}`}>
            [{msg.sender_level}] {msg.sender_name}
          </span>
          {msg.sender_role && <RoleBadge role={msg.sender_role} size="xs" />}
          <span className="text-foreground/70">: </span>
          <span className="text-foreground/80">{msg.content}</span>
        </div>
      );
    });
  };

  // --- Collapsed state ---
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground p-3 rounded-full shadow-lg glow-cyan hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 h-96 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            // Hide guild tab if no guildId
            if (tab.key === "guild" && !guildId) return null;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isActive
                    ? tab.key === "whisper"
                      ? "bg-purple-600/30 text-purple-300 font-semibold"
                      : "bg-primary/20 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
          {"\u2715"}
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {renderMessages()}
      </div>

      {/* Whisper error / hint */}
      {whisperError && (
        <div className="px-3 py-1 text-xs text-red-400 bg-red-900/20 border-t border-red-900/30">
          {whisperError}
        </div>
      )}

      {/* Input area */}
      <div className="p-2 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (whisperError) setWhisperError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                activeTab === "whisper"
                  ? "/w PlayerName message"
                  : "Type a message..."
              }
              className="text-xs h-8"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSend}
              disabled={!message.trim() || sendWhisperMutation.isPending || sendChatMutation.isPending}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
      </div>
    </div>
  );
}
