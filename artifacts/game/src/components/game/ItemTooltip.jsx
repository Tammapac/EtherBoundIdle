import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { canEquipItem, getAllowedClassesLabel } from "@/lib/equipmentSystem";
import { getItemSetInfo } from "@/lib/setSystem";
import { getItemIcon } from "@/lib/itemIcons";
import { calculateFinalStats } from "@/lib/statSystem";

const CLASS_NAMES = { warrior: "Warrior", mage: "Mage", ranger: "Ranger", rogue: "Rogue" };
const SUBTYPE_LABELS = {
  sword: "Sword", axe: "Axe", mace: "Mace", staff: "Staff", wand: "Wand",
  bow: "Bow", crossbow: "Crossbow", dagger: "Dagger", blade: "Blade",
  heavy: "Heavy Armor", medium: "Medium Armor", light: "Light Armor",
};

const STAT_LABELS = {
  strength: "Strength",
  dexterity: "Dexterity",
  intelligence: "Intelligence",
  vitality: "Vitality",
  luck: "Luck",
  damage: "Damage",
  defense: "Defense",
  hp_bonus: "Max HP",
  mp_bonus: "Max MP",
  crit_chance: "Crit Chance",
  crit_dmg_pct: "Crit Damage",
  lifesteal: "Lifesteal",
  hp_regen: "HP Regen",
  mp_regen: "MP Regen",
  evasion: "Evasion",
  block_chance: "Block Chance",
  attack_speed: "Attack Speed",
  gold_gain_pct: "Gold Gain",
  exp_gain_pct: "EXP Gain",
};

const STAT_SUFFIXES = {
  crit_chance: "%",
  crit_dmg_pct: "%",
  lifesteal: "%",
  evasion: "%",
  block_chance: "%",
  gold_gain_pct: "%",
  exp_gain_pct: "%",
};

const STAT_PREFIXES = {
  hp_regen: "",
  mp_regen: "",
  attack_speed: "",
};

const STAT_INLINE_SUFFIX = {
  hp_regen: "/s",
  mp_regen: "/s",
  attack_speed: "x",
};

export default function ItemTooltip({ item, characterLevel, compareItem = null, characterClass = null, equippedItems = [], character = null }) {
  if (!item) return null;

  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
  const Icon = getItemIcon(item);
  const levelReq = item.level_req || 1;
  const levelOk = characterLevel >= levelReq;
  const classCheck = characterClass ? canEquipItem(characterClass, item) : { allowed: true, reason: "" };
  const setInfo = getItemSetInfo(item.name);
  const isSetItem = !!setInfo || !!item.set_key;

  // Compute derived stat delta when equipping this item
  let derivedDelta = null;
  if (character && !item.equipped && (item.type !== "consumable" && item.type !== "material")) {
    try {
      const currentStats = calculateFinalStats(character, equippedItems);
      // Simulate equipping: replace slot item with this one
      const simulatedEquipped = equippedItems.filter(i => i.type !== item.type).concat([item]);
      const newStats = calculateFinalStats(character, simulatedEquipped);
      const d = currentStats.derived;
      const n = newStats.derived;
      const keys = ["attackPower", "maxHp", "maxMp", "critChance", "evasion", "blockChance", "damageReduction", "hpRegen", "mpRegen"];
      const labels = { attackPower: "Attack Power", maxHp: "Max HP", maxMp: "Max MP", critChance: "Crit Chance", evasion: "Evasion", blockChance: "Block", damageReduction: "Damage Red.", hpRegen: "HP Regen", mpRegen: "MP Regen" };
      const suffixes = { critChance: "%", evasion: "%", blockChance: "%", damageReduction: "%", hpRegen: "/s", mpRegen: "/s" };
      derivedDelta = keys.map(k => ({ key: k, label: labels[k], diff: Math.round((n[k] - d[k]) * 10) / 10, suffix: suffixes[k] || "" })).filter(x => x.diff !== 0);
    } catch {}
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${rarity.bg} border ${rarity.border} ${isSetItem ? "ring-1 ring-yellow-400/40" : ""}`}>
          <Icon className={`w-5 h-5 ${rarity.color}`} />
        </div>
        <div>
          <h3 className={`font-bold text-base ${rarity.color}`}>{item.name}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className={`text-xs ${rarity.color} ${rarity.border}`}>
              {rarity.label}
            </Badge>
            {item.subtype && (
              <span className="text-xs text-muted-foreground capitalize">{SUBTYPE_LABELS[item.subtype] || item.subtype}</span>
            )}
            <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
            {item.item_level && (
              <Badge variant="outline" className="text-xs text-primary border-primary/30">iLvl {item.item_level}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Set Badge */}
      {(item.set_name || setInfo?.set?.name) && (
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border bg-yellow-500/10 border-yellow-500/30 text-yellow-300`}>
          <span>{setInfo?.set?.icon || "✨"}</span>
          <span className="font-semibold">{item.set_name || setInfo?.set?.name}</span>
          <span className="text-yellow-400/60 ml-auto">Set Item</span>
        </div>
      )}

      {/* Class restriction */}
      {(() => {
        const allowedLabel = getAllowedClassesLabel(item);
        return allowedLabel && allowedLabel !== "All Classes" ? (
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
            classCheck.allowed ? "bg-muted/50 text-muted-foreground" : "bg-destructive/10 border border-destructive/30 text-destructive"
          }`}>
            {!classCheck.allowed && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{classCheck.allowed ? `Usable by: ${allowedLabel}` : `Not usable by your class · ${allowedLabel} only`}</span>
          </div>
        ) : null;
      })()}

      {/* Upgrade / Star / Awakened Badges */}
      {((item.upgrade_level || 0) > 0 || (item.star_level || 0) > 0 || item.is_awakened) && (
        <div className="flex items-center gap-2 flex-wrap">
          {(item.upgrade_level || 0) > 0 && (
            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
              +{item.upgrade_level} Enhanced
            </Badge>
          )}
          {(item.star_level || 0) > 0 && (
            <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {"★".repeat(item.star_level)} {item.star_level}/7
            </Badge>
          )}
          {item.is_awakened && (
            <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse">
              ✨ AWAKENED
            </Badge>
          )}
        </div>
      )}

      {/* Level Requirement */}
      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
        levelOk ? "bg-muted/50 text-muted-foreground" : "bg-destructive/10 border border-destructive/30 text-destructive"
      }`}>
        {!levelOk && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
        <span>
          Requires Level <strong>{levelReq}</strong>
          {!levelOk && ` (You are level ${characterLevel})`}
        </span>
      </div>

      {/* Stats */}
      {item.stats && Object.keys(item.stats).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Stats</p>
          {Object.entries(item.stats).map(([k, v]) => {
          if (!v) return null;
          const compareVal = compareItem?.stats?.[k] || 0;
          const diff = v - compareVal;
          const label = STAT_LABELS[k] || k.replace(/_/g, " ");
          const suffix = STAT_SUFFIXES[k] || STAT_INLINE_SUFFIX[k] || "";
          return (
            <div key={k} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground capitalize">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">+{v}{suffix}</span>
                {compareItem && diff !== 0 && (
                  <span className={`text-xs flex items-center gap-0.5 ${diff > 0 ? "text-green-400" : "text-red-400"}`}>
                    {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {diff > 0 ? "+" : ""}{diff}
                  </span>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Derived stat preview when equipping */}
      {derivedDelta && derivedDelta.length > 0 && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-2 space-y-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Equip Preview</p>
          {derivedDelta.map(({ key, label, diff, suffix }) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className={`font-bold flex items-center gap-0.5 ${diff > 0 ? "text-green-400" : "text-red-400"}`}>
                {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {diff > 0 ? "+" : ""}{diff}{suffix}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sell price */}
      {item.sell_price > 0 && (
        <p className="text-xs text-accent border-t border-border pt-2">
          Sell: {item.sell_price} Gold
        </p>
      )}
    </div>
  );
}