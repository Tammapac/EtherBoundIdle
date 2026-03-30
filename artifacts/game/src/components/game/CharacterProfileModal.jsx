import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X, Shield, Swords, Heart, Zap, Clover, Star,
  Plus, Minus, TrendingUp, Coins, Gem, ShieldCheck,
  Activity, Target, Wind, Flame, Clock, Sparkles,
  Eye, ArrowUpRight, RefreshCw
} from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import { calculateFinalStats } from "@/lib/statSystem";

const STAT_CONFIG = [
  { key: "strength",     label: "Strength",     icon: Swords,  color: "text-red-400",    desc: "Increases physical damage" },
  { key: "dexterity",    label: "Dexterity",    icon: Wind,    color: "text-green-400",   desc: "Boosts attack speed, evasion & crit" },
  { key: "intelligence", label: "Intelligence", icon: Sparkles,color: "text-blue-400",    desc: "Boosts spell damage & MP pool" },
  { key: "vitality",     label: "Vitality",     icon: Heart,   color: "text-orange-400",  desc: "Increases HP, defense & HP regen" },
  { key: "luck",         label: "Luck",         icon: Clover,  color: "text-yellow-400",  desc: "Improves crit chance, crit dmg & gold" },
];

const DERIVED_SECTIONS = [
  {
    title: "Offense",
    color: "text-red-400",
    stats: [
      { key: "attackPower",   label: "Attack Power",   icon: Swords,       fmt: v => Math.round(v),         suffix: "",    color: "text-red-400" },
      { key: "critChance",    label: "Crit Chance",    icon: Target,       fmt: v => v.toFixed(1),           suffix: "%",   color: "text-orange-400" },
      { key: "critDmgPct",    label: "Crit Damage",    icon: Flame,        fmt: v => v.toFixed(0),           suffix: "%",   color: "text-red-300" },
      { key: "attackSpeed",   label: "Attack Speed",   icon: Clock,        fmt: v => v.toFixed(2),           suffix: "x",   color: "text-yellow-400" },
      { key: "lifesteal",     label: "Lifesteal",      icon: Activity,     fmt: v => v.toFixed(1),           suffix: "%",   color: "text-rose-400",  hideIfZero: true },
    ]
  },
  {
    title: "Defense",
    color: "text-blue-400",
    stats: [
      { key: "maxHp",          label: "Max HP",         icon: Heart,        fmt: v => Math.round(v),          suffix: "",    color: "text-red-400" },
      { key: "maxMp",          label: "Max MP",         icon: Zap,          fmt: v => Math.round(v),          suffix: "",    color: "text-blue-400" },
      { key: "rawDefense",     label: "Defense",        icon: Shield,       fmt: v => Math.round(v),          suffix: "",    color: "text-slate-400" },
      { key: "damageReduction",label: "Dmg Reduction",  icon: ShieldCheck,  fmt: v => v.toFixed(1),           suffix: "%",   color: "text-cyan-400" },
      { key: "evasion",        label: "Evasion",        icon: Wind,         fmt: v => v.toFixed(1),           suffix: "%",   color: "text-green-400" },
      { key: "blockChance",    label: "Block Chance",   icon: Shield,       fmt: v => v.toFixed(1),           suffix: "%",   color: "text-blue-300" },
    ]
  },
  {
    title: "Regeneration",
    color: "text-green-400",
    stats: [
      { key: "hpRegen",        label: "HP Regen",       icon: Heart,        fmt: v => v.toFixed(2),           suffix: "/s",  color: "text-red-400" },
      { key: "mpRegen",        label: "MP Regen",       icon: Zap,          fmt: v => v.toFixed(2),           suffix: "/s",  color: "text-blue-400" },
    ]
  },
  {
    title: "Utility",
    color: "text-yellow-400",
    stats: [
      { key: "goldGainPct",    label: "Gold Bonus",     icon: Coins,        fmt: v => v.toFixed(0),           suffix: "%",   color: "text-yellow-400", hideIfZero: true },
      { key: "expGainPct",     label: "EXP Bonus",      icon: Star,         fmt: v => v.toFixed(0),           suffix: "%",   color: "text-purple-400", hideIfZero: true },
    ]
  },
];

export default function CharacterProfileModal({ character, onCharacterUpdate, onClose }) {
  const { logout } = useAuth();
  const [pendingStats, setPendingStats] = useState({});

  const { data: equippedItems = [] } = useQuery({
    queryKey: ["items", character?.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character?.id }),
    enabled: !!character?.id,
    select: (data) => data.filter(i => i.equipped),
  });

  const statMutation = useMutation({
    mutationFn: async () => {
      const totalSpent = Object.values(pendingStats).reduce((s, v) => s + v, 0);
      const updates = { stat_points: (character.stat_points || 0) - totalSpent };
      for (const [key, val] of Object.entries(pendingStats)) {
        updates[key] = (character[key] || 10) + val;
      }
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

  const totalPending = Object.values(pendingStats).reduce((s, v) => s + v, 0);
  const availablePoints = (character?.stat_points || 0) - totalPending;

  const addStat = (key) => {
    if (availablePoints <= 0) return;
    setPendingStats(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };
  const removeStat = (key) => {
    if (!pendingStats[key]) return;
    setPendingStats(prev => ({ ...prev, [key]: prev[key] - 1 }));
  };

  if (!character) return null;
  const cls = CLASSES[character.class];

  const previewChar = { ...character };
  for (const [k, v] of Object.entries(pendingStats)) {
    previewChar[k] = (character[k] || 10) + v;
  }
  const { base, equipBonus, total, derived } = calculateFinalStats(previewChar, equippedItems);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: -20, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-card border border-border rounded-2xl w-full max-w-2xl my-4 overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-orbitron font-bold text-xl">{character.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cls?.color}>Lv.{character.level} {cls?.name}</Badge>
                  {character.prestige_level > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Prestige {character.prestige_level}</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Currency & Progress */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Gold</p>
                <p className="font-bold text-accent flex items-center justify-center gap-1"><Coins className="w-3.5 h-3.5" />{(character.gold||0).toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Gems</p>
                <p className="font-bold text-secondary flex items-center justify-center gap-1"><Gem className="w-3.5 h-3.5" />{character.gems||0}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Kills</p>
                <p className="font-bold">{(character.total_kills||0).toLocaleString()}</p>
              </div>
            </div>

            {/* EXP / HP / MP bars */}
            <div className="space-y-2">
              {[
                { label: "HP", cur: character.hp || character.max_hp, max: character.max_hp, color: "bg-red-500" },
                { label: "MP", cur: character.mp || character.max_mp, max: character.max_mp, color: "bg-blue-500" },
                { label: "EXP", cur: character.exp, max: character.exp_to_next, color: "bg-primary" },
              ].map(({ label, cur, max, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{label}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (cur / max) * 100)}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">{Math.round(cur||0)} / {Math.round(max||0)}</span>
                </div>
              ))}
            </div>

            {/* Attributes */}
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Attributes</h3>
                {availablePoints > 0 && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">{availablePoints} pts available</Badge>
                )}
              </div>
              <div className="space-y-2">
                {STAT_CONFIG.map(({ key, label, icon: Icon, color, desc }) => {
                  const baseVal = base[key] || 0;
                  const gearBonus = equipBonus[key] || 0;
                  const finalVal = total[key] || 0;
                  const pending = pendingStats[key] || 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                      <span className="text-sm text-muted-foreground w-24">{label}</span>
                      <div className="flex items-center gap-1.5 flex-1 text-sm font-mono">
                        <span className={`font-bold ${color}`}>{baseVal}</span>
                        {gearBonus > 0 && <span className="text-green-400 text-xs">+{gearBonus}</span>}
                        {pending > 0 && <span className="text-primary text-xs">+{pending}</span>}
                        {(gearBonus > 0 || pending > 0) && <span className="text-foreground font-bold">= {finalVal}</span>}
                      </div>
                      {(character.stat_points || 0) > 0 && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStat(key)} disabled={!pendingStats[key]}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addStat(key)} disabled={availablePoints <= 0}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalPending > 0 && (
                <Button className="w-full mt-3" size="sm" onClick={() => statMutation.mutate()} disabled={statMutation.isPending}>
                  Confirm ({totalPending} points)
                </Button>
              )}
            </div>

            {/* Combat Stats — full detail */}
            {DERIVED_SECTIONS.map(section => {
              const visibleStats = section.stats.filter(s => !s.hideIfZero || (derived[s.key] || 0) > 0);
              if (!visibleStats.length) return null;
              return (
                <div key={section.title} className="bg-muted/30 rounded-xl p-4">
                  <h3 className={`font-semibold text-sm mb-3 ${section.color}`}>{section.title}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleStats.map(({ key, label, icon: Icon, fmt, suffix, color }) => (
                      <div key={key} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <span className={`text-sm font-bold font-mono ${color}`}>
                          {fmt(derived[key] || 0)}{suffix}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Logout */}
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}