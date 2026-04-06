import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  PawPrint, Star, Zap, Shield, Heart, Swords, ArrowUpCircle, Trash2, Sparkles,
  MapPin, Clock, ChevronRight, Package, Wrench, CircleDot, Flame, Droplets,
  Wind, Mountain, Leaf, Moon, Sun, RefreshCw, CheckCircle2, XCircle,
  TrendingUp, GitBranch, Baby, Dna, Layers, Plus, RotateCcw, Crown,
  Egg, Timer, Gem, FastForward,
} from "lucide-react";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

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

const PET_XP_PER_LEVEL = 500;

// Evolution stage config
const EVOLUTION_STAGES = [
  { stage: 0, name: "Baby",  suffix: "",   levelReq: 0,  color: "text-gray-300",  badge: "bg-gray-500/20 text-gray-300" },
  { stage: 1, name: "Adult", suffix: "⭐",  levelReq: 15, color: "text-amber-300", badge: "bg-amber-500/20 text-amber-300" },
  { stage: 2, name: "Elder", suffix: "👑",  levelReq: 35, color: "text-purple-300", badge: "bg-purple-500/20 text-purple-300" },
];

// Bond level names and colors
const BOND_LEVELS = [
  { name: "Stranger",    color: "text-gray-400",   heartColor: "text-gray-500" },
  { name: "Acquainted",  color: "text-blue-400",   heartColor: "text-blue-400" },
  { name: "Friendly",    color: "text-green-400",  heartColor: "text-green-400" },
  { name: "Trusted",     color: "text-cyan-400",   heartColor: "text-cyan-400" },
  { name: "Bonded",      color: "text-pink-400",   heartColor: "text-pink-400" },
  { name: "Soulbound",   color: "text-rose-300",   heartColor: "text-rose-300" },
];

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

function getEvolutionInfo(pet) {
  const stage = pet.evolution ?? pet.evolutionStage ?? pet.evolution_stage ?? 0;
  return EVOLUTION_STAGES[Math.min(stage, 2)];
}

function getEvolutionVisual(pet) {
  const base = SPECIES_ICONS[pet.species] || "🐾";
  const evo = getEvolutionInfo(pet);
  return base + (evo.suffix ? evo.suffix : "");
}

function getBondInfo(pet) {
  const level = pet.bondLevel ?? pet.bond_level ?? 0;
  return BOND_LEVELS[Math.min(level, BOND_LEVELS.length - 1)] || BOND_LEVELS[0];
}

function getBondLevelName(pet) {
  const n = pet.bondLevelName ?? pet.bond_level_name ?? null;
  if (n) return n;
  return getBondInfo(pet).name;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TraitPill({ trait, index }) {
  const color = TRAIT_COLORS[index % TRAIT_COLORS.length];
  const name = typeof trait === 'object' ? (trait.name || trait.key || '') : trait;
  const desc = typeof trait === 'object' ? (trait.desc || '') : '';
  return (
    <span className="relative group inline-block">
      <span className={`inline-block text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full border font-medium cursor-help ${color}`}>
        {name}
      </span>
      {desc && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm text-white whitespace-nowrap shadow-xl pointer-events-none">
          {desc}
        </span>
      )}
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

// ─── Error Boundary ──────────────────────────────────────────────────────────

class PetsErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-lg mx-auto mt-10">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <h3 className="font-bold text-red-300 mb-2">Pet System Error</h3>
            <p className="text-sm text-red-200/70 mb-3">{String(this.state.error?.message || "Something went wrong rendering the Pets page.")}</p>
            <p className="text-xs text-gray-400 mb-4">Check browser console (F12) for details. Make sure all SQL migrations were run in Supabase.</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300 hover:bg-red-500/30">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

function ResultModal({ modal, onClose }) {
  if (!modal) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className={`bg-gradient-to-b from-gray-900 to-gray-950 border-2 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center relative overflow-hidden ${
            modal.success ? "border-emerald-500/50 shadow-emerald-500/20" : "border-red-500/50 shadow-red-500/20"
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className={`absolute inset-0 opacity-10 ${modal.success ? "bg-gradient-to-b from-emerald-500 to-transparent" : "bg-gradient-to-b from-red-500 to-transparent"}`} />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", damping: 12 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
                modal.success ? "bg-emerald-500/20 border-emerald-500/40" : "bg-red-500/20 border-red-500/40"
              }`}
            >
              {modal.success
                ? <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                : <XCircle className="w-9 h-9 text-red-400" />}
            </motion.div>
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-orbitron font-bold text-lg mb-3 ${modal.success ? "text-emerald-300" : "text-red-300"}`}
            >
              {modal.title}
            </motion.h3>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-gray-300 mb-6 whitespace-pre-line leading-relaxed"
            >
              {modal.message}
            </motion.p>
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`px-8 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all ${
                modal.success
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
              }`}
            >
              Continue
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ modal, onClose }) {
  if (!modal) return null;
  const isDestructive = modal.variant === "destructive";
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`bg-gradient-to-b from-gray-900 to-gray-950 border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden ${
            isDestructive ? "border-red-500/30" : "border-cyan-500/30"
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className={`absolute inset-0 opacity-5 ${isDestructive ? "bg-gradient-to-b from-red-500 to-transparent" : "bg-gradient-to-b from-cyan-500 to-transparent"}`} />
          <div className="relative z-10">
            <h3 className={`font-orbitron font-bold text-base mb-2 ${isDestructive ? "text-red-300" : "text-cyan-300"}`}>
              {modal.title}
            </h3>
            <p className="text-sm text-gray-300 mb-5 whitespace-pre-line leading-relaxed">{modal.message}</p>
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-600 text-sm text-gray-400 hover:border-gray-400 hover:text-white transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { modal.onConfirm(); onClose(); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold tracking-wide uppercase transition-all ${
                  isDestructive
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
                }`}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PetsInner({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pollInterval = useSmartPolling(POLL_INTERVALS.GAME_STATE);

  // Tab state
  const [activeTab, setActiveTab] = useState("pets");

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm, variant }

  // Result modal state
  const [resultModal, setResultModal] = useState(null); // { title, message, success, icon }

  // My Pets state
  const [selectedForFuse, setSelectedForFuse] = useState([]);
  const [fuseMode, setFuseMode] = useState(false);
  const [fuseSpeciesFilter, setFuseSpeciesFilter] = useState(null);
  const [fuseRarityFilter, setFuseRarityFilter] = useState(null);
  const [rarityFilter, setRarityFilter] = useState("all");

  // Expeditions state
  const [selectedExpeditionPet, setSelectedExpeditionPet] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [expeditionResultModal, setExpeditionResultModal] = useState(null); // { petName, rewards }

  // Equipment state
  const [selectedEquipPet, setSelectedEquipPet] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

  // Evolution state
  const [evolvingPetId, setEvolvingPetId] = useState(null);
  const [fuseAnimating, setFuseAnimating] = useState(false);
  const [evolveAnimating, setEvolveAnimating] = useState(null); // petId or null

  // Skills state
  const [selectedSkillPet, setSelectedSkillPet] = useState(null);

  // Breeding state
  const [breedSlot1, setBreedSlot1] = useState(null);
  const [breedSlot2, setBreedSlot2] = useState(null);
  const [breedResult, setBreedResult] = useState(null);
  const [breedRevealed, setBreedRevealed] = useState(false);

  // Auras state
  const [auraData, setAuraData] = useState(null);

  // ── Pets query ──
  const { data: petData, isLoading: petsLoading, error: petsError } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    retry: 1,
  });

  const pets = petData?.pets || [];
  const skillTrees = petData?.skillTrees || {};
  const equippedPet = pets.find(p => p.equipped);
  const unequippedPets = pets.filter(p => !p.equipped);

  // Auto-select equipped pet in skills tab
  useEffect(() => {
    if (equippedPet && activeTab === "skills") setSelectedSkillPet(equippedPet);
  }, [equippedPet?.id, activeTab]);

  // ── Expeditions query ──
  const { data: expeditionData, isLoading: expeditionsLoading } = useQuery({
    queryKey: ["petExpeditions", character?.id],
    queryFn: () => base44.functions.invoke("petExpedition", { characterId: character.id, action: "list" }),
    enabled: !!character?.id && activeTab === "expeditions",
    refetchInterval: activeTab === "expeditions" ? pollInterval : false,
    staleTime: POLL_INTERVALS.GAME_STATE,
  });

  const expeditions = expeditionData?.expeditions || [];
  const regions = expeditionData?.regions || [];
  const durations = expeditionData?.durations || [];

  // ── Equipment query ──
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ["petEquipment", character?.id],
    queryFn: () => base44.functions.invoke("petEquipment", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
  });

  const allEquipment = equipmentData?.equipment || [];
  const inventoryItems = allEquipment.filter(e => !e.petId);
  const equippedItems = allEquipment.filter(e => e.petId);

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

  const sellMutation = useMutation({
    mutationFn: (petId) => base44.functions.invoke("petAction", { characterId: character.id, action: "sell", petId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (onCharacterUpdate) onCharacterUpdate();
      toast({ title: "Pet sold!", description: `+${data?.goldGain?.toLocaleString() || 0} gold`, duration: 2000 });
    },
    onError: (err) => toast({ title: "Sell failed", description: err?.message, variant: "destructive" }),
  });

  const fuseMutation = useMutation({
    mutationFn: ({ species, rarity }) => {
      setFuseAnimating(true);
      return base44.functions.invoke("petAction", { characterId: character.id, action: "fuse", species, rarity });
    },
    onSuccess: (data) => {
      setFuseAnimating(false);
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (data?.failed) {
        setSelectedForFuse([]);
        setFuseMode(false);
        setFuseSpeciesFilter(null);
        setFuseRarityFilter(null);
        setResultModal({ title: "Fusion Failed!", message: `Fusion failed! Success chance was ${data.chance}%. All 3 pets were lost. ${data?.goldCost ? `${data.goldCost.toLocaleString()} gold consumed.` : ''}`, success: false });
        return;
      }
      setSelectedForFuse([]);
      setFuseMode(false);
      setFuseSpeciesFilter(null);
      setFuseRarityFilter(null);
      const p = data?.pet;
      const desc = p
        ? `New Pet: ${(SPECIES_ICONS[p.species] || '🐾')} ${p.species}\nRarity: ${p.rarity}\nLevel: ${p.level}\nPassive: ${PASSIVE_LABELS[p.passiveType] || p.passiveType} +${p.passiveValue}\nSkill: ${SKILL_LABELS[p.skillType] || p.skillType} (${p.skillValue})\nTraits: ${(p.traits || []).map(t => typeof t === 'object' ? t.name : t).join(', ') || 'None'}`
        : "New pet created!";
      setResultModal({ title: "Fusion Successful!", message: desc, success: true });
    },
    onError: (err) => { setFuseAnimating(false); toast({ title: "Fusion failed", description: err?.message, variant: "destructive" }); },
  });

  const sellAllMutation = useMutation({
    mutationFn: (rarity) => base44.functions.invoke("petAction", { characterId: character.id, action: "sellAll", rarity }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (onCharacterUpdate) onCharacterUpdate();
      toast({ title: "Sold all!", description: `Sold ${data?.soldCount || 0} ${data?.rarity || ''} pets for ${data?.goldGain?.toLocaleString() || 0} gold`, duration: 3000 });
    },
    onError: (err) => toast({ title: "Sell all failed", description: err?.message, variant: "destructive" }),
  });

  const rerollTraitsMutation = useMutation({
    mutationFn: (petId) => base44.functions.invoke("petAction", { characterId: character.id, action: "rerollTraits", petId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({ title: "Traits rerolled!", description: `Spent ${data?.cost?.toLocaleString() || ''} gold`, duration: 2000 });
    },
    onError: (err) => toast({ title: "Reroll failed", description: err?.message, variant: "destructive" }),
  });

  const feedMutation = useMutation({
    mutationFn: (petId) => base44.functions.invoke("petAction", { characterId: character.id, action: "feed", petId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({
        title: "Pet fed!",
        description: data?.bondLevelName
          ? `Bond improved! Now: ${data.bondLevelName} (+${data.bondGain ?? 1} bond)`
          : `+${data.bondGain ?? 1} bond`,
        duration: 2000,
      });
    },
    onError: (err) => toast({ title: "Feed failed", description: err?.message, variant: "destructive" }),
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

  // ── Evolution mutation ──
  const evolveMutation = useMutation({
    mutationFn: (petId) => {
      setEvolveAnimating(petId);
      return base44.functions.invoke("petAction", { characterId: character.id, action: "evolve", petId });
    },
    onSuccess: (data) => {
      setEvolveAnimating(null);
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (onCharacterUpdate) onCharacterUpdate();
      setEvolvingPetId(null);
      if (data?.failed) {
        setResultModal({ title: "Evolution Failed!", message: `Your pet failed to evolve. ${data?.gemCost ?? 500} gems consumed. Success chance was ${data.chance}%.`, success: false });
        return;
      }
      const p = data?.pet;
      const stageName = data?.stage || (p?.evolution === 1 ? "Adult" : "Elder");
      setResultModal({ title: "Evolution Successful!", message: `${p?.species || 'Pet'} evolved to ${stageName}!`, success: true });
    },
    onError: (err) => {
      setEvolvingPetId(null);
      setEvolveAnimating(null);
      toast({ title: "Evolution failed", description: err?.message, variant: "destructive" });
    },
  });

  // ── Skill mutations ──
  const allocateSkillMutation = useMutation({
    mutationFn: ({ petId, branch, skill }) =>
      base44.functions.invoke("petAction", { characterId: character.id, action: "allocateSkill", petId, branch, skill }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({ title: "Skill point allocated!", duration: 1200 });
    },
    onError: (err) => toast({ title: "Allocation failed", description: err?.message, variant: "destructive" }),
  });

  const resetSkillsMutation = useMutation({
    mutationFn: (petId) =>
      base44.functions.invoke("petAction", { characterId: character.id, action: "resetSkills", petId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({ title: "Skill tree reset!", description: "Refunded 2000 gold.", duration: 2000 });
    },
    onError: (err) => toast({ title: "Reset failed", description: err?.message, variant: "destructive" }),
  });

  // ── Breeding mutation ──
  const breedMutation = useMutation({
    mutationFn: ({ pet1Id, pet2Id }) =>
      base44.functions.invoke("petAction", { characterId: character.id, action: "breed", pet1Id, pet2Id }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setBreedResult(data);
      setBreedRevealed(false);
      setTimeout(() => setBreedRevealed(true), 300);
      if (data?.isSecretCombo) {
        toast({ title: "Secret Combo discovered!", description: "A rare combination!", duration: 4000 });
      } else if (data?.isMutation) {
        toast({ title: "Mutation occurred!", description: `Mutation trait: ${data.mutationTrait}`, duration: 4000 });
      } else {
        toast({ title: "Breeding successful!", description: "A new pet was born!", duration: 2500 });
      }
    },
    onError: (err) => toast({ title: "Breeding failed", description: err?.message, variant: "destructive" }),
  });

  // ── Auras query (on tab open) ──
  const { data: auraQueryData, isLoading: aurasLoading } = useQuery({
    queryKey: ["petAuras", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "getAuras" }),
    enabled: !!character?.id && activeTab === "auras",
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
    mutationFn: ({ expeditionId, petName }) =>
      base44.functions.invoke("petExpedition", { characterId: character.id, action: "claim", expeditionId }).then(d => ({ ...d, _petName: petName })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["petExpeditions"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (onCharacterUpdate) onCharacterUpdate();
      setExpeditionResultModal({ petName: data._petName || "Your Pet", rewards: data?.rewards || {} });
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
      const next = selectedForFuse.filter(p => p.id !== pet.id);
      setSelectedForFuse(next);
      if (next.length === 0) { setFuseSpeciesFilter(null); setFuseRarityFilter(null); }
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
    const next = [...selectedForFuse, pet];
    setSelectedForFuse(next);
    // Auto-filter to matching species/rarity when first pet selected
    if (next.length === 1) {
      setFuseSpeciesFilter(pet.species);
      setFuseRarityFilter(pet.rarity);
    }
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
    return pets.filter(p => !onExpedition.has(p.id)).sort((a, b) => (b.level || 1) - (a.level || 1));
  }, [pets, expeditions]);

  // Equipped items for a given pet
  const getEquippedItemsForPet = (petId) => equippedItems.filter(e => e.petId === petId);

  // ── Skill tree helpers ──
  const getSkillTreeForPet = (pet) => {
    if (!pet || !skillTrees) return null;
    return skillTrees;
  };

  const getPetSkillAllocation = (pet) => {
    return pet?.skill_tree || pet?.skillTree || {};
  };

  const getTotalAllocated = (allocation) => {
    let total = 0;
    Object.values(allocation).forEach(branch => {
      if (typeof branch === "object") {
        Object.values(branch).forEach(v => { total += (typeof v === "number" ? v : 0); });
      }
    });
    return total;
  };

  const getAvailableSkillPoints = (pet) => {
    const allocation = getPetSkillAllocation(pet);
    const total = getTotalAllocated(allocation);
    return Math.max(0, (pet?.level || 1) - total);
  };

  // ── Evolution helpers ──
  const canEvolve = (pet) => {
    const currentStage = pet.evolution ?? pet.evolutionStage ?? pet.evolution_stage ?? 0;
    if (currentStage >= 2) return false;
    const nextStage = EVOLUTION_STAGES[currentStage + 1];
    return nextStage && (pet.level || 1) >= nextStage.levelReq;
  };

  const getEvolveCost = (pet) => {
    const stage = pet.evolution ?? pet.evolutionStage ?? pet.evolution_stage ?? 0;
    return stage === 0 ? 500 : 1500;
  };

  // ── Render pet card ──
  const renderPetCard = (pet, isEquipped = false) => {
    const colors = RARITY_COLORS[pet.rarity] || RARITY_COLORS.common;
    const badgeColor = RARITY_BADGE[pet.rarity] || RARITY_BADGE.common;
    const SkillIcon = SKILL_ICONS[pet.skillType] || Zap;
    const isSelectedFuse = !!selectedForFuse.find(p => p.id === pet.id);
    const xpPercent = Math.min(100, ((pet.xp || 0) / PET_XP_PER_LEVEL) * 100);
    const traits = pet.traits || [];
    const evoInfo = getEvolutionInfo(pet);
    const bondName = getBondLevelName(pet);
    const bondInfo = getBondInfo(pet);
    const visual = getEvolutionVisual(pet);
    const feedCooldown = pet.lastFedAt
      ? Math.max(0, 3600000 - (Date.now() - new Date(pet.lastFedAt).getTime()))
      : 0;
    const canFeedNow = feedCooldown <= 0;

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
            <span className="text-2xl">{visual}</span>
            <div>
              <p className="font-bold text-sm">{pet.species}</p>
              <div className="flex gap-1 flex-wrap">
                <Badge className={`text-[9px] px-1.5 py-0 ${badgeColor}`}>{pet.rarity}</Badge>
                <Badge className={`text-[9px] px-1.5 py-0 ${evoInfo.badge}`}>{evoInfo.name}</Badge>
              </div>
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

        {/* Bond */}
        <div className="flex items-center gap-1.5 text-[10px] mb-1">
          <Heart className={`w-3 h-3 ${bondInfo.heartColor}`} />
          <span className="text-muted-foreground">Bond:</span>
          <span className={`font-bold ${bondInfo.color}`}>{bondName}</span>
        </div>

        {/* Passive */}
        <div className="flex items-center gap-1.5 text-[10px] mb-1"
          title={`${PASSIVE_LABELS[pet.passiveType] || pet.passiveType}: Provides +${pet.passiveValue}${pet.passiveType === "crit_chance" ? "% critical hit chance" : pet.passiveType === "luck" ? " luck bonus" : pet.passiveType === "damage" ? "% damage boost" : pet.passiveType === "defense" ? "% defense boost" : pet.passiveType === "exp_gain" ? "% experience gain" : pet.passiveType === "gold_gain" ? "% gold gain" : " bonus"} passively while equipped`}>
          <Star className="w-3 h-3 text-amber-400" />
          <span className="text-muted-foreground">{PASSIVE_LABELS[pet.passiveType] || pet.passiveType}:</span>
          <span className="font-bold">+{pet.passiveValue}{pet.passiveType === "crit_chance" || pet.passiveType === "luck" ? "" : "%"}</span>
        </div>

        {/* Skill */}
        <div className="flex items-center gap-1.5 text-[10px] mb-2"
          title={`${SKILL_LABELS[pet.skillType] || pet.skillType}: ${pet.skillType === "heal" ? `Restores ${pet.skillValue} HP during combat` : pet.skillType === "shield" ? `Absorbs ${pet.skillValue} damage in combat` : pet.skillType === "extra_attack" ? `Deals ${pet.skillValue} bonus damage` : `Value: ${pet.skillValue}`}`}>
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

        {/* Mini Equipment Slots */}
        {(() => {
          const petItems = getEquippedItemsForPet(pet.id);
          return (
            <div className="flex gap-1.5 mb-2">
              {["collar", "claws", "charm"].map(slot => {
                const item = petItems.find(e => e.slot === slot);
                const SlotIcon = SLOT_ICONS[slot] || Package;
                const borderColor = item ? (RARITY_BORDER_HEX[item.rarity] || "#9ca3af") : "#374151";
                return (
                  <div
                    key={slot}
                    className="flex-1 rounded-md border p-1 flex items-center gap-1 bg-gray-900/50 min-h-[28px]"
                    style={{ borderColor }}
                    title={item ? `${item.name} (${item.rarity} ${slot})${item.statType ? ` — +${item.statValue} ${item.statType}` : ""}` : `${slot} (empty)`}
                  >
                    <SlotIcon className="w-3 h-3 shrink-0" style={{ color: borderColor }} />
                    {item ? (
                      <span className="text-[8px] text-white truncate leading-tight">{item.name}</span>
                    ) : (
                      <span className="text-[8px] text-gray-600 capitalize">{slot}</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Actions */}
        {!fuseMode && (
          <div className="flex gap-1.5 flex-wrap">
            {isEquipped ? (
              <>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => unequipMutation.mutate()}>
                  Unequip
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 px-2 text-[10px] gap-1 ${canFeedNow ? "text-pink-400 border-pink-500/30 hover:bg-pink-500/10" : "text-muted-foreground border-gray-600"}`}
                  title={canFeedNow ? "Feed pet (+bond) — costs 200 gold" : `Feed cooldown: ${formatCountdown(feedCooldown)}`}
                  onClick={() => canFeedNow && feedMutation.mutate(pet.id)}
                  disabled={!canFeedNow || feedMutation.isPending}
                >
                  <Heart className="w-3 h-3" />{canFeedNow ? "Feed (200g)" : formatCountdown(feedCooldown)}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" className="flex-1 h-7 text-[10px] bg-primary/80 hover:bg-primary" onClick={() => equipMutation.mutate(pet.id)}>
                  Equip
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 px-2 text-[10px] gap-1 ${canFeedNow ? "text-pink-400 border-pink-500/30 hover:bg-pink-500/10" : "text-muted-foreground border-gray-600"}`}
                  title={canFeedNow ? "Feed pet (+bond) — costs 200 gold" : `Feed cooldown: ${formatCountdown(feedCooldown)}`}
                  onClick={() => canFeedNow && feedMutation.mutate(pet.id)}
                  disabled={!canFeedNow || feedMutation.isPending}
                >
                  <Heart className="w-3 h-3" />{canFeedNow ? "Feed (200g)" : formatCountdown(feedCooldown)}
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
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[10px] text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  title={`Sell for gold (${({ common: 100, uncommon: 300, rare: 800, epic: 2000, legendary: 5000, mythic: 15000 }[pet.rarity] || 100).toLocaleString()} gold)`}
                  onClick={() => {
                    const prices = { common: 100, uncommon: 300, rare: 800, epic: 2000, legendary: 5000, mythic: 15000 };
                    const price = prices[pet.rarity] || 100;
                    setConfirmModal({ title: "Sell Pet", message: `Sell ${pet.species} for ${price.toLocaleString()} gold?`, onConfirm: () => sellMutation.mutate(pet.id) });
                  }}
                  disabled={sellMutation.isPending}
                >
                  Sell
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => {
                  setConfirmModal({ title: "Release Pet", message: `Release ${pet.species}? This cannot be undone.`, onConfirm: () => releaseMutation.mutate(pet.id), variant: "destructive" });
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
            setConfirmModal({ title: "Unequip Item", message: `Unequip ${slotItem.name}?`, onConfirm: () => unequipItemMutation.mutate(slotItem.id) });
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
  if (petsError) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <PawPrint className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-red-300 mb-2">Pet System Error</h3>
          <p className="text-sm text-red-200/70 mb-3">{petsError?.message || "Failed to load pets. The database may need updating."}</p>
          <p className="text-xs text-muted-foreground">If you just merged a pet update, make sure to run the SQL from the PR description in Supabase first, then redeploy.</p>
        </div>
      </div>
    );
  }

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

      {/* Tabs — scrollable horizontally */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          {[
            { key: "pets",        label: "My Pets",    icon: PawPrint },
            { key: "hatchery",   label: "Hatchery",    icon: Egg },
            { key: "expeditions", label: "Expeditions", icon: MapPin },
            { key: "equipment",   label: "Equipment",   icon: Wrench },
            { key: "evolution",   label: "Evolution",   icon: TrendingUp },
            { key: "skills",      label: "Skills",      icon: GitBranch },
            { key: "breeding",    label: "Breeding",    icon: Dna },
            { key: "auras",       label: "Auras",       icon: Layers },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
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
                onClick={() => { setFuseMode(!fuseMode); setSelectedForFuse([]); setFuseSpeciesFilter(null); setFuseRarityFilter(null); }}
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
                  className={`bg-amber-600 hover:bg-amber-700 text-white gap-1.5 transition-all ${fuseAnimating ? "animate-pulse scale-105 ring-2 ring-amber-400/60" : ""}`}
                  onClick={() => {
                    const sp = selectedForFuse[0];
                    const fuseChances = { common: 80, uncommon: 65, rare: 50, epic: 35, legendary: 20, mythic: 10 };
                    const chance = fuseChances[sp.rarity] || 50;
                    const fuseCosts = { common: 2000, uncommon: 8000, rare: 25000, epic: 75000, legendary: 200000, mythic: 500000 };
                    const fuseCost = fuseCosts[sp.rarity] || 25000;
                    setConfirmModal({
                      title: "Confirm Fusion",
                      message: `Fuse 3x ${sp.rarity} ${sp.species} → 1 ${RARITY_NEXT[sp.rarity] || 'higher'} ${sp.species}\n\nCost: ${fuseCost.toLocaleString()} gold\nSuccess chance: ${chance}%\nOn failure: all 3 pets are lost (gold still consumed)`,
                      onConfirm: () => fuseMutation.mutate({ species: sp.species, rarity: sp.rarity }),
                    });
                  }}
                  disabled={fuseMutation.isPending}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${fuseAnimating ? "animate-spin" : ""}`} />
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
              {/* Pet Stats Guide */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 mt-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Pet Stats Guide</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                  <div><Star className="w-3 h-3 inline text-amber-400 mr-1" /><span className="text-muted-foreground">Passive:</span> <span className="text-white">Always active bonus (damage, crit, gold, etc.)</span></div>
                  <div><Swords className="w-3 h-3 inline text-cyan-400 mr-1" /><span className="text-muted-foreground">Skill:</span> <span className="text-white">Triggers in combat (heal, shield, extra attack)</span></div>
                  <div><Heart className="w-3 h-3 inline text-pink-400 mr-1" /><span className="text-muted-foreground">Bond:</span> <span className="text-white">Grows from feeding and fighting together</span></div>
                  <div><TrendingUp className="w-3 h-3 inline text-purple-400 mr-1" /><span className="text-muted-foreground">Evolution:</span> <span className="text-white">Baby → Adult (Lv.15) → Elder (Lv.35)</span></div>
                </div>
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
              {/* Rarity filter tabs */}
              {!fuseMode && (
                <div className="flex gap-1.5 flex-wrap mb-3 items-center">
                  {["all","common","uncommon","rare","epic","legendary","mythic"].map(r => (
                    <button
                      key={r}
                      onClick={() => setRarityFilter(r)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all capitalize ${
                        rarityFilter === r
                          ? r === "all" ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : (RARITY_COLORS[r] || "bg-cyan-500/20 border-cyan-500/40 text-cyan-300")
                          : "bg-gray-800 border-gray-700 text-muted-foreground hover:border-gray-500"
                      }`}
                    >
                      {r === "all" ? `All (${unequippedPets.length})` : `${r.charAt(0).toUpperCase() + r.slice(1)} (${unequippedPets.filter(p => p.rarity === r).length})`}
                    </button>
                  ))}
                  {rarityFilter !== "all" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1"
                      onClick={() => {
                        const count = unequippedPets.filter(p => p.rarity === rarityFilter).length;
                        const prices = { common: 100, uncommon: 300, rare: 800, epic: 2000, legendary: 5000, mythic: 15000 };
                        const total = count * (prices[rarityFilter] || 100);
                        setConfirmModal({
                          title: `Sell All ${rarityFilter} Pets`,
                          message: `Sell ${count} unequipped ${rarityFilter} pets for ${total.toLocaleString()} gold?\n\nThis cannot be undone!`,
                          onConfirm: () => sellAllMutation.mutate(rarityFilter),
                        });
                      }}
                      disabled={sellAllMutation.isPending || unequippedPets.filter(p => p.rarity === rarityFilter).length === 0}
                    >
                      <Trash2 className="w-3 h-3" /> Sell All {rarityFilter}
                    </Button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...unequippedPets]
                  .filter(pet => {
                    if (fuseMode && fuseSpeciesFilter) return pet.species === fuseSpeciesFilter && pet.rarity === fuseRarityFilter;
                    if (!fuseMode && rarityFilter !== "all") return pet.rarity === rarityFilter;
                    return true;
                  })
                  .sort((a, b) => {
                    const evoA = a.evolution ?? a.evolutionStage ?? 0;
                    const evoB = b.evolution ?? b.evolutionStage ?? 0;
                    if (evoB !== evoA) return evoB - evoA;
                    const rarityOrder = ["mythic","legendary","epic","rare","uncommon","common"];
                    const rA = rarityOrder.indexOf(a.rarity); const rB = rarityOrder.indexOf(b.rarity);
                    if (rA !== rB) return rA - rB;
                    return (b.level || 0) - (a.level || 0);
                  })
                  .map(pet => renderPetCard(pet))}
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
          TAB: HATCHERY
         ══════════════════════════════════════════════════════ */}
      {activeTab === "hatchery" && (
        <HatcheryTab character={character} />
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
                                  onClick={() => claimExpeditionMutation.mutate({ expeditionId: exp.id, petName: pet?.species || "Pet" })}
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
                                  onClick={() => { setConfirmModal({ title: "Cancel Expedition", message: "Cancel this expedition? Rewards will be lost.", onConfirm: () => cancelExpeditionMutation.mutate(exp.id), variant: "destructive" }); }}
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
                    {/* Pet select — compact scrollable grid */}
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Select Pet</label>
                      <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                        {availablePetsForExpedition.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedExpeditionPet(p.id)}
                            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center transition-all ${
                              selectedExpeditionPet === p.id
                                ? "border-cyan-500/60 bg-cyan-500/10"
                                : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                            }`}
                          >
                            <span className="text-lg">{SPECIES_ICONS[p.species] || "🐾"}</span>
                            <span className="text-[9px] text-white font-medium truncate w-full">{p.species}</span>
                            <span className="text-[8px] text-muted-foreground">Lv.{p.level}</span>
                            <Badge className={`text-[7px] px-1 py-0 ${RARITY_BADGE[p.rarity] || ""}`}>{p.rarity}</Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Region select */}
                    {regions.length > 0 && (
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-2 block">Select Region</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {regions.map(region => {
                            const selectedPet = pets.find(p => p.id === selectedExpeditionPet);
                            const ELEMENT_SPECIES_BONUS = { fire: ["Phoenix","Dragon"], nature: ["Cat","Owl"], ice: ["Turtle","Golem"], dark: ["Serpent","Wolf"], wind: ["Fairy","Phoenix"], void: ["Slime","Dragon"] };
                            const hasElementMatch = selectedPet && (ELEMENT_SPECIES_BONUS[region.element] || []).includes(selectedPet.species);
                            return (
                              <div
                                key={region.key || region.name}
                                onClick={() => setSelectedRegion(region.key)}
                                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                                  selectedRegion === region.key
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
                                  {region.baseRewards && <div>Rewards: <span className="text-white/70">{typeof region.baseRewards === 'object' ? Object.entries(region.baseRewards).map(([k, v]) => `${v} ${k}`).join(', ') : region.baseRewards}</span></div>}
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
                              key={dur.key || dur.name}
                              onClick={() => setSelectedDuration(dur.key)}
                              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                                selectedDuration === dur.key
                                  ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                                  : "border-gray-600 bg-gray-700/50 text-muted-foreground hover:border-gray-500"
                              }`}
                            >
                              {dur.name} ({dur.seconds >= 3600 ? Math.round(dur.seconds/3600) + 'h' : Math.round(dur.seconds/60) + 'm'})
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
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
            <p className="text-[10px] text-muted-foreground">
              <Package className="w-3 h-3 inline mr-1" />
              Pet equipment drops from <span className="text-cyan-300">Expeditions</span> (longer = better drops) and <span className="text-amber-300">Boss fights</span>.
              Salvage unwanted gear for gold.
            </p>
          </div>
          {equipmentLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading equipment...</div>
          ) : (
            <>
              {/* Pet selector for equipment slots — equipped pet only */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Equipped Pet Equipment</p>

                {equippedPet ? (
                  <div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{SPECIES_ICONS[equippedPet.species] || "🐾"}</span>
                        <div>
                          <p className="font-semibold text-white">{equippedPet.species}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{equippedPet.rarity} · Lv.{equippedPet.level}</p>
                        </div>
                      </div>
                      {selectedInventoryItem && (
                        <p className="text-[10px] text-cyan-400 mb-2">
                          Click a matching slot to equip: <span className="font-bold">{selectedInventoryItem.name}</span> ({selectedInventoryItem.slot})
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {["collar", "claws", "charm"].map(slot => renderSlotBox(equippedPet, slot))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center text-sm text-muted-foreground">
                    Equip a pet first to manage their equipment.
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
                        onClick={() => { setConfirmModal({ title: "Salvage Item", message: `Salvage ${selectedInventoryItem.name} for gold?`, onConfirm: () => salvageMutation.mutate(selectedInventoryItem.id) }); }}
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

      {/* ══════════════════════════════════════════════════════
          TAB: EVOLUTION
         ══════════════════════════════════════════════════════ */}
      {activeTab === "evolution" && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pets evolve through 3 stages: <span className="text-gray-300 font-medium">Baby</span> → <span className="text-amber-300 font-medium">Adult ⭐ (Lv.15)</span> → <span className="text-purple-300 font-medium">Elder 👑 (Lv.35)</span>.
              Evolving costs gems (scaled by rarity: 200–3000 💎) and permanently upgrades your pet's appearance and stats.
            </p>
          </div>

          {pets.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pets to evolve.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pets.map(pet => {
                const evoInfo = getEvolutionInfo(pet);
                const eligible = canEvolve(pet);
                const goldCost = getEvolveCost(pet);
                const colors = RARITY_COLORS[pet.rarity] || RARITY_COLORS.common;
                const visual = getEvolutionVisual(pet);
                const isEvolving = evolvingPetId === pet.id && evolveMutation.isPending;
                const currentStage = pet.evolution ?? pet.evolutionStage ?? pet.evolution_stage ?? 0;
                const nextStage = EVOLUTION_STAGES[currentStage + 1];

                return (
                  <div key={pet.id} className={`rounded-xl border-2 p-4 ${colors}`}>
                    {/* Pet header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{visual}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-white">{pet.species}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{pet.rarity} · Lv.{pet.level}</p>
                      </div>
                    </div>

                    {/* Stage display */}
                    <div className="flex items-center gap-2 mb-3">
                      {EVOLUTION_STAGES.map((stage, idx) => (
                        <React.Fragment key={stage.stage}>
                          <div className={`flex flex-col items-center ${idx <= currentStage ? "" : "opacity-30"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 ${
                              idx < currentStage
                                ? "bg-green-500/20 border-green-500/60 text-green-400"
                                : idx === currentStage
                                  ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                                  : "bg-gray-700 border-gray-600 text-gray-500"
                            }`}>
                              {idx < currentStage ? "✓" : idx === 0 ? "🐣" : idx === 1 ? "⭐" : "👑"}
                            </div>
                            <span className={`text-[8px] mt-0.5 ${stage.color}`}>{stage.name}</span>
                          </div>
                          {idx < 2 && (
                            <ChevronRight className={`w-3 h-3 flex-shrink-0 ${idx < currentStage ? "text-green-400" : "text-gray-600"}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Current stage badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${evoInfo.badge}`}>
                      {currentStage === 0 ? "🐣" : currentStage === 1 ? "⭐" : "👑"} {evoInfo.name}
                    </div>

                    {/* Evolve button or max stage */}
                    {currentStage >= 2 ? (
                      <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" /> Max Stage Reached
                      </div>
                    ) : (
                      <div>
                        {nextStage && (
                          <p className="text-[10px] text-muted-foreground mb-2">
                            Next: <span className={`font-bold ${nextStage.color}`}>{nextStage.name}</span>
                            {(pet.level || 1) < nextStage.levelReq && (
                              <span className="text-red-400"> — Need Lv.{nextStage.levelReq} (currently Lv.{pet.level})</span>
                            )}
                          </p>
                        )}
                        <Button
                          size="sm"
                          className={`w-full gap-1.5 text-xs transition-all ${
                            evolveAnimating === pet.id ? "animate-pulse scale-105 ring-2 ring-purple-400/60" : ""
                          } ${
                            eligible
                              ? "bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700 text-white"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          disabled={!eligible || isEvolving}
                          onClick={() => {
                            if (!eligible) return;
                            const evolveGemCosts = { common: 200, uncommon: 350, rare: 500, epic: 800, legendary: 1500, mythic: 3000 };
                            const evolveCost = evolveGemCosts[pet.rarity] || 500;
                            setConfirmModal({
                              title: "Evolve Pet",
                              message: `Evolve ${pet.species} to ${nextStage?.name}?\nCost: ${evolveCost.toLocaleString()} 💎\nSuccess chance: ${{ common: 75, uncommon: 60, rare: 45, epic: 30, legendary: 20, mythic: 10 }[pet.rarity] || 45}%`,
                              onConfirm: () => { setEvolvingPetId(pet.id); evolveMutation.mutate(pet.id); },
                            });
                          }}
                        >
                          <TrendingUp className={`w-3 h-3 ${evolveAnimating === pet.id ? "animate-spin" : ""}`} />
                          {isEvolving ? "Evolving..." : eligible ? `Evolve (${({ common: 200, uncommon: 350, rare: 500, epic: 800, legendary: 1500, mythic: 3000 }[pet.rarity] || 500).toLocaleString()} 💎)` : `Lv.${nextStage?.levelReq} required`}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: SKILLS
         ══════════════════════════════════════════════════════ */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          {/* Pet selector — equipped pet only */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Equipped Pet Skills</p>
            {!equippedPet ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                <GitBranch className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Equip a pet first to manage its skills.</p>
              </div>
            ) : null}
          </div>

          {!selectedSkillPet ? (
            equippedPet ? null : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                <GitBranch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Equip a pet to view its skill tree.</p>
              </div>
            )
          ) : (() => {
            // Re-find the pet from the latest data to keep points current
            const pet = pets.find(p => p.id === selectedSkillPet.id) || selectedSkillPet;
            const allocation = getPetSkillAllocation(pet);
            const availablePoints = getAvailableSkillPoints(pet);
            const tree = getSkillTreeForPet(pet);

            const branchConfig = [
              { key: "combat",   label: "Combat",   color: "rose",  headerClass: "bg-rose-500/20 border-rose-500/30 text-rose-300", btnClass: "bg-rose-600 hover:bg-rose-700 text-white" },
              { key: "resource", label: "Resource", color: "amber", headerClass: "bg-amber-500/20 border-amber-500/30 text-amber-300", btnClass: "bg-amber-600 hover:bg-amber-700 text-white" },
              { key: "utility",  label: "Utility",  color: "blue",  headerClass: "bg-blue-500/20 border-blue-500/30 text-blue-300",  btnClass: "bg-blue-600 hover:bg-blue-700 text-white" },
            ];

            return (
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getEvolutionVisual(pet)}</span>
                    <div>
                      <p className="font-bold text-white">{pet.species}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{pet.rarity} · Lv.{pet.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                      availablePoints > 0
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "bg-gray-700 border-gray-600 text-muted-foreground"
                    }`}>
                      {availablePoints} skill point{availablePoints !== 1 ? "s" : ""} available
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                      onClick={() => {
                        setConfirmModal({ title: "Reset Skill Tree", message: "Reset skill tree for 2,000 gold?", onConfirm: () => resetSkillsMutation.mutate(pet.id) });
                      }}
                      disabled={resetSkillsMutation.isPending}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset (2,000g)
                    </Button>
                  </div>
                </div>

                {/* Skill branches */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {branchConfig.map(branch => {
                    const branchData = tree?.[branch.key] || {};
                    const branchAllocation = allocation?.[branch.key] || {};

                    return (
                      <div key={branch.key} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                        {/* Branch header */}
                        <div className={`px-3 py-2 border-b flex items-center gap-2 ${branch.headerClass}`}>
                          <GitBranch className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold uppercase tracking-wide">{branch.label}</span>
                        </div>

                        {/* Skills list */}
                        <div className="p-3 space-y-3">
                          {Object.keys(branchData).length === 0 ? (
                            <p className="text-[10px] text-muted-foreground text-center py-2">No skills in this branch.</p>
                          ) : (
                            Object.entries(branchData).map(([skillKey, skillData]) => {
                              const current = branchAllocation[skillKey] || 0;
                              const max = skillData.maxPoints || 5;
                              const pct = max > 0 ? (current / max) * 100 : 0;
                              const canAllocate = availablePoints > 0 && current < max;

                              return (
                                <div key={skillKey} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold text-white">{skillData.name || skillKey}</p>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">{current}/{max}</span>
                                      <button
                                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                                          canAllocate
                                            ? `${branch.btnClass} hover:scale-110`
                                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                        }`}
                                        disabled={!canAllocate || allocateSkillMutation.isPending}
                                        onClick={() => allocateSkillMutation.mutate({ petId: pet.id, branch: branch.key, skill: skillKey })}
                                        title={canAllocate ? `Allocate point to ${skillData.name || skillKey}` : current >= max ? "Max level reached" : "No skill points available"}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        branch.color === "rose" ? "bg-rose-500" :
                                        branch.color === "amber" ? "bg-amber-500" : "bg-blue-500"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  {skillData.desc && (
                                    <p className="text-[9px] text-muted-foreground leading-tight">{skillData.desc}</p>
                                  )}
                                  {skillData.effect && typeof skillData.effect === "object" && current > 0 && (() => {
                                    const parts = [];
                                    for (const [k, v] of Object.entries(skillData.effect)) {
                                      const label = k.replace(/([A-Z])/g, ' $1').trim();
                                      parts.push(label + " +" + Math.round(Number(v) * current * 100) + "%");
                                    }
                                    return <p className="text-[9px] text-cyan-400">Active: {parts.join(", ")}</p>;
                                  })()}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: BREEDING
         ══════════════════════════════════════════════════════ */}
      {activeTab === "breeding" && (
        <div className="space-y-5">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select two unequipped pets to breed. The child inherits traits from both parents.
              Some combinations unlock <span className="text-amber-300 font-semibold">Secret Combos</span> or trigger
              <span className="text-purple-300 font-semibold"> Mutations</span>!
            </p>
          </div>

          {/* Slot selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { slot: breedSlot1, setSlot: setBreedSlot1, label: "Parent 1" },
              { slot: breedSlot2, setSlot: setBreedSlot2, label: "Parent 2" },
            ].map(({ slot, setSlot, label }, idx) => {
              const otherSlot = idx === 0 ? breedSlot2 : breedSlot1;
              const availablePets = unequippedPets.filter(p => !otherSlot || p.id !== otherSlot.id);

              return (
                <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{label}</p>
                  {slot ? (
                    <div className={`rounded-xl border-2 p-3 mb-3 ${RARITY_COLORS[slot.rarity] || RARITY_COLORS.common}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getEvolutionVisual(slot)}</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{slot.species}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{slot.rarity} · Lv.{slot.level}</p>
                        </div>
                        <button
                          onClick={() => setSlot(null)}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center mb-3">
                      <Dna className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No pet selected</p>
                    </div>
                  )}
                  <div className="max-h-32 overflow-y-auto border border-gray-700 rounded-lg p-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {availablePets.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSlot(p); setBreedResult(null); }}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center transition-all ${
                          slot?.id === p.id
                            ? "border-pink-500/60 bg-pink-500/10"
                            : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                        }`}
                      >
                        <span className="text-lg">{SPECIES_ICONS[p.species] || "🐾"}</span>
                        <span className="text-[9px] text-white font-medium truncate w-full">{p.species}</span>
                        <span className="text-[8px] text-muted-foreground">Lv.{p.level} · {p.rarity}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Breed button + cost */}
          {breedSlot1 && breedSlot2 && (
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getEvolutionVisual(breedSlot1)}</span>
                  <Heart className="w-5 h-5 text-pink-400" />
                  <span className="text-xl">{getEvolutionVisual(breedSlot2)}</span>
                  <span className="text-muted-foreground text-sm">=</span>
                  <span className="text-xl">?</span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-[10px] text-amber-400">Cost: 5,000 gold + 100 gems</p>
                  <Button
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white gap-1.5"
                    onClick={() => {
                      setBreedResult(null);
                      breedMutation.mutate({ pet1Id: breedSlot1.id, pet2Id: breedSlot2.id });
                    }}
                    disabled={breedMutation.isPending}
                  >
                    <Heart className="w-4 h-4" />
                    {breedMutation.isPending ? "Breeding..." : "Breed (5,000g + 100💎)"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Breed result */}
          {breedResult && (
            <div className={`rounded-xl border-2 p-5 transition-all duration-500 ${
              breedResult.isSecretCombo
                ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                : breedResult.isMutation
                  ? "border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                  : "border-green-500/40 bg-green-500/10"
            } ${breedRevealed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            style={{ transform: breedRevealed ? "scale(1)" : "scale(0.95)", transition: "all 0.4s ease" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className={`w-5 h-5 ${
                  breedResult.isSecretCombo ? "text-amber-400" :
                  breedResult.isMutation ? "text-purple-400" : "text-green-400"
                }`} />
                <p className={`font-bold text-base ${
                  breedResult.isSecretCombo ? "text-amber-300" :
                  breedResult.isMutation ? "text-purple-300" : "text-green-300"
                }`}>
                  {breedResult.isSecretCombo ? "Secret Combo Discovered!" :
                   breedResult.isMutation ? "Mutation!" : "New Pet Born!"}
                </p>
              </div>

              {breedResult.isMutation && breedResult.mutationTrait && (
                <div className="mb-3 px-3 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                  <p className="text-xs text-purple-300">
                    <span className="font-bold">Mutation Trait:</span> {typeof breedResult.mutationTrait === 'object' ? (breedResult.mutationTrait.name || breedResult.mutationTrait.key) : breedResult.mutationTrait}
                  </p>
                </div>
              )}

              {breedResult.child && (
                <div className={`rounded-xl border-2 p-3 max-w-xs ${RARITY_COLORS[breedResult.child.rarity] || RARITY_COLORS.common}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getEvolutionVisual(breedResult.child)}</span>
                    <div>
                      <p className="font-bold text-white">{breedResult.child.species}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 ${RARITY_BADGE[breedResult.child.rarity] || RARITY_BADGE.common}`}>
                        {breedResult.child.rarity}
                      </Badge>
                    </div>
                  </div>
                  {breedResult.child.traits?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {breedResult.child.traits.map((t, i) => <TraitPill key={i} trait={t} index={i} />)}
                    </div>
                  )}
                  {breedResult.goldCost > 0 && (
                    <p className="text-[10px] text-amber-400">Cost: {breedResult.goldCost.toLocaleString()} gold{breedResult.gemCost > 0 ? ` + ${breedResult.gemCost} gems` : ""}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Secret Combos reference */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" /> Secret Combos Reference
            </p>
            <p className="text-[10px] text-muted-foreground mb-3">Breed these pairs for a 25% chance to unlock a special pet!</p>
            {(petData?.secretCombos || []).length > 0 ? (
              <div className="space-y-2">
                {(petData.secretCombos).map((combo, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-gray-900/50 rounded-lg px-3 py-2">
                    <span className="text-lg">{SPECIES_ICONS[combo.parent1] || "🐾"}</span>
                    <span className="text-muted-foreground">{combo.parent1}</span>
                    <span className="text-pink-400">+</span>
                    <span className="text-lg">{SPECIES_ICONS[combo.parent2] || "🐾"}</span>
                    <span className="text-muted-foreground">{combo.parent2}</span>
                    <span className="text-amber-400 mx-1">→</span>
                    <span className="text-lg">{SPECIES_ICONS[combo.result] || "✨"}</span>
                    <span className="text-amber-300 font-semibold">{combo.resultName || combo.result}</span>
                    <Badge className={`text-[8px] px-1 ml-auto ${RARITY_BADGE[combo.rarity] || RARITY_BADGE.common}`}>{combo.rarity}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">Secret combo data loading...</p>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />

      {/* Result Modal */}
      <ResultModal modal={resultModal} onClose={() => setResultModal(null)} />

      {/* Expedition Result Modal */}
      {expeditionResultModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setExpeditionResultModal(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 rounded-2xl p-8 max-w-sm w-full mx-4 text-center relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-cyan-500 to-transparent" />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", damping: 12 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 bg-cyan-500/20 border-cyan-500/40"
                >
                  <MapPin className="w-9 h-9 text-cyan-400" />
                </motion.div>
                <motion.h3
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-orbitron font-bold text-lg mb-1 text-cyan-300"
                >
                  Expedition Complete!
                </motion.h3>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-xs text-gray-400 mb-5"
                >
                  {expeditionResultModal.petName} has returned with loot
                </motion.p>
                <div className="space-y-2.5 mb-6">
                  {expeditionResultModal.rewards.gold > 0 && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-xs text-amber-300 flex items-center gap-2"><Star className="w-4 h-4" /> Gold</span>
                      <span className="text-sm font-bold text-amber-200">+{expeditionResultModal.rewards.gold.toLocaleString()}</span>
                    </motion.div>
                  )}
                  {expeditionResultModal.rewards.exp > 0 && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-xs text-blue-300 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Character EXP</span>
                      <span className="text-sm font-bold text-blue-200">+{expeditionResultModal.rewards.exp.toLocaleString()}</span>
                    </motion.div>
                  )}
                  {expeditionResultModal.rewards.petXp > 0 && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-xs text-purple-300 flex items-center gap-2"><PawPrint className="w-4 h-4" /> Pet EXP</span>
                      <span className="text-sm font-bold text-purple-200">+{expeditionResultModal.rewards.petXp.toLocaleString()}</span>
                    </motion.div>
                  )}
                  {expeditionResultModal.rewards.petEgg && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-xs text-emerald-300 flex items-center gap-2"><Baby className="w-4 h-4" /> New Pet Egg Found!</span>
                    </motion.div>
                  )}
                  {expeditionResultModal.rewards.equipmentDrop && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-xs text-cyan-300 flex items-center gap-2"><Package className="w-4 h-4" /> Equipment Drop</span>
                      <span className="text-xs font-bold text-cyan-200 capitalize">{expeditionResultModal.rewards.equipmentDrop.rarity} {expeditionResultModal.rewards.equipmentDrop.slot}</span>
                    </motion.div>
                  )}
                </div>
                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpeditionResultModal(null)}
                  className="px-8 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: AURAS & SYNERGIES
         ══════════════════════════════════════════════════════ */}
      {activeTab === "auras" && (
        <div className="space-y-5">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <Sparkles className="w-3 h-3 inline mr-1 text-cyan-400" />
              Each pet <span className="text-cyan-300">species</span> you own provides one unique aura.
              Owning multiple pets of the same species does NOT stack — only <span className="text-white font-semibold">unique species</span> count.
              Max 10 auras (one per species). Set bonuses activate when you own all required species.
            </p>
          </div>
          {aurasLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading auras...</div>
          ) : (() => {
            const auras = auraQueryData?.auras || [];
            const setBonuses = auraQueryData?.setBonuses || [];
            const ownedSpecies = new Set(auraQueryData?.ownedSpecies || pets.map(p => p.species));

            return (
              <>
                {/* Active Auras */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Active Auras
                  </p>
                  {auras.length === 0 ? (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                      <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No active auras</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">Own pets of different species to unlock auras.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {auras.map((aura, i) => (
                        <div key={i} className="bg-gray-800/50 border border-cyan-500/30 rounded-xl p-3 flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{SPECIES_ICONS[aura.species] || "🐾"}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{aura.name || `${aura.species} Aura`}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{aura.species}</p>
                            {aura.effect && (
                              <p className="text-[10px] text-cyan-300 mt-1">
                                {typeof aura.effect === 'object'
                                  ? Object.entries(aura.effect).map(([k, v]) => `+${Math.round(v * 100)}% ${k}`).join(', ')
                                  : aura.effect}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Set Bonuses */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Set Bonuses
                  </p>
                  {setBonuses.length === 0 ? (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                      <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No set bonuses defined.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {setBonuses.map((set, i) => {
                        const requiredSpecies = set.requiredSpecies || set.species || [];
                        const isActive = set.isActive ?? (Array.isArray(requiredSpecies) && requiredSpecies.every(s => ownedSpecies.has(s)));

                        return (
                          <div key={i} className={`rounded-xl border-2 p-4 transition-all ${
                            isActive
                              ? "border-amber-500/50 bg-amber-500/10 shadow-md shadow-amber-500/10"
                              : "border-gray-700 bg-gray-800/30 opacity-60"
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className={`text-sm font-bold ${isActive ? "text-amber-300" : "text-muted-foreground"}`}>
                                {set.name || `Set ${i + 1}`}
                              </p>
                              {isActive && (
                                <Badge className="bg-amber-500/20 text-amber-300 text-[9px] px-2 border border-amber-500/30">
                                  Active
                                </Badge>
                              )}
                            </div>

                            {/* Required species icons */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {requiredSpecies.map((species, j) => (
                                <div key={j} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${
                                  ownedSpecies.has(species)
                                    ? "border-green-500/40 bg-green-500/10 text-green-300"
                                    : "border-gray-600 bg-gray-700/50 text-gray-500"
                                }`}>
                                  <span>{SPECIES_ICONS[species] || "🐾"}</span>
                                  <span>{species}</span>
                                  {ownedSpecies.has(species) && <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />}
                                </div>
                              ))}
                            </div>

                            {set.bonus && (
                              <p className={`text-xs ${isActive ? "text-cyan-300" : "text-muted-foreground"}`}>
                                Bonus: {set.bonus}
                              </p>
                            )}
                            {set.description && (
                              <p className="text-[10px] text-muted-foreground mt-1">{set.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Owned species summary */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Your Species Collection</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SPECIES_ICONS).map(([species, icon]) => {
                      const owned = ownedSpecies.has(species);
                      return (
                        <div key={species} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                          owned
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-gray-700 bg-gray-800/50 text-gray-600"
                        }`}>
                          <span>{icon}</span>
                          <span>{species}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Hatchery Tab Component ────────────────────────────────────────────────
const HATCH_RARITY_COLORS = {
  common: "text-gray-400", uncommon: "text-green-400", rare: "text-blue-400",
  epic: "text-purple-400", legendary: "text-amber-400", mythic: "text-red-400", shiny: "text-yellow-300",
};

function HatcheryTab({ character }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setTick] = useState(0);
  const [showHatchResult, setShowHatchResult] = useState(null);

  const { data: hatcheryData, refetch } = useQuery({
    queryKey: ["hatchery", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "hatchery_status" }),
    enabled: !!character?.id,
    refetchInterval: 60000,
  });

  const incubating = hatcheryData?.incubating || null;
  const incubatorCount = hatcheryData?.incubatorCount || 0;
  const eggs = hatcheryData?.eggs || [];

  // Tick timer
  useEffect(() => {
    if (!incubating) return;
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [!!incubating]);

  const timeLeft = incubating ? Math.max(0, new Date(incubating.hatches_at).getTime() - Date.now()) : 0;
  const isReady = incubating && timeLeft <= 0;

  const speedupMutation = useMutation({
    mutationFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "hatchery_speedup" }),
    onSuccess: (res) => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({ title: "Speedup applied! -30 minutes" });
    },
    onError: (err) => toast({ title: err.message || "Speedup failed", variant: "destructive" }),
  });

  const claimMutation = useMutation({
    mutationFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "hatchery_claim" }),
    onSuccess: (res) => {
      setShowHatchResult(res.pet);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["petData"] });
    },
    onError: (err) => toast({ title: err.message || "Claim failed", variant: "destructive" }),
  });

  const startHatchMutation = useMutation({
    mutationFn: (itemId) => base44.functions.invoke("useItem", { itemId }),
    onSuccess: (res) => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
      toast({ title: res.message || "Incubation started!" });
    },
    onError: (err) => toast({ title: err.message || "Failed to start", variant: "destructive" }),
  });

  const formatTime = (ms) => {
    if (ms <= 0) return "Ready!";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  return (
    <div className="space-y-4">
      {/* Active Incubation */}
      <div className="bg-gradient-to-b from-amber-900/30 to-amber-950/50 border-2 border-amber-500/40 rounded-2xl p-5 text-center">
        <Egg className="w-10 h-10 text-amber-400 mx-auto mb-2" />
        <h3 className="font-orbitron text-lg font-bold text-amber-400 mb-1">Hatchery</h3>
        <p className="text-xs text-muted-foreground mb-4">Place a pet egg to start hatching. Requires 1 Pet Incubator.</p>

        {incubating ? (
          <div className="space-y-3">
            <div className={`text-sm font-semibold ${HATCH_RARITY_COLORS[incubating.eggRarity] || "text-white"}`}>
              {incubating.egg_name || "Pet Egg"} {incubating.isShiny && <span className="text-yellow-300">(Shiny!)</span>}
            </div>
            {/* Progress bar */}
            <div className="max-w-xs mx-auto">
              <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-amber-500/30">
                <motion.div
                  className={`h-full rounded-full ${isReady ? "bg-green-500 animate-pulse" : "bg-amber-500"}`}
                  animate={{ width: isReady ? "100%" : `${Math.max(5, 100 - (timeLeft / (8 * 3600000)) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className={`text-lg font-bold mt-2 ${isReady ? "text-green-400 animate-pulse" : "text-amber-300"}`}>
                <Timer className="w-4 h-4 inline mr-1" />
                {isReady ? "Ready to Hatch!" : formatTime(timeLeft)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-center mt-3">
              {!isReady && (incubating.speedups_used || 0) < 5 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-violet-500/40 text-violet-400 hover:bg-violet-500/20"
                  onClick={() => speedupMutation.mutate()}
                  disabled={speedupMutation.isPending}
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Speed Up (-30m)
                  <span className="flex items-center gap-0.5 text-violet-300"><Gem className="w-3 h-3" />50</span>
                  <span className="text-[10px] text-muted-foreground">({incubating.speedups_used || 0}/5)</span>
                </Button>
              )}
              {isReady && (
                <Button
                  className="gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 font-orbitron"
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                >
                  <Sparkles className="w-4 h-4" /> Hatch Now!
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Incubators: <span className={incubatorCount > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{incubatorCount}</span>
              {incubatorCount === 0 && " (Drops from World Boss)"}
            </p>
            {eggs.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-amber-400 font-semibold">Your Eggs:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {eggs.map(egg => (
                    <button
                      key={egg.id}
                      onClick={() => startHatchMutation.mutate(egg.id)}
                      disabled={startHatchMutation.isPending || incubatorCount === 0}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                        incubatorCount > 0
                          ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                          : "border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Egg className={`w-4 h-4 ${HATCH_RARITY_COLORS[egg.rarity] || "text-gray-400"}`} />
                      <span className={`text-xs font-semibold ${HATCH_RARITY_COLORS[egg.rarity] || "text-gray-400"}`}>{egg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No pet eggs. Eggs drop from World Bosses, Dungeons, and Expeditions.</p>
            )}
          </div>
        )}
      </div>

      {/* Hatch Result Animation */}
      <AnimatePresence>
        {showHatchResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHatchResult(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="bg-card border-2 border-amber-500/60 rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Sparkles className="w-20 h-20 text-amber-400 mx-auto" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <h2 className="font-orbitron text-2xl font-bold text-amber-400">Pet Hatched!</h2>
                <p className={`text-xl font-bold mt-2 ${HATCH_RARITY_COLORS[showHatchResult.rarity] || "text-white"}`}>
                  {showHatchResult.species}
                </p>
                <Badge className={`mt-1 ${HATCH_RARITY_COLORS[showHatchResult.rarity]}`}>
                  {showHatchResult.rarity?.toUpperCase()}
                </Badge>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="bg-black/30 rounded-xl p-3 space-y-1 text-sm text-left"
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passive</span>
                  <span className="text-cyan-400">{showHatchResult.passiveType?.replace(/_/g, " ")} +{showHatchResult.passiveValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skill</span>
                  <span className="text-green-400">{showHatchResult.skillType?.replace(/_/g, " ")} +{showHatchResult.skillValue}</span>
                </div>
                {showHatchResult.traits?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Traits</span>
                    <span className="text-amber-400">{showHatchResult.traits.map(t => t.name).join(", ")}</span>
                  </div>
                )}
              </motion.div>
              <Button onClick={() => setShowHatchResult(null)} className="w-full bg-amber-600 hover:bg-amber-700 font-orbitron">
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Pets(props) {
  return (
    <PetsErrorBoundary>
      <PetsInner {...props} />
    </PetsErrorBoundary>
  );
}
