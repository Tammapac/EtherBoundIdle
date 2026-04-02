import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { canEquipItem, getAllowedClassesLabel } from "@/lib/equipmentSystem";
import { getItemSetInfo, ITEM_SETS } from "@/lib/setSystem";
import { getItemIcon } from "@/lib/itemIcons";
import { calculateFinalStats } from "@/lib/statSystem";
import { getItemProcs, PROC_TYPES } from "@/lib/procSystem";
import { getUniqueItemDef } from "@/lib/uniqueItems";

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
  fire_dmg: "Fire Damage",
  ice_dmg: "Ice Damage",
  lightning_dmg: "Lightning Damage",
  poison_dmg: "Poison Damage",
  blood_dmg: "Blood Damage",
  sand_dmg: "Sand Damage",
};

const STAT_SUFFIXES = {
  crit_chance: "%",
  crit_dmg_pct: "%",
  lifesteal: "%",
  evasion: "%",
  block_chance: "%",
  gold_gain_pct: "%",
  exp_gain_pct: "%",
  fire_dmg: "%",
  ice_dmg: "%",
  lightning_dmg: "%",
  poison_dmg: "%",
  blood_dmg: "%",
  sand_dmg: "%",
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

const RUNE_STAT_LABELS = {
  attack_pct: "ATK%", crit_chance: "Crit%", crit_dmg_pct: "Crit DMG%",
  boss_dmg_pct: "Boss DMG%", attack_speed: "ATK Speed%", lifesteal: "Lifesteal%",
  defense_pct: "DEF%", block_chance: "Block%", evasion: "Evasion%",
  hp_flat: "HP", mp_flat: "MP", hp_regen: "HP Regen", mp_regen: "MP Regen",
  exp_pct: "EXP%", gold_pct: "Gold%", drop_chance: "Drop%",
  fire_dmg: "Fire%", ice_dmg: "Ice%", lightning_dmg: "Lightning%",
  poison_dmg: "Poison%", blood_dmg: "Blood%", sand_dmg: "Sand%",
};

export default function ItemTooltip({ item, characterLevel, compareItem = null, characterClass = null, equippedItems = [], character = null, socketedRunes = [] }) {
  if (!item) return null;

  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
  const Icon = getItemIcon(item);
  const levelReq = item.level_req || 1;
  const levelOk = characterLevel >= levelReq;
  const classCheck = characterClass ? canEquipItem(characterClass, item) : { allowed: true, reason: "" };
  const setInfo = getItemSetInfo(item.name);
  const isSetItem = !!setInfo || !!item.set_key;
  const uniqueDef = getUniqueItemDef(item.name);
  const isUnique = !!uniqueDef || !!item.is_unique;

  // Get proc effects
  const itemProcs = getItemProcs(item);

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
        <div className={`p-2 rounded-lg ${rarity.bg} border ${rarity.border} ${isSetItem ? "ring-1 ring-yellow-400/40" : ""} ${isUnique ? "ring-1 ring-orange-400/60" : ""}`}>
          <Icon className={`w-5 h-5 ${rarity.color}`} />
        </div>
        <div>
          <h3 className={`font-bold text-base ${isUnique ? "text-orange-300" : rarity.color}`}>{item.name}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {isUnique && (
              <Badge variant="outline" className="text-xs text-orange-300 border-orange-400/50 bg-orange-500/10">
                UNIQUE
              </Badge>
            )}
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

      {/* Unique Item Lore */}
      {uniqueDef?.lore && (
        <p className="text-xs italic text-muted-foreground/80 px-2 border-l-2 border-orange-400/30">
          {uniqueDef.lore}
        </p>
      )}

      {/* Set Badge + Bonuses */}
      {(item.set_name || setInfo?.set?.name) && (() => {
        const setKey = setInfo?.setKey || item.set_key;
        const set = setInfo?.set || (setKey && ITEM_SETS[setKey]);
        const equippedCount = set ? equippedItems.filter(eq => set.pieces.includes(eq.name)).length : 0;
        return (
          <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-yellow-300">
              <span>{set?.icon || "✨"}</span>
              <span className="font-semibold">{set?.name || item.set_name}</span>
              <span className="text-yellow-400/60 ml-auto">{equippedCount}/{set?.pieces?.length || 5}</span>
            </div>
            {set?.bonuses && (
              <div className="space-y-1">
                {Object.entries(set.bonuses).sort(([a], [b]) => Number(a) - Number(b)).map(([threshold, bonus]) => {
                  const active = equippedCount >= Number(threshold);
                  return (
                    <div key={threshold} className={`flex items-start gap-1.5 text-[11px] ${active ? "text-yellow-300" : "text-muted-foreground/50"}`}>
                      <span className="flex-shrink-0 mt-px">{active ? "✓" : "○"}</span>
                      <span>
                        <span className="font-semibold">({threshold})</span> {bonus.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {set?.pieces && (
              <div className="space-y-0.5 pt-1 border-t border-yellow-500/20">
                {set.pieces.map((piece, i) => {
                  const owned = equippedItems.some(eq => eq.name === piece);
                  return (
                    <p key={i} className={`text-[10px] ${owned ? "text-yellow-300" : "text-muted-foreground/40"}`}>
                      {owned ? "●" : "○"} {piece}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Proc Effects */}
      {itemProcs.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-2 space-y-1.5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Special Effects</p>
          {itemProcs.map((proc, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="flex-shrink-0 mt-0.5">{proc.icon}</span>
              <div>
                <span className={`font-semibold ${proc.color}`}>{proc.name}</span>
                <p className="text-muted-foreground mt-0.5">{proc.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Socketed Runes */}
      {(() => {
        const extraData = item.extraData || item.extra_data || {};
        const maxSlots = extraData.rune_slots || 0;
        const itemRunes = socketedRunes.filter(r => (r.itemId || r.item_id) === item.id);
        if (maxSlots === 0 && itemRunes.length === 0) return null;
        return (
          <div className="border border-purple-500/30 bg-purple-500/5 rounded-lg p-2 space-y-1.5">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
              Rune Slots ({itemRunes.length}/{maxSlots})
            </p>
            {itemRunes.map((rune, i) => {
              const rarityConf = RARITY_CONFIG[rune.rarity] || RARITY_CONFIG.common;
              return (
                <div key={rune.id || i} className="flex items-start gap-2 text-xs">
                  <span className="flex-shrink-0 mt-0.5">🔮</span>
                  <div>
                    <span className={`font-semibold ${rarityConf.color}`}>{rune.name}</span>
                    <span className="text-muted-foreground"> Lv.{rune.level || 1}</span>
                    <p className="text-muted-foreground">
                      {RUNE_STAT_LABELS[rune.mainStat || rune.main_stat] || rune.mainStat || rune.main_stat} +{rune.mainValue || rune.main_value}
                      {(rune.subStats || rune.sub_stats || []).map((s, j) => (
                        <span key={j}> · {RUNE_STAT_LABELS[s.stat] || s.stat} +{s.value}</span>
                      ))}
                    </p>
                  </div>
                </div>
              );
            })}
            {Array.from({ length: maxSlots - itemRunes.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-2 text-xs text-muted-foreground/40">
                <span>○</span> <span>Empty Slot</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Unique Effect Summary */}
      {(uniqueDef?.uniqueEffect || item.uniqueEffect) && (
        <div className="border border-orange-500/30 bg-orange-500/5 rounded-lg px-3 py-2">
          <p className="text-xs font-bold text-orange-300">{uniqueDef?.uniqueEffect || item.uniqueEffect}</p>
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
