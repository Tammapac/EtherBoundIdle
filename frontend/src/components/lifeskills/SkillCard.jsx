import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Zap, Coins, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SKILL_META = {
  mining:    { icon: "⛏️", color: "text-orange-400", border: "border-orange-500/30", bg: "from-orange-500/10", label: "Mining"    },
  fishing:   { icon: "🎣", color: "text-blue-400",   border: "border-blue-500/30",   bg: "from-blue-500/10",   label: "Fishing"   },
  herbalism: { icon: "🌿", color: "text-green-400",  border: "border-green-500/30",  bg: "from-green-500/10",  label: "Herbalism" },
};

export default function SkillCard({ skill, onStart, onStop, onTick, onUpgrade, loading, lastDrop, locked }) {
  const meta = SKILL_META[skill.skill_type] || SKILL_META.mining;

  // --- Local live state ---
  const [liveGather, setLiveGather]   = useState(skill.gather_progress || 0);
  const [liveExp,    setLiveExp]      = useState(skill.exp || 0);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [dropFlash,  setDropFlash]    = useState(null);

  const tickRef       = useRef(null);
  const tickPending   = useRef(false);
  const lastTickTime  = useRef(Date.now());

  const cycleTime  = skill.cycle_duration || 20;   // seconds per full gather cycle
  const xpPerCycle = skill.xp_per_cycle   || 15;
  const expToNext  = skill.exp_to_next    || 100;
  const speedLvl   = skill.speed_level    || 1;
  const xpBoostLvl = skill.xp_boost_level || skill.luck_level || 1;
  const speedCost  = skill.speed_upgrade_cost || 50;
  const xpBoostCost = skill.xp_boost_upgrade_cost || skill.luck_upgrade_cost || 80;

  // Sync from server whenever skill data refreshes — but only reset gather bar
  // when the skill was just started or when the server reports a lower value
  // (level-up reset). This prevents the bar from jumping back on tab switch.
  const prevSkillId = useRef(skill.id);
  useEffect(() => {
    if (prevSkillId.current !== skill.id) {
      // Different skill, hard sync
      setLiveGather(skill.gather_progress || 0);
      setLiveExp(skill.exp || 0);
      prevSkillId.current = skill.id;
    } else {
      // Same skill — only update exp (server authoritative for level-ups)
      // and reset gather bar only if server reports it below current local value
      // (meaning a cycle completed server-side and bar was reset)
      setLiveExp(skill.exp || 0);
      setLiveGather(prev => {
        const serverVal = skill.gather_progress || 0;
        // If server progress is less than local, a cycle completed — sync to server
        if (serverVal < prev - 10) return serverVal;
        return prev;
      });
    }
    lastTickTime.current = Date.now();
    tickPending.current  = false;
  }, [skill.id, skill.gather_progress, skill.exp]);

  // ── LOCAL INTERPOLATION LOOP (100ms) ──────────────────────────────────────
  // Visually fills gathering bar and XP bar in real time between server ticks
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!skill.is_active) return;

    const INTERVAL_MS  = 100;
    const progressPerMs = 100 / (cycleTime * 1000); // % per ms
    const xpPerMs       = xpPerCycle / (cycleTime * 1000);

    tickRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickTime.current;
      lastTickTime.current = now;

      setLiveGather(prev => {
        const next = prev + progressPerMs * delta;
        // When bar visually fills, send a server tick
        if (next >= 100 && !tickPending.current) {
          tickPending.current = true;
          onTick(skill.skill_type);
        }
        return Math.min(next, 100);
      });

      setLiveExp(prev => Math.min(prev + xpPerMs * delta, expToNext));
    }, INTERVAL_MS);

    return () => clearInterval(tickRef.current);
  }, [skill.is_active, skill.skill_type, cycleTime, xpPerCycle, expToNext, onTick]);

  // Flash on new drop
  useEffect(() => {
    if (lastDrop) {
      setDropFlash(lastDrop);
      const t = setTimeout(() => setDropFlash(null), 1400);
      return () => clearTimeout(t);
    }
  }, [lastDrop]);

  const gatherPct = Math.min(liveGather, 100);
  const xpPct     = Math.min((liveExp / expToNext) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${meta.bg} to-transparent bg-card border ${meta.border} rounded-xl p-4 space-y-3 relative overflow-hidden transition-opacity ${locked ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* Drop flash */}
      <AnimatePresence>
        {dropFlash && (
          <motion.div
            key={dropFlash.ts}
            initial={{ opacity: 0, scale: 0.6, y: 0 }}
            animate={{ opacity: 1, scale: 1.1, y: -22 }}
            exit={{ opacity: 0, y: -44 }}
            transition={{ duration: 0.9 }}
            className="absolute top-3 right-3 text-xl pointer-events-none z-10 font-bold drop-shadow"
            style={{ color: RARITY_COLORS[dropFlash.rarity] || "#fff" }}
          >
            +1 {dropFlash.icon}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <p className={`font-bold ${meta.color}`}>{meta.label}</p>
            <p className="text-xs text-muted-foreground">Level {skill.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {skill.is_active && (
            <span className="flex items-center gap-1 text-xs text-green-400 animate-pulse">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Gathering
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {cycleTime.toFixed(1)}s/cycle
          </span>
        </div>
      </div>

      {/* ── GATHERING BAR (animated, loops) ── */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className={`font-semibold ${meta.color}`}>⚒ Gathering</span>
          <span className="text-muted-foreground">{gatherPct.toFixed(0)}%</span>
        </div>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${GATHER_BAR_COLOR[skill.skill_type] || "bg-orange-500"}`}
            style={{ width: `${gatherPct}%` }}
            transition={{ duration: 0.1 }}
          />
          {skill.is_active && (
            <motion.div
              className="absolute inset-0 bg-white/10 rounded-full"
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {skill.is_active ? `Next resource in ~${Math.max(0, ((100 - gatherPct) / 100) * cycleTime).toFixed(1)}s` : "Paused"}
        </p>
      </div>

      {/* ── XP BAR (slow, level progression) ── */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>✨ XP — Level {skill.level} → {skill.level + 1}</span>
          <span>{Math.floor(liveExp)} / {expToNext}</span>
        </div>
        <Progress value={xpPct} className="h-2 opacity-70" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {skill.is_active ? (
          <PixelButton variant="cancel" label="STOP" onClick={() => onStop(skill.skill_type)} disabled={loading} />
        ) : (
          <PixelButton variant="ok" label="START" onClick={() => onStart(skill.skill_type)} disabled={loading} />
        )}
        <Button size="sm" variant="ghost" className="gap-1 px-2" onClick={() => setShowUpgrades(v => !v)}>
          <TrendingUp className="w-3.5 h-3.5" />
          {showUpgrades ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* Upgrades Panel */}
      <AnimatePresence>
        {showUpgrades && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 pt-3 space-y-2">
              <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs font-semibold">Speed Lv.{speedLvl}</span>
                    {speedLvl >= 10 && <span className="text-xs text-accent">MAX</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">-8% cycle time per level</p>
                </div>
                <PixelButton
                  variant="ok"
                  label={speedLvl < 10 ? `UPGRADE (${speedCost.toLocaleString()}G)` : "MAX"}
                  disabled={loading || speedLvl >= 10}
                  onClick={() => onUpgrade(skill.skill_type, 'speed')}
                />
              </div>

              <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">📈</span>
                    <span className="text-xs font-semibold">XP Boost Lv.{xpBoostLvl}</span>
                    {xpBoostLvl >= 10 && <span className="text-xs text-accent">MAX</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">+10% XP gain per level</p>
                </div>
                <PixelButton
                  variant="ok"
                  label={xpBoostLvl < 10 ? `UPGRADE (${xpBoostCost.toLocaleString()}G)` : "MAX"}
                  disabled={loading || xpBoostLvl >= 10}
                  onClick={() => onUpgrade(skill.skill_type, 'xp_boost')}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const RARITY_COLORS = {
  common: "#9ca3af",
  uncommon: "#4ade80",
  rare: "#60a5fa",
  epic: "#c084fc",
  legendary: "#fbbf24",
  mythic: "#f87171",
  shiny: "#fde68a",
};

const GATHER_BAR_COLOR = {
  mining:    "bg-orange-500",
  fishing:   "bg-blue-500",
  herbalism: "bg-green-500",
};

// Extend SKILL_META fallback for safety
Object.assign(SKILL_META, {
  smelting: { icon: "🔥", color: "text-orange-400", border: "border-orange-500/30", bg: "from-orange-500/10", label: "Smelting" },
  cooking:  { icon: "🍳", color: "text-yellow-400", border: "border-yellow-500/30", bg: "from-yellow-500/10", label: "Cooking"  },
  alchemy:  { icon: "⚗️", color: "text-purple-400", border: "border-purple-500/30", bg: "from-purple-500/10", label: "Alchemy"  },
});