import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Lock, CheckCircle2, ChevronDown, ChevronRight, Star, Flame, Snowflake, Swords, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CLASS_SKILLS, SKILL_TIERS, ELEMENT_CONFIG, SKILL_SYNERGIES, getActiveSynergies, ELEMENT_STACK_BONUSES, getElementStackBonuses } from "@/lib/skillData";
import SkillHotbar from "@/components/game/SkillHotbar";

export default function SkillTree({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openTiers, setOpenTiers] = useState({ 1: true, 2: false, 3: false, 4: false, 5: false, 6: false });

  const charClass = character?.class || "warrior";
  const skills = CLASS_SKILLS[charClass] || [];
  const learnedSkills = character?.skills || [];
  const skillPoints = character?.skill_points || 0;
  const charLevel = character?.level || 1;

  // Elemental bonuses on character
  const elemStats = {
    fire_dmg:      character?.fire_dmg || 0,
    ice_dmg:       character?.ice_dmg || 0,
    lightning_dmg: character?.lightning_dmg || 0,
    poison_dmg:    character?.poison_dmg || 0,
    blood_dmg:     character?.blood_dmg || 0,
    sand_dmg:      character?.sand_dmg || 0,
  };
  const hasAnyElem = Object.values(elemStats).some(v => v > 0);

  const learnMutation = useMutation({
    mutationFn: async (skill) => {
      const newSkills = [...learnedSkills, skill.id];
      const newPoints = skillPoints - skill.cost;
      await base44.entities.Character.update(character.id, { skills: newSkills, skill_points: newPoints });
      onCharacterUpdate({ ...character, skills: newSkills, skill_points: newPoints });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({ title: "Skill learned!", duration: 1500 });
    },
  });

  const toggleTier = (tier) => setOpenTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
  const tierNums = [1, 2, 3, 4, 5, 6];

  // Synergies — only active when required skills are in hotbar
  const equippedSkills = character?.hotbar_skills || [];
  const allSynergies = SKILL_SYNERGIES[charClass] || [];
  const activeSynergies = getActiveSynergies(charClass, learnedSkills, equippedSkills);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Skill Tree
          </h2>
          <p className="text-xs text-muted-foreground capitalize">{charClass} · {skills.length} skills · Lv.{charLevel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
            <Star className="w-3 h-3" /> {skillPoints} Skill Points
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            {learnedSkills.length}/{skills.length} learned
          </Badge>
        </div>
      </div>

      {/* Elemental stats overview */}
      {hasAnyElem && (
        <div className="bg-muted/30 border border-border rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">⚡ Your Elemental Bonuses (amplify matching skills):</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(elemStats).filter(([,v]) => v > 0).map(([key, val]) => {
              const elem = Object.values(ELEMENT_CONFIG).find(e => e.stat === key);
              if (!elem) return null;
              return (
                <span key={key} className={`text-xs font-bold ${elem.color} bg-card border border-current/20 rounded-lg px-2 py-1`}>
                  {elem.icon} {elem.label} +{val}%
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-muted/30 border border-border rounded-xl p-3 text-xs text-muted-foreground">
        <p>Earn <strong className="text-foreground">1 skill point per level</strong>. Skills with 🔥❄️⚡☠️🩸🌪️ icons scale with your matching elemental bonus stats from items.</p>
        {skillPoints === 0 && <p className="text-destructive mt-1">⚠ No skill points. Level up to earn more.</p>}
      </div>

      {/* Skill Hotbar - always visible at top */}
      <SkillHotbar character={character} onCharacterUpdate={onCharacterUpdate} />

      {/* Tier sections */}
      {tierNums.map(tier => {
        const tierMeta = SKILL_TIERS[tier];
        const tierSkills = skills.filter(s => s.tier === tier);
        const tierUnlocked = charLevel >= tierMeta.levelReq;
        const learnedInTier = tierSkills.filter(s => learnedSkills.includes(s.id)).length;
        const isOpen = openTiers[tier];

        return (
          <div key={tier} className={`border ${tierMeta.border} ${tierMeta.bg} rounded-xl overflow-hidden`}>
            <button
              onClick={() => tierUnlocked && toggleTier(tier)}
              className={`w-full flex items-center justify-between p-4 transition-colors ${tierUnlocked ? "hover:bg-white/5 cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <div className="flex items-center gap-3">
                {tierUnlocked
                  ? isOpen ? <ChevronDown className={`w-4 h-4 ${tierMeta.color}`} /> : <ChevronRight className={`w-4 h-4 ${tierMeta.color}`} />
                  : <Lock className="w-4 h-4 text-muted-foreground" />
                }
                <span className={`font-orbitron font-bold text-sm ${tierMeta.color}`}>
                  Tier {tier} — {tierMeta.label}
                </span>
                {!tierUnlocked && (
                  <Badge variant="outline" className="text-xs">Requires Lv.{tierMeta.levelReq}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{learnedInTier}/{tierSkills.length}</span>
                {learnedInTier === tierSkills.length && tierSkills.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && tierUnlocked && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 grid md:grid-cols-3 gap-3 border-t border-white/5 pt-3">
                    {tierSkills.map(skill => {
                      const learned = learnedSkills.includes(skill.id);
                      const prereqMet = !skill.requires || learnedSkills.includes(skill.requires);
                      const levelOk = charLevel >= skill.levelReq;
                      const canLearn = !learned && prereqMet && levelOk && skillPoints >= skill.cost;
                      const prereqSkill = skill.requires ? skills.find(s => s.id === skill.requires) : null;
                      const locked = !prereqMet || !levelOk;
                      const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
                      // Elemental bonus for this skill
                      const elemBonus = elem?.stat ? (elemStats[elem.stat] || 0) : 0;

                      return (
                        <motion.div
                          key={skill.id}
                          whileHover={canLearn ? { scale: 1.02 } : {}}
                          className={`bg-card border rounded-xl p-3 space-y-2 transition-all ${
                            learned ? "border-primary/50 bg-primary/5"
                            : locked ? "border-border opacity-40"
                            : canLearn ? "border-accent/50 cursor-pointer hover:border-accent"
                            : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {elem && <span className={`text-sm ${elem.color}`}>{elem.icon}</span>}
                                <p className={`font-semibold text-sm ${learned ? "text-primary" : locked ? "text-muted-foreground" : "text-foreground"}`}>
                                  {skill.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs text-blue-400">{skill.mp}MP</span>
                                <span className="text-xs text-muted-foreground">{skill.cooldown}T CD</span>
                                {skill.damage > 0 && (
                                  <span className="text-xs text-orange-400">{Math.round(skill.damage * 100)}% DMG</span>
                                )}
                                {elemBonus > 0 && (
                                  <span className={`text-xs font-bold ${elem?.color}`}>+{elemBonus}% {elem?.label}</span>
                                )}
                                {skill.levelReq > 1 && (
                                  <span className={`text-xs ${charLevel >= skill.levelReq ? "text-green-400" : "text-destructive"}`}>
                                    Lv.{skill.levelReq}
                                  </span>
                                )}
                              </div>
                            </div>
                            {learned ? (
                              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : locked ? (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                                <Star className="w-2.5 h-2.5" />{skill.cost}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>

                          {skill.synergy && (
                            <p className="text-xs text-primary/70 italic leading-relaxed">💡 {skill.synergy}</p>
                          )}

                          {prereqSkill && !learned && (
                            <p className="text-xs">
                              Requires:{" "}
                              <span className={prereqMet ? "text-green-400" : "text-destructive"}>{prereqSkill.name}</span>
                            </p>
                          )}
                          {!levelOk && <p className="text-xs text-destructive">Requires Level {skill.levelReq}</p>}
                          {!learned && prereqMet && levelOk && skillPoints > 0 && skillPoints < skill.cost && (
                            <p className="text-xs text-destructive">Need {skill.cost - skillPoints} more pts</p>
                          )}
                          {canLearn && (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs gap-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                              onClick={() => learnMutation.mutate(skill)}
                              disabled={learnMutation.isPending}
                            >
                              <Zap className="w-3 h-3" /> Learn — {skill.cost} pt{skill.cost > 1 ? "s" : ""}
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Skill Synergies */}
      {allSynergies.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron font-bold text-sm text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Skill Synergies
            </h3>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
              {activeSynergies.length}/{allSynergies.length} active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Learn specific skill combinations to unlock permanent passive bonuses. Build your character around synergies for maximum power.
          </p>
          <div className="grid md:grid-cols-2 gap-2">
            {allSynergies.map(syn => {
              const isActive = activeSynergies.some(a => a.id === syn.id);
              const learnedSet = new Set(learnedSkills);
              const progress = syn.requires.filter(id => learnedSet.has(id)).length;

              return (
                <motion.div
                  key={syn.id}
                  className={`border rounded-lg p-3 transition-all ${
                    isActive
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-gray-700 bg-gray-800/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{syn.icon}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${isActive ? "text-amber-300" : "text-gray-400"}`}>
                        {syn.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{syn.buildType} Build</p>
                    </div>
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    ) : (
                      <span className="text-[9px] text-gray-500">{progress}/{syn.requires.length}</span>
                    )}
                  </div>
                  <p className={`text-[10px] mb-1.5 ${isActive ? "text-amber-200" : "text-gray-500"}`}>
                    {syn.description}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {syn.requires.map(id => {
                      const sk = skills.find(s => s.id === id);
                      const has = learnedSet.has(id);
                      return (
                        <span key={id} className={`text-[8px] px-1.5 py-0.5 rounded border ${
                          has ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-gray-700 text-gray-500"
                        }`}>
                          {sk?.name || id}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      {/* Element Stack Bonuses */}
      {(() => {
        const { activeStacks } = getElementStackBonuses(charClass, equippedSkills);
        const ELEM_EMOJIS = { fire: "🔥", ice: "❄️", lightning: "⚡", poison: "☠️", blood: "🩸", sand: "🌪️" };
        const ELEM_COLORS = { fire: "text-orange-400", ice: "text-cyan-400", lightning: "text-yellow-300", poison: "text-green-400", blood: "text-red-400", sand: "text-amber-400" };
        const allElements = Object.keys(ELEMENT_STACK_BONUSES);
        return (
          <div className="border border-violet-500/30 bg-violet-500/5 rounded-xl p-4 space-y-3">
            <h3 className="font-orbitron font-bold text-sm text-violet-400 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Element Stack Bonuses
            </h3>
            <p className="text-xs text-muted-foreground">
              Equip multiple skills of the same element for stacking bonuses. 2/3/4 of a kind unlocks increasing power.
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {allElements.map(element => {
                const tiers = ELEMENT_STACK_BONUSES[element];
                const activeStack = activeStacks.find(s => s.element === element);
                const activeTier = activeStack?.tier || 0;
                return (
                  <div key={element} className={`border rounded-lg p-2.5 ${activeTier > 0 ? `border-${element === "fire" ? "orange" : element === "ice" ? "cyan" : element === "lightning" ? "yellow" : element === "poison" ? "green" : element === "blood" ? "red" : "amber"}-500/40 bg-${element}-500/5` : "border-gray-700/50 bg-gray-800/20 opacity-60"}`}>
                    <p className={`text-xs font-bold mb-1.5 ${ELEM_COLORS[element] || "text-gray-400"}`}>{ELEM_EMOJIS[element]} {element.charAt(0).toUpperCase() + element.slice(1)}</p>
                    {[2, 3, 4].map(tier => {
                      const bonus = tiers[tier];
                      if (!bonus) return null;
                      const isActive = activeTier >= tier;
                      const bonusStr = Object.entries(bonus).map(([k, v]) => `+${v}% ${k.replace(/_/g, " ")}`).join(", ");
                      return (
                        <p key={tier} className={`text-[10px] ${isActive ? ELEM_COLORS[element] : "text-gray-500"}`}>
                          {isActive ? "✓" : "○"} {tier} skills: {bonusStr}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}