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
      { key: "goldGainPct",    label: "Gold Bonus",     icon: Coins,        fmt: v => v.toFixed(0),           suffix: "%",   color: "text-yellow-400" },
      { key: "expGainPct",     label: "EXP Bonus",      icon: Star,         fmt: v => v.toFixed(0),           suffix: "%",   color: "text-purple-400" },
      { key: "lootBonus",      label: "Loot Bonus",     icon: Sparkles,     fmt: v => v.toFixed(0),           suffix: "%",   color: "text-green-400" },
    ]
  },
];

export default function CharacterProfileModal({ character, onCharacterUpdate, onClose }) {
  const { logout } = useAuth();
  const [pendingStats, setPendingStats] = useState({});

  const { data: equippedItems = [] } = useQuery({
    queryKey: ["equippedItems", character?.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character?.id, equipped: true }),
    enabled: !!character?.id,
  });

  const { data: guildData } = useQuery({
    queryKey: ["guildForStats", character?.guildId],
    queryFn: async () => {
      if (!character?.guildId) return null;
      const guilds = await base44.entities.Guild.filter({ id: character.guildId });
      return guilds?.[0] || null;
    },
    enabled: !!character?.guildId,
    staleTime: 60000,
  });

  const { data: petData } = useQuery({
    queryKey: ["petsForStats", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    staleTime: 60000,
  });
  const equippedPetForStats = (petData?.pets || []).find(p => p.equipped);

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

  if (!character) return null;
  const cls = CLASSES[character.class];

  const previewChar = { ...character };
  for (const [k, v] of Object.entries(pendingStats)) {
    previewChar[k] = (character[k] || 10) + v;
  }
  const { base, equipBonus, total, derived } = calculateFinalStats(previewChar, equippedItems);
  derived.lootBonus = Math.min(50, Math.round((total.luck || 0) * 0.5));

  // Add guild + pet bonuses to EXP/Gold display so player sees total
  const guildBuffs2 = guildData?.buffs && typeof guildData.buffs === 'object' ? guildData.buffs : {};
  derived.expGainPct = (derived.expGainPct || 0) + (guildBuffs2.exp_bonus || 0);
  derived.goldGainPct = (derived.goldGainPct || 0) + (guildBuffs2.gold_bonus || 0);
  if (equippedPetForStats) {
    if (equippedPetForStats.passiveType === "exp_gain") derived.expGainPct += equippedPetForStats.passiveValue || 0;
    if (equippedPetForStats.passiveType === "gold_gain") derived.goldGainPct += equippedPetForStats.passiveValue || 0;
    // Add pet skill tree exp/gold bonuses
    const st2 = equippedPetForStats.skillTree || {};
    const expPts = st2.resource?.exp_seeker || 0;
    const goldPts = st2.resource?.gold_finder || 0;
    if (expPts > 0) derived.expGainPct += Math.round(0.02 * expPts * 100);
    if (goldPts > 0) derived.goldGainPct += Math.round(0.02 * goldPts * 100);
  }

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
              <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                <img src={`/sprites/class_${character.class || "warrior"}.png`} alt={character.class} className="w-12 h-12" style={{ imageRendering: "pixelated" }} />
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
                  <Badge className="bg-primary/20 text-primary border-primary/30">{availablePoints} pts (Shift+Click=10)</Badge>
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="h-6 w-6 flex items-center justify-center rounded bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-30 text-xs"
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
                            className="w-10 h-6 text-center text-xs rounded px-1 font-mono"
                            style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #475569' }}
                          />
                          <button
                            type="button"
                            className="h-6 w-6 flex items-center justify-center rounded bg-green-900/50 text-green-300 hover:bg-green-800 disabled:opacity-30 text-xs"
                            onClick={(e) => addStat(key, e.shiftKey ? 10 : 1)}
                            disabled={availablePoints <= 0}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="h-6 px-1.5 text-[10px] rounded bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800 disabled:opacity-30"
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

            {/* Combat Bonuses - Guild & Pet */}
            {(() => {
              const bonuses = [];

              // Guild bonuses
              const guildBuffs = guildData?.buffs && typeof guildData.buffs === 'object' ? guildData.buffs : {};
              if (guildBuffs.exp_bonus) bonuses.push({ label: "Guild EXP Bonus", value: `+${guildBuffs.exp_bonus}%`, color: "text-green-400", icon: TrendingUp });
              if (guildBuffs.gold_bonus) bonuses.push({ label: "Guild Gold Bonus", value: `+${guildBuffs.gold_bonus}%`, color: "text-yellow-400", icon: Coins });
              if (guildBuffs.damage_bonus) bonuses.push({ label: "Guild Damage Bonus", value: `+${guildBuffs.damage_bonus}%`, color: "text-red-400", icon: Swords });

              // Pet passive bonus
              if (equippedPetForStats) {
                const PASSIVE_LABELS = { crit_chance: "Crit Chance", exp_gain: "EXP Gain", gold_gain: "Gold Gain", damage: "Damage", defense: "Defense", luck: "Luck" };
                const PASSIVE_ICONS = { crit_chance: Target, exp_gain: Star, gold_gain: Coins, damage: Swords, defense: Shield, luck: Clover };
                const PASSIVE_COLORS = { crit_chance: "text-orange-400", exp_gain: "text-purple-400", gold_gain: "text-yellow-400", damage: "text-red-400", defense: "text-blue-400", luck: "text-amber-400" };
                const pLabel = PASSIVE_LABELS[equippedPetForStats.passiveType] || equippedPetForStats.passiveType;
                const pIcon = PASSIVE_ICONS[equippedPetForStats.passiveType] || Star;
                const pColor = PASSIVE_COLORS[equippedPetForStats.passiveType] || "text-cyan-400";
                bonuses.push({
                  label: `Pet: ${pLabel}`,
                  value: `+${equippedPetForStats.passiveValue}${equippedPetForStats.passiveType === 'crit_chance' || equippedPetForStats.passiveType === 'luck' ? '' : '%'}`,
                  color: pColor,
                  icon: pIcon,
                });
                const SKILL_LABELS = { heal: "Heal", shield: "Shield", extra_attack: "Extra Attack" };
                const SKILL_ICONS = { heal: Heart, shield: ShieldCheck, extra_attack: Swords };
                bonuses.push({
                  label: `Pet Skill: ${SKILL_LABELS[equippedPetForStats.skillType] || equippedPetForStats.skillType}`,
                  value: `${equippedPetForStats.skillValue}`,
                  color: "text-cyan-400",
                  icon: SKILL_ICONS[equippedPetForStats.skillType] || Zap,
                });

                // Pet skill tree bonuses
                const PET_SKILL_TREES = {
                  combat: {
                    damage_boost: { name: "Damage Boost", effect: { damage: 0.02 } },
                    crit_mastery: { name: "Crit Mastery", effect: { critChance: 0.01 } },
                    lethal_strikes: { name: "Boss Damage", effect: { bossDamage: 0.03 } },
                    berserker: { name: "Attack Speed", effect: { attackSpeed: 0.02 } },
                  },
                  resource: {
                    gold_finder: { name: "Gold Gain", effect: { goldGain: 0.02 } },
                    exp_seeker: { name: "EXP Gain", effect: { expGain: 0.02 } },
                    lucky_looter: { name: "Drop Rate", effect: { luck: 0.02 } },
                    treasure_sense: { name: "Expedition Loot", effect: { expeditionLoot: 0.03 } },
                  },
                  utility: {
                    quick_learner: { name: "Pet XP Gain", effect: { petXpGain: 0.03 } },
                    bond_master: { name: "Bond Gain", effect: { bondGain: 0.03 } },
                    expedition_pro: { name: "Expedition Speed", effect: { expeditionSpeed: 0.03 } },
                    aura_amplifier: { name: "Aura Strength", effect: { auraStrength: 0.02 } },
                  },
                };
                const EFFECT_ICONS = { damage: Swords, critChance: Target, bossDamage: Flame, attackSpeed: Clock, goldGain: Coins, expGain: Star, luck: Clover, expeditionLoot: Sparkles, petXpGain: TrendingUp, bondGain: Heart, expeditionSpeed: Wind, auraStrength: Sparkles };
                const EFFECT_COLORS = { damage: "text-red-400", critChance: "text-orange-400", bossDamage: "text-red-300", attackSpeed: "text-yellow-400", goldGain: "text-yellow-400", expGain: "text-purple-400", luck: "text-amber-400", expeditionLoot: "text-green-400", petXpGain: "text-cyan-400", bondGain: "text-pink-400", expeditionSpeed: "text-blue-400", auraStrength: "text-indigo-400" };
                const st = equippedPetForStats.skillTree || {};
                for (const branchKey of Object.keys(st)) {
                  const branch = st[branchKey] || {};
                  for (const [skillKey, points] of Object.entries(branch)) {
                    if (typeof points !== "number" || points <= 0) continue;
                    const skillDef = PET_SKILL_TREES[branchKey]?.[skillKey];
                    if (!skillDef?.effect) continue;
                    for (const [effectKey, effectVal] of Object.entries(skillDef.effect)) {
                      const totalPct = Math.round(effectVal * points * 100);
                      bonuses.push({
                        label: `Skill: ${skillDef.name}`,
                        value: `+${totalPct}%`,
                        color: EFFECT_COLORS[effectKey] || "text-cyan-400",
                        icon: EFFECT_ICONS[effectKey] || Zap,
                      });
                    }
                  }
                }
              }

              if (bonuses.length === 0) return null;

              return (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Pet & Guild Bonuses
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bonuses.map((b, i) => {
                      const BIcon = b.icon;
                      return (
                        <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/30">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <BIcon className="w-3 h-3" />
                            {b.label}
                          </span>
                          <span className={`text-xs font-bold ${b.color}`}>{b.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Active Scroll Buffs */}
            {(() => {
              const extra = character?.extraData || character?.extra_data || {};
              const activeBuffs = (extra.active_buffs || []).filter(
                b => new Date(b.expires_at).getTime() > Date.now()
              );
              if (activeBuffs.length === 0) return null;
              const BUFF_LABELS = { exp_bonus: "EXP Bonus", gold_bonus: "Gold Bonus", dmg_bonus: "Damage Bonus", loot_bonus: "Loot Bonus" };
              const BUFF_COLORS = { exp_bonus: "text-blue-400", gold_bonus: "text-yellow-400", dmg_bonus: "text-red-400", loot_bonus: "text-purple-400" };
              const BUFF_ICONS = { exp_bonus: Zap, gold_bonus: Coins, dmg_bonus: Swords, loot_bonus: Sparkles };
              return (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3 text-cyan-400">Active Scroll Buffs</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {activeBuffs.map((buff, i) => {
                      const BIcon = BUFF_ICONS[buff.type] || Zap;
                      const timeLeft = Math.max(0, new Date(buff.expires_at).getTime() - Date.now());
                      const h = Math.floor(timeLeft / 3600000);
                      const m = Math.floor((timeLeft % 3600000) / 60000);
                      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                      return (
                        <div key={i} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <BIcon className={`w-3.5 h-3.5 ${BUFF_COLORS[buff.type] || "text-cyan-400"}`} />
                            <span className="text-xs text-muted-foreground">{BUFF_LABELS[buff.type] || buff.type}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold font-mono ${BUFF_COLORS[buff.type] || "text-cyan-400"}`}>+{buff.value}%</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({timeStr})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Elemental Damage */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 text-orange-400">Elemental Damage</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "fireDmg",      emoji: "🔥", label: "Fire",      color: "text-orange-400" },
                  { key: "iceDmg",       emoji: "❄️", label: "Ice",        color: "text-cyan-400"   },
                  { key: "lightningDmg", emoji: "⚡", label: "Lightning", color: "text-yellow-300" },
                  { key: "poisonDmg",    emoji: "☠️", label: "Poison",    color: "text-green-400"  },
                  { key: "bloodDmg",     emoji: "🩸", label: "Blood",     color: "text-red-500"    },
                  { key: "sandDmg",      emoji: "🌪️", label: "Sand",      color: "text-amber-400"  },
                ].map(e => {
                  const val = derived?.[e.key] ?? 0;
                  return (
                    <div key={e.key} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-muted-foreground">{e.emoji} {e.label}</span>
                      <span className={`text-sm font-bold font-mono ${val > 0 ? e.color : "text-muted-foreground"}`}>
                        {val > 0 ? `+${val}%` : "0%"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

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