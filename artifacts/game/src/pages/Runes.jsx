import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Gem, Star, Shield, Swords, Zap, Flame, Snowflake, Heart,
  ArrowUpCircle, Trash2, Package, Sparkles, Plus, X,
  TrendingUp, CircleDot, Target, Eye, Droplets, Wind,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const RUNE_STAT_LABELS = {
  attack_pct: "ATK%", crit_chance: "Crit Chance%", crit_dmg_pct: "Crit DMG%",
  boss_dmg_pct: "Boss DMG%", attack_speed: "ATK Speed%", lifesteal: "Lifesteal%",
  defense_pct: "DEF%", block_chance: "Block%", evasion: "Evasion%",
  hp_flat: "HP", mp_flat: "MP", hp_regen: "HP Regen", mp_regen: "MP Regen",
  exp_pct: "EXP%", gold_pct: "Gold%", drop_chance: "Drop%",
  fire_dmg: "Fire DMG%", ice_dmg: "Ice DMG%", lightning_dmg: "Lightning DMG%",
  poison_dmg: "Poison DMG%", blood_dmg: "Blood DMG%", sand_dmg: "Sand DMG%",
};

const RUNE_STAT_ICONS = {
  attack_pct: Swords, crit_chance: Target, crit_dmg_pct: Zap,
  boss_dmg_pct: Swords, attack_speed: Wind, lifesteal: Heart,
  defense_pct: Shield, block_chance: Shield, evasion: Eye,
  hp_flat: Heart, mp_flat: Droplets, hp_regen: Heart, mp_regen: Droplets,
  exp_pct: TrendingUp, gold_pct: Star, drop_chance: Sparkles,
  fire_dmg: Flame, ice_dmg: Snowflake, lightning_dmg: Zap,
  poison_dmg: CircleDot, blood_dmg: Heart, sand_dmg: Wind,
};

const RUNE_CATEGORY_COLORS = {
  offensive:  { border: "border-red-500/40",    bg: "bg-red-500/10",    text: "text-red-400" },
  defensive:  { border: "border-blue-500/40",   bg: "bg-blue-500/10",   text: "text-blue-400" },
  utility:    { border: "border-green-500/40",  bg: "bg-green-500/10",  text: "text-green-400" },
  elemental:  { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400" },
};

const RARITY_COLORS = {
  common:    { text: "text-gray-400",   border: "border-gray-500/30",   bg: "bg-gray-500/10",   hex: "#9ca3af" },
  uncommon:  { text: "text-green-400",  border: "border-green-500/30",  bg: "bg-green-500/10",  hex: "#22c55e" },
  rare:      { text: "text-blue-400",   border: "border-blue-500/30",   bg: "bg-blue-500/10",   hex: "#3b82f6" },
  epic:      { text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", hex: "#a855f7" },
  legendary: { text: "text-amber-400",  border: "border-amber-500/30",  bg: "bg-amber-500/10",  hex: "#f59e0b" },
  mythic:    { text: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10",    hex: "#ef4444" },
};

const DUST_INFO = {
  magic_dust:   { label: "Magic Dust",   color: "text-blue-400",   bg: "bg-blue-500/15",   icon: "✨", sprite: "/sprites/dust/magic_dust.png" },
  heavens_dust: { label: "Heavens Dust",  color: "text-amber-400",  bg: "bg-amber-500/15",  icon: "🌟", sprite: "/sprites/dust/heavens_dust.png" },
  void_dust:    { label: "Void Dust",     color: "text-purple-400", bg: "bg-purple-500/15",  icon: "🔮", sprite: "/sprites/dust/void_dust.png" },
};

const DUST_FOR_LEVEL = { 1: "magic_dust", 2: "magic_dust", 3: "heavens_dust", 4: "heavens_dust", 5: "void_dust", 6: "void_dust" };
const DUST_COST = { 1: 10, 2: 20, 3: 35, 4: 50, 5: 75, 6: 100 };
const UPGRADE_RATE = { 1: 90, 2: 75, 3: 60, 4: 45, 5: 30, 6: 20 };

const ITEM_TYPE_LABELS = {
  weapon: "Weapon", helmet: "Helmet", armor: "Armor", boots: "Boots",
  gloves: "Gloves", ring: "Ring", amulet: "Amulet", shield: "Shield",
  cape: "Cape", belt: "Belt",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function Runes({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRune, setSelectedRune] = useState(null);
  const [socketTarget, setSocketTarget] = useState(null); // item ID to socket into
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [confirmModal, setConfirmModal] = useState(null);
  const [upgradeResult, setUpgradeResult] = useState(null);

  // ── Queries ──
  const { data: runeData, isLoading } = useQuery({
    queryKey: ["runes", character?.id],
    queryFn: () => base44.functions.invoke("runes", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
  });

  const allRunes = runeData?.runes || [];
  const equippedItems = runeData?.equippedItems || [];
  const dust = runeData?.dust || { magic_dust: 0, heavens_dust: 0, void_dust: 0 };

  // Items that have rune slots
  const itemsWithSlots = useMemo(() => {
    return equippedItems
      .filter(item => {
        const extra = item.extraData || item.extra_data || {};
        return (extra.rune_slots || 0) > 0;
      })
      .map(item => {
        const extra = item.extraData || item.extra_data || {};
        const maxSlots = extra.rune_slots || 0;
        const socketed = allRunes.filter(r => r.itemId === item.id || r.item_id === item.id);
        return { ...item, maxSlots, socketed, availableSlots: maxSlots - socketed.length };
      });
  }, [equippedItems, allRunes]);

  // Inventory runes (not socketed)
  const inventoryRunes = useMemo(() => {
    return allRunes.filter(r => !r.itemId && !r.item_id);
  }, [allRunes]);

  const filteredInventory = useMemo(() => {
    return inventoryRunes.filter(r => {
      if (filterRarity !== "all" && r.rarity !== filterRarity) return false;
      if (filterCategory !== "all" && r.runeType !== filterCategory) return false;
      return true;
    });
  }, [inventoryRunes, filterRarity, filterCategory]);

  // ── Mutations ──
  const socketMutation = useMutation({
    mutationFn: ({ runeId, itemId }) =>
      base44.functions.invoke("runes", { characterId: character.id, action: "socket", runeId, itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runes"] });
      setSelectedRune(null);
      setSocketTarget(null);
      toast({ title: "Rune socketed!", duration: 1500 });
    },
    onError: (err) => toast({ title: "Socket failed", description: err?.message, variant: "destructive" }),
  });

  const unsocketMutation = useMutation({
    mutationFn: (runeId) =>
      base44.functions.invoke("runes", { characterId: character.id, action: "unsocket", runeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runes"] });
      toast({ title: "Rune unsocketed", duration: 1500 });
    },
    onError: (err) => toast({ title: "Unsocket failed", description: err?.message, variant: "destructive" }),
  });

  const upgradeMutation = useMutation({
    mutationFn: (runeId) =>
      base44.functions.invoke("runes", { characterId: character.id, action: "upgrade", runeId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["runes"] });
      setUpgradeResult(data);
    },
    onError: (err) => toast({ title: "Upgrade failed", description: err?.message, variant: "destructive" }),
  });

  const salvageMutation = useMutation({
    mutationFn: (runeId) =>
      base44.functions.invoke("runes", { characterId: character.id, action: "salvage", runeId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["runes"] });
      if (onCharacterUpdate) onCharacterUpdate();
      setSelectedRune(null);
      const dustStr = Object.entries(data?.dustGained || {})
        .map(([k, v]) => `${v} ${DUST_INFO[k]?.label || k}`)
        .join(", ");
      toast({ title: `Salvaged: ${dustStr}`, duration: 2500 });
    },
    onError: (err) => toast({ title: "Salvage failed", description: err?.message, variant: "destructive" }),
  });

  const salvageAllMutation = useMutation({
    mutationFn: (rarity) =>
      base44.functions.invoke("runes", { characterId: character.id, action: "salvage_all", rarity }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["runes"] });
      if (onCharacterUpdate) onCharacterUpdate();
      setSelectedRune(null);
      const dustStr = Object.entries(data?.dustGained || {})
        .map(([k, v]) => `${v} ${DUST_INFO[k]?.label || k}`)
        .join(", ");
      toast({ title: `Salvaged ${data?.salvaged || 0} runes: ${dustStr}`, duration: 3000 });
    },
    onError: (err) => toast({ title: "Salvage all failed", description: err?.message, variant: "destructive" }),
  });

  // ── Render rune mini-card ──
  const renderRuneCard = (rune, compact = false) => {
    const rarity = RARITY_COLORS[rune.rarity] || RARITY_COLORS.common;
    const category = RUNE_CATEGORY_COLORS[rune.runeType] || RUNE_CATEGORY_COLORS.offensive;
    const isSelected = selectedRune?.id === rune.id;
    const runeSprite = `/sprites/runes/rune_${rune.rarity || "common"}.png`;

    return (
      <motion.div
        key={rune.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={() => setSelectedRune(isSelected ? null : rune)}
        className={`rounded-xl border-2 p-3 cursor-pointer transition-all hover:scale-[1.02] ${
          isSelected ? "ring-2 ring-white/40 scale-[1.02]" : ""
        } ${category.bg} bg-gray-800/80`}
        style={{ borderColor: rarity.hex + (isSelected ? "cc" : "55") }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.bg} border ${category.border}`}>
            <img src={runeSprite} alt={rune.name} className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{rune.name}</p>
            <div className="flex gap-1 items-center">
              <Badge className={`text-[8px] px-1 py-0 ${rarity.text} ${rarity.bg} ${rarity.border}`}>{rune.rarity}</Badge>
              <span className="text-[8px] text-muted-foreground">Lv.{rune.level || 1}/7</span>
            </div>
          </div>
        </div>

        <div className={`text-xs font-bold ${rarity.text} mb-1`}>
          {RUNE_STAT_LABELS[rune.mainStat] || rune.mainStat} +{rune.mainValue}
        </div>

        {!compact && (rune.subStats || rune.sub_stats || []).length > 0 && (
          <div className="space-y-0.5">
            {(rune.subStats || rune.sub_stats || []).map((sub, i) => (
              <div key={i} className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="text-gray-500">+{sub.value}</span>
                <span>{RUNE_STAT_LABELS[sub.stat] || sub.stat}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // ── Render equipment piece with rune slots ──
  const renderEquipmentCard = (itemData) => {
    const { maxSlots, socketed, availableSlots } = itemData;
    const rarity = RARITY_COLORS[itemData.rarity] || RARITY_COLORS.common;
    const isSocketTarget = socketTarget === itemData.id;

    return (
      <div
        key={itemData.id}
        className={`border rounded-xl p-3 transition-all ${
          isSocketTarget ? "border-primary ring-1 ring-primary/40" : rarity.border
        } ${rarity.bg} bg-gray-800/80`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{itemData.name}</p>
            <div className="flex gap-1 items-center">
              <Badge className={`text-[8px] px-1 py-0 ${rarity.text} ${rarity.bg}`}>{itemData.rarity}</Badge>
              <span className="text-[8px] text-muted-foreground capitalize">{ITEM_TYPE_LABELS[itemData.type] || itemData.type}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] gap-0.5">
            <Gem className="w-2.5 h-2.5" /> {socketed.length}/{maxSlots}
          </Badge>
        </div>

        {/* Rune slots */}
        <div className="space-y-1.5">
          {socketed.map((rune) => {
            const runeRarity = RARITY_COLORS[rune.rarity] || RARITY_COLORS.common;
            const cat = RUNE_CATEGORY_COLORS[rune.runeType] || RUNE_CATEGORY_COLORS.offensive;
            return (
              <div
                key={rune.id}
                className={`flex items-center gap-2 p-1.5 rounded-lg border ${runeRarity.border} ${runeRarity.bg} cursor-pointer hover:brightness-110`}
                onClick={() => setSelectedRune(rune)}
              >
                <img src={`/sprites/runes/rune_${rune.rarity || "common"}.png`} alt="" className="w-4 h-4 flex-shrink-0" style={{ imageRendering: "pixelated" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-white truncate block">{rune.name}</span>
                  <span className={`text-[9px] ${runeRarity.text}`}>
                    {RUNE_STAT_LABELS[rune.mainStat]} +{rune.mainValue} · Lv.{rune.level || 1}
                  </span>
                </div>
                <button
                  className="text-gray-500 hover:text-red-400 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal({
                      title: "Unsocket Rune",
                      message: `Remove ${rune.name} from ${itemData.name}?`,
                      onConfirm: () => { unsocketMutation.mutate(rune.id); setConfirmModal(null); },
                    });
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: availableSlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className={`flex items-center gap-2 p-1.5 rounded-lg border border-dashed transition-all ${
                selectedRune && !selectedRune.itemId && !selectedRune.item_id
                  ? "border-primary/50 bg-primary/5 cursor-pointer hover:border-primary hover:bg-primary/10"
                  : "border-gray-700 bg-gray-900/30"
              }`}
              onClick={() => {
                if (selectedRune && !selectedRune.itemId && !selectedRune.item_id) {
                  socketMutation.mutate({ runeId: selectedRune.id, itemId: itemData.id });
                }
              }}
            >
              <Plus className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <span className="text-[10px] text-gray-600">
                {selectedRune && !selectedRune.itemId && !selectedRune.item_id ? "Click to socket" : "Empty slot"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading runes...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <img src="/sprites/runes/rune_epic.png" alt="" className="w-5 h-5" style={{ imageRendering: "pixelated" }} /> Rune System
          </h2>
          <p className="text-xs text-muted-foreground">
            Socket runes into equipment. Upgrade with dust. Salvage for resources.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Package className="w-3 h-3" /> {inventoryRunes.length} runes
          </Badge>
        </div>
      </div>

      {/* Dust Resources */}
      <div className="bg-muted/30 border border-border rounded-xl p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Your Dust</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(DUST_INFO).map(([key, info]) => (
            <div key={key} className={`flex items-center gap-1.5 ${info.bg} rounded-lg px-3 py-1.5`}>
              <img src={info.sprite} alt={info.label} className="w-5 h-5" style={{ imageRendering: "pixelated" }} />
              <span className={`text-xs font-bold ${info.color}`}>{dust[key] || 0}</span>
              <span className="text-[9px] text-muted-foreground">{info.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Dust drops from battles, dungeons, and tower floors. Salvage runes for more dust.
        </p>
      </div>

      {/* Equipment with Rune Slots */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
          <img src="/sprites/runes/rune_rare.png" alt="" className="w-4 h-4" style={{ imageRendering: "pixelated" }} /> Equipment Rune Slots
        </p>
        {itemsWithSlots.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
            <img src="/sprites/runes/rune_common.png" alt="" className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ imageRendering: "pixelated" }} />
            <p className="text-sm text-muted-foreground">No equipped gear with rune slots</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Higher rarity equipment has a chance to spawn with 1-3 rune slots.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemsWithSlots.map(renderEquipmentCard)}
          </div>
        )}
        {selectedRune && !selectedRune.itemId && !selectedRune.item_id && itemsWithSlots.some(i => i.availableSlots > 0) && (
          <p className="text-xs text-primary mt-2 animate-pulse">
            Click an empty slot on your equipment to socket the selected rune
          </p>
        )}
      </div>

      {/* Selected Rune Detail Panel */}
      <AnimatePresence>
        {selectedRune && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedRune.name}</h3>
                  <div className="flex gap-1.5 mt-1">
                    <Badge className={`text-[9px] ${RARITY_COLORS[selectedRune.rarity]?.text} ${RARITY_COLORS[selectedRune.rarity]?.bg}`}>
                      {selectedRune.rarity}
                    </Badge>
                    <Badge className={`text-[9px] ${RUNE_CATEGORY_COLORS[selectedRune.runeType]?.text} ${RUNE_CATEGORY_COLORS[selectedRune.runeType]?.bg}`}>
                      {selectedRune.runeType}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">Lv.{selectedRune.level || 1}/7</Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelectedRune(null)}>Close</Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-900/50 rounded-lg p-2.5">
                  <p className="text-[9px] text-muted-foreground mb-1">MAIN STAT</p>
                  <p className={`text-sm font-bold ${RARITY_COLORS[selectedRune.rarity]?.text}`}>
                    {RUNE_STAT_LABELS[selectedRune.mainStat]} +{selectedRune.mainValue}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2.5">
                  <p className="text-[9px] text-muted-foreground mb-1">SUB-STATS</p>
                  {(selectedRune.subStats || selectedRune.sub_stats || []).map((sub, i) => (
                    <p key={i} className="text-xs text-gray-300">+{sub.value} {RUNE_STAT_LABELS[sub.stat]}</p>
                  ))}
                  {(selectedRune.subStats || selectedRune.sub_stats || []).length === 0 && (
                    <p className="text-xs text-gray-600">None</p>
                  )}
                </div>
              </div>

              {/* Upgrade info */}
              {(selectedRune.level || 1) < 7 && (() => {
                const lvl = selectedRune.level || 1;
                const dustType = DUST_FOR_LEVEL[lvl];
                const dustNeeded = DUST_COST[lvl];
                const rate = UPGRADE_RATE[lvl];
                const dInfo = DUST_INFO[dustType];
                const hasDust = (dust[dustType] || 0) >= dustNeeded;
                return (
                  <div className="bg-gray-900/50 rounded-lg p-2.5 mb-3">
                    <p className="text-[9px] text-muted-foreground mb-1">UPGRADE TO LEVEL {lvl + 1}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs ${dInfo?.color} flex items-center gap-1`}>
                        {dInfo?.sprite && <img src={dInfo.sprite} alt="" className="w-4 h-4 inline" style={{ imageRendering: "pixelated" }} />}
                        {dustNeeded} {dInfo?.label}
                        <span className={hasDust ? " text-green-400" : " text-red-400"}>
                          {" "}({dust[dustType] || 0} owned)
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">Success: {rate}%</span>
                      <span className="text-[10px] text-red-400/60">Fail: -1 level</span>
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {/* Upgrade */}
                {(selectedRune.level || 1) < 7 && (() => {
                  const lvl = selectedRune.level || 1;
                  const dustType = DUST_FOR_LEVEL[lvl];
                  const dustNeeded = DUST_COST[lvl];
                  const hasDust = (dust[dustType] || 0) >= dustNeeded;
                  return (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-amber-600 hover:bg-amber-500 gap-1"
                      disabled={upgradeMutation.isPending || !hasDust}
                      onClick={() => upgradeMutation.mutate(selectedRune.id)}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      Upgrade ({dustNeeded} {DUST_INFO[dustType]?.label})
                    </Button>
                  );
                })()}

                {/* Salvage (only if not socketed) */}
                {!selectedRune.itemId && !selectedRune.item_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1"
                    onClick={() => setConfirmModal({
                      title: "Salvage Rune",
                      message: `Destroy ${selectedRune.name} for dust?`,
                      onConfirm: () => { salvageMutation.mutate(selectedRune.id); setConfirmModal(null); },
                      variant: "destructive",
                    })}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Salvage for Dust
                  </Button>
                )}

                {/* Unsocket */}
                {(selectedRune.itemId || selectedRune.item_id) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => unsocketMutation.mutate(selectedRune.id)}
                  >
                    Unsocket
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rune Inventory */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Rune Inventory ({filteredInventory.length})
          </p>
          <div className="flex gap-1.5">
            <select
              className="text-[10px] bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-300"
              value={filterRarity}
              onChange={e => setFilterRarity(e.target.value)}
            >
              <option value="all">All Rarities</option>
              {["common", "uncommon", "rare", "epic", "legendary", "mythic"].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <select
              className="text-[10px] bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-300"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All Types</option>
              {["offensive", "defensive", "utility", "elemental"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {["common", "uncommon", "rare", "epic", "legendary", "mythic"].map(r => {
            const count = allRunes.filter(rn => rn.rarity === r && !rn.itemId && !rn.item_id).length;
            if (count === 0) return null;
            const colors = { common: "text-gray-400", uncommon: "text-green-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-yellow-400", mythic: "text-red-400" };
            return (
              <Button
                key={r}
                size="sm"
                variant="outline"
                className={`h-6 text-[10px] px-2 ${colors[r]} border-current/30 hover:bg-current/10 gap-1`}
                onClick={() => setConfirmModal({
                  title: `Salvage All ${r.charAt(0).toUpperCase() + r.slice(1)} Runes`,
                  message: `Salvage ${count} unsocketed ${r} runes for dust? This cannot be undone!`,
                  onConfirm: () => { salvageAllMutation.mutate(r); setConfirmModal(null); },
                  variant: "destructive",
                })}
                disabled={salvageAllMutation.isPending}
              >
                <Trash2 className="w-2.5 h-2.5" /> Salvage All {r} ({count})
              </Button>
            );
          })}
        </div>

        {filteredInventory.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <img src="/sprites/runes/rune_common.png" alt="" className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ imageRendering: "pixelated" }} />
            <p className="text-sm text-muted-foreground">No runes in inventory</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Runes drop from dungeon bosses, tower floors, and expedition rewards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <AnimatePresence>
              {filteredInventory.map(rune => renderRuneCard(rune))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2 text-white">{confirmModal.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{confirmModal.message}</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                size="sm"
                className={confirmModal.variant === "destructive" ? "bg-red-600 hover:bg-red-500" : "bg-primary hover:bg-primary/80"}
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upgrade Result Modal */}
      {upgradeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setUpgradeResult(null); setSelectedRune(upgradeResult.rune || selectedRune); }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className={`bg-gradient-to-b from-gray-900 to-gray-950 border-2 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl ${
              upgradeResult.success
                ? "border-amber-500/50 shadow-amber-500/20"
                : "border-red-500/50 shadow-red-500/20"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0, rotate: upgradeResult.success ? -180 : 0 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", damping: 12 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
                upgradeResult.success
                  ? "bg-amber-500/20 border-amber-500/40"
                  : "bg-red-500/20 border-red-500/40"
              }`}
            >
              {upgradeResult.success ? (
                <ArrowUpCircle className="w-9 h-9 text-amber-400" />
              ) : (
                <X className="w-9 h-9 text-red-400" />
              )}
            </motion.div>
            <h3 className={`font-orbitron font-bold text-lg mb-2 ${upgradeResult.success ? "text-amber-300" : "text-red-300"}`}>
              {upgradeResult.success ? "Upgrade Success!" : "Upgrade Failed!"}
            </h3>
            <p className="text-sm text-gray-300 mb-1">
              {upgradeResult.success
                ? `Level ${(upgradeResult.newLevel || 2) - 1} → ${upgradeResult.newLevel || 2}`
                : `Level dropped to ${upgradeResult.newLevel || 1}`
              }
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Used: {upgradeResult.dustCost} {DUST_INFO[upgradeResult.dustUsed]?.label || upgradeResult.dustUsed}
            </p>
            {upgradeResult.rune && (
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <p className={`text-sm font-bold ${RARITY_COLORS[upgradeResult.rune.rarity]?.text}`}>
                  {RUNE_STAT_LABELS[upgradeResult.rune.mainStat]} +{upgradeResult.rune.mainValue}
                </p>
                {(upgradeResult.rune.subStats || upgradeResult.rune.sub_stats || []).map((sub, i) => (
                  <p key={i} className="text-xs text-gray-400">+{sub.value} {RUNE_STAT_LABELS[sub.stat]}</p>
                ))}
              </div>
            )}
            <Button
              size="sm"
              className={upgradeResult.success ? "bg-amber-600 hover:bg-amber-500" : "bg-gray-700 hover:bg-gray-600"}
              onClick={() => { setUpgradeResult(null); setSelectedRune(upgradeResult.rune || selectedRune); }}
            >
              Continue
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
