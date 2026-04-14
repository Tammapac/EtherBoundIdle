import React, { useState, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Lock, CheckCircle2, Sparkles, Flame } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CLASS_SKILLS, SKILL_TIERS, ELEMENT_CONFIG, SKILL_SYNERGIES, getActiveSynergies, ELEMENT_STACK_BONUSES, getElementStackBonuses } from "@/lib/skillData";
import SkillHotbar from "@/components/game/SkillHotbar";

const ELEMENT_ORDER = ["physical", "fire", "ice", "lightning", "poison", "blood", "sand", "arcane"];

const ELEM_BORDER = {
  fire: "#fb923c", ice: "#22d3ee", lightning: "#fde047", poison: "#4ade80",
  blood: "#ef4444", sand: "#fbbf24", arcane: "#c084fc", physical: "#9ca3af", none: "#a78bfa",
};

const EFFECT_LABELS = {
  shield: { icon: "🛡️", label: "Shield" },
  dot: { icon: "🔥", label: "DoT" },
  stun: { icon: "⚡", label: "Stun" },
  slow: { icon: "🌀", label: "Slow" },
  buff: { icon: "✨", label: "Buff" },
};

const NODE_SIZE = 72;
const HALF = NODE_SIZE / 2;
const LINE_WIDTH = 4;
const CUT = 10; // how far lines stop from node center
const H_GAP = 16;
const V_GAP = 120;
const PADDING = 24;

/* ======================
   DFS PATH (from prototype)
====================== */
function getPath(skillId, skills, visited = new Set()) {
  if (visited.has(skillId)) return visited;
  visited.add(skillId);
  const skill = skills.find(s => s.id === skillId);
  if (skill?.requires) getPath(skill.requires, skills, visited);
  return visited;
}

/* ======================
   COMPUTE LAYOUT (dynamic positions from skill data)
====================== */
function computeLayout(filteredSkills) {
  const tiers = {};
  filteredSkills.forEach(s => {
    if (!tiers[s.tier]) tiers[s.tier] = [];
    tiers[s.tier].push(s);
  });

  const tierNums = Object.keys(tiers).map(Number).sort();
  const maxPerRow = Math.max(...tierNums.map(t => tiers[t].length), 1);
  const containerW = Math.max(maxPerRow * (NODE_SIZE + H_GAP) + PADDING * 2, 400) + 200;

  const positions = {};
  tierNums.forEach((tier, tierIdx) => {
    const tierSkills = tiers[tier];
    const count = tierSkills.length;
    const totalW = count * NODE_SIZE + (count - 1) * H_GAP;
    const startX = (containerW - totalW) / 2;

    tierSkills.forEach((skill, i) => {
      positions[skill.id] = {
        x: startX + i * (NODE_SIZE + H_GAP),
        y: PADDING + tierIdx * V_GAP
      };
    });
  });

  const connections = [];
  filteredSkills.forEach(skill => {
    if (skill.requires && positions[skill.requires]) {
      connections.push([skill.requires, skill.id]);
    }
  });

  const containerH = PADDING * 2 + (tierNums.length - 1) * V_GAP + NODE_SIZE;

  return { positions, connections, containerW, containerH, tiers: tierNums };
}

/* ======================
   SKILL NODE (from prototype + game styling)
====================== */
function SkillNode({ skill, learned, canLearn, locked, isSelected, isEquipped, isInPath, onClick, onHover, onLeave }) {
  const elemCfg = skill.element ? ELEMENT_CONFIG[skill.element] : { icon: "⚔️", label: "Physical" };

  // Color priority: hover path > learned > can learn > locked (matches prototype exactly)
  const color = isInPath ? "#38bdf8"
    : learned ? "#facc15"
    : canLearn ? "#a78bfa"
    : "#475569";

  const glow = learned ? "0 0 15px #facc1555"
    : isInPath ? "0 0 12px #38bdf855"
    : "none";

  const frameImg = learned
    ? "/sprites/ui/skill_frame_learned.png"
    : "/sprites/ui/skill_frame_unlearned.png";

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        background: learned ? "#1e293b" : "#080b11",
        opacity: learned ? 1 : 0.6,
        boxShadow: glow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        zIndex: 3,
        color: "white",
        overflow: "visible",
      }}
    >
      {skill.id.startsWith("m_") ? (
        <img src={`/sprites/skills/mage/${skill.id}.png`} alt={skill.name} style={{ width: 69, height: 69, imageRendering: "pixelated", userSelect: "none", position: "relative", zIndex: 1 }} onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = ""; }} />
      ) : null}
      <span style={{ fontSize: 28, userSelect: "none", display: skill.id.startsWith("m_") ? "none" : "", position: "relative", zIndex: 1 }}>{elemCfg.icon}</span>

      {/* Frame overlay — renders ON TOP of the skill icon */}
      <div style={{
        position: "absolute",
        inset: -10,
        borderImage: `url('${frameImg}') 10 / 10px`,
        borderStyle: "solid",
        imageRendering: "pixelated",
        pointerEvents: "none",
        zIndex: 5,
      }} />

      {/* Lock overlay */}
      {locked && !learned && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 6,
          background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 6,
        }}>
          <Lock style={{ width: 20, height: 20, color: "#6b7280" }} />
        </div>
      )}

      {/* Can learn pulse */}
      {canLearn && !learned && (
        <div style={{
          position: "absolute", top: -6, right: -6,
          width: 18, height: 18, borderRadius: "50%",
          background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center",
          animation: "pulse 2s infinite",
          zIndex: 7,
        }}>
          <Star style={{ width: 11, height: 11, color: "white" }} />
        </div>
      )}

      {/* Equipped badge */}
      {isEquipped && (
        <div style={{
          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
          padding: "1px 6px", borderRadius: 4,
          background: "rgba(139,92,246,0.8)", fontSize: 8, fontWeight: "bold", color: "white",
          zIndex: 7,
        }}>EQ</div>
      )}
    </div>
  );
}

/* ======================
   CONNECTION LINES (from prototype - 3 segment SVG)
====================== */
function ConnectionLines({ positions, connections, learnedSkills, hoverPath }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      {connections.map(([a, b]) => {
        const from = positions[a];
        const to = positions[b];
        if (!from || !to) return null;

        const x1 = from.x + HALF;
        const y1 = from.y + HALF;
        const x2 = to.x + HALF;
        const y2 = to.y + HALF;

        const midY = y1 + (y2 - y1) / 2;

        // CUT OFF near nodes (lines stop 10px from center)
        const y1c = y1 + CUT;
        const y2c = y2 - CUT;

        const parentLearned = learnedSkills.includes(a);
        const childLearned = learnedSkills.includes(b);
        const isHover = hoverPath.has(a) && hoverPath.has(b);

        const color = isHover ? "#38bdf8"
          : parentLearned && childLearned ? "#facc15"
          : "#475569";

        const glow = isHover || (parentLearned && childLearned);

        const path = `M ${x1} ${y1c} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2c}`;

        return (
          <g key={a + b}>
            {glow && (
              <path d={path} stroke={color} strokeWidth={10} opacity={0.15} fill="none" />
            )}
            <path d={path} stroke={color} strokeWidth={LINE_WIDTH} fill="none" />
            {/* Junction circle at bend point */}
            <circle cx={x2} cy={midY} r={4} fill={color} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
}

/* ======================
   SKILL PREVIEW (left panel)
====================== */
function SkillPreview({ skill, skills, learnedSkills, skillPoints, charLevel, onLearn, isPending }) {
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
        <div className="w-[72px] h-[72px] flex items-center justify-center"
          style={{ position: "relative", background: learned ? "#1e293b" : "#080b11", overflow: "visible" }}>
          {skill.id.startsWith("m_") ? (
            <img src={`/sprites/skills/mage/${skill.id}.png`} alt={skill.name} style={{ width: 69, height: 69, imageRendering: "pixelated", position: "relative", zIndex: 1 }} onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = ""; }} />
          ) : null}
          <span className="text-3xl" style={{ display: skill.id.startsWith("m_") ? "none" : "", position: "relative", zIndex: 1 }}>{elemCfg.icon}</span>
          <div style={{
            position: "absolute", inset: -10,
            borderImage: `url('/sprites/ui/${learned ? "skill_frame_learned" : "skill_frame_unlearned"}.png') 10 / 10px`,
            borderStyle: "solid", imageRendering: "pixelated", pointerEvents: "none", zIndex: 5,
          }} />
        </div>
        <h3 className="font-bold text-base">{skill.name}</h3>
        <p className="text-xs text-muted-foreground">
          <span className={SKILL_TIERS[skill.tier]?.color}>T{skill.tier}</span> · {ELEMENT_CONFIG[skill.element]?.label || "Physical"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div className="bg-white/5 rounded px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Damage</span>
          {skill.damage > 0 ? <span className="text-orange-400 font-bold">{Math.round(skill.damage * 100)}% weapon dmg</span> : skill.special === "heal" || skill.special === "group_heal" ? <span className="text-green-400 font-bold">Heal {Math.round((skill.healPct || 0.2) * 100)}% HP</span> : skill.special === "shield" ? <span className="text-cyan-400 font-bold">Shield {Math.round((skill.shieldPct || 0.25) * 100)}% HP</span> : skill.special === "mana" ? <span className="text-indigo-400 font-bold">Restore {Math.round((skill.manaPct || 0.2) * 100)}% MP</span> : skill.buffEffect ? <span className="text-amber-400 font-bold">Buff ({skill.buffDuration || 3} turns)</span> : <span className="text-blue-300 font-bold">Utility</span>}
        </div>
        <div className="bg-white/5 rounded px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Mana Cost</span>
          <span className="text-blue-400 font-bold">{skill.mp} MP per use</span>
        </div>
        <div className="bg-white/5 rounded px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Cooldown</span>
          <span className="text-gray-300 font-bold">{skill.cooldown} {skill.cooldown === 1 ? "turn" : "turns"}</span>
        </div>
        <div className="bg-white/5 rounded px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Skill Points</span>
          <span className="text-amber-400 font-bold">{skill.cost} SP to learn</span>
        </div>
      </div>

      {skill.buffEffect && (
        <div className="text-xs px-2.5 py-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <span className="text-gray-500 text-[10px] block mb-0.5">Buff Effects</span>
          {Object.entries(skill.buffEffect).map(([k, v]) => (
            <span key={k} className="mr-2">+{v}% {k === "atk_pct" ? "Attack" : k === "def_pct" ? "Defense" : k === "crit_pct" ? "Crit Chance" : k === "block_pct" ? "Block" : k === "atk_speed" ? "Speed" : k === "evasion" ? "Evasion" : k.replace(/_/g, " ")}</span>
          ))}
          <span className="text-gray-500 ml-1">for {skill.buffDuration || 3} turns</span>
        </div>
      )}

      {skill.statScale && (
        <div className="text-xs px-2.5 py-1.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300">
          Scales with: <span className="font-bold capitalize">{skill.statScale}</span>
        </div>
      )}

      {effectInfo && (
        <div className="text-xs px-2.5 py-2 rounded bg-white/5 border border-white/10 text-gray-200">
          {skill.effect.type === "shield" && `🛡️ ${skill.effect.value}% max HP shield ${skill.effect.duration}T`}
          {skill.effect.type === "dot" && `🔥 ${skill.effect.value}% dmg/turn ${skill.effect.duration}T`}
          {skill.effect.type === "stun" && `⚡ Stun ${skill.effect.duration}T`}
          {skill.effect.type === "slow" && `🌀 +50% dmg taken ${skill.effect.duration}T`}
          {skill.effect.type === "buff" && `✨ +${skill.effect.value}% ${skill.effect.stat?.toUpperCase()} ${skill.effect.duration}T`}
        </div>
      )}

      <p className="text-xs text-white leading-relaxed line-clamp-3">{skill.description}</p>

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

/* ======================
   SYNERGY PANEL (right panel)
====================== */
function SynergyPanel({ charClass, skills, learnedSkills, equippedSkills }) {
  const allSynergies = SKILL_SYNERGIES[charClass] || [];
  const activeSynergies = getActiveSynergies(charClass, learnedSkills, equippedSkills);
  const learnedSet = new Set(learnedSkills);
  if (allSynergies.length === 0) return null;

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-2">
      <h3 className="font-orbitron font-bold text-sm text-amber-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Synergies
        <span className="text-xs text-amber-500/60 ml-auto">{activeSynergies.length}/{allSynergies.length}</span>
      </h3>
      <div className="grid grid-cols-2 gap-1.5 max-h-[70vh] overflow-y-auto scrollbar-hide">
        {allSynergies.map(syn => {
          const isActive = activeSynergies.some(a => a.id === syn.id);
          const progress = syn.requires.filter(id => learnedSet.has(id)).length;
          return (
            <div key={syn.id} className={`p-2 rounded-lg border ${isActive ? "border-amber-500/40 bg-amber-500/10" : "border-gray-700/30 opacity-50"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{syn.icon}</span>
                <span className={`text-xs font-bold flex-1 truncate ${isActive ? "text-amber-300" : "text-gray-500"}`}>{syn.name}</span>
                {isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> : <span className="text-[10px] text-gray-500 font-bold">{progress}/{syn.requires.length}</span>}
              </div>
              <p className={`text-[11px] leading-snug ${isActive ? "text-amber-200/70" : "text-gray-600"}`}>{syn.description}</p>
              <div className="flex gap-1 flex-wrap mt-1">
                {syn.requires.map(id => {
                  const sk = skills.find(s => s.id === id);
                  const has = learnedSet.has(id);
                  return <span key={id} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${has ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>{sk?.name || id}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================
   MAIN COMPONENT
====================== */
export default function SkillTree({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeElement, setActiveElement] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [hoveredSkillId, setHoveredSkillId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [showSynergyMobile, setShowSynergyMobile] = useState(false);

  // Drag-to-pan state
  const treeContainerRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const onDragStart = useCallback((e) => {
    if (!treeContainerRef.current) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX || e.touches?.[0]?.clientX || 0,
      y: e.clientY || e.touches?.[0]?.clientY || 0,
      scrollLeft: treeContainerRef.current.scrollLeft,
      scrollTop: treeContainerRef.current.scrollTop,
    };
    treeContainerRef.current.style.cursor = "grabbing";
  }, []);

  const onDragMove = useCallback((e) => {
    if (!isDragging.current || !treeContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const y = e.clientY || e.touches?.[0]?.clientY || 0;
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;
    treeContainerRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    treeContainerRef.current.scrollTop = dragStart.current.scrollTop - dy;
  }, []);

  const onDragEnd = useCallback(() => {
    isDragging.current = false;
    if (treeContainerRef.current) treeContainerRef.current.style.cursor = "grab";
  }, []);

  const charClass = character?.class || "warrior";
  const allSkills = CLASS_SKILLS[charClass] || [];
  const learnedSkills = character?.skills || [];
  const skillPoints = character?.skill_points || 0;
  const charLevel = character?.level || 1;
  const equippedSkills = character?.hotbar_skills || [];

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

  // Filter skills by active element
  const filteredSkills = useMemo(() => {
    if (!activeElement) return allSkills;
    return allSkills.filter(s => (s.element || "none") === activeElement);
  }, [allSkills, activeElement]);

  // Compute layout positions + connections
  const { positions, connections, containerW, containerH } = useMemo(
    () => computeLayout(filteredSkills),
    [filteredSkills]
  );

  // Hover path (DFS up the prereq chain)
  const hoverPath = useMemo(() => {
    if (!hoveredSkillId) return new Set();
    return getPath(hoveredSkillId, filteredSkills);
  }, [hoveredSkillId, filteredSkills]);

  // Available elements
  const availableElements = useMemo(() => {
    const elems = new Set();
    for (const s of allSkills) elems.add(s.element || "none");
    return ELEMENT_ORDER.filter(e => elems.has(e)).concat(elems.has("none") ? ["none"] : []);
  }, [allSkills]);

  // Count learned per element
  const elemCounts = useMemo(() => {
    const counts = {};
    for (const e of availableElements) {
      const es = allSkills.filter(s => (s.element || "none") === e);
      counts[e] = { total: es.length, learned: es.filter(s => learnedSkills.includes(s.id)).length };
    }
    return counts;
  }, [allSkills, learnedSkills, availableElements]);

  function canUnlock(skill) {
    if (!skill.requires) return true;
    return learnedSkills.includes(skill.requires);
  }

  return (
    <div className="p-2 md:p-3 max-w-[1800px] mx-auto space-y-2">
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
          <Badge variant="outline" className="text-xs">{learnedSkills.length}/{allSkills.length}</Badge>
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
            <SkillPreview skill={selectedSkill} skills={allSkills} learnedSkills={learnedSkills} skillPoints={skillPoints} charLevel={charLevel} onLearn={(s) => learnMutation.mutate(s)} isPending={learnMutation.isPending} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSynergyMobile && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
            <SynergyPanel charClass={charClass} skills={allSkills} learnedSkills={learnedSkills} equippedSkills={equippedSkills} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 3-COLUMN GRID (matching screenshot layout) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-2">

        {/* LEFT: Skill Preview + Element Stacks */}
        <div className="hidden lg:block">
          <div className="sticky top-3 space-y-3">
            <SkillPreview skill={selectedSkill} skills={allSkills} learnedSkills={learnedSkills} skillPoints={skillPoints} charLevel={charLevel} onLearn={(s) => learnMutation.mutate(s)} isPending={learnMutation.isPending} />

            {/* Element Stacks */}
            {(() => {
              const { activeStacks } = getElementStackBonuses(charClass, equippedSkills);
              const ELEM_EMOJIS = { fire: "🔥", ice: "❄️", lightning: "⚡", poison: "☠️", blood: "🩸", sand: "🌪️" };
              const ELEM_COLORS = { fire: "text-orange-400", ice: "text-cyan-400", lightning: "text-yellow-300", poison: "text-green-400", blood: "text-red-400", sand: "text-amber-400" };
              const allElements = Object.keys(ELEMENT_STACK_BONUSES);
              return (
                <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-orbitron font-bold text-base text-violet-400 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Element Stacks
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {allElements.map(element => {
                      const tiers = ELEMENT_STACK_BONUSES[element];
                      const activeStack = activeStacks.find(s => s.element === element);
                      const activeTier = activeStack?.tier || 0;
                      return (
                        <div key={element} className={`rounded-lg p-2 ${activeTier > 0 ? "bg-white/5 border border-white/10" : "bg-black/20 border border-gray-800/50 opacity-40"}`}>
                          <p className={`text-xs font-bold mb-0.5 ${ELEM_COLORS[element]}`}>{ELEM_EMOJIS[element]} {element.charAt(0).toUpperCase() + element.slice(1)}</p>
                          {[2, 3, 4].map(t => {
                            const bonus = tiers[t];
                            if (!bonus) return null;
                            const isActive = activeTier >= t;
                            const bonusStr = Object.entries(bonus).map(([k, v]) => `+${v}% ${k.replace(/_/g, " ")}`).join(", ");
                            return <p key={t} className={`text-[11px] ${isActive ? ELEM_COLORS[element] : "text-gray-600"}`}>{isActive ? "✓" : "○"} {t}x: {bonusStr}</p>;
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

        {/* CENTER: Element Filter + Skill Tree */}
        <div className="space-y-2 min-w-0">
          {/* Element pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <button onClick={() => setActiveElement(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border-2 ${!activeElement ? "border-white/30 bg-white/10 text-white" : "border-transparent bg-white/5 text-gray-500"}`}>
              All
            </button>
            {availableElements.map(elem => {
              const cfg = elem === "none" ? { icon: "✨", label: "Buffs" } : (ELEMENT_CONFIG[elem] || { icon: "⚔️", label: elem });
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

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="px-3 py-1 rounded-lg text-sm font-bold border border-border bg-white/5 text-gray-300 hover:bg-white/10">
              −
            </button>
            <span className="text-xs text-gray-400 font-bold min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className="px-3 py-1 rounded-lg text-sm font-bold border border-border bg-white/5 text-gray-300 hover:bg-white/10">
              +
            </button>
            {zoom !== 1 && (
              <button onClick={() => setZoom(1)}
                className="px-2 py-1 rounded-lg text-xs font-bold border border-border bg-white/5 text-gray-400 hover:bg-white/10">
                Reset
              </button>
            )}
          </div>

          {/* ═══ SKILL TREE (prototype layout) ═══ */}
          <div
            ref={treeContainerRef}
            className="border border-border rounded-xl bg-[#0d0d14] overflow-auto rpg-frame"
            style={{ cursor: "grab" }}
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}>
            <div style={{
              position: "relative",
              width: containerW * zoom,
              height: containerH * zoom,
              margin: "0 auto",
            }}>
            <div style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              position: "relative",
              width: containerW,
              height: containerH,
            }}>
              {/* Connection lines (behind nodes) */}
              <ConnectionLines
                positions={positions}
                connections={connections}
                learnedSkills={learnedSkills}
                hoverPath={hoverPath}
              />

              {/* Skill nodes (absolute positioned) */}
              {filteredSkills.map(skill => {
                const pos = positions[skill.id];
                if (!pos) return null;

                const isLearned = learnedSkills.includes(skill.id);
                const prereqMet = canUnlock(skill);
                const levelOk = charLevel >= skill.levelReq;
                const canLearnThis = !isLearned && prereqMet && levelOk && skillPoints >= skill.cost;
                const isLocked = !prereqMet || !levelOk;
                const isSelected = selectedSkill?.id === skill.id;
                const isInPath = hoverPath.has(skill.id);

                return (
                  <div key={skill.id} style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    zIndex: 2,
                  }}>
                    <SkillNode
                      skill={skill}
                      learned={isLearned}
                      canLearn={canLearnThis}
                      locked={isLocked}
                      isSelected={isSelected}
                      isEquipped={equippedSkills.includes(skill.id)}
                      isInPath={isInPath}
                      onClick={() => setSelectedSkill(isSelected ? null : skill)}
                      onHover={() => setHoveredSkillId(skill.id)}
                      onLeave={() => setHoveredSkillId(null)}
                    />
                    {/* Skill name below node */}
                    <p style={{
                      fontSize: 10,
                      textAlign: "center",
                      fontWeight: "bold",
                      marginTop: 4,
                      width: NODE_SIZE,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: isLearned ? "#e5e7eb" : isLocked ? "#4b5563" : "#9ca3af",
                    }}>
                      {skill.name}
                    </p>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Synergies */}
        <div className="hidden lg:block">
          <div className="sticky top-3">
            <SynergyPanel charClass={charClass} skills={allSkills} learnedSkills={learnedSkills} equippedSkills={equippedSkills} />
          </div>
        </div>
      </div>

      {/* ELEMENT STACKS (mobile only) */}
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
