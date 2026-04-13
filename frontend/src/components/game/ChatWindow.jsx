import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import RoleBadge from "@/components/game/RoleBadge";
import { useAuth } from "@/lib/AuthContext";

export default function ChatWindow({ character, channel = "global", guildId = null }) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = channel === "guild" && guildId
    ? { channel: "guild", guild_id: guildId }
    : { channel: "global" };

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", channel, guildId],
    queryFn: () => base44.entities.ChatMessage.filter(query, "-created_date", 50),
    refetchInterval: 30000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.ChatMessage.create({
        channel,
        sender_name: character?.name || "Unknown",
        sender_class: character?.class || "warrior",
        sender_level: character?.level || 1,
        sender_role: user?.role || null,
        content,
        ...(guildId ? { guild_id: guildId } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", channel, guildId] });
      setMessage("");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create") {
        queryClient.invalidateQueries({ queryKey: ["chat", channel, guildId] });
      }
    });
    return unsub;
  }, [channel, guildId, queryClient]);

  const handleSend = () => {
    if (!message.trim() || !character) return;
    sendMutation.mutate(message.trim());
  };

  const sorted = [...messages].reverse();

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
    <div className="fixed bottom-4 right-4 z-40 w-80 h-96 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden rpg-frame">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
        <span className="text-sm font-semibold capitalize">{channel} Chat</span>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.map((msg) => {
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
        })}
        {sorted.length === 0 && (
          <p className="text-center text-muted-foreground text-xs mt-8">No messages yet.</p>
        )}
      </div>

      <div className="p-2 border-t border-border flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="text-xs h-8"
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={!message.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}