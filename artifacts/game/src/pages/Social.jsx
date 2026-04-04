import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Mail, ArrowLeftRight, Bell, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FriendPanel from "@/components/social/FriendPanel";
import MessagesPanel from "@/components/social/MessagesPanel";
import MailPanel from "@/components/social/MailPanel";
import TradePanel from "@/components/social/TradePanel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

// Error boundary to prevent black screen on component crashes
class SocialErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto" />
          <p className="text-sm text-muted-foreground">Something went wrong in the Social panel.</p>
          <Button size="sm" onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Social({ character, onCharacterUpdate }) {
  const [activeTab, setActiveTab] = useState("friends");
  const qc = useQueryClient();
  const bgPollInterval = useSmartPolling(POLL_INTERVALS.BACKGROUND);
  const socialPollInterval = useSmartPolling(POLL_INTERVALS.SOCIAL);

  const [tradeTarget, setTradeTarget] = useState(null);

  // Listen for trade button clicks from FriendPanel
  useEffect(() => {
    const handler = (e) => {
      setTradeTarget(e.detail || null);
      setActiveTab("trade");
    };
    window.addEventListener("eb-trade", handler);
    return () => window.removeEventListener("eb-trade", handler);
  }, []);

  // Friend request badge updates via polling (refetchInterval on query below)

  // Upsert presence on mount
  useEffect(() => {
    if (!character) return;
    const upsertPresence = async () => {
      const existing = await base44.entities.Presence.filter({ character_id: character.id });
      const data = {
        character_id: character.id,
        character_name: character.name,
        character_class: character.class,
        character_level: character.level,
        status: "online",
        current_zone: character.current_region,
        last_seen: new Date().toISOString(),
      };
      if (existing.length > 0) {
        await base44.entities.Presence.update(existing[0].id, data);
      } else {
        await base44.entities.Presence.create(data);
      }
    };
    upsertPresence();

    // Mark offline on unmount
    return () => {
      base44.entities.Presence.filter({ character_id: character.id }).then(res => {
        if (res[0]) base44.entities.Presence.update(res[0].id, { status: "offline", last_seen: new Date().toISOString() });
      });
    };
  }, [character?.id]);

  // Unread mail count
  const { data: unreadMail = [] } = useQuery({
    queryKey: ["mail_unread", character?.id],
    queryFn: () => base44.entities.Mail.filter({ to_character_id: character?.id, is_read: false }),
    enabled: !!character?.id,
    refetchInterval: bgPollInterval,
    staleTime: POLL_INTERVALS.BACKGROUND,
  });

  // Pending trade count
  const { data: pendingTrades = [] } = useQuery({
    queryKey: ["trades_pending", character?.id],
    queryFn: () => base44.entities.TradeSession.filter({ receiver_id: character?.id, status: "pending" }),
    enabled: !!character?.id,
    refetchInterval: socialPollInterval,
    staleTime: POLL_INTERVALS.SOCIAL,
  });

  // Friend requests count — reuses same query key as FriendPanel, no duplicate fetch
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["friend_requests_in", character?.id],
    queryFn: () => base44.entities.FriendRequest.filter({ to_character_id: character?.id, status: "pending" }),
    enabled: !!character?.id,
    refetchInterval: socialPollInterval,
    staleTime: POLL_INTERVALS.SOCIAL,
  });

  if (!character) return null;

  return (
    <SocialErrorBoundary>
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> Social
      </h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted grid grid-cols-4 w-full">
          <TabsTrigger value="friends" className="relative flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" /> Friends
            {pendingRequests.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] px-1 text-[10px] bg-destructive text-white">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="relative flex items-center gap-1.5 text-xs">
            <Bell className="w-3.5 h-3.5" /> Messages
          </TabsTrigger>
          <TabsTrigger value="mail" className="relative flex items-center gap-1.5 text-xs">
            <Mail className="w-3.5 h-3.5" /> Mail
            {unreadMail.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] px-1 text-[10px] bg-primary text-primary-foreground">
                {unreadMail.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trade" className="relative flex items-center gap-1.5 text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Trade
            {pendingTrades.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] px-1 text-[10px] bg-accent text-accent-foreground">
                {pendingTrades.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <FriendPanel character={character} onWhisper={(name) => {
            // Dispatch event for ChatWindow to open whisper tab with pre-filled /w command
            window.dispatchEvent(new CustomEvent("eb-whisper", { detail: { name } }));
          }} />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesPanel character={character} />
        </TabsContent>
        <TabsContent value="mail">
          <MailPanel character={character} onCharacterUpdate={onCharacterUpdate} />
        </TabsContent>
        <TabsContent value="trade">
          <TradePanel character={character} onCharacterUpdate={onCharacterUpdate} tradeTarget={tradeTarget} onTradeTargetConsumed={() => setTradeTarget(null)} />
        </TabsContent>
      </Tabs>
    </div>
    </SocialErrorBoundary>
  );
}