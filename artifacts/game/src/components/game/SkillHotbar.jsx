import React, { useState, useRef } from "react";
import { Zap, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import { base44 } from "@/api/base44Client";

const MAX_HOTBAR = 6;

function getSpriteFolder(skillId) {
  if (!skillId) return null;
  if (skillId.startsWith("m_")) return "mage";
  if (skillId.startsWith("w_")) return "warrior";
  if (skillId.startsWith("ro_")) return "rogue";
  if (skillId.startsWith("r_")) return "ranger";
  return null;
}

function SkillSprite({ skill, size = 32, className = "" }) {
  const folder = getSpriteFolder(skill?.id);
  if (!folder) {
    const elem = skill?.element ? ELEMENT_CONFIG[skill.element] : null;
    return <span className={`leading-none ${className}`}>{elem?.icon || "⚔️"}</span>;
  }
  return (
    <img
      src={`/sprites/skills/${folder}/${skill.id}.png`}
      alt={skill.name}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      className={className}
      draggable={false}
      onError={e => { e.target.style.display = "none"; }}
    />
  );
}

/**
 * SkillHotbar - shown in SkillTree page. Drag-and-drop:
 *   · Drag a learned skill onto a hotbar slot to assign it
 *   · Drag a hotbar skill onto another slot to swap/move
 *   · Drag a hotbar skill out onto the learned list to remove it
 *   · Clicking a learned skill toggles it on/off the hotbar
 * Props: character, onCharacterUpdate
 */
export default function SkillHotbar({ character, onCharacterUpdate }) {
  const [hotbar, setHotbar] = useState(() => {
    const src = character?.hotbar_skills || [];
    return [...src, ...Array(MAX_HOTBAR - src.length).fill(null)].slice(0, MAX_HOTBAR);
  });
  const [dragState, setDragState] = useState(null); // { from: "slot" | "pool", skillId, slotIndex? }
  const [overSlot, setOverSlot] = useState(null);
  const savingRef = useRef(false);

  // Sync local state when character prop changes
  React.useEffect(() => {
    const src = character?.hotbar_skills || [];
    setHotbar([...src, ...Array(MAX_HOTBAR - src.length).fill(null)].slice(0, MAX_HOTBAR));
  }, [character?.hotbar_skills?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const charClass = character?.class || "warrior";
  const allClassSkills = CLASS_SKILLS[charClass] || [];
  const learnedSkills = character?.skills || [];
  const learnedData = learnedSkills
    .map(id => allClassSkills.find(s => s.id === id))
    .filter(Boolean);

  const compactHotbar = (next) => next.filter(Boolean);
  const filledCount = hotbar.filter(Boolean).length;

  const persist = async (next) => {
    const compact = compactHotbar(next);
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await base44.entities.Character.update(character.id, { hotbar_skills: compact });
      onCharacterUpdate({ ...character, hotbar_skills: compact });
    } finally {
      savingRef.current = false;
    }
  };

  const applyHotbar = (next) => {
    setHotbar(next);
    persist(next);
  };

  const toggleSkillClick = (skillId) => {
    const idx = hotbar.findIndex(s => s === skillId);
    if (idx >= 0) {
      // remove from hotbar
      const next = [...hotbar];
      next[idx] = null;
      applyHotbar(next);
      return;
    }
    // add to first empty slot
    const empty = hotbar.findIndex(s => s === null);
    if (empty === -1) return; // full
    const next = [...hotbar];
    next[empty] = skillId;
    applyHotbar(next);
  };

  const onDragStart = (e, payload) => {
    setDragState(payload);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", payload.skillId || "");
    } catch {}
  };

  const onDragEnd = () => {
    setDragState(null);
    setOverSlot(null);
  };

  const onSlotDragOver = (e, slotIndex) => {
    if (!dragState) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverSlot(slotIndex);
  };

  const onSlotDragLeave = () => setOverSlot(null);

  const onSlotDrop = (e, slotIndex) => {
    e.preventDefault();
    if (!dragState) return;
    const { from, skillId, slotIndex: fromIndex } = dragState;
    const next = [...hotbar];

    if (from === "pool") {
      // Dragging a learned skill onto slot — replace/assign.
      // If the skill is already elsewhere on the hotbar, clear its old spot.
      const existingIdx = next.findIndex(s => s === skillId);
      if (existingIdx >= 0) next[existingIdx] = null;
      next[slotIndex] = skillId;
    } else if (from === "slot") {
      // Swap between slots
      const target = next[slotIndex];
      next[slotIndex] = next[fromIndex];
      next[fromIndex] = target;
    }
    applyHotbar(next);
    setDragState(null);
    setOverSlot(null);
  };

  const onPoolDrop = (e) => {
    e.preventDefault();
    if (!dragState) return;
    if (dragState.from === "slot") {
      // Remove from hotbar
      const next = [...hotbar];
      next[dragState.slotIndex] = null;
      applyHotbar(next);
    }
    setDragState(null);
    setOverSlot(null);
  };

  const onPoolDragOver = (e) => {
    if (dragState?.from === "slot") e.preventDefault();
  };

  const removeSlot = (slotIndex) => {
    const next = [...hotbar];
    next[slotIndex] = null;
    applyHotbar(next);
  };

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-2 space-y-2 rpg-frame">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-xs">Battle Hotbar</span>
          <Badge className="bg-primary/20 text-primary text-[10px] border-0 px-1.5 py-0">
            {filledCount}/{MAX_HOTBAR} slots
          </Badge>
        </div>
        <span className="text-[10px] text-muted-foreground hidden md:block">Drag skills to assign · drag out to remove</span>
      </div>

      {/* Hotbar slots — always drop targets */}
      <div className="flex gap-1.5 flex-wrap">
        {hotbar.map((skillId, i) => {
          const skill = skillId ? allClassSkills.find(s => s.id === skillId) : null;
          const elem = skill?.element ? ELEMENT_CONFIG[skill.element] : null;
          const isOver = overSlot === i;
          return (
            <div
              key={i}
              draggable={!!skill}
              onDragStart={skill ? (e) => onDragStart(e, { from: "slot", skillId, slotIndex: i }) : undefined}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onSlotDragOver(e, i)}
              onDragLeave={onSlotDragLeave}
              onDrop={(e) => onSlotDrop(e, i)}
              className={`relative w-10 h-10 rounded-lg border-2 flex flex-col items-center justify-center gap-0 text-xs font-bold transition-all duration-150 select-none ${
                isOver
                  ? "border-amber-400 bg-amber-500/20 scale-110"
                  : skill
                    ? `border-primary/60 bg-primary/10 ${elem?.color || "text-foreground"} cursor-grab hover:scale-105 hover:border-primary`
                    : "border-dashed border-border/50 bg-muted/20 text-muted-foreground/40"
              }`}
              title={skill ? `${skill.name} — drag to reorder, drag out to remove` : "Empty slot — drag a skill here"}
            >
              {skill ? (
                <>
                  <SkillSprite skill={skill} size={26} />
                  <span className="text-[7px] text-center leading-none truncate max-w-[36px] px-0.5">{skill.name.split(" ")[0]}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    style={{ opacity: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    tabIndex={-1}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </>
              ) : (
                <span className="text-sm leading-none text-muted-foreground/40">{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Learned-skills pool — always visible, drop target for "remove from hotbar" */}
      <div
        className={`border-t border-border pt-2 space-y-1.5 ${dragState?.from === "slot" ? "bg-red-500/5 rounded" : ""}`}
        onDragOver={onPoolDragOver}
        onDrop={onPoolDrop}
      >
        <p className="text-[10px] text-muted-foreground">
          Learned skills — click to toggle, or drag onto a slot:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {learnedData.map(skill => {
            const on = hotbar.includes(skill.id);
            const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
            const full = filledCount >= MAX_HOTBAR && !on;
            return (
              <div
                key={skill.id}
                draggable
                onDragStart={(e) => onDragStart(e, { from: "pool", skillId: skill.id })}
                onDragEnd={onDragEnd}
                onClick={() => toggleSkillClick(skill.id)}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all select-none cursor-grab ${
                  on
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : full
                      ? "border-border opacity-40 cursor-not-allowed"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
                title={on ? "On hotbar · click to remove" : full ? "Hotbar full" : "Click to add · drag onto a slot"}
              >
                <SkillSprite skill={skill} size={22} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate">{skill.name}</p>
                  <p className="text-[9px] text-muted-foreground">{skill.mp}MP · {skill.cooldown}T {elem ? <span className={elem.color}>{elem.icon}</span> : null}</p>
                </div>
              </div>
            );
          })}
          {learnedData.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-full py-3 text-center">Learn skills in the tier panels above first.</p>
          )}
        </div>
      </div>
    </div>
  );
}
