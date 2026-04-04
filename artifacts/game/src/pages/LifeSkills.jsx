import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Leaf, Package, Coins, FlaskConical } from "lucide-react";
import SkillCard from "@/components/lifeskills/SkillCard";
import ResourceInventory from "@/components/lifeskills/ResourceInventory";
import ProcessingPanel from "@/components/lifeskills/ProcessingPanel";
import { useToast } from "@/components/ui/use-toast";
import hybridPersistence from "@/lib/hybridPersistence";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

const DROP_ICONS = {
  iron_ore: "🪨", copper_ore: "🟤", silver_ore: "⚪", gold_ore: "🟡",
  platinum_ore: "💎", void_ore: "🔮", crystal_ore: "⭐",
  carp: "🐟", salmon: "🐠", tuna: "🐡", swordfish: "🐬",
  dragonfish: "🐲", leviathan_fish: "🐉", golden_fish: "✨",
  common_herb: "🌿", greenleaf: "🍃", blue_herb: "🌺", shadow_herb: "🌑",
  sun_blossom: "🌻", ether_plant: "🌸", spirit_herb: "💫",
};

const RARITY_NOTABLE = ["epic", "legendary", "mythic", "shiny"];
const RARITY_ORDER   = ["shiny","mythic","legendary","epic","rare","uncommon","common"];

export default function LifeSkills({ character, onCharacterUpdate }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [lastDrops, setLastDrops] = useState({});
  const pollInterval = useSmartPolling(POLL_INTERVALS.GAME_STATE);

  const { data, isLoading } = useQuery({
    queryKey: ["lifeskills", character?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("lifeSkills", {
        action: "get_skills",
        character_id: character.id,
      });
      return res;
    },
    enabled: !!character?.id,
    refetchInterval: pollInterval,
    staleTime: POLL_INTERVALS.GAME_STATE,
  });

  const skills     = data?.skills     || [];
  const resources  = data?.resources  || [];
  const processing = data?.processing || {};

  const activeSkillType = skills.find(s => s.is_active)?.skill_type || null;

  // ── START ───────────────────────────────────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: (skillType) => base44.functions.invoke("lifeSkills", {
      action: "start", character_id: character.id, skill_type: skillType,
    }),
    onSuccess: (res, skillType) => {
      // Save to local storage for resume on reload
      const skill = data?.skills?.find(s => s.skill_type === skillType);
      if (skill) {
        hybridPersistence.saveLifeSkill(
          character.id,
          skillType,
          skill.gather_progress || 0,
          skill.speed_level || 1
        );
      }
      queryClient.invalidateQueries({ queryKey: ["lifeskills", character.id] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || "Could not start skill.";
      toast({ title: "Cannot start", description: msg, variant: "destructive" });
    },
  });

  // ── STOP ────────────────────────────────────────────────────────────────────
  const stopMutation = useMutation({
    mutationFn: (skillType) => base44.functions.invoke("lifeSkills", {
      action: "stop", character_id: character.id, skill_type: skillType,
    }),
    onSuccess: () => {
      // Clear local cache
      hybridPersistence.clearLocal(character.id);
      queryClient.invalidateQueries({ queryKey: ["lifeskills", character.id] });
    },
  });

  // ── TICK ────────────────────────────────────────────────────────────────────
  const tickMutation = useMutation({
    mutationFn: (skillType) => base44.functions.invoke("lifeSkills", {
      action: "tick", character_id: character.id, skill_type: skillType,
    }),
    onSuccess: (res, skillType) => {
      const d = res || {};
      if (d.success === false) return;

      queryClient.invalidateQueries({ queryKey: ["lifeskills", character.id] });

      if (d.resources?.length > 0) {
        const rarest = d.resources.reduce((best, r) =>
          RARITY_ORDER.indexOf(r.rarity) < RARITY_ORDER.indexOf(best.rarity) ? r : best,
          d.resources[0]
        );
        const icon = DROP_ICONS[rarest.resource] || "📦";
        setLastDrops(prev => ({ ...prev, [skillType]: { icon, rarity: rarest.rarity, ts: Date.now() } }));

        d.resources.filter(r => RARITY_NOTABLE.includes(r.rarity)).forEach(drop => {
          const prefix = drop.rarity === "shiny" ? "✨ SHINY" : drop.rarity.charAt(0).toUpperCase() + drop.rarity.slice(1);
          toast({ title: `${prefix} Drop!`, description: `+1 ${drop.label}` });
        });

        // Update quest progress for this resource type
        d.resources.forEach(r => {
          base44.functions.invoke('updateQuestProgress', {
            characterId: character.id,
            objectiveType: skillType,
            targetResource: r.resource,
            amount: 1,
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["quests", character.id] });
          }).catch(() => {});
        });
      }

      if (d.leveled_up) {
        toast({
          title: `${skillType.charAt(0).toUpperCase() + skillType.slice(1)} Level Up! 🎉`,
          description: `Reached Level ${d.new_level}!`,
        });
      }
    },
  });

  // ── UPGRADE ─────────────────────────────────────────────────────────────────
  const upgradeMutation = useMutation({
    mutationFn: ({ skillType, upgradeType }) => base44.functions.invoke("lifeSkills", {
      action: "upgrade", character_id: character.id, skill_type: skillType, upgrade_type: upgradeType,
    }),
    onSuccess: (res, { upgradeType }) => {
      queryClient.invalidateQueries({ queryKey: ["lifeskills", character.id] });
      const d = res || {};
      if (d.gold_spent !== undefined) {
        onCharacterUpdate?.({ gold: (character.gold || 0) - d.gold_spent });
        const label = upgradeType === "speed" ? `Speed Lv.${d.new_speed_level}` : `Luck Lv.${d.new_luck_level}`;
        toast({ title: `Upgraded! ${label}`, description: `-${d.gold_spent} Gold` });
      }
    },
    onError: (err) => {
      toast({ title: "Upgrade failed", description: err?.response?.data?.error || "Not enough gold?", variant: "destructive" });
    },
  });

  const isMutating = startMutation.isPending || stopMutation.isPending || upgradeMutation.isPending;
  const refreshResources = () => queryClient.invalidateQueries({ queryKey: ["lifeskills", character.id] });

  // Resume from local cache on mount if skill was active
  useEffect(() => {
    if (!character?.id || !data) return;
    
    const localSkill = hybridPersistence.loadLifeSkill(character.id);
    if (localSkill && !activeSkillType) {
      // Skill was active, restore it
      const skill = data.skills?.find(s => s.skill_type === localSkill.skillType);
      if (skill && !skill.is_active) {
        // Auto-resume the skill
        startMutation.mutate(localSkill.skillType);
      }
    }
  }, [character?.id, data?.skills?.length]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-400" />
          <h2 className="font-orbitron text-xl font-bold">Life Skills</h2>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-accent font-semibold">
          <Coins className="w-4 h-4" />
          {(character?.gold || 0).toLocaleString()} Gold
        </div>
      </div>

      <Tabs defaultValue="gather">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="gather" className="gap-1.5 text-xs sm:text-sm">
            <Leaf className="w-3.5 h-3.5" /> Gather
          </TabsTrigger>
          <TabsTrigger value="process" className="gap-1.5 text-xs sm:text-sm">
            <FlaskConical className="w-3.5 h-3.5" /> Process
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5" /> Resources
          </TabsTrigger>
        </TabsList>

        {/* ── GATHER TAB ── */}
        <TabsContent value="gather">
          {activeSkillType && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse inline-block" />
              Gathering <span className="font-bold capitalize">{activeSkillType}</span> — stop it first to switch.
            </div>
          )}

          {isLoading ? (
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              {skills.map(skill => (
                <SkillCard
                  key={skill.id || skill.skill_type}
                  skill={skill}
                  onStart={(t) => startMutation.mutate(t)}
                  onStop={(t) => stopMutation.mutate(t)}
                  onTick={(t) => tickMutation.mutate(t)}
                  onUpgrade={(t, u) => upgradeMutation.mutate({ skillType: t, upgradeType: u })}
                  loading={isMutating}
                  lastDrop={lastDrops[skill.skill_type]}
                  locked={activeSkillType !== null && activeSkillType !== skill.skill_type}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3 text-center">
            One skill at a time. Reach Level 30 to unlock Processing skills.
          </p>
        </TabsContent>

        {/* ── PROCESS TAB ── */}
        <TabsContent value="process">
          <div className="mt-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 h-32 animate-pulse" />
                ))}
              </div>
            ) : (
              <ProcessingPanel
                processing={processing}
                resources={resources}
                characterId={character.id}
                onResourcesChange={refreshResources}
              />
            )}
          </div>
        </TabsContent>

        {/* ── RESOURCES TAB ── */}
        <TabsContent value="resources">
          <div className="mt-3">
            <ResourceInventory
              resources={resources}
              character={character}
              onCharacterUpdate={onCharacterUpdate}
              onResourcesChange={refreshResources}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}