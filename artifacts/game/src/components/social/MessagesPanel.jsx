import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import { format } from "date-fns";

function getConversationId(idA, idB) {
  return [idA, idB].sort().join("_");
}

export default function MessagesPanel({ character }) {
  const [activeConv, setActiveConv] = useState(null); // { id, name, class, level }
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const qc = useQueryClient();

  // Get all messages involving this character
  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages_all", character.id],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.PrivateMessage.filter({ from_character_id: character.id }),
        base44.entities.PrivateMessage.filter({ to_character_id: character.id }),
      ]);
      return [...sent, ...received];
    },
    refetchInterval: 5000,
  });

  // Build conversation list
  const conversations = useMemo(() => {
    const convMap = {};
    for (const msg of allMessages) {
      const otherId = msg.from_character_id === character.id ? msg.to_character_id : msg.from_character_id;
      const otherName = msg.from_character_id === character.id ? msg.to_character_id : msg.from_name;
      const convId = getConversationId(character.id, otherId);
      if (!convMap[convId]) {
        convMap[convId] = {
          convId,
          otherId,
          otherName: msg.from_character_id === character.id ? (msg.to_name || otherId) : msg.from_name,
          otherClass: msg.from_character_id === character.id ? msg.to_class : msg.from_class,
          otherLevel: msg.from_character_id === character.id ? msg.to_level : msg.from_level,
          lastMessage: msg,
          unread: 0,
        };
      }
      if (new Date(msg.created_date) > new Date(convMap[convId].lastMessage.created_date)) {
        convMap[convId].lastMessage = msg;
      }
      if (!msg.is_read && msg.to_character_id === character.id) {
        convMap[convId].unread++;
      }
    }
    return Object.values(convMap).sort((a, b) =>
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [allMessages, character.id]);

  // Get messages for active conversation
  const convMessages = activeConv
    ? allMessages
        .filter(m => m.conversation_id === getConversationId(character.id, activeConv.otherId))
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!activeConv) return;
    const unread = convMessages.filter(m => m.to_character_id === character.id && !m.is_read);
    if (unread.length > 0) {
      Promise.all(unread.map(m => base44.entities.PrivateMessage.update(m.id, { is_read: true }))).then(() => {
        qc.invalidateQueries({ queryKey: ["messages_all", character.id] });
      });
    }
  }, [activeConv?.otherId, convMessages.length]);

  // Polling handles real-time updates via refetchInterval above

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [convMessages.length]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !activeConv) return;
      const convId = getConversationId(character.id, activeConv.otherId);
      await base44.entities.PrivateMessage.create({
        from_character_id: character.id,
        from_name: character.name,
        from_class: character.class,
        from_level: character.level,
        to_character_id: activeConv.otherId,
        to_name: activeConv.otherName,
        to_class: activeConv.otherClass,
        to_level: activeConv.otherLevel,
        content: message.trim(),
        conversation_id: convId,
        is_read: false,
      });
      setMessage("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages_all", character.id] }),
  });

  if (activeConv) {
    const cls = CLASSES[activeConv.otherClass];
    return (
      <div className="mt-4 flex flex-col h-[500px] bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/50">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveConv(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <span className={`text-sm font-bold ${cls?.color}`}>{activeConv.otherName[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">{activeConv.otherName}</p>
            <p className="text-xs text-muted-foreground">Lv.{activeConv.otherLevel} {cls?.name}</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {convMessages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Start the conversation!</p>
          )}
          {convMessages.map(msg => {
            const isMe = msg.from_character_id === character.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_date), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex gap-2">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMutation.mutate()}
            placeholder="Type a message..."
            className="h-9 text-sm"
          />
          <Button size="icon" className="h-9 w-9" onClick={() => sendMutation.mutate()} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {conversations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No messages yet.</p>
          <p className="text-xs mt-1">Start a conversation from your friend list.</p>
        </div>
      )}
      {conversations.map(conv => {
        const cls = CLASSES[conv.otherClass];
        return (
          <button
            key={conv.convId}
            onClick={() => setActiveConv(conv)}
            className="w-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="relative w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <span className={`text-base font-bold ${cls?.color}`}>{conv.otherName[0]}</span>
              {conv.unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 text-[10px] rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{conv.otherName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(conv.lastMessage.created_date), "MMM d, HH:mm")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {conv.lastMessage.from_character_id === character.id ? "You: " : ""}{conv.lastMessage.content}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}