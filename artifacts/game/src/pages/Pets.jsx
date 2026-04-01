import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PawPrint, Star, Zap, Shield, Heart, Swords, ArrowUpCircle, Trash2, Sparkles } from "lucide-react";

const RARITY_COLORS = {
  common: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  uncommon: "text-green-400 border-green-500/30 bg-green-500/10",
  rare: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  epic: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  legendary: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  mythic: "text-red-400 border-red-500/30 bg-red-500/10",
};

const RARITY_BADGE = {
  common: "bg-gray-500/20 text-gray-300",
  uncommon: "bg-green-500/20 text-green-300",
  rare: "bg-blue-500/20 text-blue-300",
  epic: "bg-purple-500/20 text-purple-300",
  legendary: "bg-amber-500/20 text-amber-300",
  mythic: "bg-red-500/20 text-red-300",
};

const SPECIES_ICONS = {
  Wolf: "🐺", Phoenix: "🔥", Dragon: "🐉", Turtle: "🐢", Cat: "🐱",
  Owl: "🦉", Slime: "🟢", Fairy: "✨", Serpent: "🐍", Golem: "🪨",
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

const PET_XP_PER_LEVEL = 200;

export default function Pets({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedForFuse, setSelectedForFuse] = useState([]);
  const [fuseMode, setFuseMode] = useState(false);

  const { data: petData, isLoading } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
  });

  const pets = petData?.pets || [];
  const equippedPet = pets.find(p => p.equipped);
  const unequippedPets = pets.filter(p => !p.equipped);

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

  const handleFuseSelect = (pet) => {
    if (!fuseMode) return;
    const already = selectedForFuse.find(p => p.id === pet.id);
    if (already) {
      setSelectedForFuse(selectedForFuse.filter(p => p.id !== pet.id));
      return;
    }
    if (selectedForFuse.length >= 3) return;
    // Must match species and rarity of first selected
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

  const renderPetCard = (pet, isEquipped = false) => {
    const colors = RARITY_COLORS[pet.rarity] || RARITY_COLORS.common;
    const badgeColor = RARITY_BADGE[pet.rarity] || RARITY_BADGE.common;
    const SkillIcon = SKILL_ICONS[pet.skillType] || Zap;
    const isSelectedFuse = selectedForFuse.find(p => p.id === pet.id);
    const xpPercent = Math.min(100, ((pet.xp || 0) / PET_XP_PER_LEVEL) * 100);

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
        <div className="flex items-center gap-1.5 text-[10px] mb-3">
          <SkillIcon className="w-3 h-3 text-cyan-400" />
          <span className="text-muted-foreground">{SKILL_LABELS[pet.skillType] || pet.skillType}:</span>
          <span className="font-bold">{pet.skillValue}</span>
        </div>

        {/* Actions */}
        {!fuseMode && (
          <div className="flex gap-1.5">
            {isEquipped ? (
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => unequipMutation.mutate()}>
                Unequip
              </Button>
            ) : (
              <>
                <Button size="sm" className="flex-1 h-7 text-[10px] bg-primary/80 hover:bg-primary" onClick={() => equipMutation.mutate(pet.id)}>
                  Equip
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

  // Group pets by species+rarity for fusion eligibility
  const fusionGroups = {};
  unequippedPets.forEach(p => {
    const key = `${p.species}-${p.rarity}`;
    if (!fusionGroups[key]) fusionGroups[key] = { species: p.species, rarity: p.rarity, count: 0 };
    fusionGroups[key].count++;
  });
  const fusionEligible = Object.values(fusionGroups).filter(g => g.count >= 3);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
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
        <div className="flex gap-2">
          {fusionEligible.length > 0 && (
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
              {fuseMutation.isPending ? "Fusing..." : `Fuse into ${selectedForFuse[0]?.rarity === "common" ? "Uncommon" : selectedForFuse[0]?.rarity === "uncommon" ? "Rare" : selectedForFuse[0]?.rarity === "rare" ? "Epic" : selectedForFuse[0]?.rarity === "epic" ? "Legendary" : "Mythic"}`}
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

      {/* Pet Collection */}
      {pets.length === 0 && !isLoading ? (
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

      {/* Fusion eligible hint */}
      {!fuseMode && fusionEligible.length > 0 && (
        <div className="text-xs text-amber-400/70 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          You have {fusionEligible.length} fusion{fusionEligible.length > 1 ? "s" : ""} available!
        </div>
      )}
    </div>
  );
}
