import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, LogOut, ArrowUp, Skull, Heart, Shield } from "lucide-react";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";

function HpBar({ current, max, color = "bg-red-500", label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className="space-y-0.5">
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span><span>{Math.ceil(current)}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full ${color} rounded-full`} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

export default function TowerCombat({ session: initialSession, character, onLeave, onFloorCleared }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session.combat_log?.length]);

  // Update session from parent
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  const doAction = async (actionType, skillId) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("towerAction", {
        action: actionType,
        characterId: character.id,
        sessionId: session.id,
        skillId,
        targetIndex: selectedTarget,
      });
      if (res?.session) {
        setSession(res.session);
        if (res.session.status === "floor_clear") {
          onFloorCleared?.(res.session);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const doNextFloor = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("towerAction", {
        action: "next_floor",
        characterId: character.id,
        sessionId: session.id,
      });
      if (res?.session) setSession(res.session);
    } finally {
      setLoading(false);
    }
  };

  const doLeave = async () => {
    await base44.functions.invoke("towerAction", {
      action: "leave",
      characterId: character.id,
      sessionId: session.id,
    });
    onLeave();
  };

  const me = session.member;
  const enemies = session.enemies || [];
  const inCombat = session.status === "combat";
  const isCleared = session.status === "floor_clear";
  const isDefeat = session.status === "defeat";
  const floorType = session.floorType || "normal";

  // Skills
  const allClassSkills = CLASS_SKILLS[character?.class || "warrior"] || [];
  const hotbarIds = character?.hotbar_skills?.length > 0
    ? character.hotbar_skills
    : (character?.skills || []);
  const charSkills = hotbarIds
    .map(sid => allClassSkills.find(s => s.id === sid))
    .filter(Boolean)
    .slice(0, 6);

  // Auto-select first alive enemy
  useEffect(() => {
    if (inCombat && enemies.length > 0) {
      const firstAlive = enemies.findIndex(e => e.hp > 0);
      if (firstAlive >= 0 && enemies[selectedTarget]?.hp <= 0) {
        setSelectedTarget(firstAlive);
      }
    }
  }, [enemies, inCombat]);

  return (
    <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <span className="text-sm font-bold text-amber-400">F{session.floor}</span>
          </div>
          <span className="font-orbitron font-bold text-lg">Tower of Trials</span>
          <Badge variant="outline" className={
            floorType === "centennial_boss" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" :
            floorType === "boss" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" :
            "text-muted-foreground border-border"
          }>
            {floorType === "centennial_boss" ? "CENTENNIAL BOSS" :
             floorType === "boss" ? "BOSS FLOOR" : `Floor ${session.floor}`}
          </Badge>
          <Badge variant="outline" className={
            inCombat ? "text-green-400 border-green-500/30" :
            isCleared ? "text-yellow-400 border-yellow-500/30" :
            isDefeat ? "text-destructive border-destructive/30" : ""
          }>
            {inCombat ? "In Combat" : isCleared ? "Cleared!" : isDefeat ? "Defeated" : session.status}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={doLeave} className="gap-1 text-muted-foreground">
          <LogOut className="w-3.5 h-3.5" /> Leave Tower
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4">
        {/* Left: Enemies + Player */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Enemies */}
          <div className="space-y-2">
            {enemies.map((enemy, idx) => {
              const hpPct = enemy.max_hp > 0 ? (enemy.hp / enemy.max_hp) * 100 : 0;
              const isTarget = selectedTarget === idx;
              const isDead = enemy.hp <= 0;
              return (
                <div
                  key={idx}
                  onClick={() => !isDead && inCombat && setSelectedTarget(idx)}
                  className={`bg-card border-2 rounded-xl p-3 transition-all ${
                    isDead ? "opacity-40 border-muted" :
                    isTarget ? "border-destructive/50 bg-destructive/5" :
                    "border-border cursor-pointer hover:border-destructive/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      enemy.isBoss ? "bg-destructive/20 border border-destructive/30" : "bg-muted/50 border border-border"
                    }`}>
                      <Skull className={`w-5 h-5 ${enemy.isBoss ? "text-destructive" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${enemy.isBoss ? "text-destructive font-orbitron" : ""}`}>{enemy.name}</p>
                        {isTarget && inCombat && <Badge className="text-[10px] h-4 px-1 bg-destructive/20 text-destructive border-destructive/30">TARGET</Badge>}
                        {isDead && <Badge variant="destructive" className="text-[10px] h-4 px-1">DEAD</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{Math.max(0, enemy.hp).toLocaleString()} / {enemy.max_hp.toLocaleString()} HP</p>
                    </div>
                    {enemy.element && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/50 text-orange-400">
                        {enemy.element}
                      </Badge>
                    )}
                  </div>
                  <HpBar
                    current={enemy.hp}
                    max={enemy.max_hp}
                    color={hpPct > 50 ? "bg-destructive" : hpPct > 25 ? "bg-orange-500" : "bg-red-700 animate-pulse"}
                  />
                </div>
              );
            })}
          </div>

          {/* Player stats */}
          {me && (
            <div className="bg-card border border-primary/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{(me.name || "?")[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{me.name} <span className="text-muted-foreground">Lv.{me.level}</span></p>
                  <p className="text-xs text-muted-foreground capitalize">{me.class}</p>
                </div>
              </div>
              <div className="space-y-1">
                <HpBar current={me.hp} max={me.max_hp} color="bg-green-500" label="HP" />
                <HpBar current={me.mp} max={me.max_mp} color="bg-blue-500" label="MP" />
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions + Log */}
        <div className="w-full md:w-72 space-y-3 flex flex-col">
          {/* Combat actions */}
          {inCombat && me && me.hp > 0 && (
            <div className="bg-card border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-primary">Attack!</p>
              <Button
                size="sm"
                className="w-full gap-1.5"
                disabled={loading}
                onClick={() => doAction("attack")}
              >
                <Swords className="w-3.5 h-3.5" /> Basic Attack
              </Button>
              {charSkills.map(skill => {
                const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
                const skillColor = elem ? `border-current/30 ${elem.color}` : "border-secondary/40 text-secondary";
                return (
                  <Button
                    key={skill.id}
                    size="sm"
                    variant="outline"
                    className={`w-full gap-1.5 hover:bg-muted/30 ${skillColor}`}
                    disabled={loading}
                    onClick={() => doAction("skill", skill.id)}
                  >
                    <span className="text-sm">{elem?.icon || <Zap className="w-3.5 h-3.5" />}</span>
                    {skill.name}
                    <span className="text-xs opacity-60 ml-auto">({skill.mp}MP)</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Floor cleared */}
          {isCleared && (
            <div className="bg-card border-2 border-yellow-500/50 rounded-xl p-4 text-center space-y-3">
              <p className="font-orbitron text-xl font-bold text-yellow-400">Floor {session.floor} Cleared!</p>
              {session.rewards && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {session.rewards.gold > 0 && <p>+{session.rewards.gold} Gold</p>}
                  {session.rewards.exp > 0 && <p>+{session.rewards.exp} EXP</p>}
                  {session.rewards.gems > 0 && <p>+{session.rewards.gems} Gems</p>}
                  {session.rewards.tammablocks > 0 && <p>+{session.rewards.tammablocks} Tammablocks</p>}
                  {session.rewards.towershards > 0 && <p>+{session.rewards.towershards} Tower Shards</p>}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1.5" onClick={doNextFloor} disabled={loading}>
                  <ArrowUp className="w-3.5 h-3.5" /> Next Floor
                </Button>
                <Button size="sm" variant="outline" onClick={doLeave} className="gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Leave
                </Button>
              </div>
            </div>
          )}

          {/* Defeat */}
          {isDefeat && (
            <div className="bg-card border-2 border-destructive/50 rounded-xl p-4 text-center space-y-2">
              <p className="font-orbitron text-xl font-bold text-destructive">Defeated!</p>
              <p className="text-xs text-muted-foreground">You fell on Floor {session.floor}</p>
              <Button size="sm" variant="outline" className="w-full" onClick={doLeave}>
                Return to Tower
              </Button>
            </div>
          )}

          {/* Combat Log */}
          <div className="bg-card border border-border rounded-xl p-3 flex-1 min-h-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2">COMBAT LOG</p>
            <div ref={logRef} className="space-y-0.5 max-h-64 md:max-h-full overflow-y-auto">
              {(session.combat_log || []).slice().reverse().map((entry, i) => (
                <p key={i} className={`text-xs ${
                  entry.type === "victory" ? "text-yellow-400 font-semibold" :
                  entry.type === "defeat" ? "text-destructive font-semibold" :
                  entry.type === "player_attack" ? "text-foreground" :
                  entry.type === "boss_attack" ? "text-orange-400" :
                  entry.type === "heal" ? "text-green-400" :
                  "text-muted-foreground"
                }`}>
                  {entry.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
