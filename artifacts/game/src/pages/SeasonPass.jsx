import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Gem, Lock, Check, Clock, Swords, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SEASON_PASS_CONFIG } from "@/lib/gameData";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

export default function SeasonPass({ character, onCharacterUpdate }) {
  const [claiming, setClaiming] = useState(null);
  const [unlockingPremium, setUnlockingPremium] = useState(false);
  const [claimingMission, setClaimingMission] = useState(null);
  const trackRef = useRef(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pollInterval = useSmartPolling(POLL_INTERVALS.BACKGROUND);

  // Fetch season pass status
  const { data: seasonData, refetch, error: seasonError } = useQuery({
    queryKey: ["seasonPass", character?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("seasonPassAction", {
        action: "get_status",
        characterId: character.id,
      });
      return res;
    },
    enabled: !!character?.id,
    staleTime: 120_000,
    retry: 1,
  });

  // Missions are now auto-generated server-side by get_status

  const pass = seasonData?.pass || { tier: 0, xp: 0, isPremium: false, claimedFree: [], claimedPremium: [] };
  const missions = seasonData?.missions || [];
  const config = seasonData?.config || SEASON_PASS_CONFIG;
  const rewards = seasonData?.rewards || {};

  const currentXpInTier = pass.xp % config.xpPerTier;
  const xpProgress = (currentXpInTier / config.xpPerTier) * 100;

  // Season countdown
  const seasonEnd = config.seasonEnd ? new Date(config.seasonEnd).getTime() : 0;
  const now = Date.now();
  const timeLeft = Math.max(0, seasonEnd - now);
  const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  const dailyMissions = missions.filter(m => m.type === "daily");
  const weeklyMissions = missions.filter(m => m.type === "weekly");

  const handleClaimReward = async (tier, track) => {
    setClaiming(`${tier}-${track}`);
    try {
      const res = await base44.functions.invoke("seasonPassAction", {
        action: "claim_reward",
        characterId: character.id,
        tier,
        track,
      });
      if (res?.success) {
        const r = res.reward;
        const parts = [];
        if (r.gold) parts.push(`${r.gold} Gold`);
        if (r.gems) parts.push(`${r.gems} Gems`);
        if (r.tammablocks) parts.push(`${r.tammablocks} Tammablocks`);
        if (r.towershards) parts.push(`${r.towershards} Tower Shards`);
        toast({ title: `Claimed: ${parts.join(", ")}` });
        refetch();
        if (onCharacterUpdate) onCharacterUpdate();
      } else {
        toast({ title: res?.error || "Failed to claim", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setClaiming(null);
    }
  };

  const handleClaimMission = async (missionId) => {
    setClaimingMission(missionId);
    try {
      const res = await base44.functions.invoke("seasonPassAction", {
        action: "claim_mission",
        characterId: character.id,
        missionId,
      });
      if (res?.success) {
        toast({ title: `+${res.xpGained} Season XP!${res.tierUp ? " TIER UP!" : ""}` });
        refetch();
      } else {
        toast({ title: res?.error || "Failed to claim", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setClaimingMission(null);
    }
  };

  const handleUnlockPremium = async () => {
    setUnlockingPremium(true);
    try {
      const res = await base44.functions.invoke("seasonPassAction", {
        action: "unlock_premium",
        characterId: character.id,
      });
      if (res?.success) {
        toast({ title: "Premium Battle Pass Unlocked!" });
        refetch();
        if (onCharacterUpdate) onCharacterUpdate();
      } else {
        toast({ title: res?.error || "Failed to unlock", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setUnlockingPremium(false);
    }
  };

  const scrollTrack = (dir) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Error display for debugging */}
      {seasonError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          Season Pass Error: {seasonError?.message || "Unknown error — check browser console (F12)"}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            {config.seasonName || "Battle Pass"}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {daysLeft}d {hoursLeft}h remaining
            </p>
            {pass.isPremium && (
              <Badge className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/40">
                PREMIUM
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>Tier <span className="font-bold text-purple-400">{pass.tier}</span> / {config.maxTier}</span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Season XP</span>
          <span className="font-bold text-purple-400">{currentXpInTier} / {config.xpPerTier} XP</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, xpProgress)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Total: {pass.xp} XP earned this season
        </p>
      </div>

      {/* Premium Unlock */}
      {!pass.isPremium && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl p-4 text-center space-y-2">
          <p className="font-orbitron text-sm font-bold text-purple-300">Unlock Premium Battle Pass</p>
          <p className="text-xs text-muted-foreground">Get exclusive rewards at every tier including gems, tammablocks, and tower shards!</p>
          <Button
            onClick={handleUnlockPremium}
            disabled={unlockingPremium || (character?.gems || 0) < config.premiumCost}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Gem className="w-4 h-4" />
            {unlockingPremium ? "Unlocking..." : `Unlock — ${config.premiumCost?.toLocaleString()} Gems`}
          </Button>
          <p className="text-[10px] text-muted-foreground">You have {(character?.gems || 0).toLocaleString()} gems</p>
        </div>
      )}

      {/* Reward Track */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-400" /> Reward Track
          </p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => scrollTrack(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => scrollTrack(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div ref={trackRef} className="flex overflow-x-auto gap-0 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {Array.from({ length: config.maxTier }, (_, i) => i + 1).map(tier => {
            const tierRewards = rewards[tier] || {};
            const reached = pass.tier >= tier;
            const freeClaimed = (pass.claimedFree || []).includes(tier);
            const premClaimed = (pass.claimedPremium || []).includes(tier);
            const isMilestone = tier % 10 === 0;

            return (
              <div
                key={tier}
                className={`flex-shrink-0 w-[100px] border-r border-border last:border-r-0 ${
                  reached ? "bg-purple-500/5" : ""
                } ${isMilestone ? "bg-amber-500/5" : ""}`}
              >
                {/* Tier number */}
                <div className={`text-center py-1.5 border-b border-border text-xs font-bold ${
                  reached ? "text-purple-400" : "text-muted-foreground/50"
                } ${isMilestone ? "text-amber-400" : ""}`}>
                  {isMilestone ? "★ " : ""}T{tier}
                </div>

                {/* Free reward */}
                <div className={`p-2 min-h-[60px] border-b border-border flex flex-col items-center justify-center gap-1 ${
                  !tierRewards.free ? "opacity-30" : ""
                }`}>
                  {tierRewards.free ? (
                    <>
                      <div className="text-[9px] text-muted-foreground uppercase">Free</div>
                      {Object.entries(tierRewards.free).map(([k, v]) => (
                        <span key={k} className="text-[10px] text-green-400 font-medium">
                          +{v} {k === "gold" ? "G" : k === "gems" ? "💎" : k === "tammablocks" ? "TB" : k === "towershards" ? "TS" : k}
                        </span>
                      ))}
                      {reached && !freeClaimed ? (
                        <Button
                          size="sm"
                          className="h-5 text-[9px] px-2 bg-green-600 hover:bg-green-700"
                          onClick={() => handleClaimReward(tier, "free")}
                          disabled={claiming === `${tier}-free`}
                        >
                          {claiming === `${tier}-free` ? "..." : "Claim"}
                        </Button>
                      ) : freeClaimed ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground/30" />
                      )}
                    </>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/30">—</span>
                  )}
                </div>

                {/* Premium reward */}
                <div className={`p-2 min-h-[60px] flex flex-col items-center justify-center gap-1 ${
                  !pass.isPremium ? "opacity-40" : ""
                }`}>
                  {tierRewards.premium ? (
                    <>
                      <div className="text-[9px] text-purple-400/80 uppercase">Premium</div>
                      {Object.entries(tierRewards.premium).map(([k, v]) => (
                        <span key={k} className="text-[10px] text-purple-300 font-medium">
                          +{v} {k === "gold" ? "G" : k === "gems" ? "💎" : k === "tammablocks" ? "TB" : k === "towershards" ? "TS" : k}
                        </span>
                      ))}
                      {reached && pass.isPremium && !premClaimed ? (
                        <Button
                          size="sm"
                          className="h-5 text-[9px] px-2 bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleClaimReward(tier, "premium")}
                          disabled={claiming === `${tier}-premium`}
                        >
                          {claiming === `${tier}-premium` ? "..." : "Claim"}
                        </Button>
                      ) : premClaimed ? (
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                      ) : !pass.isPremium ? (
                        <Lock className="w-3 h-3 text-purple-400/30" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground/30" />
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Missions */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" /> Daily Missions
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Resets daily at midnight UTC</p>
          </div>
          <div className="divide-y divide-border">
            {dailyMissions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">No daily missions yet</div>
            )}
            {dailyMissions.map(m => (
              <MissionRow key={m.id} mission={m} onClaim={handleClaimMission} claiming={claimingMission} />
            ))}
          </div>
        </div>

        {/* Weekly Missions */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" /> Weekly Missions
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Resets every Sunday at midnight UTC</p>
          </div>
          <div className="divide-y divide-border">
            {weeklyMissions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">No weekly missions yet</div>
            )}
            {weeklyMissions.map(m => (
              <MissionRow key={m.id} mission={m} onClaim={handleClaimMission} claiming={claimingMission} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionRow({ mission, onClaim, claiming }) {
  const m = mission;
  const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
  const isCompleted = m.status === "completed";
  const isClaimed = m.status === "claimed";

  return (
    <div className={`px-4 py-3 space-y-1.5 ${isClaimed ? "opacity-40" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{m.title}</p>
          <p className="text-[10px] text-muted-foreground">{m.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30">
            +{m.xpReward} XP
          </Badge>
          {isCompleted && !isClaimed && (
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => onClaim(m.id)}
              disabled={claiming === m.id}
            >
              {claiming === m.id ? "..." : "Claim"}
            </Button>
          )}
          {isClaimed && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isCompleted || isClaimed ? "bg-green-500" : "bg-purple-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono w-16 text-right">
          {m.progress}/{m.target}
        </span>
      </div>
    </div>
  );
}
