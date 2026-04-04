import React, { useState, useEffect } from "react";
import { Zap, Coins, Swords, Sparkles, Timer } from "lucide-react";

const BUFF_CONFIG = {
  exp_bonus:  { label: "EXP",  icon: Zap,      color: "text-blue-400",   bg: "bg-blue-500/20 border-blue-500/40" },
  gold_bonus: { label: "Gold", icon: Coins,     color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/40" },
  dmg_bonus:  { label: "DMG",  icon: Swords,    color: "text-red-400",    bg: "bg-red-500/20 border-red-500/40" },
  loot_bonus: { label: "Loot", icon: Sparkles,  color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/40" },
};

function formatTimeLeft(ms) {
  if (ms <= 0) return "0:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ActiveBuffsBar({ character }) {
  const [, setTick] = useState(0);
  const extra = character?.extraData || character?.extra_data || {};
  const buffs = (extra.active_buffs || []).filter(
    b => new Date(b.expires_at).getTime() > Date.now()
  );

  // Tick every second to update countdown
  useEffect(() => {
    if (buffs.length === 0) return;
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [buffs.length]);

  if (buffs.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-card/80 border-b border-border/50 overflow-x-auto">
      <Timer className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex-shrink-0">Active:</span>
      {buffs.map((buff, i) => {
        const cfg = BUFF_CONFIG[buff.type] || BUFF_CONFIG.exp_bonus;
        const Icon = cfg.icon;
        const timeLeft = Math.max(0, new Date(buff.expires_at).getTime() - Date.now());
        return (
          <div
            key={i}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg.bg} flex-shrink-0`}
            title={buff.source || cfg.label}
          >
            <Icon className={`w-3 h-3 ${cfg.color}`} />
            <span className={cfg.color}>+{buff.value}% {cfg.label}</span>
            <span className="text-muted-foreground">{formatTimeLeft(timeLeft)}</span>
          </div>
        );
      })}
    </div>
  );
}
