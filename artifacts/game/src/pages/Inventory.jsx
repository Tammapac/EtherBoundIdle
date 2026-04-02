import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Backpack, Swords, ShieldCheck, Crown, Footprints, CircleDot,
  Gem, Coins, ArrowUpRight, FlaskConical, Package, Hand,
  Heart, Zap, Shield, Crosshair, Wind, Flame,
  Droplet, Snowflake, Skull, User, Sparkles, Star, Egg
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getItemIcon } from "@/lib/itemIcons";
import { RARITY_CONFIG } from "@/lib/gameData";
import { canEquipItem, validateEquip, getAllowedClassesLabel, EQUIPMENT_SLOTS, SLOT_LABELS } from "@/lib/equipmentSystem";
import { calculateFinalStats } from "@/lib/statSystem";
import { aggregateSetStats } from "@/lib/setSystem";
import ItemTooltip from "@/components/game/ItemTooltip";
import { getUniqueItemDef } from "@/lib/uniqueItems";
import SetCollectionPanel from "@/components/game/SetCollectionPanel";

const TYPE_ICONS = {
  weapon: Swords, armor: ShieldCheck, helmet: Crown, gloves: Hand,
  boots: Footprints, ring: CircleDot, amulet: Gem,
  consumable: FlaskConical, material: Package,
};

const SLOT_ORDER = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

// ─── Hover Tooltip ──────────────────────────────────────────────────────────

function HoverTooltip({ item, character, equipped, triggerRef }) {
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
        />
      </div>
    </div>
  );
}

// ─── Item Card ──────────────────────────────────────────────────────────────

function ItemCard({ item, character, equipped, onSelect, rarity, canEquip, isNew, onMarkSeen }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const Icon = getItemIcon(item);
  const levelOk = character.level >= (item.level_req || 1);
  const classOk = canEquipItem(character.class, item).allowed;
  const isStack = item.stackCount > 1;
  const itemLevel = item.item_level;
  const isSetItem = item.rarity === "set";
  const isUnique = !!item.is_unique || !!getUniqueItemDef(item.name) || (item.proc_effects && item.proc_effects.length > 0);
  const extraData = item.extraData || item.extra_data || {};
  const runeSlots = extraData.rune_slots || 0;

  return (
    <>
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        onClick={() => onSelect(item)}
        onMouseEnter={() => { setHovered(true); if (isNew && onMarkSeen) onMarkSeen(item.id); }}
        onMouseLeave={() => setHovered(false)}
        className={`relative bg-card border rounded-lg p-3 text-left transition-all hover:bg-muted/50 ${
          item.equipped ? `${rarity.border} ${rarity.bg}` : !canEquip ? "border-destructive/30 opacity-60" : "border-border"
        } ${item.rarity === "shiny" ? "ring-1 ring-yellow-400/50" : ""} ${isSetItem ? "ring-1 ring-cyan-400/50" : ""} ${isUnique ? "ring-1 ring-orange-400/50" : ""} ${item.is_awakened ? "outline outline-2 outline-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.5),0_0_4px_rgba(168,85,247,0.3)] animate-pulse" : ""}`}
      >
        {isStack && (
          <span className="absolute top-1.5 right-1.5 bg-green-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            x{item.stackCount}
          </span>
        )}
        {isNew && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold rounded px-1 py-0.5 leading-none animate-pulse">
            NEW
          </span>
        )}
        <div className="flex items-center gap-2 mb-1">
          <div className="relative flex-shrink-0">
            <Icon className={`w-5 h-5 ${rarity.color}`} />
            {itemLevel && (
              <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold leading-none px-0.5 rounded ${rarity.color} bg-background border border-current`}>
                {itemLevel}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold ${rarity.color} truncate block`}>{item.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {(item.upgrade_level || 0) > 0 && (
                <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 rounded px-1 leading-tight">
                  +{item.upgrade_level}
                </span>
              )}
              <span className="text-[9px] text-yellow-400 tracking-tight leading-none">
                {Array.from({length: 7}).map((_, si) => (
                  <span key={si} className={si < (item.star_level || 0) ? "text-yellow-400" : "text-muted-foreground/30"}>★</span>
                ))}
              </span>
              {(item.star_level || 0) > 0 && (
                <span className="text-[9px] text-yellow-400">{item.star_level}/7</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className={`text-xs ${rarity.color} ${rarity.border}`}>{rarity.label}</Badge>
          {item.equipped && <Badge className="text-xs bg-primary/20 text-primary">Equipped</Badge>}
          {isSetItem && <Badge className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Set</Badge>}
          {runeSlots > 0 && (
            <Badge className="text-xs bg-purple-500/15 text-purple-400 border-purple-500/30 gap-0.5">
              <Gem className="w-2.5 h-2.5" /> {runeSlots}
            </Badge>
          )}
          {!levelOk && <Badge className="text-xs bg-destructive/20 text-destructive border-destructive/30">Req. {item.level_req}</Badge>}
          {levelOk && !classOk && <Badge className="text-xs bg-destructive/20 text-destructive border-destructive/30">Wrong Class</Badge>}
        </div>
        {isUnique && (
          <span className="absolute bottom-1 right-1 bg-orange-500 text-white text-[9px] font-bold rounded w-[16px] h-[16px] flex items-center justify-center leading-none">
            U
          </span>
        )}
      </motion.button>
      {hovered && (
        <HoverTooltip item={item} character={character} equipped={equipped} triggerRef={ref} />
      )}
    </>
  );
}

// ─── Character Silhouette Equipment Panel ───────────────────────────────────

function CharacterEquipmentPanel({ character, equipped, onSelectItem }) {
  const getSlot = (slot) => equipped.find(i => i.type === slot);

  const renderSlot = (slot, position) => {
    const item = getSlot(slot);
    const Icon = item ? getItemIcon(item) : (TYPE_ICONS[slot] || Backpack);
    const rarity = item ? RARITY_CONFIG[item.rarity] : null;
    const extraData = item ? (item.extraData || item.extra_data || {}) : {};
    const runeSlots = extraData.rune_slots || 0;

    return (
      <button
        key={slot}
        onClick={() => item && onSelectItem(item)}
        className={`absolute ${position} w-[60px] h-[60px] rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105 ${
          item
            ? `${rarity?.border} ${rarity?.bg} cursor-pointer`
            : "border-dashed border-gray-600 bg-gray-900/50"
        }`}
        title={item ? item.name : SLOT_LABELS[slot]}
      >
        <Icon className={`w-5 h-5 ${item ? rarity?.color : "text-gray-600"}`} />
        <span className={`text-[8px] mt-0.5 truncate max-w-[54px] ${item ? rarity?.color : "text-gray-600"}`}>
          {item ? (item.name.length > 8 ? item.name.slice(0, 8) + ".." : item.name) : SLOT_LABELS[slot]}
        </span>
        {item && (item.upgrade_level || 0) > 0 && (
          <span className="absolute -top-1 -right-1 text-[8px] font-bold text-green-400 bg-gray-900 border border-green-500/40 rounded px-0.5">
            +{item.upgrade_level}
          </span>
        )}
        {item && runeSlots > 0 && (
          <span className="absolute -bottom-1 -right-1 text-[8px] font-bold text-purple-400 bg-gray-900 border border-purple-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center">
            {runeSlots}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="relative w-[240px] h-[320px] mx-auto flex-shrink-0">
      {/* Character silhouette center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[200px] rounded-full bg-gradient-to-b from-gray-700/20 to-gray-800/20 border border-gray-700/30 flex items-center justify-center">
        <User className="w-12 h-12 text-gray-600/40" />
      </div>

      {/* Helmet — top center */}
      {renderSlot("helmet", "top-0 left-1/2 -translate-x-1/2")}
      {/* Amulet — below helmet, slightly right */}
      {renderSlot("amulet", "top-[65px] left-1/2 translate-x-[5px]")}
      {/* Weapon — left of body */}
      {renderSlot("weapon", "top-[80px] left-0")}
      {/* Armor — center body */}
      {renderSlot("armor", "top-[130px] left-1/2 -translate-x-1/2")}
      {/* Gloves — left lower */}
      {renderSlot("gloves", "top-[195px] left-0")}
      {/* Ring — right of body */}
      {renderSlot("ring", "top-[195px] right-0")}
      {/* Boots — bottom center */}
      {renderSlot("boots", "bottom-0 left-1/2 -translate-x-1/2")}
    </div>
  );
}

// ─── Stats Panel ────────────────────────────────────────────────────────────

function CharacterStatsPanel({ character, equippedItems }) {
  if (!character) return null;
  const setStats = aggregateSetStats(equippedItems);
  const { total, derived } = calculateFinalStats(character, equippedItems, setStats);

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

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1 text-[11px]">
      <h3 className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Base Stats</h3>
      {baseStats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3 h-3 ${color}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
          <span className={`font-mono font-semibold ${color}`}>{value}</span>
        </div>
      ))}
      <div className="border-t border-border my-1" />
      <h3 className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Combat Stats</h3>
      {stats.filter(s => !s.hide).map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3 h-3 ${color}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
          <span className={`font-mono font-semibold ${color}`}>{value}</span>
        </div>
      ))}
      {elementalStats.length > 0 && (
        <>
          <div className="border-t border-border my-1" />
          <h3 className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Elemental</h3>
          {elementalStats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-muted-foreground">{label}</span>
              </div>
              <span className={`font-mono font-semibold ${color}`}>{value}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Main Inventory ─────────────────────────────────────────────────────────

export default function Inventory({ character, onCharacterUpdate }) {
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
      setSelectedItem({ ...item, equipped: false });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (itemIdToSell) => {
      const response = await base44.functions.invoke('sellItem', { itemId: itemIdToSell });
      if (response?.success) {
        onCharacterUpdate({ ...character, gold: response.newGold });
        queryClient.invalidateQueries({ queryKey: ["items"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        setSelectedItem(null);
        toast({ title: `Sold for ${response.sellPrice} gold!`, duration: 1000 });
      } else if (response?.error) {
        toast({ title: response.error, variant: 'destructive' });
      }
      return response;
    },
  });

  const sellAllMutation = useMutation({
    mutationFn: async () => {
      const unequipped = items.filter(i => !i.equipped && SLOT_ORDER.includes(i.type));
      if (unequipped.length === 0) return;
      await Promise.all(unequipped.map(item => base44.functions.invoke('sellItem', { itemId: item.id })));
      queryClient.invalidateQueries({ queryKey: ["items"] });
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

  // Special items: materials, stones, tammablocks, tower shards, pet eggs
  const specialItems = items.filter(i =>
    i.type === "material" || i.type === "pet_egg" || i.type === "stone" ||
    i.name?.toLowerCase().includes("tammablocks") ||
    i.name?.toLowerCase().includes("tower shard") ||
    i.name?.toLowerCase().includes("celestial stone") ||
    i.name?.toLowerCase().includes("egg")
  );

  const getFilteredItems = () => {
    if (filter === "sets") return null; // handled separately
    if (filter === "special") return specialItems;
    if (filter === "consumable") return stackedConsumables;

    const gearTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];
    let result;
    if (filter === "all") {
      result = [...items.filter(i => gearTypes.includes(i.type) && i.type !== "consumable"), ...stackedConsumables];
    } else {
      result = items.filter(i => i.type === filter);
    }
    return result.sort((a, b) => (RARITY_CONFIG[b.rarity]?.order ?? -1) - (RARITY_CONFIG[a.rarity]?.order ?? -1));
  };

  const filtered = getFilteredItems();
  const sellableCount = items.filter(i => !i.equipped && SLOT_ORDER.includes(i.type)).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
          <Backpack className="w-5 h-5 text-primary" /> Inventory
        </h2>
        {sellableCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => sellAllMutation.mutate()}
            disabled={sellAllMutation.isPending}
            className="gap-1.5"
          >
            <Coins className="w-3.5 h-3.5" />
            Sell All ({sellableCount} · {items.filter(i => !i.equipped && SLOT_ORDER.includes(i.type)).reduce((s, i) => s + (i.sell_price || 5), 0)}g)
          </Button>
        )}
      </div>

      {/* Top: Character Silhouette + Stats */}
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Character Equipment Silhouette */}
        <div className="bg-card border border-border rounded-xl p-4 flex-shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider text-center">Equipment</h3>
          <CharacterEquipmentPanel
            character={character}
            equipped={equipped}
            onSelectItem={setSelectedItem}
          />
        </div>

        {/* Stats Panel */}
        <div className="flex-1 min-w-0">
          <CharacterStatsPanel character={character} equippedItems={equipped} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="flex items-center gap-1 text-xs"><Backpack className="w-3 h-3" />All Gear</TabsTrigger>
          <TabsTrigger value="weapon" className="flex items-center gap-1 text-xs"><Swords className="w-3 h-3" />Weapons</TabsTrigger>
          <TabsTrigger value="armor" className="flex items-center gap-1 text-xs"><ShieldCheck className="w-3 h-3" />Armor</TabsTrigger>
          <TabsTrigger value="helmet" className="flex items-center gap-1 text-xs"><Crown className="w-3 h-3" />Helmets</TabsTrigger>
          <TabsTrigger value="gloves" className="flex items-center gap-1 text-xs"><Hand className="w-3 h-3" />Gloves</TabsTrigger>
          <TabsTrigger value="boots" className="flex items-center gap-1 text-xs"><Footprints className="w-3 h-3" />Boots</TabsTrigger>
          <TabsTrigger value="ring" className="flex items-center gap-1 text-xs"><CircleDot className="w-3 h-3" />Rings</TabsTrigger>
          <TabsTrigger value="amulet" className="flex items-center gap-1 text-xs"><Gem className="w-3 h-3" />Amulets</TabsTrigger>
          <TabsTrigger value="consumable" className="flex items-center gap-1 text-xs"><FlaskConical className="w-3 h-3" />Consumables</TabsTrigger>
          <TabsTrigger value="special" className="flex items-center gap-1 text-xs"><Sparkles className="w-3 h-3" />Special</TabsTrigger>
          <TabsTrigger value="sets" className="flex items-center gap-1 text-xs"><Shield className="w-3 h-3 text-yellow-400" />Sets</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Item Grid */}
      {filter === "sets" ? (
        <div className="bg-card border border-border rounded-xl p-4">
          <SetCollectionPanel
            equippedItems={equipped}
            allItems={items}
            characterClass={character?.class}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {isLoading && Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 animate-pulse h-24" />
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
                    />
                    {equippedInSlot && !selectedItem.equipped && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Currently Equipped:</p>
                        <p className={`text-sm font-medium ${RARITY_CONFIG[equippedInSlot.rarity]?.color}`}>{equippedInSlot.name}</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-5">
                      {SLOT_ORDER.includes(selectedItem.type) && (
                        selectedItem.equipped ? (
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => unequipMutation.mutate(selectedItem)}>
                            Unequip
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            disabled={!canEquip}
                            onClick={() => equipMutation.mutate(selectedItem)}
                            title={!canEquip ? equipReason : ""}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {!levelOk ? `Req. Lv.${selectedItem.level_req}` : !classCheck.allowed ? "Wrong Class" : "Equip"}
                          </Button>
                        )
                      )}
                      <Button variant="destructive" size="sm" onClick={() => sellMutation.mutate(selectedItem.stackIds ? selectedItem.stackIds[0] : selectedItem.id)}>
                        <Coins className="w-3.5 h-3.5 mr-1" /> Sell {selectedItem.stackIds ? "1" : ""} ({selectedItem.sell_price || 5}g)
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedItem(null)}>
                      Close
                    </Button>
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
