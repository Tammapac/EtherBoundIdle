import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  PawPrint, Star, Zap, Shield, Heart, Swords, ArrowUpCircle, Trash2, Sparkles,
  MapPin, Clock, ChevronRight, Package, Wrench, CircleDot, Flame, Droplets,
  Wind, Mountain, Leaf, Moon, Sun, RefreshCw, CheckCircle2, XCircle,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const RARITY_COLORS = {
  common:    "text-gray-400 border-gray-500/30 bg-gray-500/10",
  uncommon:  "text-green-400 border-green-500/30 bg-green-500/10",
  rare:      "text-blue-400 border-blue-500/30 bg-blue-500/10",
  epic:      "text-purple-400 border-purple-500/30 bg-purple-500/10",
  legendary: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  mythic:    "text-red-400 border-red-500/30 bg-red-500/10",
};

const RARITY_BADGE = {
  common:    "bg-gray-500/20 text-gray-300",
  uncommon:  "bg-green-500/20 text-green-300",
  rare:      "bg-blue-500/20 text-blue-300",
  epic:      "bg-purple-500/20 text-purple-300",
  legendary: "bg-amber-500/20 text-amber-300",
  mythic:    "bg-red-500/20 text-red-300",
};

const RARITY_BORDER_HEX = {
  common:    "#9ca3af",
  uncommon:  "#22c55e",
  rare:      "#3b82f6",
  epic:      "#a855f7",
  legendary: "#f59e0b",
  mythic:    "#ef4444",
};

const SPECIES_ICONS = {
  Wolf: "🐺", Phoenix: "🔥", Dragon: "🐉", Turtle: "🐢", Cat: "🐱",
  Owl: "🦉", Slime: "🫧", Fairy: "🧚", Serpent: "🐍", Golem: "🪨",
};

const PASSIVE_LABELS = {
  crit_chance: "Crit Chance", exp_gain: "EXP Gain", gold_gain: "Gold Gain",
  damage: "Damage", defense: "Defense", luck: "Luck",
};

const SKILL_LABELS = {
  heal: "Heal", shield: "Shield", extra_attack: "Extra Attack",
};

const SKILL_ICONS = {
  heal: Heart, shield: Shield, extra_attack: Swords,
};

const SLOT_ICONS = {
  collar: CircleDot,
  claws:  Zap,
  charm:  Star,
};

const ELEMENT_ICONS = {
  fire:    "🔥", water: "💧", wind:  "🌬️", earth: "🪨",
  nature:  "🌿", dark:  "🌑", light: "✨",
};

const RARITY_NEXT = {
  common: "Uncommon", uncommon: "Rare", rare: "Epic",
  epic: "Legendary", legendary: "Mythic",
};

const TRAIT_COLORS = [
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-teal-500/20 text-teal-300 border-teal-500/30",
];

const PET_XP_PER_LEVEL = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function getProgressPct(startedAt, completesAt) {
  const now = Date.now();
  const total = completesAt - startedAt;
  const elapsed = now - startedAt;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TraitPill({ trait, index }) {
  const color = TRAIT_COLORS[index % TRAIT_COLORS.length];
  return (
    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${color}`}>
      {trait}
    </span>
  );
}

function ExpeditionTimer({ completesAt, startedAt }) {
  const [remaining, setRemaining] = useState(Math.max(0, completesAt - Date.now()));
  const pct = getProgressPct(startedAt, completesAt);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        const next = Math.max(0, completesAt - Date.now());
        if (next <= 0) clearInterval(interval);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [completesAt]);

  const isDone = remaining <= 0;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className={isDone ? "text-green-400 font-bold" : "text-muted-foreground"}>
          {isDone ? "Ready to claim!" : formatCountdown(remaining)}
        </span>
        <span className="text-muted-foreground">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isDone ? "bg-green-500" : "bg-cyan-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Pets({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState("pets");

  // My Pets state
  const [selectedForFuse, setSelectedForFuse] = useState([]);
  const [fuseMode, setFuseMode] = useState(false);

  // Expeditions state
  const [selectedExpeditionPet, setSelectedExpeditionPet] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  // Equipment state
  const [selectedEquipPet, setSelectedEquipPet] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

  // ── Pets query ──
  const { data: petData, isLoading: petsLoading } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
  });

  const pets = petData?.pets || [];
  const equippedPet = pets.find(p => p.equipped);
  const unequippedPets = pets.filter(p => !p.equipped);

  // ── Expeditions query ──
  const { data: expeditionData, isLoading: expeditionsLoading } = useQuery({
    queryKey: ["petExpeditions", character?.id],
    queryFn: () => base44.functions.invoke("petExpedition", { characterId: character.id, action: "list" }),
    enabled: !!character?.id && activeTab === "expeditions",
    refetchInterval: activeTab === "expeditions" ? 30000 : false,
  });

  const expeditions = expeditionData?.expeditions || [];
  const regions = expeditionData?.regions || [];
  const durations = expeditionData?.durations || [];

  // ── Equipment query ──
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ["petEquipment", character?.id],
    queryFn: () => base44.functions.invoke("petEquipment", { characterId: character.id, action: "list" }),
    enabled: !!character?.id && activeTab === "equipment",
  });

  const allEquipment = equipmentData?.equipment || [];
  const inventoryItems = allEquipment.filter(e => !e.equippedToPet);
  const equippedItems = allEquipment.filter(e => e.equippedToPet);

  // ── Pet mutations ──
  const equipMutation = useMutation({
    mutationFn: (petId) => base44.functions.invoke("petAction", { characterId: character.id, action: "equip", petId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pets"] }); toast({ title: "Pet equipped!", duration: 1500 }); },
  });

  const unequipMutation = useMutation({
    mutationFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "unequip" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pets"] }); toast({ title: "Pet unequipped", duration: 1500 }); },
  });

  const releaseMutation = useMutation({
    mutationFn: (petId) => base44.functions.invoke("petAction", { characterId: character.id, action: "release", petId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pets"] }); toast({ title: "Pet released", duration: 1500 }); },
  });

  const fuseMutation = useMutation({
    mutationFn: ({ species, rarity }) => base44.functions.invoke("petAction", { characterId: character.id, action: "fuse", species, rarity }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setSelectedForFuse([]);
      setFuseMode(false);
      toast({ title: "Fusion successful!", description: `Created a new ${data?.pet?.rarity} ${data?.pet?.species}!`, duration: 3000 });
    },
    onError: (err) => toast({ title: "Fusion failed", description: err?.message, variant: "destructive" }),
  });

  const rerollTraitsMutation = useMutation({
    mutationFn: (petId) => base44.functions.invoke("petAction", { characterId: character.id, action: "rerollTraits", petId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({ title: "Traits rerolled!", duration: 1500 });
    },
    onError: (err) => toast({ title: "Reroll failed", description: err?.message, variant: "destructive" }),
  });

  const [grantSpecies, setGrantSpecies] = useState("Wolf");
  const [grantRarity, setGrantRarity] = useState("rare");
  const grantPetMutation = useMutation({
    mutationFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "grant_pet", species: grantSpecies, rarity: grantRarity }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({ title: "Pet granted!", description: `Got a ${data?.pet?.rarity} ${data?.pet?.species}!`, duration: 3000 });
    },
    onError: (err) => toast({ title: "Grant failed", description: err?.message, variant: "destructive" }),
  });

  // ── Expedition mutations ──
  const startExpeditionMutation = useMutation({
    mutationFn: ({ petId, region, duration }) =>
      base44.functions.invoke("petExpedition", { characterId: character.id, action: "start", petId, region, duration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petExpeditions"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setSelectedExpeditionPet("");
      setSelectedRegion("");
      setSelectedDuration("");
      toast({ title: "Expedition started!", duration: 2000 });
    },
    onError: (err) => toast({ title: "Failed to start expedition", description: err?.message, variant: "destructive" }),
  });

  const claimExpeditionMutation = useMutation({
    mutationFn: (expeditionId) =>
      base44.functions.invoke("petExpedition", { characterId: character.id, action: "claim", expeditionId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["petExpeditions"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (onCharacterUpdate) onCharacterUpdate();
      const rewards = data?.rewards;
      const rewardText = rewards
        ? Object.entries(rewards).map(([k, v]) => `${v} ${k}`).join(", ")
        : "Rewards claimed!";
      toast({ title: "Expedition complete!", description: rewardText, duration: 3000 });
    },
    onError: (err) => toast({ title: "Claim failed", description: err?.message, variant: "destructive" }),
  });

  const cancelExpeditionMutation = useMutation({
    mutationFn: (expeditionId) =>
      base44.functions.invoke("petExpedition", { characterId: character.id, action: "cancel", expeditionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petExpeditions"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({ title: "Expedition cancelled", duration: 1500 });
    },
    onError: (err) => toast({ title: "Cancel failed", description: err?.message, variant: "destructive" }),
  });

  // ── Equipment mutations ──
  const equipItemMutation = useMutation({
    mutationFn: ({ equipmentId, petId }) =>
      base44.functions.invoke("petEquipment", { characterId: character.id, action: "equip", equipmentId, petId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petEquipment"] });
      setSelectedInventoryItem(null);
      toast({ title: "Item equipped!", duration: 1500 });
    },
    onError: (err) => toast({ title: "Equip failed", description: err?.message, variant: "destructive" }),
  });

  const unequipItemMutation = useMutation({
    mutationFn: (equipmentId) =>
      base44.functions.invoke("petEquipment", { characterId: character.id, action: "unequip", equipmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petEquipment"] });
      toast({ title: "Item unequipped", duration: 1500 });
    },
    onError: (err) => toast({ title: "Unequip failed", description: err?.message, variant: "destructive" }),
  });

  const salvageMutation = useMutation({
    mutationFn: (equipmentId) =>
      base44.functions.invoke("petEquipment", { characterId: character.id, action: "salvage", equipmentId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["petEquipment"] });
      setSelectedInventoryItem(null);
      if (onCharacterUpdate) onCharacterUpdate();
      toast({ title: "Item salvaged!", description: `+${data?.goldGained || 0} gold`, duration: 2000 });
    },
    onError: (err) => toast({ title: "Salvage failed", description: err?.message, variant: "destructive" }),
  });

  // ── Fusion helpers ──
  const handleFuseSelect = (pet) => {
    if (!fuseMode) return;
    const already = selectedForFuse.find(p => p.id === pet.id);
    if (already) {
      setSelectedForFuse(selectedForFuse.filter(p => p.id !== pet.id));
      return;
    }
    if (selectedForFuse.length >= 3) return;
    if (selectedForFuse.length > 0) {
      const first = selectedForFuse[0];
      if (pet.species !== first.species || pet.rarity !== first.rarity) {
        toast({ title: "Must select same species and rarity", variant: "destructive", duration: 2000 });
        return;
      }
    }
    setSelectedForFuse([...selectedForFuse, pet]);
  };

  const canFuse = selectedForFuse.length === 3;

  const fusionGroups = useMemo(() => {
    const groups = {};
    unequippedPets.forEach(p => {
      const key = `${p.species}-${p.rarity}`;
      if (!groups[key]) groups[key] = { species: p.species, rarity: p.rarity, count: 0 };
      groups[key].count++;
    });
    return Object.values(groups).filter(g => g.count >= 3);
  }, [unequippedPets]);

  // Pets not currently on an expedition
  const availablePetsForExpedition = useMemo(() => {
    const onExpedition = new Set(expeditions.filter(e => !e.claimedAt).map(e => e.petId));
    return pets.filter(p => !onExpedition.has(p.id));
  }, [pets, expeditions]);

  // Equipped items for a given pet
  const getEquippedItemsForPet = (petId) => equippedItems.filter(e => e.equippedToPet === petId);

  // ── Render pet card ──
  const renderPetCard = (pet, isEquipped = false) => {
    const colors = RARITY_COLORS[pet.rarity] || RARITY_COLORS.common;
    const badgeColor = RARITY_BADGE[pet.rarity] || RARITY_BADGE.common;
    const SkillIcon = SKILL_ICONS[pet.skillType] || Zap;
    const isSelectedFuse = !!selectedForFuse.find(p => p.id === pet.id);
    const xpPercent = Math.min(100, ((pet.xp || 0) / PET_XP_PER_LEVEL) * 100);
    const traits = pet.traits || [];

    return (
      <div
        key={pet.id}
        onClick={() => fuseMode && !pet.equipped ? handleFuseSelect(pet) : null}
        className={`rounded-xl border-2 p-3 transition-all ${colors} ${
          isEquipped ? "ring-2 ring-primary/50" : ""
        } ${fuseMode && !pet.equipped ? "cursor-pointer hover:scale-105" : ""} ${
          isSelectedFuse ? "ring-2 ring-yellow-400 scale-105" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{SPECIES_ICONS[pet.species] || "🐾"}</span>
            <div>
              <p className="font-bold text-sm">{pet.species}</p>
              <Badge className={`text-[9px] px-1.5 py-0 ${badgeColor}`}>{pet.rarity}</Badge>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground">Lv.{pet.level}</span>
        </div>

        {/* XP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
            <span>XP</span>
            <span>{pet.xp || 0}/{PET_XP_PER_LEVEL}</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Passive */}
        <div className="flex items-center gap-1.5 text-[10px] mb-1">
          <Star className="w-3 h-3 text-amber-400" />
          <span className="text-muted-foreground">{PASSIVE_LABELS[pet.passiveType] || pet.passiveType}:</span>
          <span className="font-bold">+{pet.passiveValue}{pet.passiveType === "crit_chance" || pet.passiveType === "luck" ? "" : "%"}</span>
        </div>

        {/* Skill */}
        <div className="flex items-center gap-1.5 text-[10px] mb-2">
          <SkillIcon className="w-3 h-3 text-cyan-400" />
          <span className="text-muted-foreground">{SKILL_LABELS[pet.skillType] || pet.skillType}:</span>
          <span className="font-bold">{pet.skillValue}</span>
        </div>

        {/* Traits */}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {traits.map((trait, i) => <TraitPill key={i} trait={trait} index={i} />)}
          </div>
        )}

        {/* Actions */}
        {!fuseMode && (
          <div className="flex gap-1.5 flex-wrap">
            {isEquipped ? (
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => unequipMutation.mutate()}>
                Unequip
              </Button>
            ) : (
              <>
                <Button size="sm" className="flex-1 h-7 text-[10px] bg-primary/80 hover:bg-primary" onClick={() => equipMutation.mutate(pet.id)}>
                  Equip
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[10px] text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                  title="Reroll Traits (costs gold)"
                  onClick={() => rerollTraitsMutation.mutate(pet.id)}
                  disabled={rerollTraitsMutation.isPending}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />Traits
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => {
                  if (confirm("Release this pet?")) releaseMutation.mutate(pet.id);
                }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Equipment item card ──
  const renderEquipmentCard = (item, selectable = false) => {
    const rarityColor = RARITY_BORDER_HEX[item.rarity] || RARITY_BORDER_HEX.common;
    const rarityTextClass = {
      common: "text-gray-400", uncommon: "text-green-400", rare: "text-blue-400",
      epic: "text-purple-400", legendary: "text-amber-400", mythic: "text-red-400",
    }[item.rarity] || "text-gray-400";
    const isSelected = selectedInventoryItem?.id === item.id;
    const SlotIcon = SLOT_ICONS[item.slot] || Package;

    return (
      <div
        key={item.id}
        onClick={() => selectable && setSelectedInventoryItem(isSelected ? null : item)}
        className={`rounded-lg border-2 p-2.5 cursor-pointer transition-all hover:scale-[1.02] ${
          isSelected ? "ring-2 ring-white/40 scale-[1.02]" : ""
        } bg-gray-800`}
        style={{ borderColor: rarityColor + (isSelected ? "cc" : "55") }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <SlotIcon className={`w-4 h-4 ${rarityTextClass}`} />
          <span className="text-xs font-semibold text-white truncate flex-1">{item.name || "Unknown Item"}</span>
        </div>
        <div className={`text-[9px] font-bold mb-1 ${rarityTextClass} capitalize`}>{item.rarity} · {item.slot}</div>
        {item.statType && (
          <div className="text-[10px] text-cyan-300">+{item.statValue} {item.statType}</div>
        )}
        {item.secondaryStatType && (
          <div className="text-[10px] text-gray-400">+{item.secondaryStatValue} {item.secondaryStatType}</div>
        )}
      </div>
    );
  };

  // ── Equipment slot box ──
  const renderSlotBox = (pet, slotKey) => {
    const SlotIcon = SLOT_ICONS[slotKey] || Package;
    const slotItem = getEquippedItemsForPet(pet.id).find(e => e.slot === slotKey);
    const rarityColor = slotItem ? (RARITY_BORDER_HEX[slotItem.rarity] || "#9ca3af") : "#374151";

    return (
      <div
        key={slotKey}
        className="rounded-lg border-2 p-2 flex flex-col items-center gap-1 min-h-[70px] cursor-pointer transition-all hover:border-gray-500 bg-gray-800/50"
        style={{ borderColor: rarityColor }}
        onClick={() => {
          if (slotItem) {
            if (confirm("Unequip this item?")) unequipItemMutation.mutate(slotItem.id);
          } else if (selectedInventoryItem && selectedInventoryItem.slot === slotKey) {
            equipItemMutation.mutate({ equipmentId: selectedInventoryItem.id, petId: pet.id });
          }
        }}
        title={slotItem ? `${slotItem.name} — click to unequip` : selectedInventoryItem?.slot === slotKey ? "Click to equip selected item" : `${slotKey} slot (empty)`}
      >
        <SlotIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground capitalize">{slotKey}</span>
        {slotItem ? (
          <>
            <span className="text-[9px] font-semibold text-white text-center leading-tight">{slotItem.name}</span>
            {slotItem.statType && <span className="text-[8px] text-cyan-400">+{slotItem.statValue} {slotItem.statType}</span>}
          </>
        ) : (
          <span className="text-[8px] text-gray-600">
            {selectedInventoryItem?.slot === slotKey ? "Click to equip" : "Empty"}
          </span>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-cyan-400" />
            Pet Companions
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {pets.length} pet{pets.length !== 1 ? "s" : ""} collected
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "pets",        label: "My Pets",    icon: PawPrint },
          { key: "expeditions", label: "Expeditions", icon: MapPin },
          { key: "equipment",   label: "Equipment",   icon: Wrench },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === key
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-gray-800 text-muted-foreground border border-gray-700 hover:border-gray-500"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: MY PETS
         ══════════════════════════════════════════════════════ */}
      {activeTab === "pets" && (
        <div className="space-y-4">
          {/* Debug: Grant test pet */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
            <p className="text-xs text-cyan-400 font-semibold mb-2">Test: Grant a Pet</p>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={grantSpecies} onChange={e => setGrantSpecies(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                {["Wolf","Phoenix","Dragon","Turtle","Cat","Owl","Slime","Fairy","Serpent","Golem"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={grantRarity} onChange={e => setGrantRarity(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                {["common","uncommon","rare","epic","legendary","mythic"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Button size="sm" className="text-xs gap-1" onClick={() => grantPetMutation.mutate()}
                disabled={grantPetMutation.isPending}>
                <PawPrint className="w-3 h-3" /> Grant Pet
              </Button>
            </div>
          </div>

          {/* Fuse toggle */}
          <div className="flex justify-end">
            {fusionGroups.length > 0 && (
              <Button
                size="sm"
                variant={fuseMode ? "destructive" : "outline"}
                className="gap-1.5 text-xs"
                onClick={() => { setFuseMode(!fuseMode); setSelectedForFuse([]); }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {fuseMode ? "Cancel Fusion" : "Fuse Pets"}
              </Button>
            )}
          </div>

          {/* Fusion UI */}
          {fuseMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Fusion Mode
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Select 3 pets of the same species and rarity to fuse into a higher rarity pet.
              </p>
              <div className="flex items-center gap-2 mb-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center ${
                    selectedForFuse[i] ? "border-yellow-400 bg-yellow-500/10" : "border-muted-foreground/30"
                  }`}>
                    {selectedForFuse[i] ? (
                      <span className="text-2xl">{SPECIES_ICONS[selectedForFuse[i].species]}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">?</span>
                    )}
                  </div>
                ))}
                <ArrowUpCircle className="w-6 h-6 text-amber-400 mx-2" />
                <div className="w-16 h-16 rounded-xl border-2 border-amber-400/50 bg-amber-500/10 flex items-center justify-center">
                  {canFuse ? (
                    <span className="text-2xl">{SPECIES_ICONS[selectedForFuse[0]?.species]}</span>
                  ) : (
                    <span className="text-lg">✨</span>
                  )}
                </div>
              </div>
              {canFuse && (
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                  onClick={() => fuseMutation.mutate({ species: selectedForFuse[0].species, rarity: selectedForFuse[0].rarity })}
                  disabled={fuseMutation.isPending}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {fuseMutation.isPending
                    ? "Fusing..."
                    : `Fuse into ${RARITY_NEXT[selectedForFuse[0]?.rarity] || "higher rarity"}`}
                </Button>
              )}
            </div>
          )}

          {/* Equipped Pet */}
          {equippedPet && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Active Companion</p>
              <div className="max-w-xs">
                {renderPetCard(equippedPet, true)}
              </div>
            </div>
          )}

          {/* Collection */}
          {pets.length === 0 && !petsLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <PawPrint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pets yet!</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Defeat enemies to find pet eggs.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {fuseMode ? "Select pets to fuse" : "Collection"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unequippedPets.map(pet => renderPetCard(pet))}
              </div>
            </div>
          )}

          {/* Fusion hint */}
          {!fuseMode && fusionGroups.length > 0 && (
            <div className="text-xs text-amber-400/70 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              You have {fusionGroups.length} fusion{fusionGroups.length > 1 ? "s" : ""} available!
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: EXPEDITIONS
         ══════════════════════════════════════════════════════ */}
      {activeTab === "expeditions" && (
        <div className="space-y-5">
          {expeditionsLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading expeditions...</div>
          ) : (
            <>
              {/* Active expeditions */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Active Expeditions
                </p>
                {expeditions.length === 0 ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No active expeditions</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Send a pet below to explore regions.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {expeditions.map(exp => {
                      const pet = pets.find(p => p.id === exp.petId);
                      const completesAt = new Date(exp.completesAt).getTime();
                      const startedAt = new Date(exp.startedAt || (completesAt - (exp.durationHours || 1) * 3600000)).getTime();
                      const isDone = Date.now() >= completesAt;

                      return (
                        <div key={exp.id} className={`bg-gray-800 border rounded-xl p-4 ${isDone ? "border-green-500/40" : "border-gray-700"}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{pet ? (SPECIES_ICONS[pet.species] || "🐾") : "🐾"}</span>
                              <div>
                                <p className="text-sm font-semibold text-white">{pet?.species || "Unknown Pet"}</p>
                                <p className="text-[10px] text-muted-foreground">{exp.region}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              {isDone ? (
                                <Button
                                  size="sm"
                                  className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white gap-1"
                                  onClick={() => claimExpeditionMutation.mutate(exp.id)}
                                  disabled={claimExpeditionMutation.isPending}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Claim
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                  title="Cancel expedition"
                                  onClick={() => { if (confirm("Cancel this expedition? Rewards will be lost.")) cancelExpeditionMutation.mutate(exp.id); }}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <ExpeditionTimer completesAt={completesAt} startedAt={startedAt} />
                          {exp.elementMatch && (
                            <div className="mt-2 text-[9px] text-amber-400 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Element bonus active
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Send on expedition */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Send on Expedition
                </p>

                {availablePetsForExpedition.length === 0 ? (
                  <p className="text-xs text-muted-foreground">All pets are currently on expeditions.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Pet select */}
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Select Pet</label>
                      <select
                        value={selectedExpeditionPet}
                        onChange={e => setSelectedExpeditionPet(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Choose a pet...</option>
                        {availablePetsForExpedition.map(p => (
                          <option key={p.id} value={p.id}>
                            {SPECIES_ICONS[p.species] || "🐾"} {p.species} (Lv.{p.level}, {p.rarity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Region select */}
                    {regions.length > 0 && (
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-2 block">Select Region</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {regions.map(region => {
                            const selectedPet = pets.find(p => p.id === selectedExpeditionPet);
                            const hasElementMatch = selectedPet && region.elementSpecies?.includes(selectedPet.species);
                            return (
                              <div
                                key={region.id || region.name}
                                onClick={() => setSelectedRegion(region.id || region.name)}
                                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                                  selectedRegion === (region.id || region.name)
                                    ? "border-cyan-500/60 bg-cyan-500/10"
                                    : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-white flex items-center gap-1.5">
                                    {region.element ? (ELEMENT_ICONS[region.element] || "🌍") : "🌍"} {region.name}
                                  </span>
                                  {hasElementMatch && (
                                    <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                                      Bonus!
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-muted-foreground space-y-0.5">
                                  {region.element && <div>Element: <span className="capitalize text-white/70">{region.element}</span></div>}
                                  {region.minLevel && <div>Min Level: <span className="text-white/70">{region.minLevel}</span></div>}
                                  {region.baseRewards && <div>Rewards: <span className="text-white/70">{region.baseRewards}</span></div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Duration select */}
                    {durations.length > 0 && (
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">Duration</label>
                        <div className="flex gap-2 flex-wrap">
                          {durations.map(dur => (
                            <button
                              key={dur.value || dur.label}
                              onClick={() => setSelectedDuration(dur.value || dur.label)}
                              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                                selectedDuration === (dur.value || dur.label)
                                  ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                                  : "border-gray-600 bg-gray-700/50 text-muted-foreground hover:border-gray-500"
                              }`}
                            >
                              {dur.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full gap-1.5 text-sm"
                      disabled={!selectedExpeditionPet || !selectedRegion || !selectedDuration || startExpeditionMutation.isPending}
                      onClick={() => startExpeditionMutation.mutate({
                        petId: selectedExpeditionPet,
                        region: selectedRegion,
                        duration: selectedDuration,
                      })}
                    >
                      <MapPin className="w-4 h-4" />
                      {startExpeditionMutation.isPending ? "Sending..." : "Send on Expedition"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: EQUIPMENT
         ══════════════════════════════════════════════════════ */}
      {activeTab === "equipment" && (
        <div className="space-y-5">
          {equipmentLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading equipment...</div>
          ) : (
            <>
              {/* Pet selector for equipment slots */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Pet Equipment Slots</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {pets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedEquipPet(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        selectedEquipPet === p.id
                          ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                          : "border-gray-600 bg-gray-800 text-muted-foreground hover:border-gray-500"
                      }`}
                    >
                      <span>{SPECIES_ICONS[p.species] || "🐾"}</span>
                      <span>{p.species}</span>
                      <span className="text-[10px] opacity-60">Lv.{p.level}</span>
                    </button>
                  ))}
                </div>

                {selectedEquipPet ? (
                  <div>
                    {(() => {
                      const pet = pets.find(p => p.id === selectedEquipPet);
                      if (!pet) return null;
                      return (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{SPECIES_ICONS[pet.species] || "🐾"}</span>
                            <div>
                              <p className="font-semibold text-white">{pet.species}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{pet.rarity} · Lv.{pet.level}</p>
                            </div>
                          </div>
                          {selectedInventoryItem && (
                            <p className="text-[10px] text-cyan-400 mb-2">
                              Click a matching slot to equip: <span className="font-bold">{selectedInventoryItem.name}</span> ({selectedInventoryItem.slot})
                            </p>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            {["collar", "claws", "charm"].map(slot => renderSlotBox(pet, slot))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center text-sm text-muted-foreground">
                    Select a pet above to manage their equipment slots.
                  </div>
                )}
              </div>

              {/* Inventory */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Inventory ({inventoryItems.length})
                  </p>
                  {selectedInventoryItem && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-red-400 hover:text-red-300 gap-1"
                        onClick={() => { if (confirm("Salvage for gold?")) salvageMutation.mutate(selectedInventoryItem.id); }}
                        disabled={salvageMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" /> Salvage
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-muted-foreground gap-1"
                        onClick={() => setSelectedInventoryItem(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {inventoryItems.length === 0 ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                    <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No equipment in inventory</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Equipment drops from expeditions and dungeons.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {inventoryItems.map(item => renderEquipmentCard(item, true))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
