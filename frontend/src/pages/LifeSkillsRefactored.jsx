import React, { useState } from "react";
import { useUnifiedProgression } from "@/hooks/useUnifiedProgression";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Progress } from "@/components/ui/progress";
import { Leaf, Play, Square, Coins } from "lucide-react";
import { motion } from "framer-motion";

/**
 * REFACTORED LIFE SKILLS PAGE
 * 
 * Uses unified backend progression.
 * Frontend displays state, sends start/stop actions.
 * Backend simulates all progress.
 */

const SKILLS = [
  { type: 'mining', label: 'Mining', icon: '⛏️', color: 'text-orange-400' },
  { type: 'fishing', label: 'Fishing', icon: '🎣', color: 'text-blue-400' },
  { type: 'herbalism', label: 'Herbalism', icon: '🌿', color: 'text-green-400' },
];

export default function LifeSkillsRefactored({ character, onCharacterUpdate }) {
  const { character: progChar, session, actions, isLoading } = useUnifiedProgression(character?.id);
  const [isStarting, setIsStarting] = useState(null);
  const [isStopping, setIsStopping] = useState(null);

  const displayChar = progChar || character;
  const activeSkill = session?.active_skill;
  const skillProgress = session?.skill_progress || 0;

  const handleStart = async (skillType) => {
    setIsStarting(skillType);
    const result = await actions.startSkill(skillType);
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
    setIsStarting(null);
  };

  const handleStop = async () => {
    setIsStopping(true);
    const result = await actions.stopSkill();
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
    setIsStopping(null);
  };

  // Update character when backend state changes
  React.useEffect(() => {
    if (progChar) {
      onCharacterUpdate(progChar);
    }
  }, [progChar?.exp, progChar?.level]);

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
          {(displayChar?.gold || 0).toLocaleString()} Gold
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid sm:grid-cols-3 gap-3">
        {SKILLS.map(skill => (
          <motion.div
            key={skill.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-card border rounded-xl p-4 space-y-3 transition-opacity ${
              activeSkill && activeSkill !== skill.type ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{skill.icon}</span>
              <div>
                <p className={`font-bold ${skill.color}`}>{skill.label}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>

            {/* Progress Bar (if active) */}
            {activeSkill === skill.type ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground">{Math.floor(skillProgress)}%</span>
                </div>
                <Progress value={skillProgress} className="h-2" />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Ready</div>
            )}

            {/* Action Button */}
            {activeSkill === skill.type ? (
              <PixelButton
                variant="cancel"
                label="STOP"
                onClick={handleStop}
                disabled={isLoading || isStopping}
                className="w-full"
              />
            ) : (
              <PixelButton
                variant="ok"
                label="START"
                onClick={() => handleStart(skill.type)}
                disabled={isLoading || isStarting === skill.type || (activeSkill !== null)}
                className="w-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Debug */}
      {isLoading && <p className="text-xs text-muted-foreground text-center">Syncing...</p>}
    </div>
  );
}