import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import RoleBadge from "@/components/game/RoleBadge";
import { useAuth } from "@/lib/AuthContext";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

export default function InlineChat({ character, channel = "global", guildId = null }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const pollInterval = useSmartPolling(POLL_INTERVALS.SOCIAL);

  const query = channel === "guild" && guildId
    ? { channel: "guild", guild_id: guildId }
    : { channel: "global" };

  // Shares the same query key as ChatWindow — no duplicate fetches
  const { data: messages = [] } = useQuery({
    queryKey: ["chat", channel, guildId],
    queryFn: () => base44.entities.ChatMessage.filter(query, "-created_date", 50),
    refetchInterval: pollInterval,
    staleTime: POLL_INTERVALS.SOCIAL,
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Polling handles real-time updates via refetchInterval above

  const sorted = [...messages].reverse();

  return (
    <div className="flex flex-col h-[400px] bg-card border border-border rounded-xl overflow-hidden">
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
          onKeyDown={(e) => e.key === "Enter" && message.trim() && sendMutation.mutate(message.trim())}
          placeholder="Type a message..."
          className="text-xs h-8"
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => message.trim() && sendMutation.mutate(message.trim())}
          disabled={!message.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}