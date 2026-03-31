import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, Shield, Swords, Heart, Zap,
  Clover, Star, Plus, Minus, TrendingUp, Coins, Gem, ShieldCheck, RotateCcw
} from "lucide-react";
import HealthBar from "@/components/game/HealthBar";
import CombatStatsPanel from "@/components/game/CombatStatsPanel";
import SetCollectionPanel from "@/components/game/SetCollectionPanel";
import { CLASSES, calculateIdleRewards, SKILLS } from "@/lib/gameData";
import { calculateFinalStats } from "@/lib/statSystem";
import { formatGold } from "@/lib/formatGold";

const STAT_CONFIG = [
  { key: "strength", label: "Strength", icon: Swords, color: "text-red-400" },
  { key: "dexterity", label: "Dexterity", icon: Zap, color: "text-green-400" },
  { key: "intelligence", label: "Intelligence", icon: Star, color: "text-blue-400" },
  { key: "vitality", label: "Vitality", icon: Heart, color: "text-orange-400" },
  { key: "luck", label: "Luck", icon: Clover, color: "text-yellow-400" },
];

export default function Profile({ character, onCharacterUpdate }) {
  const { logout } = useAuth();
  const [pendingStats, setPendingStats] = useState({});
  const [pendingSkills, setPendingSkills] = useState({});

  const statMutation = useMutation({
    mutationFn: async () => {
      const totalSpent = Object.values(pendingStats).reduce((s, v) => s + v, 0);
      const updates = { stat_points: (character.stat_points || 0) - totalSpent };
      for (const [key, val] of Object.entries(pendingStats)) {
        updates[key] = (character[key] || 10) + val;
      }
      // Recalculate HP/MP with new stats and persist them so Battle window updates instantly
      const tempChar = { ...character, ...updates };
      const { derived } = calculateFinalStats(tempChar, equippedItems);
      updates.max_hp = derived.maxHp;
      updates.max_mp = derived.maxMp;
      updates.hp = derived.maxHp;
      updates.mp = derived.maxMp;
      const updated = await base44.entities.Character.update(character.id, updates);
      onCharacterUpdate(updated);
      setPendingStats({});
    },
  });

  const claimIdleMutation = useMutation({
    mutationFn: async () => {
      const lastClaim = character.last_idle_claim ? new Date(character.last_idle_claim) : new Date();
      const hoursOffline = Math.max(0, (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60));
      if (hoursOffline < 0.05) return;
      const rewards = calculateIdleRewards(character, hoursOffline);
      const updates = {
        exp: (character.exp || 0) + rewards.exp,
        gold: (character.gold || 0) + rewards.gold,
        total_kills: (character.total_kills || 0) + rewards.kills,
        last_idle_claim: new Date().toISOString(),
      };
      const updated = await base44.entities.Character.update(character.id, updates);
      onCharacterUpdate(updated);
    },
  });

  const totalPending = Object.values(pendingStats).reduce((s, v) => s + v, 0);
  const availablePoints = (character?.stat_points || 0) - totalPending;

  const totalSkillsPending = Object.values(pendingSkills).reduce((s, v) => s + v, 0);
  const availableSkillPoints = (character?.skill_points || 0) - totalSkillsPending;

  const addStat = (key, amount = 1) => {
    setPendingStats(prev => {
      const currentTotal = Object.values(prev).reduce((s, v) => s + v, 0);
      const remaining = (character?.stat_points || 0) - currentTotal;
      const actualAdd = Math.min(amount, remaining);
      if (actualAdd <= 0) return prev;
      return { ...prev, [key]: (prev[key] || 0) + actualAdd };
    });
  };

  const removeStat = (key, amount = 1) => {
    setPendingStats(prev => {
      const current = prev[key] || 0;
      if (current <= 0) return prev;
      return { ...prev, [key]: Math.max(0, current - amount) };
    });
  };

  const addSkill = (skillId) => {
    if (availableSkillPoints <= 0) return;
    setPendingSkills(prev => ({ ...prev, [skillId]: (prev[skillId] || 0) + 1 }));
  };

  const removeSkill = (skillId) => {
    if (!pendingSkills[skillId] || pendingSkills[skillId] <= 0) return;
    setPendingSkills(prev => ({ ...prev, [skillId]: prev[skillId] - 1 }));
  };

  const resetStatsMutation = useMutation({
    mutationFn: async (resetType) => {
      const res = await base44.functions.invoke("resetStatPoints", { characterId: character.id, resetType });
      if (res?.success) {
        onCharacterUpdate({ ...character, ...res.character, gems: res.gemsRemaining });
        setPendingStats({});
        setPendingSkills({});
      }
      return res;
    },
  });

  const { data: allCharItems = [] } = useQuery({
    queryKey: ["items", character?.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character?.id }),
    enabled: !!character?.id,
  });

  const equippedItems = allCharItems.filter(i => i.equipped);

  if (!character) return null;
  const cls = CLASSES[character.class];

  // Unified stat pipeline — includes pending allocations for preview
  const previewChar = { ...character };
  for (const [k, v] of Object.entries(pendingStats)) {
    previewChar[k] = (character[k] || 10) + v;
  }
  const { base, equipBonus, total, derived } = calculateFinalStats(previewChar, equippedItems);

  // Calculate idle rewards preview
  const lastClaim = character.last_idle_claim ? new Date(character.last_idle_claim) : new Date();
  const hoursOffline = Math.max(0, (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60));
  const idleRewards = calculateIdleRewards(character, hoursOffline);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
        <User className="w-5 h-5 text-primary" /> Profile
      </h2>

      {/* Character Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">{character.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${cls?.color}`}>Lv.{character.level} {cls?.name}</Badge>
              {character.prestige_level > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Prestige {character.prestige_level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Kills</p>
            <p className="font-bold text-lg">{(character.total_kills || 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Gold</p>
            <p className="font-bold text-lg text-accent">{formatGold(character.gold || 0)}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Gems</p>
            <p className="font-bold text-lg text-secondary">{character.gems || 0}</p>
          </div>
        </div>

        <div className="space-y-2">
          <HealthBar current={derived.maxHp} max={derived.maxHp} color="bg-red-500" label="HP" />
          <HealthBar current={derived.maxMp} max={derived.maxMp} color="bg-blue-500" label="MP" />
          <HealthBar current={character.exp} max={character.exp_to_next} color="bg-primary" label="EXP" />
        </div>
      </div>

      {/* Idle Rewards */}
      {hoursOffline >= 0.05 && idleRewards.exp > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-accent/30 rounded-xl p-4 glow-gold"
        >
          <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Idle Rewards Available!
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            You were away for {Math.floor(hoursOffline)}h {Math.floor((hoursOffline % 1) * 60)}m
          </p>
          <div className="flex gap-4 mb-3">
            <span className="text-sm text-primary">+{idleRewards.exp.toLocaleString()} EXP</span>
            <span className="text-sm text-accent">+{idleRewards.gold.toLocaleString()} Gold</span>
            <span className="text-sm text-muted-foreground">{idleRewards.kills} Kills</span>
          </div>
          <Button size="sm" onClick={() => claimIdleMutation.mutate()} disabled={claimIdleMutation.isPending}>
            Claim Rewards
          </Button>
        </motion.div>
      )}

      {/* Combat Stats Overview */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" /> Combat Stats
        </h3>
        <CombatStatsPanel derived={derived} character={character} />
      </div>

      {/* Set Collection */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-yellow-400" /> Set Collection
        </h3>
        <SetCollectionPanel
          equippedItems={equippedItems}
          allItems={allCharItems}
          characterClass={character.class}
        />
      </div>

      {/* Attributes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Attributes</h3>
          <Badge variant="outline" className="text-primary border-primary/30">
            {availablePoints} pts available (Shift+Click=10)
          </Badge>
        </div>
        <div className="space-y-1">
          {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => {
            const baseVal = character[key] || (key === "luck" ? 5 : 10);
            const gearBonus = equipBonus[key] || 0;
            const pending = pendingStats[key] || 0;
            // Calculate directly to avoid stale total from calculateFinalStats
            const finalVal = baseVal + gearBonus + pending;
            return (
              <div key={key} className="flex items-center gap-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-mono">
                      <span className={`font-semibold ${color}`}>{baseVal}</span>
                      {gearBonus > 0 && (
                        <span className="text-green-400 text-xs">+{gearBonus}</span>
                      )}
                      {pending > 0 && (
                        <span className="text-primary text-xs">+{pending}</span>
                      )}
                      {(gearBonus > 0 || pending > 0) && (
                        <span className={`font-bold ${color}`}>= {finalVal}</span>
                      )}
                    </div>
                  </div>
                </div>
                {(character.stat_points || 0) > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="h-7 w-7 flex items-center justify-center rounded bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-30"
                      onClick={(e) => removeStat(key, e.shiftKey ? 10 : 1)}
                      disabled={!pendingStats[key]}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pending}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        const val = Math.max(0, Math.min(parseInt(raw) || 0, availablePoints + pending));
                        setPendingStats(prev => ({ ...prev, [key]: val }));
                      }}
                      className="w-10 h-7 text-center text-xs rounded px-1 font-mono"
                      style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #475569' }}
                    />
                    <button
                      type="button"
                      className="h-7 w-7 flex items-center justify-center rounded bg-green-900/50 text-green-300 hover:bg-green-800 disabled:opacity-30"
                      onClick={(e) => addStat(key, e.shiftKey ? 10 : 1)}
                      disabled={availablePoints <= 0}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="h-7 px-2 text-xs rounded bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800 disabled:opacity-30"
                      onClick={() => addStat(key, availablePoints)}
                      disabled={availablePoints <= 0}
                    >
                      MAX
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {(equippedItems.length > 0) && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-green-400" />
            <span><span className="text-green-400 font-medium">Green</span> = gear bonus · <span className="text-primary font-medium">Cyan</span> = pending allocation</span>
          </p>
        )}
        {totalPending > 0 && (
          <Button className="w-full mt-4" onClick={() => statMutation.mutate()} disabled={statMutation.isPending}>
            Confirm Stat Allocation ({totalPending} points)
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => resetStatsMutation.mutate("stats")}
          disabled={resetStatsMutation.isPending}
        >
          <RotateCcw className="w-3 h-3" />
          Reset Stats (100 <Gem className="w-3 h-3 inline" />)
        </Button>
      </div>

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Skills</h3>
          <Badge variant="outline" className="text-primary border-primary/30">
            {availableSkillPoints} points available
          </Badge>
        </div>
        <div className="space-y-1">
          {(character?.skills || []).map((skillId) => {
            const skill = SKILLS[skillId];
            if (!skill) return null;
            const pending = pendingSkills[skillId] || 0;
            return (
              <div key={skillId} className="flex items-center gap-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <span>{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-mono">
                      {pending > 0 && (
                        <span className="text-primary text-xs">+{pending}</span>
                      )}
                    </div>
                  </div>
                </div>
                {(character.skill_points || 0) > 0 && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSkill(skillId)} disabled={!pendingSkills[skillId]}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addSkill(skillId)} disabled={availableSkillPoints <= 0}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {totalSkillsPending > 0 && (
          <Button className="w-full mt-4" onClick={() => {
            const newSkills = character.skills ? [...character.skills] : [];
            for (const [skillId, count] of Object.entries(pendingSkills)) {
              for (let i = 0; i < count; i++) {
                if (!newSkills.includes(skillId)) newSkills.push(skillId);
              }
            }
            saveMutation.mutate({ skills: newSkills, skill_points: availableSkillPoints });
            setPendingSkills({});
          }} disabled={saveMutation.isPending}>
            Confirm Skill Allocation ({totalSkillsPending} points)
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => resetStatsMutation.mutate("skills")}
          disabled={resetStatsMutation.isPending}
        >
          <RotateCcw className="w-3 h-3" />
          Reset Skills (50 <Gem className="w-3 h-3 inline" />)
        </Button>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full" onClick={() => logout()}>
        Logout
      </Button>
    </div>
  );
}