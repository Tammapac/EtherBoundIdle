import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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

  const dailyQuests = quests.filter(q => q.type === "daily" && (q.status === "active" || q.status === "completed"));
  const weeklyQuests = quests.filter(q => q.type === "weekly" && (q.status === "active" || q.status === "completed"));
  const storyQuests = quests.filter(q => q.type === "story" && (q.status === "active" || q.status === "completed"));

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
        className={`bg-card border rounded-xl p-4 ${
          isComplete ? "border-primary/30 glow-cyan" : "border-border"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getObjectiveIcon()}</span>
              <h3 className="font-semibold">{quest.title}</h3>
              {quest.type === "daily" && (
                <Badge variant="secondary" className="text-xs gap-1 flex items-center">
                  <Clock className="w-3 h-3" /> Daily
                </Badge>
              )}
              {quest.expires_at && (
                <DailyTimer expiresAt={quest.expires_at} />
              )}
              {quest.type === "weekly" && (
                <Badge variant="outline" className="text-xs gap-1 flex items-center">
                  <Calendar className="w-3 h-3" /> Weekly
                </Badge>
              )}
            </div>
            {quest.description && (
              <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
            )}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-semibold">
                  {currentCount}/{targetCount}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {rewards.exp && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Star className="w-3 h-3" /> {rewards.exp} EXP
                </span>
              )}
              {rewards.gold && (
                <span className="text-xs text-accent flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {rewards.gold} Gold
                </span>
              )}
              {rewards.gems && (
                <span className="text-xs text-secondary flex items-center gap-1">
                  <Gem className="w-3 h-3" /> {rewards.gems} Gems
                </span>
              )}
            </div>
          </div>
          {isComplete && quest.status !== "claimed" && (
            <Button
              size="sm"
              onClick={() => claimMutation.mutate({ ...quest, reward: rewards })}
              disabled={claimMutation.isPending}
              className="gap-1 shrink-0 bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Claim
            </Button>
          )}
          {quest.status === "claimed" && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Claimed
            </Badge>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="gap-1 flex items-center justify-center">
            <Clock className="w-4 h-4" /> Daily
            {dailyQuests.filter(q => q.status !== "claimed").length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {dailyQuests.filter(q => q.status !== "claimed").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1 flex items-center justify-center">
            <Calendar className="w-4 h-4" /> Weekly
            {weeklyQuests.filter(q => q.status !== "claimed").length > 0 && (
              <span className="ml-1 bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {weeklyQuests.filter(q => q.status !== "claimed").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="story" className="gap-1 flex items-center justify-center">
            <Sparkles className="w-4 h-4" /> Story
            {storyQuests.filter(q => q.status !== "claimed").length > 0 && (
              <span className="ml-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
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