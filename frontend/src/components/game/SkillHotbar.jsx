import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import { base44 } from "@/api/base44Client";
import PixelButton from "@/components/game/PixelButton";

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
      onError={e => { e.target.style.display = "none"; }}
    />
  );
}

/**
 * SkillHotbar - shown in SkillTree page. Lets user drag/assign up to 6 skills.
 * Props: character, onCharacterUpdate
 */
export default function SkillHotbar({ character, onCharacterUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localHotbar, setLocalHotbar] = useState(() => character?.hotbar_skills || []);

  const charClass = character?.class || "warrior";
  const allClassSkills = CLASS_SKILLS[charClass] || [];
  const learnedSkills = character?.skills || [];
  const learnedData = learnedSkills
    .map(id => allClassSkills.find(s => s.id === id))
    .filter(Boolean);

  const isOnHotbar = (id) => localHotbar.includes(id);

  const toggleSkill = (id) => {
    setLocalHotbar(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= MAX_HOTBAR) return prev; // already full
      return [...prev, id];
    });
  };

  const saveHotbar = async () => {
    setSaving(true);
    const updated = await base44.entities.Character.update(character.id, { hotbar_skills: localHotbar });
    onCharacterUpdate({ ...character, hotbar_skills: localHotbar });
    setSaving(false);
    setIsEditing(false);
  };

  const hotbarSkillData = localHotbar
    .map(id => allClassSkills.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3 rpg-frame">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Battle Hotbar</span>
          <Badge className="bg-primary/20 text-primary text-xs border-0">
            {localHotbar.length}/{MAX_HOTBAR} slots
          </Badge>
        </div>
        <div className="flex gap-1.5">
          {isEditing ? (
            <>
              <PixelButton variant="ok" label="SAVE" onClick={saveHotbar} disabled={saving} />
              <PixelButton variant="cancel" label="CANCEL" onClick={() => { setIsEditing(false); setLocalHotbar(character?.hotbar_skills || []); }} />
            </>
          ) : (
            <PixelButton variant="ok" label="EDIT HOTBAR" onClick={() => setIsEditing(true)} />
          )}
        </div>
      </div>

      {/* Hotbar slots */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: MAX_HOTBAR }).map((_, i) => {
          const skill = hotbarSkillData[i];
          const elem = skill?.element ? ELEMENT_CONFIG[skill.element] : null;
          return (
            <div
              key={i}
              className={`relative w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all duration-200 ${
                skill
                  ? `border-primary/60 bg-primary/10 ${elem?.color || "text-foreground"} hover:scale-110 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] hover:border-primary`
                  : "border-border/50 bg-muted/20 text-muted-foreground/40"
              }`}
            >
              {skill ? <SkillSprite skill={skill} size={32} /> : <span className="text-base leading-none text-muted-foreground/40">{i + 1}</span>}
              {skill && <span className="text-[8px] text-center leading-none truncate max-w-[44px] px-0.5">{skill.name.split(" ")[0]}</span>}
            </div>
          );
        })}
      </div>

      {isEditing && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">Click learned skills to toggle them on the hotbar (max {MAX_HOTBAR}):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {learnedData.map(skill => {
              const on = isOnHotbar(skill.id);
              const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
              const full = localHotbar.length >= MAX_HOTBAR && !on;
              return (
                <button
                  key={skill.id}
                  disabled={full}
                  onClick={() => toggleSkill(skill.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all duration-200 ${
                    on
                      ? "border-primary/60 bg-primary/15 text-primary hover:scale-105 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                      : full
                        ? "border-border opacity-40 cursor-not-allowed"
                        : "border-border hover:border-primary/40 hover:bg-muted/40 hover:scale-105 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  }`}
                >
                  <SkillSprite skill={skill} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{skill.name}</p>
                    <p className="text-[10px] text-muted-foreground">{skill.mp}MP · {skill.cooldown}T CD</p>
                  </div>
                  {on && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
                </button>
              );
            })}
            {learnedData.length === 0 && (
              <p className="text-xs text-muted-foreground col-span-3 py-4 text-center">Learn skills in the tier panels above first.</p>
            )}
          </div>
        </div>
      )}

      {!isEditing && hotbarSkillData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {hotbarSkillData.map((skill, i) => {
            const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
            return (
              <div key={skill.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">{i + 1}</span>
                <SkillSprite skill={skill} size={20} className="flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{skill.name}</span>
                <span className="text-blue-400 flex-shrink-0">{skill.mp}MP</span>
                <span className="flex-shrink-0">{skill.cooldown}T CD</span>
                {skill.damage > 0 && <span className="text-orange-400 flex-shrink-0">{Math.round(skill.damage * 100)}%</span>}
                {elem && <span className={`flex-shrink-0 ${elem.color}`}>{elem.icon} {elem.label}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}