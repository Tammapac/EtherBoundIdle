import React, { useState, useEffect } from "react";
import { useUnifiedProgression } from "@/hooks/useUnifiedProgression";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Swords, Skull, Heart, Zap,
} from "lucide-react";
import HealthBar from "@/components/game/HealthBar";
import { REGIONS, ENEMIES, CLASSES } from "@/lib/gameData";

/**
 * REFACTORED BATTLE PAGE
 * 
 * Uses unified backend progression.
 * Frontend ONLY displays state and sends actions.
 * NO local timers, NO local damage calculations.
 */

export default function BattleRefactored({ character, onCharacterUpdate }) {
  const { character: progChar, session, isLoading, actions } = useUnifiedProgression(character?.id);
  const [battleLog, setBattleLog] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);

  const region = REGIONS[character?.current_region || "verdant_forest"];
  const charClass = CLASSES[character?.class || "warrior"];

  // Use backend state if available, fallback to props
  const displayChar = progChar || character;
  const activeSkill = session?.active_skill;
  const combatActive = session?.combat_active;
  const combatState = session?.combat_state;

  const addLog = (msg) => setBattleLog(prev => [msg, ...prev.slice(0, 19)]);

  // Spawn new enemy (when not in combat)
  const spawnEnemy = async () => {
    if (!region) return;

    const key = region.enemies[Math.floor(Math.random() * region.enemies.length)];
    const enemyData = ENEMIES[key];

    if (enemyData) {
      const lvlScale = 1 + (displayChar.level - 1) * 0.1;
      const hp = Math.floor(enemyData.baseHp * lvlScale);

      // Start new combat session (backend will handle it)
      await actions.attack(0); // Dummy attack to initialize
      addLog(`⚔️ A wild ${enemyData.name} appears!`);
    }
  };

  // Player attacks
  const handleAttack = async () => {
    if (!combatActive || isAttacking) return;

    setIsAttacking(true);
    const result = await actions.attack(10);

    if (result.success) {
      addLog(`⚔️ Attack for ${result.damage} damage!`);

      if (result.isDead) {
        addLog(`💀 Enemy defeated! +50 EXP +25 Gold`);
        // Will auto-spawn next enemy on next sync
      }
    }

    setIsAttacking(false);
  };

  // Update character when backend state changes
  useEffect(() => {
    if (progChar) {
      onCharacterUpdate(progChar);
    }
  }, [progChar?.exp, progChar?.gold, progChar?.level]);

  if (!displayChar || !region) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xl font-bold">{region.name}</h2>
          <p className="text-xs text-muted-foreground">Level {region.levelRange?.[0]}–{region.levelRange?.[1]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={combatActive ? "default" : "outline"}>
            {combatActive ? "⚔️ IN COMBAT" : "🕐 IDLE"}
          </Badge>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* Player */}
        <motion.div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <img src={`/sprites/class_${displayChar.class || "warrior"}.png`} alt={displayChar.class} className="w-9 h-9" style={{ imageRendering: "pixelated" }} />
            </div>
            <div>
              <p className="font-bold">{displayChar.name}</p>
              <p className="text-xs text-muted-foreground">Lv.{displayChar.level} {charClass.name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <HealthBar current={displayChar.hp || displayChar.max_hp} max={displayChar.max_hp} color="bg-red-500" label="HP" />
            <HealthBar current={displayChar.mp || displayChar.max_mp} max={displayChar.max_mp} color="bg-blue-500" label="MP" />
            <HealthBar current={displayChar.exp} max={displayChar.exp_to_next} color="bg-primary" label="EXP" />
          </div>
        </motion.div>

        {/* VS */}
        <div className="hidden md:flex items-center justify-center">
          <div className="font-orbitron text-2xl font-bold text-primary/50">VS</div>
        </div>

        {/* Enemy */}
        <motion.div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {combatState ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                  <Skull className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="font-bold">{combatState.enemy_name}</p>
                  <p className="text-xs text-muted-foreground">DMG: {combatState.enemy_damage}</p>
                </div>
              </div>
              <HealthBar current={combatState.enemy_hp} max={combatState.enemy_max_hp} color="bg-destructive" label="HP" />
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-3">No enemy</p>
              <Button onClick={spawnEnemy} disabled={isLoading}>
                Spawn Enemy
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Attack Button */}
      <div className="flex gap-2">
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={handleAttack}
          disabled={!combatActive || isAttacking || isLoading}
        >
          <Swords className="w-4 h-4" />
          {isAttacking ? "Attacking..." : "Attack"}
        </Button>
      </div>

      {/* Battle Log */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">BATTLE LOG</h3>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {battleLog.map((log, i) => (
            <p key={i} className={`text-xs ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>{log}</p>
          ))}
          {battleLog.length === 0 && <p className="text-xs text-muted-foreground">Engage an enemy to begin combat.</p>}
        </div>
      </div>

      {/* Debug Info */}
      {isLoading && <p className="text-xs text-muted-foreground">Syncing...</p>}
    </div>
  );
}