import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Backpack, Swords, ShieldCheck, Crown, Footprints, CircleDot,
  Gem, Coins, ArrowUpRight, FlaskConical, Package, Hand,
  Heart, Zap, Shield, Crosshair, Wind, Flame,
  Droplet, Snowflake, Skull, User, Sparkles, Star, Egg
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getItemIcon, getItemSprite } from "@/lib/itemIcons";
import { RARITY_CONFIG } from "@/lib/gameData";
import { canEquipItem, validateEquip, getAllowedClassesLabel, EQUIPMENT_SLOTS, SLOT_LABELS, RARITY_SELL_PRICES } from "@/lib/equipmentSystem";
import { calculateFinalStats } from "@/lib/statSystem";
import { aggregateSetStats } from "@/lib/setSystem";
import ItemTooltip from "@/components/game/ItemTooltip";
import { getUniqueItemDef } from "@/lib/uniqueItems";
import SetCollectionPanel from "@/components/game/SetCollectionPanel";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

const TYPE_ICONS = {
  weapon: Swords, armor: ShieldCheck, helmet: Crown, gloves: Hand,
  boots: Footprints, ring: CircleDot, amulet: Gem,
  consumable: FlaskConical, material: Package,
};

const SLOT_ORDER = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

// ─── Hover Tooltip ──────────────────────────────────────────────────────────

function HoverTooltip({ item, character, equipped, triggerRef, allRunes = [] }) {
  if (!item || !triggerRef?.current) return null;
  const rect = triggerRef.current.getBoundingClientRect();
  const tooltipW = 264;
  const tooltipH = 320;
  const margin = 8;

  const spaceRight = window.innerWidth - rect.right;
  let left = spaceRight >= tooltipW + margin
    ? rect.right + margin
    : rect.left - tooltipW - margin;
  left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

  let top = rect.top;
  top = Math.max(margin, Math.min(top, window.innerHeight - tooltipH - margin));

  return (
    <div className="fixed z-[100] pointer-events-none" style={{ top, left, maxHeight: "80vh" }}>
      <div className="bg-card border border-border rounded-lg p-3 w-64 shadow-xl overflow-y-auto max-h-[80vh]">
        <ItemTooltip
          item={item}
          characterLevel={character?.level}
          characterClass={character?.class}
          compareItem={!item.equipped ? equipped.find(i => i.type === item.type && i.id !== item.id) : null}
          equippedItems={equipped}
          character={character}
          socketedRunes={allRunes}
        />
      </div>
    </div>
  );
}

// ─── Item Card ──────────────────────────────────────────────────────────────

const CONSUMABLE_DESCRIPTIONS = {
  hourglass: "Resets all dungeon entries",
  scroll_exp: "Boosts EXP gain for 2 hours",
  scroll_gold: "Boosts gold gain for 2 hours",
  scroll_dmg: "Boosts damage for 2 hours",
  scroll_loot: "Boosts loot drops for 2 hours",
  dungeon_ticket: "Grants 1 bonus dungeon entry",
  pet_egg: "Hatch to receive a pet",
  pet_egg_shiny: "Hatch to receive a shiny pet",
  upgrade_stone: "Used to upgrade equipment",
  pet_incubator: "Required to hatch pet eggs",
};

const CONSUMABLE_DETAILS = {
  hourglass:      { effect: "Resets all dungeon entries to 0", icon: "⏳" },
  scroll_exp:     { effect: "+50% EXP gain from combat", duration: "2 hours", icon: "📜" },
  scroll_gold:    { effect: "+50% Gold gain from combat", duration: "2 hours", icon: "📜" },
  scroll_dmg:     { effect: "+25% Damage dealt in combat", duration: "2 hours", icon: "📜" },
  scroll_loot:    { effect: "+25% Loot drop quality", duration: "2 hours", icon: "📜" },
  dungeon_ticket: { effect: "+1 Bonus dungeon entry (permanent)", icon: "🎟️" },
  pet_egg:        { effect: "Use in Pets tab to start hatching", icon: "🥚" },
  pet_egg_shiny:  { effect: "Use in Pets tab to hatch a Mythic pet", icon: "✨" },
  upgrade_stone:  { effect: "Used to upgrade equipment at the forge", icon: "🔧" },
  pet_incubator:  { effect: "Required to start hatching a pet egg in the Pets tab", icon: "🔬" },
};

function getConsumableDesc(item, forCard = false) {
  const extra = item.extraData || item.extra_data || {};
  // For currency items, only show description in the detail modal (not on the small card)
  if (extra.is_currency && extra.description) return forCard ? "" : extra.description;
  const cType = extra.consumableType || extra.materialType || "";
  return CONSUMABLE_DESCRIPTIONS[cType] || "";
}

function ConsumableDetail({ item }) {
  const extra = item.extraData || item.extra_data || {};
  const cType = extra.consumableType || extra.materialType || "";
  const detail = CONSUMABLE_DETAILS[cType];
  if (!detail) return null;
  const stats = item.stats || {};
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-1.5">
      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Effect</p>
      <p className="text-sm text-foreground">{detail.icon} {detail.effect}</p>
      {stats.bonus_value && (
        <p className="text-xs text-amber-400">Bonus: +{stats.bonus_value}%</p>
      )}
      {detail.duration && (
        <p className="text-xs text-muted-foreground">Duration: {detail.duration}</p>
      )}
    </div>
  );
}

function ItemCard({ item, character, equipped, onSelect, rarity, canEquip, isNew, onMarkSeen, allRunes = [] }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const Icon = getItemIcon(item);
  const isConsumableOrMaterial = item.type === "consumable" || item.type === "material";
  const levelOk = character.level >= (item.level_req || 1);
  const classOk = canEquipItem(character.class, item).allowed;
  const isStack = item.stackCount > 1;
  const itemLevel = item.item_level;
  const isSetItem = item.rarity === "set";
  const isUnique = !!item.is_unique || !!getUniqueItemDef(item.name) || (item.proc_effects && item.proc_effects.length > 0);
  const extraData = item.extraData || item.extra_data || {};
  const runeSlots = extraData.rune_slots || 0;

  // Clean card for consumables/materials
  if (isConsumableOrMaterial) {
    const desc = getConsumableDesc(item, true);
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        onClick={() => onSelect(item)}
        onMouseEnter={() => { setHovered(true); if (isNew && onMarkSeen) onMarkSeen(item.id); }}
        onMouseLeave={() => setHovered(false)}
        className={`relative p-3 text-left transition-all overflow-visible ${item.rarity === "shiny" ? "ring-1 ring-yellow-400/50" : ""}`}
        style={{ background: "#0d0d1a", border: "2px solid #2a1f5c", boxShadow: "2px 2px 0 #1a1040" }}
      >
        {/* Corner accent dots */}
        <span className="absolute -top-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -top-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -bottom-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -bottom-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        {isStack && (
          <span className="absolute top-1.5 right-1.5 bg-green-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
            x{item.stackCount}
          </span>
        )}
        {isNew && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white font-bold leading-none animate-pulse" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", padding: "2px 4px" }}>
            NEW
          </span>
        )}
        <div className="flex items-center gap-2.5 mb-1">
          {getItemSprite(item) ? (
            <img src={getItemSprite(item)} alt="" className="w-12 h-12 flex-shrink-0 sprite-outline" style={{ imageRendering: "pixelated" }} />
          ) : (
            <Icon className={`w-10 h-10 ${rarity.color} flex-shrink-0`} />
          )}
          <div className="flex-1 min-w-0">
            <span className={`${rarity.color} truncate block`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>{item.name}</span>
            {desc && <span className="text-[10px] leading-tight block" style={{ color: "#6b6a9a" }}>{desc}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <span className={`${rarity.color}`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid currentColor", padding: "2px 5px" }}>{rarity.label}</span>
        </div>
      </motion.button>
    );
  }

  return (
    <>
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        onClick={() => onSelect(item)}
        onMouseEnter={() => { setHovered(true); if (isNew && onMarkSeen) onMarkSeen(item.id); }}
        onMouseLeave={() => setHovered(false)}
        className={`relative p-3 text-left transition-all overflow-visible ${
          !canEquip ? "opacity-60" : ""
        } ${item.rarity === "shiny" ? "ring-1 ring-yellow-400/50" : ""} ${isSetItem ? "ring-1 ring-cyan-400/50" : ""} ${isUnique ? "ring-1 ring-orange-400/50" : ""} ${item.is_awakened ? "outline outline-2 outline-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.5),0_0_4px_rgba(168,85,247,0.3)] animate-pulse" : ""}`}
        style={{
          background: "#0d0d1a",
          border: item.equipped ? `2px solid currentColor` : "2px solid #2a1f5c",
          boxShadow: "2px 2px 0 #1a1040",
        }}
      >
        {/* Corner accent dots */}
        <span className="absolute -top-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -top-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -bottom-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        <span className="absolute -bottom-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
        {isStack && (
          <span className="absolute top-1.5 right-1.5 bg-green-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
            x{item.stackCount}
          </span>
        )}
        {isNew && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white font-bold leading-none animate-pulse" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", padding: "2px 4px" }}>
            NEW
          </span>
        )}
        <div className="flex items-center gap-2 mb-1">
          <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
            {getItemSprite(item) ? (
              <img src={getItemSprite(item)} alt="" className="w-12 h-12 sprite-outline" style={{ imageRendering: "pixelated" }} />
            ) : (
              <Icon className={`w-10 h-10 ${rarity.color}`} />
            )}
            {itemLevel && (
              <span className={`absolute -bottom-1 -right-1 font-bold leading-none px-0.5 ${rarity.color} bg-background border border-current`} style={{ fontSize: "7px" }}>
                {itemLevel}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="truncate block" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "#e0e0ff" }}>{item.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {(item.upgrade_level || 0) > 0 && (
                <span className="text-green-400 border border-green-500/30 px-1 leading-tight" style={{ fontSize: "7px", fontFamily: "'Press Start 2P', monospace" }}>
                  +{item.upgrade_level}
                </span>
              )}
              <span className="text-yellow-400 tracking-tight leading-none text-[9px]">
                {Array.from({length: 7}).map((_, si) => (
                  <span key={si} className={si < (item.star_level || 0) ? "text-yellow-400" : "text-muted-foreground/30"}>★</span>
                ))}
              </span>
              {(item.star_level || 0) > 0 && (
                <span className="text-yellow-400 text-[9px]">{item.star_level}/7</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <span className={`${rarity.color}`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid currentColor", padding: "2px 5px" }}>{rarity.label}</span>
          {item.equipped && <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #22d3ee60", background: "#001a1a", color: "#22d3ee", padding: "2px 5px" }}>Equipped</span>}
          {isSetItem && <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #22d3ee60", background: "#001a1a", color: "#22d3ee", padding: "2px 5px" }}>Set</span>}
          {runeSlots > 0 && (
            <span className="flex items-center gap-0.5" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #7c3aed60", background: "#120820", color: "#c084fc", padding: "2px 5px" }}>
              <Gem className="w-2.5 h-2.5" /> {runeSlots}
            </span>
          )}
          {!levelOk && <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #ef444460", background: "#1a0505", color: "#f87171", padding: "2px 5px" }}>Req. {item.level_req}</span>}
          {levelOk && !classOk && <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: "1px solid #ef444460", background: "#1a0505", color: "#f87171", padding: "2px 5px" }}>Wrong Class</span>}
        </div>
        {isUnique && (
          <span className="absolute bottom-1 right-1 bg-orange-500 text-white font-bold w-[16px] h-[16px] flex items-center justify-center leading-none" style={{ fontSize: "7px" }}>
            U
          </span>
        )}
      </motion.button>
      {hovered && (
        <HoverTooltip item={item} character={character} equipped={equipped} triggerRef={ref} allRunes={allRunes} />
      )}
    </>
  );
}

// ─── Compact Equipment Grid ─────────────────────────────────────────────────

function CharacterEquipmentPanel({ character, equipped, onSelectItem }) {
  const getSlot = (slot) => equipped.find(i => i.type === slot);

  const renderSlot = (slot) => {
    const item = getSlot(slot);
    const Icon = item ? getItemIcon(item) : (TYPE_ICONS[slot] || Backpack);
    const rarity = item ? RARITY_CONFIG[item.rarity] : null;
    const extraData = item ? (item.extraData || item.extra_data || {}) : {};
    const runeSlots = extraData.rune_slots || 0;

    return (
      <button
        key={slot}
        onClick={() => item && onSelectItem(item)}
        className="relative w-full h-[52px] flex items-center gap-2 px-2 transition-all hover:brightness-110"
        style={{
          background: item ? undefined : "#07071a",
          border: item ? `2px solid ${rarity?.border?.includes("cyan") ? "#22d3ee" : "#2a1f5c"}` : "1px dashed #2a1f5c",
          cursor: item ? "pointer" : "default",
        }}
        title={item ? item.name : SLOT_LABELS[slot]}
      >
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {item && getItemSprite(item) ? (
            <img src={getItemSprite(item)} alt="" className="w-10 h-10 sprite-outline" style={{ imageRendering: "pixelated" }} />
          ) : (
            <Icon className={`w-8 h-8 ${item ? rarity?.color : "text-gray-600"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span
            className={`truncate block leading-tight ${item ? rarity?.color : ""}`}
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: item ? undefined : "#6b6a9a" }}
          >
            {item ? item.name : SLOT_LABELS[slot]}
          </span>
          {item && (
            <span className="text-[9px] text-muted-foreground leading-none">
              {(item.upgrade_level || 0) > 0 && <span className="text-green-400 mr-1">+{item.upgrade_level}</span>}
              {runeSlots > 0 && <span className="text-purple-400">◈{runeSlots}</span>}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-1.5 w-full">
      {SLOT_ORDER.map(slot => (
        <div key={slot}>{renderSlot(slot)}</div>
      ))}
    </div>
  );
}

// ─── Stats Panel ────────────────────────────────────────────────────────────

function CharacterStatsPanel({ character, equippedItems, equippedRunes = [] }) {
  if (!character) return null;
  const setStats = aggregateSetStats(equippedItems);
  const { total, derived } = calculateFinalStats(character, equippedItems, setStats, equippedRunes);

  const baseStats = [
    { icon: Swords, label: "STR", value: total.strength, color: "text-red-400" },
    { icon: Crosshair, label: "DEX", value: total.dexterity, color: "text-green-400" },
    { icon: Zap, label: "INT", value: total.intelligence, color: "text-blue-400" },
    { icon: Heart, label: "VIT", value: total.vitality, color: "text-orange-400" },
    { icon: Gem, label: "LUK", value: total.luck, color: "text-yellow-400" },
  ];

  const stats = [
    { icon: Swords, label: "ATK", value: derived.attackPower, color: "text-red-400" },
    { icon: Swords, label: "M.ATK", value: derived.magicAttack, color: "text-purple-400" },
    { icon: Heart, label: "HP", value: derived.maxHp, color: "text-green-400" },
    { icon: Zap, label: "MP", value: derived.maxMp, color: "text-blue-400" },
    { icon: Shield, label: "DEF", value: derived.rawDefense, color: "text-yellow-400" },
    { icon: Crosshair, label: "Crit", value: `${derived.critChance}%`, color: "text-orange-400" },
    { icon: Wind, label: "EVA", value: `${derived.evasion}%`, color: "text-cyan-400" },
    { icon: Shield, label: "Block", value: `${derived.blockChance}%`, color: "text-amber-400" },
    { icon: Flame, label: "Crit DMG", value: `${derived.critDmgPct}%`, color: "text-pink-400" },
    { icon: Heart, label: "HP/s", value: derived.hpRegen, color: "text-emerald-400" },
    { icon: Zap, label: "MP/s", value: derived.mpRegen, color: "text-indigo-400" },
    { icon: Swords, label: "SPD", value: `${derived.attackSpeed}x`, color: "text-violet-400" },
    { icon: Shield, label: "DMG Red", value: `${derived.damageReduction}%`, color: "text-stone-400" },
    { icon: Droplet, label: "Lifesteal", value: `${derived.lifesteal || 0}%`, color: "text-rose-400", hide: !derived.lifesteal },
    { icon: Coins, label: "Gold+", value: `${derived.goldGainPct || 0}%`, color: "text-yellow-300" },
    { icon: Gem, label: "EXP+", value: `${derived.expGainPct || 0}%`, color: "text-cyan-300" },
  ];

  const elementalStats = [
    { icon: Flame, label: "Fire DMG", value: `${derived.fireDmg || 0}%`, color: "text-orange-500" },
    { icon: Snowflake, label: "Ice DMG", value: `${derived.iceDmg || 0}%`, color: "text-sky-400" },
    { icon: Zap, label: "Lightning", value: `${derived.lightningDmg || 0}%`, color: "text-yellow-300" },
    { icon: Skull, label: "Poison", value: `${derived.poisonDmg || 0}%`, color: "text-green-500" },
    { icon: Droplet, label: "Blood", value: `${derived.bloodDmg || 0}%`, color: "text-red-600" },
    { icon: Wind, label: "Sand", value: `${derived.sandDmg || 0}%`, color: "text-amber-500" },
  ].filter(s => parseInt(s.value) > 0);

  const StatRow = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#6b6a9a" }}>{label}</span>
      </div>
      <span className={`${color}`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px" }}>{value}</span>
    </div>
  );

  return (
    <div className="p-3 max-h-[280px] overflow-y-auto" style={{ background: "#0d0d1a", border: "2px solid #2a1f5c" }}>
      {/* Base stats in a row */}
      <h3 className="mb-1 uppercase tracking-wider" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#1dffa0" }}>Base Stats</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
        {baseStats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-1">
            <Icon className={`w-3 h-3 ${color}`} />
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#6b6a9a" }}>{label}</span>
            <span className={`${color}`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px" }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="my-1.5" style={{ borderTop: "1px solid #2a1f5c" }} />
      {/* Combat stats in 2 columns */}
      <h3 className="mb-1 uppercase tracking-wider" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#1dffa0" }}>Combat Stats</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {stats.filter(s => !s.hide).map(s => <StatRow key={s.label} {...s} />)}
      </div>
      {elementalStats.length > 0 && (
        <>
          <div className="my-1.5" style={{ borderTop: "1px solid #2a1f5c" }} />
          <h3 className="mb-1 uppercase tracking-wider" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#1dffa0" }}>Elemental</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {elementalStats.map(s => <StatRow key={s.label} {...s} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Inventory ─────────────────────────────────────────────────────────

export default function Inventory({ character, onCharacterUpdate }) {
  const getItemSellPrice = (item) => item.sell_price || Math.floor((RARITY_SELL_PRICES[item.rarity] || 10) * (1 + (item.item_level || 1) * 0.08));
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [seenItems, setSeenItems] = useState(() => {
    if (!character?.id) return new Set();
    try {
      const stored = localStorage.getItem(`seen_items_${character.id}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pollInterval = useSmartPolling(POLL_INTERVALS.GAME_STATE);

  useEffect(() => {
    if (!character?.id) return;
    try {
      const stored = localStorage.getItem(`seen_items_${character.id}`);
      setSeenItems(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch { setSeenItems(new Set()); }
  }, [character?.id]);

  const markSeen = useCallback((itemId) => {
    setSeenItems(prev => {
      if (prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.add(itemId);
      try { localStorage.setItem(`seen_items_${character.id}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [character?.id]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", character?.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character?.id }),
    enabled: !!character?.id,
  });

  // Fetch runes for stat calculations + tooltip display
  const { data: runeData } = useQuery({
    queryKey: ["runes", character?.id],
    queryFn: () => base44.functions.invoke("runes", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    staleTime: 120_000,
  });
  const allRunes = runeData?.runes || [];
  const equippedRunes = useMemo(() => allRunes.filter(r => r.itemId || r.item_id), [allRunes]);

  const applyEquipmentStats = async (newEquip, updatedItems) => {
    const nowEquipped = updatedItems.filter(i => Object.values(newEquip).includes(i.id));
    const setStats = aggregateSetStats(nowEquipped);
    const { derived } = calculateFinalStats(character, nowEquipped, setStats);
    const updates = { equipment: newEquip, max_hp: derived.maxHp, max_mp: derived.maxMp };
    await base44.entities.Character.update(character.id, updates);
    onCharacterUpdate({ ...character, ...updates });
  };

  const equipMutation = useMutation({
    mutationFn: async (item) => {
      const slot = item.type;
      if (!SLOT_ORDER.includes(slot)) return;
      const { valid, reason } = validateEquip(character, item);
      if (!valid) {
        toast({ title: reason, variant: "destructive", duration: 2000 });
        return;
      }
      const currentEquipId = character.equipment?.[slot];
      const dupes = items.filter(i => i.type === slot && i.equipped && i.id !== item.id);
      const unequipPromises = [];
      if (currentEquipId && items.some(i => i.id === currentEquipId)) {
        unequipPromises.push(base44.entities.Item.update(currentEquipId, { equipped: false }).catch(() => {}));
      }
      for (const dupe of dupes) {
        if (dupe.id !== currentEquipId) {
          unequipPromises.push(base44.entities.Item.update(dupe.id, { equipped: false }).catch(() => {}));
        }
      }
      await Promise.all(unequipPromises);
      await base44.entities.Item.update(item.id, { equipped: true });
      const newEquip = { ...(character.equipment || {}), [slot]: item.id };
      const updatedItems = items.map(i => {
        if (i.id === item.id) return { ...i, equipped: true };
        if (i.type === slot && i.equipped) return { ...i, equipped: false };
        return i;
      });
      await applyEquipmentStats(newEquip, updatedItems);
      queryClient.setQueryData(["items", character?.id], updatedItems);
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
      setSelectedItem({ ...item, equipped: true });
    },
  });

  const unequipMutation = useMutation({
    mutationFn: async (item) => {
      const slot = item.type;
      await base44.entities.Item.update(item.id, { equipped: false });
      const newEquip = { ...(character.equipment || {}) };
      delete newEquip[slot];
      const updatedItems = items.map(i => i.id === item.id ? { ...i, equipped: false } : i);
      await applyEquipmentStats(newEquip, updatedItems);
      queryClient.setQueryData(["items", character?.id], updatedItems);
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
      setSelectedItem({ ...item, equipped: false });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (itemIdToSell) => {
      const response = await base44.functions.invoke('sellItem', { itemId: itemIdToSell });
      if (response?.success) {
        onCharacterUpdate({ ...character, gold: response.newGold });
        queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        setSelectedItem(null);
        toast({ title: `Sold for ${response.sellPrice} gold!`, duration: 1000 });
      } else if (response?.error) {
        toast({ title: response.error, variant: 'destructive' });
      }
      return response;
    },
  });

  const useItemMutation = useMutation({
    mutationFn: async (itemIdToUse) => {
      const response = await base44.functions.invoke('useItem', { itemId: itemIdToUse });
      if (response?.success) {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        setSelectedItem(null);
        toast({ title: response.message || "Item used!" });
      } else if (response?.error) {
        toast({ title: response.error, variant: 'destructive' });
      }
      return response;
    },
  });

  const sellAllMutation = useMutation({
    mutationFn: async () => {
      const gearTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];
      const typeFilter = filter === "all" ? gearTypes : filter === "consumable" || filter === "special" || filter === "sets" ? [] : [filter];
      const unequipped = items.filter(i => !i.equipped && typeFilter.includes(i.type));
      if (unequipped.length === 0) return;
      // Sell in batches of 10 to avoid overwhelming the server
      for (let i = 0; i < unequipped.length; i += 10) {
        const batch = unequipped.slice(i, i + 10);
        await Promise.all(batch.map(item => base44.functions.invoke('sellItem', { itemId: item.id })));
      }
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });

  const equipped = useMemo(() => {
    const equipMap = character.equipment || {};
    const authoritative = [];
    const seen = new Set();
    for (const slot of SLOT_ORDER) {
      const itemId = equipMap[slot];
      if (itemId) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          authoritative.push({ ...item, equipped: true });
          seen.add(item.id);
        }
      }
    }
    for (const item of items) {
      if (item.equipped && !seen.has(item.id) && SLOT_ORDER.includes(item.type)) {
        if (!authoritative.find(a => a.type === item.type)) {
          authoritative.push(item);
        }
      }
    }
    return authoritative;
  }, [items, character.equipment]);

  // Separate items by category
  const consumableStacks = items
    .filter(i => i.type === "consumable")
    .reduce((acc, item) => {
      const key = item.name;
      if (!acc[key]) acc[key] = { ...item, stackCount: 0, stackIds: [] };
      acc[key].stackCount++;
      acc[key].stackIds.push(item.id);
      return acc;
    }, {});
  const stackedConsumables = Object.values(consumableStacks);

  // Special items: materials, stones, tammablocks, tower shards, pet eggs — stacked by name
  const specialStacks = items
    .filter(i =>
      i.type === "material" || i.type === "pet_egg" || i.type === "stone" ||
      i.name?.toLowerCase().includes("tammablocks") ||
      i.name?.toLowerCase().includes("tower shard") ||
      i.name?.toLowerCase().includes("celestial stone") ||
      i.name?.toLowerCase().includes("egg")
    )
    .reduce((acc, item) => {
      const key = item.name;
      if (!acc[key]) acc[key] = { ...item, stackCount: 0, stackIds: [] };
      acc[key].stackCount++;
      acc[key].stackIds.push(item.id);
      return acc;
    }, {});
  const specialItems = Object.values(specialStacks);

  // Virtual currency items from character.extraData — displayed in Special tab
  const extraData = character?.extraData || character?.extra_data || {};
  const CURRENCY_DEFS = [
    { key: "dublons", name: "Dublons", rarity: "epic", description: "Premium gold coins earned from combat and quests. Spend them at the Shop for exclusive gear, consumables, and mystery boxes." },
    { key: "crystals", name: "Crystals", rarity: "legendary", description: "Magical crystals used for high-tier gear upgrades, awakening equipment, and purchasing legendary items from the Shop.", sprite: "/sprites/currencies/crystals.png" },
    { key: "ascension_shards", name: "Ascension Shards", rarity: "legendary", description: "Mystical shards required for ascending your character to unlock new power tiers and stat bonuses.", sprite: "/sprites/currencies/ascension_shards.png" },
    { key: "celestial_stones", name: "Celestial Stones", rarity: "mythic", description: "Extremely rare stones dropped by bosses. Used to craft mythic equipment and upgrade legendary gear to its final form.", sprite: "/sprites/currencies/celestial_stones.png" },
    { key: "portal_shards", name: "Portal Shards", rarity: "epic", description: "Earned by clearing waves in the Infinite Portal. Used to purchase portal-exclusive gear and enchantments.", sprite: "/sprites/currencies/portal_shards.png" },
{ key: "sqrizzscrolls", name: "Sqrizzscrolls", rarity: "epic", description: "Ancient enchantment scrolls. Use them to add special bonus stats or reroll sub-stats on your equipment.", sprite: "/sprites/currencies/sqrizzscrolls.png" },
    { key: "boss_stones", name: "Boss Stones", rarity: "mythic", description: "Trophies from defeating dungeon bosses. Trade them for boss-exclusive set pieces and powerful unique weapons.", sprite: "/sprites/currencies/boss_stones.png" },
    { key: "tammablocks", name: "Tammablocks", rarity: "rare", description: "Versatile building blocks used for guild upgrades, base construction, and crafting special utility items.", sprite: "/sprites/currencies/tammablocks.png" },
    { key: "tower_shards", name: "Tower Shards", rarity: "epic", description: "Collected from clearing floors in the Tower of Trials. Exchange them for tower-exclusive gear and upgrade materials.", sprite: "/sprites/currencies/tower_shards.png" },
  ];
  const currencyItems = CURRENCY_DEFS
    .filter(c => (extraData[c.key] || 0) > 0)
    .map(c => ({
      id: `currency_${c.key}`,
      name: c.name,
      type: "material",
      rarity: c.rarity,
      level: 1,
      stats: {},
      extraData: { description: c.description, is_currency: true, quantity: extraData[c.key], sprite: c.sprite },
      stackCount: extraData[c.key],
      _isCurrency: true,
    }));
  const allSpecialItems = [...currencyItems, ...specialItems];

  const getFilteredItems = () => {
    if (filter === "sets") return null; // handled separately
    if (filter === "special") return allSpecialItems;
    if (filter === "consumable") return stackedConsumables;

    const gearTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];
    let result;
    if (filter === "all") {
      result = items.filter(i => gearTypes.includes(i.type));
    } else {
      result = items.filter(i => i.type === filter);
    }
    return result.sort((a, b) => (RARITY_CONFIG[b.rarity]?.order ?? -1) - (RARITY_CONFIG[a.rarity]?.order ?? -1));
  };

  const filtered = getFilteredItems();
  const sellableItems = (() => {
    const gearTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];
    const typeFilter = filter === "all" ? gearTypes : filter === "consumable" || filter === "special" || filter === "sets" ? [] : [filter];
    return items.filter(i => !i.equipped && typeFilter.includes(i.type));
  })();
  const sellableCount = sellableItems.length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2">
          <Backpack className="w-5 h-5" style={{ color: "#1dffa0" }} />
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "#1dffa0" }}>Inventory</span>
        </h2>
        {sellableCount > 0 && (
          <PixelButton
            variant="ok"
            label={`SELL ALL${filter !== "all" ? " " + filter.charAt(0).toUpperCase() + filter.slice(1) + "S" : ""} (${sellableCount} · ${sellableItems.reduce((s, i) => s + getItemSellPrice(i), 0)}G)`}
            onClick={() => sellAllMutation.mutate()}
            disabled={sellAllMutation.isPending}
            style={{ background: "#e6a800", border: "2px solid #a07200", boxShadow: "0 3px 0 #7a5500, inset 0 1px 0 rgba(255,255,200,0.3)" }}
          />
        )}
      </div>

      {/* Top: Equipment Grid + Stats (compact side-by-side) */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3">
        {/* Equipment Grid */}
        <div className="p-3" style={{ background: "#0d0d1a", border: "2px solid #2a1f5c" }}>
          <h3 className="mb-2 uppercase tracking-wider" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "#1dffa0" }}>Equipment</h3>
          <CharacterEquipmentPanel
            character={character}
            equipped={equipped}
            onSelectItem={setSelectedItem}
          />
        </div>

        {/* Stats Panel (scrollable) */}
        <CharacterStatsPanel character={character} equippedItems={equipped} equippedRunes={equippedRunes} />
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList
          className="flex flex-wrap h-auto gap-1 p-1 rounded-none"
          style={{ background: "#07071a", border: "2px solid #2a1f5c" }}
        >
          {[
            { value: "all",        Icon: Backpack,    label: "All Gear" },
            { value: "weapon",     Icon: Swords,      label: "Weapons" },
            { value: "armor",      Icon: ShieldCheck, label: "Armor" },
            { value: "helmet",     Icon: Crown,       label: "Helmets" },
            { value: "gloves",     Icon: Hand,        label: "Gloves" },
            { value: "boots",      Icon: Footprints,  label: "Boots" },
            { value: "ring",       Icon: CircleDot,   label: "Rings" },
            { value: "amulet",     Icon: Gem,         label: "Amulets" },
            { value: "consumable", Icon: FlaskConical,label: "Consumables" },
            { value: "special",    Icon: Sparkles,    label: "Special" },
            { value: "sets",       Icon: Shield,      label: "Sets" },
          ].map(({ value, Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1 rounded-none data-[state=active]:bg-[#e6a800] data-[state=active]:text-[#1a1a2e] data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#6b6a9a] font-['Press_Start_2P'] text-[7px] py-1.5 px-2"
            >
              <Icon className="w-3 h-3" />{label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Item Grid */}
      {filter === "sets" ? (
        <div className="p-4" style={{ background: "#0d0d1a", border: "2px solid #2a1f5c" }}>
          <SetCollectionPanel
            equippedItems={equipped}
            allItems={items}
            characterClass={character?.class}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {isLoading && Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-3 animate-pulse h-24" style={{ background: "#0d0d1a", border: "2px solid #2a1f5c" }} />
          ))}
          {filtered && filtered.map(item => {
            const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
            const { valid: canEquip } = validateEquip(character, item);
            return (
              <ItemCard
                key={item.stackIds ? item.name : item.id}
                item={item}
                character={character}
                equipped={equipped}
                onSelect={setSelectedItem}
                rarity={rarity}
                canEquip={canEquip}
                isNew={!seenItems.has(item.id)}
                onMarkSeen={markSeen}
                allRunes={allRunes}
              />
            );
          })}
          {!isLoading && filtered && filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {filter === "special"
                ? "No special items. Tammablocks, Tower Shards, Pet Eggs, and Celestial Stones appear here."
                : "No items found."}
            </div>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`bg-card border-2 rounded-xl p-5 w-full max-w-sm ${RARITY_CONFIG[selectedItem.rarity]?.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const equippedInSlot = equipped.find(i => i.type === selectedItem.type && i.id !== selectedItem.id);
                const { valid: canEquip, reason: equipReason } = validateEquip(character, selectedItem);
                const levelOk = character.level >= (selectedItem.level_req || 1);
                const classCheck = canEquipItem(character.class, selectedItem);
                return (
                  <>
                    <ItemTooltip
                      item={selectedItem}
                      characterLevel={character.level}
                      characterClass={character.class}
                      compareItem={!selectedItem.equipped ? equippedInSlot : null}
                      equippedItems={equipped}
                      character={character}
                      socketedRunes={allRunes}
                    />
                    {(selectedItem.type === "consumable" || selectedItem.type === "material") && (
                      <ConsumableDetail item={selectedItem} />
                    )}
                    {equippedInSlot && !selectedItem.equipped && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Currently Equipped:</p>
                        <p className={`text-sm font-medium ${RARITY_CONFIG[equippedInSlot.rarity]?.color}`}>{equippedInSlot.name}</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-5">
                      {selectedItem._isCurrency && (
                        <div className="flex-1 text-center text-xs text-muted-foreground py-2 space-y-2">
                          {(selectedItem.extraData || selectedItem.extra_data || {}).description && (
                            <p className="text-sm text-foreground/80 text-left">{(selectedItem.extraData || selectedItem.extra_data).description}</p>
                          )}
                          <p>You have <span className="font-bold text-foreground">{selectedItem.stackCount?.toLocaleString()}</span> {selectedItem.name}</p>
                        </div>
                      )}
                      {!selectedItem._isCurrency && SLOT_ORDER.includes(selectedItem.type) && (
                        selectedItem.equipped ? (
                          <PixelButton variant="cancel" label="UNEQUIP" onClick={() => unequipMutation.mutate(selectedItem)} />
                        ) : (
                          <PixelButton
                            variant="ok"
                            label={!levelOk ? `REQ. LV.${selectedItem.level_req}` : !classCheck.allowed ? "WRONG CLASS" : "EQUIP"}
                            disabled={!canEquip}
                            onClick={() => equipMutation.mutate(selectedItem)}
                          />
                        )
                      )}
                      {selectedItem.type === "consumable" && (() => {
                        const selExtra = selectedItem.extraData || selectedItem.extra_data || {};
                        const isPetEgg = selExtra.consumableType === "pet_egg" || selExtra.consumableType === "pet_egg_shiny";
                        return isPetEgg ? (
                          <PixelButton
                            variant="ok"
                            label="HATCH IN PETS"
                            onClick={() => { setSelectedItem(null); navigate("/pets"); }}
                          />
                        ) : (
                          <PixelButton
                            variant="ok"
                            label="USE"
                            disabled={useItemMutation.isPending}
                            onClick={() => useItemMutation.mutate(selectedItem.stackIds ? selectedItem.stackIds[0] : selectedItem.id)}
                          />
                        );
                      })()}
                      {!selectedItem._isCurrency && (
                        <PixelButton
                          variant="ok"
                          label={`SELL${selectedItem.stackIds ? " ×1" : ""} (${getItemSellPrice(selectedItem)}G)`}
                          onClick={() => sellMutation.mutate(selectedItem.stackIds ? selectedItem.stackIds[0] : selectedItem.id)}
                        />
                      )}
                    </div>
                    <div className="mt-2">
                      <PixelButton variant="cancel" label="CLOSE" onClick={() => setSelectedItem(null)} />
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
