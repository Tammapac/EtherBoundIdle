import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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

/* ─── Single Skill Node (square icon tile) ─── */
function SkillNode({ skill, learned, canLearn, locked, isSelected, isEquipped, onClick, nodeRef }) {
  const elemCfg = skill.element ? ELEMENT_CONFIG[skill.element] : { icon: "⚔️", label: "Physical" };
  const elemColor = ELEM_BORDER[skill.element] || ELEM_BORDER.physical;
  const effectInfo = skill.effect ? EFFECT_LABELS[skill.effect.type] : null;

  // Border style
  const borderColor = learned ? elemColor : canLearn ? "#a78bfa" : "#3a3a44";
  const bgColor = learned ? `${elemColor}15` : canLearn ? "#a78bfa10" : "#12121a";
  const glowShadow = learned
    ? `0 0 12px ${elemColor}44, inset 0 0 8px ${elemColor}22`
    : canLearn
    ? "0 0 10px #a78bfa33"
    : "none";

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 88 }} ref={nodeRef}>
      {/* The square node */}
      <div
        onClick={onClick}
        className={`relative w-[72px] h-[72px] rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center ${
          isSelected ? "scale-110" : "hover:scale-105"
        }`}
        style={{
          border: `3px solid ${borderColor}`,
          background: bgColor,
          boxShadow: isSelected ? `0 0 16px ${elemColor}66, ${glowShadow}` : glowShadow,
        }}
      >
        {/* Icon */}
        <span className="text-4xl select-none">{elemCfg.icon}</span>

        {/* Lock overlay */}
        {locked && !learned && (
          <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
        )}

        {/* Can learn pulse indicator */}
        {canLearn && !learned && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center animate-pulse shadow-lg shadow-violet-500/50">
            <Star className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Learned checkmark */}
        {learned && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Equipped badge */}
        {isEquipped && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-primary/80 text-[8px] font-bold text-white">
            EQ
          </div>
        )}

        {/* Effect type badge */}
        {effectInfo && learned && (
          <div className="absolute -bottom-1.5 -left-1.5 text-sm bg-black/80 rounded px-1">
            {effectInfo.icon}
          </div>
        )}
      </div>

      {/* Skill name below */}
      <p className={`text-xs text-center leading-tight font-bold truncate w-full ${
        learned ? "text-gray-200" : locked ? "text-gray-600" : "text-gray-400"
      }`}>
        {skill.name}
      </p>
    </div>
  );
}

/* ─── SVG Connection Lines Overlay ─── */
function ConnectionLines({ skills, learnedSkills, nodeRefs, containerRef, activeElement }) {
  const [lines, setLines] = useState([]);

  const calcLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];

    for (const skill of skills) {
      if (!skill.requires) continue;
      const parentSkill = skills.find(s => s.id === skill.requires);
      if (!parentSkill) continue;

      // Filter: only show connections when BOTH nodes are visible in current filter
      if (activeElement) {
        if ((skill.element || "none") !== activeElement) continue;
        if ((parentSkill.element || "none") !== activeElement) continue;
      }

      const fromEl = nodeRefs.current[skill.requires];
      const toEl = nodeRefs.current[skill.id];
      if (!fromEl || !toEl) continue;

      // Check both nodes are actually in the DOM (not stale refs from previous filter)
      if (!fromEl.isConnected || !toEl.isConnected) continue;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      // Skip if either node has zero size (hidden)
      if (fromRect.width === 0 || toRect.width === 0) continue;

      // Center of the 72px icon square (icon sits at top of container)
      const iconSize = 72;
      const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
      const y1 = fromRect.top + iconSize / 2 - containerRect.top;
      const x2 = toRect.left + toRect.width / 2 - containerRect.left;
      const y2 = toRect.top + iconSize / 2 - containerRect.top;

      const parentLearned = learnedSkills.includes(skill.requires);
      const childLearned = learnedSkills.includes(skill.id);
      const bothLearned = parentLearned && childLearned;
      const elemColor = ELEM_BORDER[skill.element] || "#555";

      newLines.push({ x1, y1, x2, y2, bothLearned, parentLearned, elemColor, id: `${skill.requires}-${skill.id}` });
    }
    setLines(newLines);
  }, [skills, learnedSkills, nodeRefs, containerRef, activeElement]);

  useEffect(() => {
    calcLines();
    const observer = new ResizeObserver(calcLines);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calcLines]);

  useEffect(() => { calcLines(); }, [learnedSkills, activeElement, calcLines]);

  if (lines.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {lines.map(line => {
        const color = line.bothLearned ? line.elemColor : line.parentLearned ? `${line.elemColor}88` : "#64748b";
        const width = 4;
        const glow = line.bothLearned ? line.elemColor : "none";

        // Horizontal-first L-shape: horizontal at parent Y, then vertical down to child
        const path = `M${line.x1},${line.y1} L${line.x2},${line.y1} L${line.x2},${line.y2}`;

        return (
          <g key={line.id}>
            {line.bothLearned && (
              <path d={path} fill="none" stroke={glow} strokeWidth={10} strokeOpacity={0.2} />
            )}
            <path d={path} fill="none" stroke={color} strokeWidth={width}
              strokeDasharray={line.parentLearned ? "none" : "6 4"} />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Skill Preview (Left Panel) ─── */
function SkillPreview({ skill, skills, learnedSkills, skillPoints, charLevel, elemStats, onLearn, isPending }) {
  if (!skill) {
    return (
      <div className="border border-border/50 rounded-xl bg-black/30 p-4 flex flex-col items-center justify-center text-center h-[160px]">
        <Zap className="w-7 h-7 text-gray-600 mb-2" />
        <p className="text-sm text-gray-500">Click a skill to preview</p>
      </div>
    );
  }

  const elemCfg = skill.element ? ELEMENT_CONFIG[skill.element] : { icon: "⚔️", label: "Utility", color: "text-gray-400" };
  const elemColor = ELEM_BORDER[skill.element] || ELEM_BORDER.physical;
  const effectInfo = skill.effect ? EFFECT_LABELS[skill.effect.type] : null;
  const learned = learnedSkills.includes(skill.id);
  const prereqMet = !skill.requires || learnedSkills.includes(skill.requires);
  const levelOk = charLevel >= skill.levelReq;
  const canLearn = !learned && prereqMet && levelOk && skillPoints >= skill.cost;

  return (
    <div className="border rounded-xl bg-black/30 p-4 space-y-2.5" style={{ borderColor: `${elemColor}55` }}>
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-[64px] h-[64px] rounded-lg flex items-center justify-center"
          style={{ border: `3px solid ${elemColor}`, background: `${elemColor}15`, boxShadow: `0 0 14px ${elemColor}44` }}>
          <span className="text-3xl">{elemCfg.icon}</span>
        </div>
        <h3 className="font-bold text-base">{skill.name}</h3>
        <p className="text-xs text-muted-foreground">
          <span className={SKILL_TIERS[skill.tier]?.color}>T{skill.tier}</span> · {ELEMENT_CONFIG[skill.element]?.label || "Physical"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-sm">
        <div className="bg-white/5 rounded px-2 py-1.5 text-center">
          {skill.damage > 0 ? <span className="text-orange-400 font-bold">{Math.round(skill.damage * 100)}%</span> : <span className="text-blue-300 font-bold">Utility</span>}
        </div>
        <div className="bg-white/5 rounded px-2 py-1.5 text-center"><span className="text-blue-400 font-bold">{skill.mp} MP</span></div>
        <div className="bg-white/5 rounded px-2 py-1.5 text-center"><span className="text-gray-400">{skill.cooldown}T CD</span></div>
        <div className="bg-white/5 rounded px-2 py-1.5 text-center"><span className="text-amber-400">{skill.cost} SP</span></div>
      </div>

      {effectInfo && (
        <div className="text-xs px-2.5 py-2 rounded bg-white/5 border border-white/10 text-gray-200">
          {skill.effect.type === "shield" && `🛡️ ${skill.effect.value}% max HP shield ${skill.effect.duration}T`}
          {skill.effect.type === "dot" && `🔥 ${skill.effect.value}% dmg/turn ${skill.effect.duration}T`}
          {skill.effect.type === "stun" && `⚡ Stun ${skill.effect.duration}T`}
          {skill.effect.type === "slow" && `🌀 +50% dmg taken ${skill.effect.duration}T`}
          {skill.effect.type === "buff" && `✨ +${skill.effect.value}% ${skill.effect.stat?.toUpperCase()} ${skill.effect.duration}T`}
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{skill.description}</p>

      {skill.requires && (() => {
        const prereq = skills.find(s => s.id === skill.requires);
        const met = learnedSkills.includes(skill.requires);
        return <p className="text-xs">Requires: <span className={`font-bold ${met ? "text-emerald-400" : "text-red-400"}`}>{prereq?.name || skill.requires}</span></p>;
      })()}

      {learned ? (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs w-full justify-center py-1">Learned</Badge>
      ) : canLearn ? (
        <Button size="sm" className="w-full h-9 text-sm gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold" onClick={() => onLearn(skill)} disabled={isPending}>
          <Zap className="w-4 h-4" /> Learn — {skill.cost} SP
        </Button>
      ) : !levelOk ? (
        <p className="text-xs text-red-400 text-center font-bold">Requires Lv.{skill.levelReq}</p>
      ) : !prereqMet ? (
        <p className="text-xs text-red-400 text-center font-bold">Prerequisite not met</p>
      ) : skillPoints < skill.cost ? (
        <p className="text-xs text-red-400 text-center font-bold">Need {skill.cost - skillPoints} more SP</p>
      ) : null}
    </div>
  );
}

/* ─── Synergy Panel (Right Panel) ─── */
function SynergyPanel({ charClass, skills, learnedSkills, equippedSkills }) {
  const allSynergies = SKILL_SYNERGIES[charClass] || [];
  const activeSynergies = getActiveSynergies(charClass, learnedSkills, equippedSkills);
  const learnedSet = new Set(learnedSkills);
  if (allSynergies.length === 0) return null;

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-2.5">
      <h3 className="font-orbitron font-bold text-sm text-amber-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Synergies
        <span className="text-xs text-amber-500/60 ml-auto">{activeSynergies.length}/{allSynergies.length}</span>
      </h3>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto scrollbar-hide">
        {allSynergies.map(syn => {
          const isActive = activeSynergies.some(a => a.id === syn.id);
          const progress = syn.requires.filter(id => learnedSet.has(id)).length;
          return (
            <div key={syn.id} className={`p-2.5 rounded-lg border ${isActive ? "border-amber-500/40 bg-amber-500/10" : "border-gray-700/30 opacity-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{syn.icon}</span>
                <span className={`text-xs font-bold flex-1 truncate ${isActive ? "text-amber-300" : "text-gray-500"}`}>{syn.name}</span>
                {isActive ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <span className="text-[10px] text-gray-500 font-bold">{progress}/{syn.requires.length}</span>}
              </div>
              <p className={`text-[11px] leading-relaxed ${isActive ? "text-amber-200/70" : "text-gray-600"}`}>{syn.description}</p>
              <div className="flex gap-1 flex-wrap mt-1.5">
                {syn.requires.map(id => {
                  const sk = skills.find(s => s.id === id);
                  const has = learnedSet.has(id);
                  return <span key={id} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${has ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>{sk?.name || id}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SkillTree({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeElement, setActiveElement] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [showSynergyMobile, setShowSynergyMobile] = useState(false);
  const treeContainerRef = useRef(null);
  const nodeRefs = useRef({});

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

  // Group skills by tier
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

  const getFilteredSkills = (tierSkills) => {
    if (!activeElement) return tierSkills;
    return tierSkills.filter(s => (s.element || "none") === activeElement);
  };

  return (
    <div className="p-2 md:p-3 max-w-7xl mx-auto space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Skill Tree
          </h2>
          <p className="text-xs text-muted-foreground capitalize">{charClass} · Lv.{charLevel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 text-sm px-3 py-1">
            <Star className="w-3.5 h-3.5" /> {skillPoints} SP
          </Badge>
          <Badge variant="outline" className="text-xs">{learnedSkills.length}/{skills.length}</Badge>
        </div>
      </div>

      <SkillHotbar character={character} onCharacterUpdate={onCharacterUpdate} />

      {/* Mobile toggles */}
      <div className="flex gap-2 lg:hidden">
        <button onClick={() => { setShowPreviewMobile(!showPreviewMobile); setShowSynergyMobile(false); }}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border ${showPreviewMobile ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
          <Zap className="w-3.5 h-3.5" /> Preview
        </button>
        <button onClick={() => { setShowSynergyMobile(!showSynergyMobile); setShowPreviewMobile(false); }}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border ${showSynergyMobile ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground"}`}>
          <Sparkles className="w-3.5 h-3.5" /> Synergies
        </button>
      </div>

      <AnimatePresence>
        {showPreviewMobile && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
            <SkillPreview skill={selectedSkill} skills={skills} learnedSkills={learnedSkills} skillPoints={skillPoints} charLevel={charLevel} elemStats={elemStats} onLearn={(s) => learnMutation.mutate(s)} isPending={learnMutation.isPending} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSynergyMobile && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
            <SynergyPanel charClass={charClass} skills={skills} learnedSkills={learnedSkills} equippedSkills={equippedSkills} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 3-COLUMN LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-2">

        {/* LEFT: Skill Preview + Element Stacks */}
        <div className="hidden lg:block">
          <div className="sticky top-3 space-y-3">
            <SkillPreview skill={selectedSkill} skills={skills} learnedSkills={learnedSkills} skillPoints={skillPoints} charLevel={charLevel} elemStats={elemStats} onLearn={(s) => learnMutation.mutate(s)} isPending={learnMutation.isPending} />

            {/* Element Stacks (left panel) */}
            {(() => {
              const { activeStacks } = getElementStackBonuses(charClass, equippedSkills);
              const ELEM_EMOJIS = { fire: "🔥", ice: "❄️", lightning: "⚡", poison: "☠️", blood: "🩸", sand: "🌪️" };
              const ELEM_COLORS = { fire: "text-orange-400", ice: "text-cyan-400", lightning: "text-yellow-300", poison: "text-green-400", blood: "text-red-400", sand: "text-amber-400" };
              const allElements = Object.keys(ELEMENT_STACK_BONUSES);
              return (
                <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-3 space-y-2">
                  <h3 className="font-orbitron font-bold text-xs text-violet-400 flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5" /> Element Stacks
                  </h3>
                  <div className="space-y-1.5">
                    {allElements.map(element => {
                      const tiers = ELEMENT_STACK_BONUSES[element];
                      const activeStack = activeStacks.find(s => s.element === element);
                      const activeTier = activeStack?.tier || 0;
                      return (
                        <div key={element} className={`rounded-lg p-2 ${activeTier > 0 ? "bg-white/5 border border-white/10" : "bg-black/20 border border-gray-800/50 opacity-40"}`}>
                          <p className={`text-[11px] font-bold mb-0.5 ${ELEM_COLORS[element]}`}>{ELEM_EMOJIS[element]} {element.charAt(0).toUpperCase() + element.slice(1)}</p>
                          {[2, 3, 4].map(t => {
                            const bonus = tiers[t];
                            if (!bonus) return null;
                            const isActive = activeTier >= t;
                            const bonusStr = Object.entries(bonus).map(([k, v]) => `+${v}% ${k.replace(/_/g, " ")}`).join(", ");
                            return <p key={t} className={`text-[10px] ${isActive ? ELEM_COLORS[element] : "text-gray-600"}`}>{isActive ? "✓" : "○"} {t}x: {bonusStr}</p>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* CENTER: Element Filter + Skill Tree Grid */}
        <div className="space-y-2 min-w-0">
          {/* Element pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <button onClick={() => setActiveElement(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border-2 ${!activeElement ? "border-white/30 bg-white/10 text-white" : "border-transparent bg-white/5 text-gray-500"}`}>
              All
            </button>
            {availableElements.map(elem => {
              const cfg = ELEMENT_CONFIG[elem] || { icon: "⚔️", label: elem };
              const c = elemCounts[elem] || { total: 0, learned: 0 };
              const isActive = activeElement === elem;
              const color = ELEM_BORDER[elem] || "#666";
              return (
                <button key={elem} onClick={() => setActiveElement(isActive ? null : elem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
                  style={{ border: `2px solid ${isActive ? color : "transparent"}`, background: isActive ? `${color}22` : "rgba(255,255,255,0.03)", color: isActive ? color : "#777" }}>
                  <span className="text-base">{cfg.icon}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                  <span style={{ opacity: 0.5 }}>{c.learned}/{c.total}</span>
                </button>
              );
            })}
          </div>

          {/* ── SKILL TREE: Tier rows with nodes and connecting lines ── */}
          <div className="border border-border rounded-xl bg-[#0d0d14] p-3 relative" ref={treeContainerRef}>
            {/* SVG connection lines */}
            <ConnectionLines
              skills={skills}
              learnedSkills={learnedSkills}
              nodeRefs={nodeRefs}
              containerRef={treeContainerRef}
              activeElement={activeElement}
            />
            {[1, 2, 3, 4, 5, 6].map((tier, tierIdx) => {
              const meta = SKILL_TIERS[tier];
              const tierUnlocked = charLevel >= meta.levelReq;
              const filtered = getFilteredSkills(tierGroups[tier] || []);
              const tierLearned = filtered.filter(s => learnedSkills.includes(s.id)).length;

              if (filtered.length === 0) return null;

              return (
                <React.Fragment key={tier}>
                  {/* Tier label */}
                  <div className="flex items-center gap-2 mb-3 mt-2" style={{ position: "relative", zIndex: 2 }}>
                    <span className={`text-xs font-orbitron font-bold px-2 py-0.5 rounded ${meta.color}`}>T{tier}</span>
                    <span className={`text-sm font-bold ${tierUnlocked ? "text-gray-200" : "text-gray-600"}`}>{meta.label}</span>
                    {!tierUnlocked && <Lock className="w-3.5 h-3.5 text-gray-600" />}
                    <span className={`text-xs font-bold ml-auto ${tierLearned === filtered.length && filtered.length > 0 ? "text-emerald-400" : "text-gray-600"}`}>{tierLearned}/{filtered.length}</span>
                  </div>

                  {/* Skill nodes grid */}
                  <div className="flex flex-wrap justify-center gap-4 mb-3" style={{ position: "relative", zIndex: 3 }}>
                    {filtered.map(skill => {
                      const isLearned = learnedSkills.includes(skill.id);
                      const prereqMet = !skill.requires || learnedSkills.includes(skill.requires);
                      const levelOk = charLevel >= skill.levelReq;
                      const canLearnThis = !isLearned && prereqMet && levelOk && skillPoints >= skill.cost;
                      const isLocked = !prereqMet || !levelOk;
                      const isSelected = selectedSkill?.id === skill.id;

                      return (
                        <SkillNode
                          key={skill.id}
                          skill={skill}
                          learned={isLearned}
                          canLearn={canLearnThis}
                          locked={isLocked}
                          isSelected={isSelected}
                          isEquipped={equippedSkills.includes(skill.id)}
                          onClick={() => setSelectedSkill(isSelected ? null : skill)}
                          nodeRef={(el) => { if (el) nodeRefs.current[skill.id] = el; }}
                        />
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Synergies */}
        <div className="hidden lg:block">
          <div className="sticky top-3">
            <SynergyPanel charClass={charClass} skills={skills} learnedSkills={learnedSkills} equippedSkills={equippedSkills} />
          </div>
        </div>
      </div>

      {/* ELEMENT STACKS (mobile only — on desktop it's in left panel) */}
      <div className="lg:hidden">
        {(() => {
          const { activeStacks } = getElementStackBonuses(charClass, equippedSkills);
          const ELEM_EMOJIS = { fire: "🔥", ice: "❄️", lightning: "⚡", poison: "☠️", blood: "🩸", sand: "🌪️" };
          const ELEM_COLORS = { fire: "text-orange-400", ice: "text-cyan-400", lightning: "text-yellow-300", poison: "text-green-400", blood: "text-red-400", sand: "text-amber-400" };
          const allElements = Object.keys(ELEMENT_STACK_BONUSES);
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
                      <p className={`text-[11px] font-bold mb-0.5 ${ELEM_COLORS[element]}`}>{ELEM_EMOJIS[element]} {element.charAt(0).toUpperCase() + element.slice(1)}</p>
                      {[2, 3, 4].map(t => {
                        const bonus = tiers[t];
                        if (!bonus) return null;
                        const isActive = activeTier >= t;
                        const bonusStr = Object.entries(bonus).map(([k, v]) => `+${v}% ${k.replace(/_/g, " ")}`).join(", ");
                        return <p key={t} className={`text-[10px] ${isActive ? ELEM_COLORS[element] : "text-gray-600"}`}>{isActive ? "✓" : "○"} {t}x: {bonusStr}</p>;
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
