import React from "react";
import { Shield, Swords, Flame, Droplets, Snowflake, Skull, Zap, Wind } from "lucide-react";

const ELEMENT_ICONS = {
  fire: Flame,
  poison: Skull,
  bleed: Droplets,
  ice: Snowflake,
  lightning: Zap,
  wind: Wind,
  physical: Swords,
  arcane: Zap,
  blood: Droplets,
  sand: Wind,
};

const ELEMENT_COLORS = {
  fire: { border: "border-orange-500/50", bg: "bg-orange-500/20", text: "text-orange-400" },
  poison: { border: "border-green-500/50", bg: "bg-green-500/20", text: "text-green-400" },
  bleed: { border: "border-rose-500/50", bg: "bg-rose-500/20", text: "text-rose-400" },
  ice: { border: "border-cyan-500/50", bg: "bg-cyan-500/20", text: "text-cyan-400" },
  lightning: { border: "border-yellow-500/50", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  wind: { border: "border-teal-500/50", bg: "bg-teal-500/20", text: "text-teal-400" },
  physical: { border: "border-gray-500/50", bg: "bg-gray-500/20", text: "text-gray-400" },
  arcane: { border: "border-purple-500/50", bg: "bg-purple-500/20", text: "text-purple-400" },
  blood: { border: "border-red-500/50", bg: "bg-red-500/20", text: "text-red-400" },
  sand: { border: "border-amber-500/50", bg: "bg-amber-500/20", text: "text-amber-400" },
};

const BUFF_STYLES = {
  defense: { icon: Shield, border: "border-blue-500/50", bg: "bg-blue-500/20", text: "text-blue-400", label: "DEF+" },
  attack: { icon: Swords, border: "border-orange-500/50", bg: "bg-orange-500/20", text: "text-orange-400", label: "ATK+" },
};

/**
 * CombatEffects - Shows active buffs on player and debuffs/DoTs on enemy.
 *
 * playerBuffs: [{ type: "defense"|"attack", turnsLeft: number, skillName: string }]
 * enemyDots: [{ element: string, dmgPerTurn: number, turnsLeft: number }]
 * modifiers: [{ type: "buff"|"debuff", name: string }] (from Fields)
 */
export default function CombatEffects({ playerBuffs = [], enemyDots = [], modifiers = [], compact = false }) {
  const hasPlayer = playerBuffs.length > 0 || modifiers.filter(m => m.type === "buff").length > 0;
  const hasEnemy = enemyDots.length > 0 || modifiers.filter(m => m.type === "debuff").length > 0;

  if (!hasPlayer && !hasEnemy) return null;

  const size = compact ? "w-5 h-5" : "w-6 h-6";
  const iconSize = compact ? "w-2.5 h-2.5" : "w-3 h-3";
  const fontSize = compact ? "text-[7px]" : "text-[8px]";

  return (
    <div className="flex flex-col gap-1">
      {/* Player buffs */}
      {hasPlayer && (
        <div className="flex gap-0.5 flex-wrap">
          {playerBuffs.map((buff, i) => {
            const style = BUFF_STYLES[buff.type] || BUFF_STYLES.defense;
            const Icon = style.icon;
            return (
              <div
                key={`buff-${i}`}
                className={`${size} rounded border ${style.border} ${style.bg} flex items-center justify-center relative`}
                title={`${buff.skillName || style.label} (${buff.turnsLeft}T)`}
              >
                <Icon className={`${iconSize} ${style.text}`} />
                {buff.turnsLeft > 0 && (
                  <span className={`absolute -bottom-1 -right-1 ${fontSize} font-bold ${style.text} bg-black/80 rounded px-0.5 leading-none`}>
                    {buff.turnsLeft}
                  </span>
                )}
              </div>
            );
          })}
          {modifiers.filter(m => m.type === "buff").map((mod, i) => (
            <div
              key={`mod-buff-${i}`}
              className={`${size} rounded border border-green-500/50 bg-green-500/20 flex items-center justify-center`}
              title={`${mod.name}: ${mod.description || ""}`}
            >
              <Zap className={`${iconSize} text-green-400`} />
            </div>
          ))}
        </div>
      )}

      {/* Enemy debuffs/DoTs */}
      {hasEnemy && (
        <div className="flex gap-0.5 flex-wrap">
          {enemyDots.map((dot, i) => {
            const elem = dot.element || "physical";
            const colors = ELEMENT_COLORS[elem] || ELEMENT_COLORS.physical;
            const Icon = ELEMENT_ICONS[elem] || Flame;
            return (
              <div
                key={`dot-${i}`}
                className={`${size} rounded border ${colors.border} ${colors.bg} flex items-center justify-center relative`}
                title={`${elem} DoT: ${dot.dmgPerTurn}/turn (${dot.turnsLeft}T left)`}
              >
                <Icon className={`${iconSize} ${colors.text}`} />
                {dot.turnsLeft > 0 && (
                  <span className={`absolute -bottom-1 -right-1 ${fontSize} font-bold ${colors.text} bg-black/80 rounded px-0.5 leading-none`}>
                    {dot.turnsLeft}
                  </span>
                )}
              </div>
            );
          })}
          {modifiers.filter(m => m.type === "debuff").map((mod, i) => (
            <div
              key={`mod-debuff-${i}`}
              className={`${size} rounded border border-red-500/50 bg-red-500/20 flex items-center justify-center`}
              title={`${mod.name}: ${mod.description || ""}`}
            >
              <Skull className={`${iconSize} text-red-400`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
