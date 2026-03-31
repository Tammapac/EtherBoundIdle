import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Swords, ShieldCheck, Heart, Star, Zap, Wind,
  Shield, RefreshCw, Droplets, Coins, TrendingUp,
  Flame, Clock, Activity
} from "lucide-react";

const STAT_ROWS = [
  { key: "attackPower",    label: "Attack",      icon: Swords,     color: "text-red-400",     format: v => v,         tooltip: "Physical damage per hit. Scales with class primary stat." },
  { key: "magicAttack",    label: "Magic Atk",   icon: Swords,     color: "text-purple-400",  format: v => v,         tooltip: "Magic damage per hit. Scales with Intelligence." },
  { key: "critChance",     label: "Crit %",      icon: Star,       color: "text-yellow-400",  format: v => `${v}%`,   tooltip: "Chance to land a critical hit. Scales with DEX and Luck. Hard cap 50%." },
  { key: "critDmgPct",     label: "Crit DMG",    icon: Flame,      color: "text-orange-400",  format: v => `${v}%`,   tooltip: "Critical hit damage multiplier. Base 150%. Scales with Luck and gear." },
  { key: "attackSpeed",    label: "Atk Speed",   icon: Clock,      color: "text-amber-400",   format: v => `${v.toFixed(2)}x`, tooltip: "Attack speed multiplier. Scales with DEX and gear. Max 3.0x." },
  { key: "rawDefense",     label: "Defense",     icon: ShieldCheck,color: "text-blue-400",    format: v => v,         tooltip: "Reduces incoming damage. Mitigation = DEF / (DEF + 100).", sub: d => `${d.damageReduction}% reduction` },
  { key: "maxHp",          label: "Max HP",      icon: Heart,      color: "text-green-400",   format: v => v,         tooltip: "Maximum health points. Scales with VIT and level." },
  { key: "maxMp",          label: "Max MP",      icon: Zap,        color: "text-blue-300",    format: v => v,         tooltip: "Maximum mana points. Scales with INT and level." },
  { key: "hpRegen",        label: "HP Regen",    icon: RefreshCw,  color: "text-emerald-400", format: v => `${v}/s`,  tooltip: "HP restored per second. Scales with VIT." },
  { key: "mpRegen",        label: "MP Regen",    icon: Droplets,   color: "text-sky-400",     format: v => `${v}/s`,  tooltip: "Mana restored per second. Scales with INT." },
  { key: "evasion",        label: "Evasion",     icon: Wind,       color: "text-cyan-400",    format: v => `${v}%`,   tooltip: "Chance to completely dodge an attack. Scales with DEX. Hard cap 40%." },
  { key: "blockChance",    label: "Block",       icon: Shield,     color: "text-violet-400",  format: v => `${v}%`,   tooltip: "Chance to reduce incoming damage by 60%. Scales with STR and VIT.", sub: d => d.blockChance > 0 ? `60% dmg reduced` : null },
  { key: "lifesteal",      label: "Lifesteal",   icon: Activity,   color: "text-rose-400",    format: v => `${v}%`,   tooltip: "Restores HP equal to this % of damage dealt.", hideIfZero: true },
  { key: "goldGainPct",    label: "Gold Gain",   icon: Coins,      color: "text-amber-400",   format: v => `+${v}%`,  tooltip: "Increases all gold received from enemies.", hideIfZero: true },
  { key: "expGainPct",     label: "EXP Gain",    icon: TrendingUp, color: "text-lime-400",    format: v => `+${v}%`,  tooltip: "Increases all EXP received from enemies.", hideIfZero: true },
];

const ELEMENTAL_STATS = [
  { key: "fireDmg",      label: "🔥 Fire",      color: "text-orange-400" },
  { key: "iceDmg",       label: "❄️ Ice",        color: "text-cyan-400"   },
  { key: "lightningDmg", label: "⚡ Lightning",  color: "text-yellow-300" },
  { key: "poisonDmg",    label: "☠️ Poison",     color: "text-green-400"  },
  { key: "bloodDmg",     label: "🩸 Blood",      color: "text-red-500"    },
  { key: "sandDmg",      label: "🌪️ Sand",       color: "text-amber-400"  },
];



export default function CombatStatsPanel({ derived, character }) {
  if (!derived) return null;

  const visible = STAT_ROWS.filter(row => {
    if (row.hideIfZero && !derived[row.key]) return false;
    return true;
  });

  const activeElemStats = ELEMENTAL_STATS.filter(e => (derived?.[e.key] ?? 0) > 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {visible.map(row => {
          const val = derived[row.key] ?? 0;
          const Icon = row.icon;
          return (
            <Tooltip key={row.key}>
              <TooltipTrigger asChild>
                <div className="bg-muted/50 rounded-lg p-3 text-center cursor-help hover:bg-muted/70 transition-colors">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${row.color}`} />
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className={`font-bold ${row.color}`}>{row.format(val)}</p>
                  {row.sub && row.sub(derived) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub(derived)}</p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs">
                {row.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {activeElemStats.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground font-semibold mb-2">⚡ Elemental Bonuses</p>
          <div className="flex flex-wrap gap-2">
            {activeElemStats.map(e => (
              <div key={e.key} className="bg-muted/50 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-sm">{e.label.split(" ")[0]}</span>
                <span className="text-xs text-muted-foreground">{e.label.split(" ").slice(1).join(" ")}</span>
                <span className={`font-bold text-sm ${e.color}`}>+{derived[e.key]}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}