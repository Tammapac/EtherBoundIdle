import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Lock, CheckCircle2, Sparkles, Flame, ChevronDown, ChevronUp, Shield, Swords, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CLASS_SKILLS, SKILL_TIERS, ELEMENT_CONFIG, SKILL_SYNERGIES, getActiveSynergies, ELEMENT_STACK_BONUSES, getElementStackBonuses } from "@/lib/skillData";
import SkillHotbar from "@/components/game/SkillHotbar";

const ELEMENT_ORDER = ["physical", "fire", "ice", "lightning", "poison", "blood", "sand", "arcane"];

const ELEM_BORDER = {
  fire: "#fb923c", ice: "#22d3ee", lightning: "#fde047", poison: "#4ade80",
  blood: "#ef4444", sand: "#fbbf24", arcane: "#c084fc", physical: "#9ca3af", none: "#6b7280",
};

const EFFECT_LABELS = {
  shield: { icon: "🛡️", label: "Shield" },
  dot: { icon: "🔥", label: "DoT" },
  stun: { icon: "⚡", label: "Stun" },
  slow: { icon: "🌀", label: "Slow" },
  buff: { icon: "✨", label: "Buff" },
};

export default function SkillTree({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedTier, setExpandedTier] = useState(1);
  const [activeElement, setActiveElement] = useState(null); // null = all elements
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showSynergies, setShowSynergies] = useState(false);

  const charClass = character?.class || "warrior";
  const skills = CLASS_SKILLS[charClass] || [];
  const learnedSkills = character?.skills || [];
  const skillPoints = character?.skill_points || 0;
  const charLevel = character?.level || 1;
  const equippedSkills = character?.hotbar_skills || [];

  const elemStats = {
    fire_dmg: character?.fire_dmg || 0, ice_dmg: character?.ice_dmg || 0,
    lightning_dmg: character?.lightning_dmg || 0, poison_dmg: character?.poison_dmg || 0,
    blood_dmg: character?.blood_dmg || 0, sand_dmg: character?.sand_dmg || 0,
  };

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

  // Group skills by tier, then optionally filter by element
  const tierGroups = useMemo(() => {
    const groups = {};
    for (let t = 1; t <= 6; t++) groups[t] = [];
    for (const s of skills) {
      if (groups[s.tier]) groups[s.tier].push(s);
    }
    return groups;
  }, [skills]);

  // Available elements
  const availableElements = useMemo(() => {
    const elems = new Set();
    for (const s of skills) elems.add(s.element || "none");
    return ELEMENT_ORDER.filter(e => elems.has(e)).concat(elems.has("none") ? ["none"] : []);
  }, [skills]);

  // Count learned per element
  const elemCounts = useMemo(() => {
    const counts = {};
    for (const e of availableElements) {
      const es = skills.filter(s => (s.element || "none") === e);
      counts[e] = { total: es.length, learned: es.filter(s => learnedSkills.includes(s.id)).length };
    }
    return counts;
  }, [skills, learnedSkills, availableElements]);

  // Synergies
  const allSynergies = SKILL_SYNERGIES[charClass] || [];
  const activeSynergies = getActiveSynergies(charClass, learnedSkills, equippedSkills);

  // Filter skills in a tier by active element
  const getFilteredSkills = (tierSkills) => {
    if (!activeElement) return tierSkills;
    return tierSkills.filter(s => (s.element || "none") === activeElement);
  };

  // Tier progress
  const getTierProgress = (tier) => {
    const ts = tierGroups[tier] || [];
    const filtered = getFilteredSkills(ts);
    const learned = filtered.filter(s => learnedSkills.includes(s.id)).length;
    return { learned, total: filtered.length };
  };

  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto space-y-3">
      {/* Header with SP and progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Skill Tree
          </h2>
          <p className="text-[11px] text-muted-foreground capitalize">{charClass} · Lv.{charLevel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 text-sm px-3 py-1">
            <Star className="w-3.5 h-3.5" /> {skillPoints} SP
          </Badge>
          <Badge variant="outline" className="text-xs">{learnedSkills.length}/{skills.length}</Badge>
        </div>
      </div>

      {/* Skill Hotbar - prominent at top */}
      <SkillHotbar character={character} onCharacterUpdate={onCharacterUpdate} />

      {/* Quick stats row: synergies toggle + element stacks */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSynergies(!showSynergies)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            showSynergies ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground hover:border-amber-500/30"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Synergies {activeSynergies.length}/{allSynergies.length}
        </button>
        <div className="flex-1" />
      </div>

      {/* Synergies Panel - collapsible, shown above tree */}
      <AnimatePresence>
        {showSynergies && allSynergies.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 space-y-2">
              <div className="grid gap-2">
                {allSynergies.map(syn => {
                  const isActive = activeSynergies.some(a => a.id === syn.id);
                  const learnedSet = new Set(learnedSkills);
                  const progress = syn.requires.filter(id => learnedSet.has(id)).length;
                  return (
                    <div
                      key={syn.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                        isActive ? "border-amber-500/40 bg-amber-500/10" : "border-gray-700/40 opacity-50"
                      }`}
                    >
                      <span className="text-xl shrink-0">{syn.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isActive ? "text-amber-300" : "text-gray-500"}`}>{syn.name}</span>
                          <span className="text-[9px] text-gray-500">{syn.buildType}</span>
                        </div>
                        <p className={`text-[10px] ${isActive ? "text-amber-200/80" : "text-gray-600"}`}>{syn.description}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {syn.requires.map(id => {
                            const sk = skills.find(s => s.id === id);
                            const has = learnedSet.has(id);
                            return (
                              <span key={id} className={`text-[8px] px-1.5 py-0.5 rounded ${
                                has ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500 border border-gray-700"
                              }`}>{sk?.name || id}</span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isActive ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <span className="text-[10px] text-gray-500">{progress}/{syn.requires.length}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        <button
          onClick={() => { setActiveElement(null); }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border-2 ${
            !activeElement ? "border-white/30 bg-white/10 text-white" : "border-transparent bg-white/5 text-gray-500"
          }`}
        >
          All
        </button>
        {availableElements.map(elem => {
          const cfg = ELEMENT_CONFIG[elem] || { icon: "🛡️", label: elem };
          const c = elemCounts[elem] || { total: 0, learned: 0 };
          const isActive = activeElement === elem;
          const color = ELEM_BORDER[elem] || "#666";
          return (
            <button
              key={elem}
              onClick={() => setActiveElement(isActive ? null : elem)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all"
              style={{
                border: `2px solid ${isActive ? color : "transparent"}`,
                background: isActive ? `${color}22` : "rgba(255,255,255,0.03)",
                color: isActive ? color : "#777",
              }}
            >
              <span>{cfg.icon}</span>
              <span className="hidden sm:inline">{cfg.label}</span>
              <span style={{ opacity: 0.5 }}>{c.learned}/{c.total}</span>
            </button>
          );
        })}
      </div>

      {/* Tier Accordion */}
      <div className="space-y-1.5">
        {[1, 2, 3, 4, 5, 6].map(tier => {
          const meta = SKILL_TIERS[tier];
          const tierUnlocked = charLevel >= meta.levelReq;
          const isExpanded = expandedTier === tier;
          const filtered = getFilteredSkills(tierGroups[tier] || []);
          const { learned: tierLearned, total: tierTotal } = getTierProgress(tier);

          return (
            <div key={tier} className="border border-border rounded-xl overflow-hidden bg-black/20">
              {/* Tier Header - clickable */}
              <button
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all ${
                  tierUnlocked ? "hover:bg-white/5" : "opacity-40"
                } ${isExpanded ? "bg-white/5" : ""}`}
              >
                <span className={`text-xs font-orbitron font-bold px-2 py-0.5 rounded ${meta.color}`}>
                  T{tier}
                </span>
                <span className={`text-sm font-bold flex-1 text-left ${tierUnlocked ? "text-gray-200" : "text-gray-600"}`}>
                  {meta.label}
                </span>
                {!tierUnlocked && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Lv.{meta.levelReq}
                  </span>
                )}
                <span className={`text-[11px] font-bold ${tierLearned === tierTotal && tierTotal > 0 ? "text-emerald-400" : "text-gray-500"}`}>
                  {tierLearned}/{tierTotal}
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {/* Expanded: Skill Cards */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-1.5">
                      {filtered.length === 0 && (
                        <p className="text-xs text-gray-600 text-center py-3">No skills for this element at this tier.</p>
                      )}
                      {filtered.map(skill => {
                        const learned = learnedSkills.includes(skill.id);
                        const prereqMet = !skill.requires || learnedSkills.includes(skill.requires);
                        const levelOk = charLevel >= skill.levelReq;
                        const canLearn = !learned && prereqMet && levelOk && skillPoints >= skill.cost;
                        const locked = !prereqMet || !levelOk;
                        const elemCfg = skill.element ? ELEMENT_CONFIG[skill.element] : { icon: "🛡️", label: "Utility", color: "text-gray-400" };
                        const elemColor = ELEM_BORDER[skill.element] || ELEM_BORDER.physical;
                        const isEquipped = equippedSkills.includes(skill.id);
                        const isSelected = selectedSkill?.id === skill.id;
                        const effectInfo = skill.effect ? EFFECT_LABELS[skill.effect.type] : null;

                        return (
                          <motion.div
                            key={skill.id}
                            layout
                            onClick={() => setSelectedSkill(isSelected ? null : skill)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              learned
                                ? "border-l-[3px] bg-white/5"
                                : canLearn
                                ? "border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10"
                                : locked
                                ? "border-gray-800 bg-black/20 opacity-40"
                                : "border-gray-700/50 bg-black/10 hover:bg-white/5"
                            } ${isSelected ? "ring-1 ring-primary/50" : ""}`}
                            style={{
                              borderLeftColor: learned ? elemColor : undefined,
                            }}
                          >
                            {/* Element icon circle */}
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                border: `2px solid ${learned ? elemColor : locked ? "#333" : "#555"}`,
                                background: learned ? `${elemColor}22` : "rgba(20,20,25,0.8)",
                                boxShadow: learned ? `0 0 8px ${elemColor}33` : "none",
                              }}
                            >
                              <span className="text-lg">{elemCfg.icon}</span>
                            </div>

                            {/* Skill info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[13px] font-bold truncate ${learned ? "text-gray-100" : locked ? "text-gray-600" : "text-gray-300"}`}>
                                  {skill.name}
                                </span>
                                {isEquipped && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
                                    EQUIPPED
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {skill.damage > 0 ? (
                                  <span className={`text-[11px] ${learned ? "text-orange-400" : "text-gray-500"}`}>
                                    <Swords className="w-3 h-3 inline mr-0.5" />{Math.round(skill.damage * 100)}%
                                  </span>
                                ) : (
                                  <span className={`text-[11px] ${learned ? "text-blue-300" : "text-gray-500"}`}>
                                    <Shield className="w-3 h-3 inline mr-0.5" />Utility
                                  </span>
                                )}
                                <span className={`text-[11px] ${learned ? "text-blue-400" : "text-gray-500"}`}>{skill.mp}MP</span>
                                <span className={`text-[11px] ${learned ? "text-gray-400" : "text-gray-600"}`}>{skill.cooldown}T</span>
                                {effectInfo && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    learned ? "bg-white/10 text-gray-300" : "bg-white/5 text-gray-600"
                                  }`}>
                                    {effectInfo.icon} {effectInfo.label}
                                    {skill.effect.duration > 1 ? ` ${skill.effect.duration}T` : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right side: status */}
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              {learned && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                              {!learned && canLearn && (
                                <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center animate-pulse">
                                  <Star className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {locked && !learned && <Lock className="w-4 h-4 text-gray-600" />}
                              {!learned && (
                                <span className="text-[9px] text-gray-500">{skill.cost}SP</span>
                              )}
                            </div>
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
      </div>

      {/* Selected Skill Detail Panel */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="border rounded-xl bg-card p-4 space-y-3"
            style={{ borderColor: `${ELEM_BORDER[selectedSkill.element] || "#555"}55` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    border: `2.5px solid ${ELEM_BORDER[selectedSkill.element] || "#666"}`,
                    background: `${ELEM_BORDER[selectedSkill.element] || "#666"}22`,
                    boxShadow: `0 0 12px ${ELEM_BORDER[selectedSkill.element] || "#666"}33`,
                  }}
                >
                  <span className="text-2xl">
                    {(selectedSkill.element && ELEMENT_CONFIG[selectedSkill.element]?.icon) || "🛡️"}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedSkill.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={SKILL_TIERS[selectedSkill.tier]?.color}>T{selectedSkill.tier} {SKILL_TIERS[selectedSkill.tier]?.label}</span>
                    <span>· Lv.{selectedSkill.levelReq}</span>
                    {selectedSkill.element && <span>· {ELEMENT_CONFIG[selectedSkill.element]?.label}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSkill(null)} className="p-1 hover:bg-white/5 rounded">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              {selectedSkill.damage > 0 ? (
                <span className="text-orange-400"><Swords className="w-3 h-3 inline mr-1" />{Math.round(selectedSkill.damage * 100)}% DMG</span>
              ) : (
                <span className="text-blue-300"><Shield className="w-3 h-3 inline mr-1" />Utility</span>
              )}
              <span className="text-blue-400">{selectedSkill.mp} MP</span>
              <span className="text-gray-400">{selectedSkill.cooldown}T CD</span>
              <span className="text-amber-300">{selectedSkill.cost} SP</span>
            </div>

            {/* Effect detail */}
            {selectedSkill.effect && (
              <div className="text-[11px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                {selectedSkill.effect.type === "shield" && `🛡️ Shield — Absorbs ${selectedSkill.effect.value}% of max HP as a damage shield for ${selectedSkill.effect.duration} turns`}
                {selectedSkill.effect.type === "dot" && `🔥 Damage over Time — Deals ${selectedSkill.effect.value}% of base damage each turn for ${selectedSkill.effect.duration} turns`}
                {selectedSkill.effect.type === "stun" && `⚡ Stun — Enemy cannot attack for ${selectedSkill.effect.duration} turn${selectedSkill.effect.duration > 1 ? "s" : ""}`}
                {selectedSkill.effect.type === "slow" && `🌀 Slow — Enemy takes 50% more damage for ${selectedSkill.effect.duration} turn${selectedSkill.effect.duration > 1 ? "s" : ""}`}
                {selectedSkill.effect.type === "buff" && `✨ Buff — +${selectedSkill.effect.value}% ${selectedSkill.effect.stat?.toUpperCase()} for ${selectedSkill.effect.duration} turns`}
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">{selectedSkill.description}</p>

            {selectedSkill.synergy && (
              <p className="text-xs text-amber-400/70 italic">💡 {selectedSkill.synergy}</p>
            )}

            {selectedSkill.requires && (() => {
              const prereq = skills.find(s => s.id === selectedSkill.requires);
              const met = learnedSkills.includes(selectedSkill.requires);
              return (
                <p className="text-xs">
                  Requires: <span className={met ? "text-emerald-400" : "text-red-400"}>{prereq?.name || selectedSkill.requires}</span>
                </p>
              );
            })()}

            {/* Elemental bonus info */}
            {selectedSkill.element && ELEMENT_CONFIG[selectedSkill.element]?.stat && (() => {
              const bonus = elemStats[ELEMENT_CONFIG[selectedSkill.element].stat] || 0;
              return bonus > 0 ? (
                <p className={`text-xs font-bold ${ELEMENT_CONFIG[selectedSkill.element].color}`}>
                  Your {ELEMENT_CONFIG[selectedSkill.element].label} bonus: +{bonus}%
                </p>
              ) : null;
            })()}

            {/* Learn / Status */}
            {(() => {
              const learned = learnedSkills.includes(selectedSkill.id);
              const prereqMet = !selectedSkill.requires || learnedSkills.includes(selectedSkill.requires);
              const levelOk = charLevel >= selectedSkill.levelReq;
              const canLearn = !learned && prereqMet && levelOk && skillPoints >= selectedSkill.cost;

              if (learned) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Learned</Badge>;
              if (!levelOk) return <p className="text-xs text-red-400">Requires Level {selectedSkill.levelReq}</p>;
              if (!prereqMet) return <p className="text-xs text-red-400">Prerequisite not met</p>;
              if (skillPoints < selectedSkill.cost) return <p className="text-xs text-red-400">Need {selectedSkill.cost - skillPoints} more SP</p>;
              if (canLearn) return (
                <Button
                  size="sm"
                  className="w-full h-9 text-sm gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold"
                  onClick={(e) => { e.stopPropagation(); learnMutation.mutate(selectedSkill); }}
                  disabled={learnMutation.isPending}
                >
                  <Zap className="w-4 h-4" /> Learn — {selectedSkill.cost} SP
                </Button>
              );
              return null;
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element Stack Bonuses - compact */}
      {(() => {
        const { activeStacks } = getElementStackBonuses(charClass, equippedSkills);
        const ELEM_EMOJIS = { fire: "🔥", ice: "❄️", lightning: "⚡", poison: "☠️", blood: "🩸", sand: "🌪️" };
        const ELEM_COLORS = { fire: "text-orange-400", ice: "text-cyan-400", lightning: "text-yellow-300", poison: "text-green-400", blood: "text-red-400", sand: "text-amber-400" };
        const allElements = Object.keys(ELEMENT_STACK_BONUSES);
        const hasAnyStack = activeStacks.length > 0;
        return (
          <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-3 space-y-2">
            <h3 className="font-orbitron font-bold text-xs text-violet-400 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5" /> Element Stacks
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {allElements.map(element => {
                const tiers = ELEMENT_STACK_BONUSES[element];
                const activeStack = activeStacks.find(s => s.element === element);
                const activeTier = activeStack?.tier || 0;
                return (
                  <div key={element} className={`rounded-lg p-2 ${activeTier > 0 ? "bg-white/5 border border-white/10" : "bg-black/20 border border-gray-800/50 opacity-40"}`}>
                    <p className={`text-[10px] font-bold mb-0.5 ${ELEM_COLORS[element]}`}>{ELEM_EMOJIS[element]} {element.charAt(0).toUpperCase() + element.slice(1)}</p>
                    {[2, 3, 4].map(t => {
                      const bonus = tiers[t];
                      if (!bonus) return null;
                      const isActive = activeTier >= t;
                      const bonusStr = Object.entries(bonus).map(([k, v]) => `+${v}% ${k.replace(/_/g, " ")}`).join(", ");
                      return <p key={t} className={`text-[9px] ${isActive ? ELEM_COLORS[element] : "text-gray-600"}`}>{isActive ? "✓" : "○"} {t}x: {bonusStr}</p>;
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
