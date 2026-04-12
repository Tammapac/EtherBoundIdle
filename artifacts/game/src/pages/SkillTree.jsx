import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Lock, CheckCircle2, Sparkles, Flame, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CLASS_SKILLS, SKILL_TIERS, ELEMENT_CONFIG, SKILL_SYNERGIES, getActiveSynergies, ELEMENT_STACK_BONUSES, getElementStackBonuses } from "@/lib/skillData";
import SkillHotbar from "@/components/game/SkillHotbar";

// ── Element ordering for tree columns ──
const ELEMENT_ORDER = ["physical", "fire", "ice", "lightning", "poison", "blood", "sand", "arcane"];
const TIER_NUMS = [1, 2, 3, 4, 5, 6];

// ── Node dimensions ──
const NODE_W = 72;
const NODE_H = 72;
const GAP_X = 20;
const GAP_Y = 40;
const TIER_LABEL_H = 28;

// Element colors for CSS (Tailwind classes won't work in SVG)
const ELEM_HEX = {
  fire: "#fb923c", ice: "#22d3ee", lightning: "#fde047", poison: "#4ade80",
  blood: "#ef4444", sand: "#fbbf24", arcane: "#c084fc", physical: "#d1d5db",
};

function getElemColor(element) {
  return ELEM_HEX[element] || ELEM_HEX.physical;
}

export default function SkillTree({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [activeElement, setActiveElement] = useState(null); // null = show all
  const scrollRef = useRef(null);

  const charClass = character?.class || "warrior";
  const skills = CLASS_SKILLS[charClass] || [];
  const learnedSkills = character?.skills || [];
  const skillPoints = character?.skill_points || 0;
  const charLevel = character?.level || 1;
  const equippedSkills = character?.hotbar_skills || [];

  // Elemental bonuses
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

  // ── Build tree data: group skills by element + tier ──
  const treeData = useMemo(() => {
    // Include skills with element=null as "none" group (buffs/utility)
    const byElem = {};
    for (const s of skills) {
      const e = s.element || "none";
      if (!byElem[e]) byElem[e] = {};
      if (!byElem[e][s.tier]) byElem[e][s.tier] = [];
      byElem[e][s.tier].push(s);
    }
    return byElem;
  }, [skills]);

  // Which elements actually have skills for this class
  const availableElements = useMemo(() => {
    const elems = [];
    for (const e of ELEMENT_ORDER) {
      if (treeData[e] && Object.keys(treeData[e]).length > 0) elems.push(e);
    }
    // Add "none" category for utility/buff skills
    if (treeData["none"] && Object.keys(treeData["none"]).length > 0) elems.push("none");
    return elems;
  }, [treeData]);

  // Filter to active element or show all
  const displayElements = activeElement ? [activeElement] : availableElements;

  // ── Calculate node positions for SVG lines ──
  const { nodePositions, svgWidth, svgHeight } = useMemo(() => {
    const positions = {};
    let maxX = 0;
    const colWidth = NODE_W + GAP_X;
    let globalCol = 0;

    for (const elem of displayElements) {
      const elemData = treeData[elem] || {};
      // Count max skills in any tier for this element
      let maxInTier = 0;
      for (const tier of TIER_NUMS) {
        const count = (elemData[tier] || []).length;
        if (count > maxInTier) maxInTier = count;
      }
      const elemCols = Math.max(1, maxInTier);

      for (const tier of TIER_NUMS) {
        const tierSkills = elemData[tier] || [];
        const startCol = globalCol + Math.floor((elemCols - tierSkills.length) / 2);
        tierSkills.forEach((s, i) => {
          const col = startCol + i;
          const x = col * colWidth + NODE_W / 2 + 16;
          const y = (tier - 1) * (NODE_H + GAP_Y + TIER_LABEL_H) + NODE_H / 2 + TIER_LABEL_H + 16;
          positions[s.id] = { x, y, col, tier };
          if (x + NODE_W / 2 > maxX) maxX = x + NODE_W / 2;
        });
      }
      globalCol += elemCols + 1; // +1 for gap between elements
    }

    const height = TIER_NUMS.length * (NODE_H + GAP_Y + TIER_LABEL_H) + 40;
    return { nodePositions: positions, svgWidth: maxX + 40, svgHeight: height };
  }, [displayElements, treeData]);

  // ── Synergies ──
  const allSynergies = SKILL_SYNERGIES[charClass] || [];
  const activeSynergies = getActiveSynergies(charClass, learnedSkills, equippedSkills);

  // ── Scroll helpers ──
  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });

  return (
    <div className="p-3 md:p-4 max-w-full mx-auto space-y-3">
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
            <Star className="w-3 h-3" /> {skillPoints} SP
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            {learnedSkills.length}/{skills.length}
          </Badge>
        </div>
      </div>

      {/* Skill Hotbar */}
      <SkillHotbar character={character} onCharacterUpdate={onCharacterUpdate} />

      {/* Element filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveElement(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
            !activeElement ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
          }`}
        >
          All Paths
        </button>
        {availableElements.map(elem => {
          const cfg = ELEMENT_CONFIG[elem] || { icon: "🛡️", label: elem, color: "text-gray-400" };
          const elemSkills = skills.filter(s => (s.element || "none") === elem);
          const elemLearned = elemSkills.filter(s => learnedSkills.includes(s.id)).length;
          return (
            <button
              key={elem}
              onClick={() => setActiveElement(activeElement === elem ? null : elem)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                activeElement === elem ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="opacity-60">{elemLearned}/{elemSkills.length}</span>
            </button>
          );
        })}
      </div>

      {/* Tree Canvas */}
      <div className="relative border border-border rounded-xl bg-black/20 overflow-hidden">
        {/* Scroll buttons */}
        <button onClick={scrollLeft} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-card/80 border border-border rounded-full p-1 hover:bg-card">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={scrollRight} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-card/80 border border-border rounded-full p-1 hover:bg-card">
          <ChevronRight className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="overflow-x-auto overflow-y-auto max-h-[70vh] p-4 scrollbar-hide" style={{ scrollBehavior: "smooth" }}>
          <div className="relative" style={{ width: svgWidth, height: svgHeight, minWidth: svgWidth }}>
            {/* SVG Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none" width={svgWidth} height={svgHeight}>
              {skills.map(skill => {
                if (!skill.requires) return null;
                const from = nodePositions[skill.requires];
                const to = nodePositions[skill.id];
                if (!from || !to) return null;
                const learned = learnedSkills.includes(skill.id);
                const prereqLearned = learnedSkills.includes(skill.requires);
                const color = learned ? getElemColor(skill.element) : prereqLearned ? "#666" : "#333";
                const opacity = learned ? 0.9 : prereqLearned ? 0.5 : 0.2;
                // Curved line
                const midY = (from.y + to.y) / 2;
                return (
                  <path
                    key={`${skill.requires}-${skill.id}`}
                    d={`M ${from.x} ${from.y + NODE_H / 2 - 4} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - NODE_H / 2 + 4}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={learned ? 2.5 : 1.5}
                    opacity={opacity}
                    strokeDasharray={learned ? "none" : "4 3"}
                  />
                );
              })}
            </svg>

            {/* Tier row labels */}
            {TIER_NUMS.map(tier => {
              const meta = SKILL_TIERS[tier];
              const y = (tier - 1) * (NODE_H + GAP_Y + TIER_LABEL_H) + 4;
              const tierUnlocked = charLevel >= meta.levelReq;
              return (
                <div
                  key={`tier-label-${tier}`}
                  className="absolute left-0 right-0 flex items-center gap-2 pointer-events-none"
                  style={{ top: y }}
                >
                  <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded ${meta.color} ${tierUnlocked ? "opacity-80" : "opacity-30"}`}>
                    T{tier} {meta.label} {!tierUnlocked && `(Lv.${meta.levelReq})`}
                  </span>
                </div>
              );
            })}

            {/* Skill Nodes */}
            {displayElements.map(elem => {
              const elemData = treeData[elem] || {};
              return TIER_NUMS.map(tier => {
                const tierSkills = elemData[tier] || [];
                return tierSkills.map(skill => {
                  const pos = nodePositions[skill.id];
                  if (!pos) return null;
                  const learned = learnedSkills.includes(skill.id);
                  const prereqMet = !skill.requires || learnedSkills.includes(skill.requires);
                  const levelOk = charLevel >= skill.levelReq;
                  const canLearn = !learned && prereqMet && levelOk && skillPoints >= skill.cost;
                  const locked = !prereqMet || !levelOk;
                  const elemCfg = skill.element ? ELEMENT_CONFIG[skill.element] : { icon: "🛡️", color: "text-gray-400" };
                  const borderColor = learned ? getElemColor(skill.element) : canLearn ? "#a78bfa" : "#444";
                  const bgOpacity = learned ? 0.25 : locked ? 0.05 : 0.12;
                  const isSelected = selectedSkill?.id === skill.id;

                  return (
                    <motion.div
                      key={skill.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: pos.x - NODE_W / 2,
                        top: pos.y - NODE_H / 2,
                        width: NODE_W,
                        height: NODE_H,
                      }}
                      whileHover={{ scale: 1.12, zIndex: 20 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSkill(isSelected ? null : skill)}
                    >
                      {/* Node circle */}
                      <div
                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center relative transition-all ${
                          isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                        }`}
                        style={{
                          border: `2px solid ${borderColor}`,
                          background: `rgba(${learned ? "255,255,255" : "100,100,100"}, ${bgOpacity})`,
                          backdropFilter: "blur(4px)",
                          opacity: locked ? 0.35 : 1,
                        }}
                      >
                        {/* Element icon placeholder */}
                        <span className="text-lg leading-none">{elemCfg.icon}</span>
                        {/* Skill name truncated */}
                        <span className={`text-[8px] font-bold text-center leading-tight mt-0.5 px-0.5 line-clamp-2 ${
                          learned ? "text-white" : locked ? "text-gray-600" : "text-gray-300"
                        }`}>
                          {skill.name}
                        </span>
                        {/* Status indicator */}
                        {learned && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        {!learned && canLearn && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center animate-pulse">
                            <Star className="w-2.5 h-2.5 text-accent-foreground" />
                          </div>
                        )}
                        {locked && !learned && (
                          <div className="absolute -top-1 -right-1">
                            <Lock className="w-3 h-3 text-gray-600" />
                          </div>
                        )}
                        {/* Cost badge */}
                        {!learned && (
                          <span className="absolute -bottom-1 text-[7px] bg-card border border-border rounded px-1 text-muted-foreground">
                            {skill.cost}SP
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                });
              });
            })}
          </div>
        </div>
      </div>

      {/* Skill Detail Panel (shows when a node is clicked) */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border border-border rounded-xl bg-card p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {selectedSkill.element && ELEMENT_CONFIG[selectedSkill.element] && (
                  <span className={`text-xl ${ELEMENT_CONFIG[selectedSkill.element].color}`}>
                    {ELEMENT_CONFIG[selectedSkill.element].icon}
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-sm">{selectedSkill.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>T{selectedSkill.tier} {SKILL_TIERS[selectedSkill.tier]?.label}</span>
                    <span>Lv.{selectedSkill.levelReq}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSkill(null)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-blue-400">{selectedSkill.mp} MP</span>
              <span className="text-gray-400">{selectedSkill.cooldown}T CD</span>
              {selectedSkill.damage > 0 && (
                <span className="text-orange-400">{Math.round(selectedSkill.damage * 100)}% DMG</span>
              )}
              {selectedSkill.element && ELEMENT_CONFIG[selectedSkill.element]?.stat && (
                (() => {
                  const bonus = elemStats[ELEMENT_CONFIG[selectedSkill.element].stat] || 0;
                  return bonus > 0 ? (
                    <span className={`font-bold ${ELEMENT_CONFIG[selectedSkill.element].color}`}>
                      +{bonus}% {ELEMENT_CONFIG[selectedSkill.element].label}
                    </span>
                  ) : null;
                })()
              )}
            </div>

            <p className="text-xs text-muted-foreground">{selectedSkill.description}</p>

            {selectedSkill.synergy && (
              <p className="text-xs text-primary/70 italic">💡 {selectedSkill.synergy}</p>
            )}

            {/* Prerequisites */}
            {selectedSkill.requires && (() => {
              const prereq = skills.find(s => s.id === selectedSkill.requires);
              const met = learnedSkills.includes(selectedSkill.requires);
              return (
                <p className="text-xs">
                  Requires: <span className={met ? "text-green-400" : "text-destructive"}>{prereq?.name || selectedSkill.requires}</span>
                </p>
              );
            })()}

            {/* Learn button */}
            {(() => {
              const learned = learnedSkills.includes(selectedSkill.id);
              const prereqMet = !selectedSkill.requires || learnedSkills.includes(selectedSkill.requires);
              const levelOk = charLevel >= selectedSkill.levelReq;
              const canLearn = !learned && prereqMet && levelOk && skillPoints >= selectedSkill.cost;

              if (learned) return <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Learned</Badge>;
              if (!levelOk) return <p className="text-xs text-destructive">Requires Level {selectedSkill.levelReq}</p>;
              if (!prereqMet) return <p className="text-xs text-destructive">Prerequisite not met</p>;
              if (skillPoints < selectedSkill.cost) return <p className="text-xs text-destructive">Need {selectedSkill.cost - skillPoints} more SP</p>;
              if (canLearn) return (
                <Button
                  size="sm"
                  className="w-full h-7 text-xs gap-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => learnMutation.mutate(selectedSkill)}
                  disabled={learnMutation.isPending}
                >
                  <Zap className="w-3 h-3" /> Learn — {selectedSkill.cost} SP
                </Button>
              );
              return null;
            })()}
          </motion.div>
        )}
      </AnimatePresence>

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
            Learn specific skill combinations to unlock permanent passive bonuses.
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
                    isActive ? "border-amber-500/50 bg-amber-500/10" : "border-gray-700 bg-gray-800/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{syn.icon}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${isActive ? "text-amber-300" : "text-gray-400"}`}>{syn.name}</p>
                      <p className="text-[9px] text-muted-foreground">{syn.buildType} Build</p>
                    </div>
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    ) : (
                      <span className="text-[9px] text-gray-500">{progress}/{syn.requires.length}</span>
                    )}
                  </div>
                  <p className={`text-[10px] mb-1.5 ${isActive ? "text-amber-200" : "text-gray-500"}`}>{syn.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {syn.requires.map(id => {
                      const sk = skills.find(s => s.id === id);
                      const has = learnedSet.has(id);
                      return (
                        <span key={id} className={`text-[8px] px-1.5 py-0.5 rounded border ${
                          has ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-gray-700 text-gray-500"
                        }`}>{sk?.name || id}</span>
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
              Equip multiple skills of the same element for stacking bonuses.
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
