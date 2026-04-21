import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScrollText, CheckCircle, Coins, Star, Gem, Clock, Calendar, Sparkles
} from "lucide-react";

function DailyTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <span className="text-xs text-muted-foreground ml-1">{timeLeft}</span>;
}

export default function Quests({ character, onCharacterUpdate }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("daily");
  const pollInterval = useSmartPolling(POLL_INTERVALS.GAME_STATE);

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ["quests", character?.id],
    queryFn: () => base44.entities.Quest.filter({ character_id: character?.id }),
    refetchInterval: pollInterval,
    staleTime: POLL_INTERVALS.GAME_STATE,
    enabled: !!character?.id,
  });

  // Initialize or reset daily quests on mount
  useEffect(() => {
    if (!character?.id) return;
    base44.functions.invoke('manageDailyQuests', { characterId: character.id })
      .then(() => queryClient.invalidateQueries({ queryKey: ["quests", character.id] }))
      .catch(() => {});
  }, [character?.id]);

  // Polling handles real-time updates via refetchInterval above

  const claimMutation = useMutation({
    mutationFn: async (quest) => {
      await base44.entities.Quest.update(quest.id, { status: "claimed" });
      const rewards = quest.reward || {};
      const updates = {};
      if (rewards.exp) updates.exp = (character.exp || 0) + rewards.exp;
      if (rewards.gold) updates.gold = (character.gold || 0) + rewards.gold;
      if (rewards.gems) updates.gems = (character.gems || 0) + rewards.gems;
      if (Object.keys(updates).length > 0) {
        await base44.entities.Character.update(character.id, updates);
        onCharacterUpdate({ ...character, ...updates });
      }
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });

  const sortByCompleted = (a, b) => (b.status === "completed" ? 1 : 0) - (a.status === "completed" ? 1 : 0);
  const dailyQuests = quests.filter(q => q.type === "daily" && (q.status === "active" || q.status === "completed")).sort(sortByCompleted);
  const weeklyQuests = quests.filter(q => q.type === "weekly" && (q.status === "active" || q.status === "completed")).sort(sortByCompleted);
  const storyQuests = quests.filter(q => q.type === "story" && (q.status === "active" || q.status === "completed")).sort(sortByCompleted);

  const QuestCard = ({ quest, idx }) => {
    const targetCount = quest.target || 1;
    const currentCount = quest.progress || 0;
    const rewards = quest.reward || {};
    const pct = targetCount > 0 ? Math.min(100, (currentCount / targetCount) * 100) : 0;
    const isComplete = quest.status === "completed" || currentCount >= targetCount;

    const getObjectiveIcon = () => {
      switch (quest.type) {
        case 'mining': return '⛏️';
        case 'fishing': return '🎣';
        case 'herbalism': return '🌿';
        case 'combat_kills': return '⚔️';
        case 'combat_damage': return '💥';
        default: return '📌';
      }
    };

    return (
      <motion.div
        key={quest.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="relative p-4 overflow-visible"
        style={{
          background: "#0d0d1a",
          border: `2px solid ${isComplete ? "#1dffa050" : "#2a1f5c"}`,
          boxShadow: isComplete ? "0 0 12px rgba(29,255,160,0.08)" : "2px 2px 0 #1a1040",
        }}
      >
        {/* Corner accent dots */}
        <span className="absolute -top-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -top-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -bottom-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -bottom-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{getObjectiveIcon()}</span>
              <h3
                className="leading-snug"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "9px", color: isComplete ? "#1dffa0" : "#d0d0ff" }}
              >{quest.title}</h3>
              {quest.type === "daily" && (
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #2a1f5c", background: "#0a0a1e", padding: "2px 5px", color: "#6b6a9a" }}
                >
                  <Clock className="w-2.5 h-2.5" /> Infinite
                </span>
              )}
              {quest.expires_at && (
                <DailyTimer expiresAt={quest.expires_at} />
              )}
              {quest.type === "weekly" && (
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #2a1f5c", background: "#0a0a1e", padding: "2px 5px", color: "#6b6a9a" }}
                >
                  <Calendar className="w-2.5 h-2.5" /> Weekly
                </span>
              )}
            </div>
            {quest.description && (
              <p className="text-xs text-muted-foreground mt-1.5">{quest.description}</p>
            )}
            <div className="mt-3">
              <div className="flex justify-between mb-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px" }}>
                <span style={{ color: "#6b6a9a" }}>PROGRESS</span>
                <span style={{ color: "#d0d0ff" }}>{currentCount}/{targetCount}</span>
              </div>
              <div style={{ height: 10, border: "1px solid #2a1f5c", background: "#050510", position: "relative" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#1dffa0", boxShadow: "0 0 6px #1dffa060", transition: "width 0.4s ease" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {rewards.exp && (
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #7c3aed60", background: "#120820", padding: "3px 6px", color: "#c084fc" }}
                >
                  <Star className="w-2.5 h-2.5" /> {rewards.exp} EXP
                </span>
              )}
              {rewards.gold && (
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #e6a80060", background: "#130e00", padding: "3px 6px", color: "#e6a800" }}
                >
                  <Coins className="w-2.5 h-2.5" /> {rewards.gold} Gold
                </span>
              )}
              {rewards.gems && (
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #22d3ee60", background: "#001618", padding: "3px 6px", color: "#22d3ee" }}
                >
                  <Gem className="w-2.5 h-2.5" /> {rewards.gems} Gems
                </span>
              )}
            </div>
          </div>
          {isComplete && quest.status !== "claimed" && (
            <PixelButton
              variant="ok"
              label="CLAIM"
              onClick={() => claimMutation.mutate({ ...quest, reward: rewards })}
              disabled={claimMutation.isPending}
            />
          )}
          {quest.status === "claimed" && (
            <span
              className="flex items-center gap-1 shrink-0"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #1dffa050", background: "#001a0d", padding: "3px 7px", color: "#1dffa0" }}
            >
              ✓ Claimed
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  const EmptyState = ({ type, icon: Icon }) => (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
      <p>No {type} quests available.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" /> Quests
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid w-full grid-cols-3 rounded-none p-0 h-auto"
          style={{ background: "#07071a", border: "2px solid #2a1f5c", gap: 0 }}
        >
          <TabsTrigger
            value="daily"
            className="gap-1 flex items-center justify-center rounded-none border-0 data-[state=active]:bg-[#e6a800] data-[state=active]:text-[#1a1a2e] data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#6b6a9a] font-['Press_Start_2P'] text-[8px] py-2.5"
          >
            <Clock className="w-3 h-3" /> Infinite
            {dailyQuests.filter(q => q.status !== "claimed").length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[7px] rounded-none w-4 h-4 flex items-center justify-center">
                {dailyQuests.filter(q => q.status !== "claimed").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="weekly"
            className="gap-1 flex items-center justify-center rounded-none border-0 data-[state=active]:bg-[#e6a800] data-[state=active]:text-[#1a1a2e] data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#6b6a9a] font-['Press_Start_2P'] text-[8px] py-2.5"
            style={{ borderLeft: "1px solid #2a1f5c", borderRight: "1px solid #2a1f5c" }}
          >
            <Calendar className="w-3 h-3" /> Weekly
            {weeklyQuests.filter(q => q.status !== "claimed").length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[7px] rounded-none w-4 h-4 flex items-center justify-center">
                {weeklyQuests.filter(q => q.status !== "claimed").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="story"
            className="gap-1 flex items-center justify-center rounded-none border-0 data-[state=active]:bg-[#e6a800] data-[state=active]:text-[#1a1a2e] data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#6b6a9a] font-['Press_Start_2P'] text-[8px] py-2.5"
          >
            <Sparkles className="w-3 h-3" /> Story
            {storyQuests.filter(q => q.status !== "claimed").length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[7px] rounded-none w-4 h-4 flex items-center justify-center">
                {storyQuests.filter(q => q.status !== "claimed").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <div className="space-y-3">
            <AnimatePresence>
              {dailyQuests.map((q, idx) => (
                <QuestCard key={q.id} quest={q} idx={idx} />
              ))}
            </AnimatePresence>
            {!isLoading && dailyQuests.length === 0 && (
              <EmptyState type="daily" icon={Clock} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <div className="space-y-3">
            <AnimatePresence>
              {weeklyQuests.map((q, idx) => (
                <QuestCard key={q.id} quest={q} idx={idx} />
              ))}
            </AnimatePresence>
            {!isLoading && weeklyQuests.length === 0 && (
              <EmptyState type="weekly" icon={Calendar} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="story" className="mt-4">
          <div className="space-y-3">
            <AnimatePresence>
              {storyQuests.map((q, idx) => (
                <QuestCard key={q.id} quest={q} idx={idx} />
              ))}
            </AnimatePresence>
            {!isLoading && storyQuests.length === 0 && (
              <EmptyState type="story" icon={Sparkles} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}