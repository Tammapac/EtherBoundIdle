import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, LogOut, ArrowUp, Skull, Coins, Star, Gem, Trophy, Package, Play, Pause } from "lucide-react";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";

function getSkillSpriteFolder(skillId) {
  if (!skillId) return null;
  if (skillId.startsWith("m_")) return "mage";
  if (skillId.startsWith("w_")) return "warrior";
  if (skillId.startsWith("ro_")) return "rogue";
  if (skillId.startsWith("r_")) return "ranger";
  return null;
}

function HpBar({ current, max, color = "bg-red-500", label, height = "h-2.5" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className="space-y-0.5">
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span><span>{Math.ceil(current).toLocaleString()}/{max.toLocaleString()}</span>
        </div>
      )}
      <div className={`${height} bg-black/40 rounded-full overflow-hidden border border-white/5`}>
        <motion.div className={`h-full ${color} rounded-full`} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

export default function TowerCombat({ session: initialSession, character, onLeave, onFloorCleared }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [autoFight, setAutoFight] = useState(false);
  const [autoTimer, setAutoTimer] = useState(0);
  const autoFightRef = useRef(false);
  const logRef = useRef(null);

  // Keep ref in sync with state for use in intervals
  useEffect(() => { autoFightRef.current = autoFight; }, [autoFight]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session.combat_log?.length]);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  // Show reward popup when floor is cleared
  useEffect(() => {
    if (session.status === "floor_clear") {
      setShowRewardPopup(true);
    }
  }, [session.status]);

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
    setShowRewardPopup(false);
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
    setShowRewardPopup(false);
    await base44.functions.invoke("towerAction", {
      action: "leave",
      characterId: character.id,
      sessionId: session.id,
    });
    onLeave();
  };

  // Auto-fight: attack every 1.5s during combat
  useEffect(() => {
    if (!autoFight || loading) return;
    if (session.status === "combat" && session.member?.hp > 0) {
      const timer = setTimeout(() => {
        if (autoFightRef.current) doAction("attack");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoFight, session, loading]);

  // Auto-advance: go to next floor 3s after clearing
  useEffect(() => {
    if (!autoFight || loading) return;
    if (session.status === "floor_clear") {
      setAutoTimer(3);
      const countdown = setInterval(() => {
        setAutoTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            if (autoFightRef.current) doNextFloor();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [session.status, autoFight]);

  // Stop auto-fight on defeat
  useEffect(() => {
    if (session.status === "defeat") setAutoFight(false);
  }, [session.status]);

  const me = session.member;
  const enemies = session.enemies || [];
  const inCombat = session.status === "combat";
  const isCleared = session.status === "floor_clear";
  const isDefeat = session.status === "defeat";
  const floorType = session.floorType || "normal";
  const isBossFloor = floorType === "boss" || floorType === "centennial_boss";

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

  const floorGradient = isBossFloor
    ? "from-amber-900/20 via-red-900/10 to-background"
    : "from-slate-900/50 via-background to-background";

  return (
    <div className={`fixed inset-0 z-40 bg-gradient-to-b ${floorGradient} backdrop-blur-sm flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-amber-500/20 bg-black/30">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-orbitron font-bold text-sm ${
            isBossFloor
              ? "bg-gradient-to-br from-amber-500/30 to-red-500/30 border-2 border-amber-500/50 text-amber-300"
              : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
          }`}>
            {session.floor}
          </div>
          <div>
            <span className="font-orbitron font-bold text-lg tracking-wide">Tower of Trials</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={
                floorType === "centennial_boss" ? "text-yellow-300 border-yellow-400/40 bg-yellow-500/10 font-bold" :
                floorType === "boss" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" :
                "text-muted-foreground border-border/50"
              }>
                {floorType === "centennial_boss" ? "CENTENNIAL BOSS" :
                 floorType === "boss" ? "BOSS FLOOR" : `Floor ${session.floor}`}
              </Badge>
              <Badge variant="outline" className={
                inCombat ? "text-green-400 border-green-500/30 bg-green-500/5" :
                isCleared ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5" :
                isDefeat ? "text-destructive border-destructive/30 bg-destructive/5" : ""
              }>
                {inCombat ? "In Combat" : isCleared ? "Cleared!" : isDefeat ? "Defeated" : session.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoFight ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoFight(!autoFight)}
            className={`gap-1.5 text-xs ${autoFight ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-muted-foreground hover:text-emerald-400 border-emerald-500/30"}`}
          >
            {autoFight ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {autoFight ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setAutoFight(false); doLeave(); }} className="gap-1 text-muted-foreground hover:text-destructive">
            <LogOut className="w-3.5 h-3.5" /> Leave
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4">
        {/* Left: Enemies + Player */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {/* Enemies */}
          <div className="space-y-2">
            {enemies.map((enemy, idx) => {
              const hpPct = enemy.max_hp > 0 ? (enemy.hp / enemy.max_hp) * 100 : 0;
              const isTarget = selectedTarget === idx;
              const isDead = enemy.hp <= 0;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isDead ? 0.3 : 1, x: 0 }}
                  onClick={() => !isDead && inCombat && setSelectedTarget(idx)}
                  className={`relative overflow-hidden rounded-xl p-3 transition-all ${
                    isDead ? "border border-muted bg-black/20" :
                    isTarget ? "border-2 border-destructive/60 bg-gradient-to-r from-destructive/10 to-black/30 shadow-lg shadow-destructive/10" :
                    "border border-border/50 bg-black/30 cursor-pointer hover:border-destructive/30 hover:bg-destructive/5"
                  }`}
                >
                  {/* Glow effect for boss */}
                  {enemy.isBoss && !isDead && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                  )}
                  <div className="relative flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      enemy.isBoss
                        ? "bg-gradient-to-br from-red-500/30 to-orange-500/20 border-2 border-red-500/40"
                        : "bg-muted/30 border border-border/50"
                    }`}>
                      <Skull className={`w-6 h-6 ${enemy.isBoss ? "text-red-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${enemy.isBoss ? "text-red-400 font-orbitron" : "text-foreground"}`}>{enemy.name}</p>
                        {isTarget && inCombat && <Badge className="text-[10px] h-4 px-1.5 bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">TARGET</Badge>}
                        {isDead && <Badge variant="destructive" className="text-[10px] h-4 px-1">SLAIN</Badge>}
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
                    height="h-3"
                    color={hpPct > 50 ? "bg-gradient-to-r from-red-600 to-red-500" : hpPct > 25 ? "bg-gradient-to-r from-orange-600 to-orange-500" : "bg-gradient-to-r from-red-800 to-red-600 animate-pulse"}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Player stats */}
          {me && (
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-primary/5 to-black/30 border border-primary/20">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
                  <img src={`/sprites/class_${me.class || "warrior"}.png`} alt={me.class} className="w-8 h-8" style={{ imageRendering: "pixelated" }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{me.name} <span className="text-muted-foreground">Lv.{me.level}</span></p>
                  <p className="text-xs text-muted-foreground capitalize">{me.class}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <HpBar current={me.hp} max={me.max_hp} color="bg-gradient-to-r from-green-600 to-emerald-500" label="HP" height="h-3" />
                <HpBar current={me.mp} max={me.max_mp} color="bg-gradient-to-r from-blue-600 to-cyan-500" label="MP" height="h-2.5" />
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions + Log */}
        <div className="w-full md:w-72 space-y-3 flex flex-col">
          {/* Combat actions */}
          {inCombat && me && me.hp > 0 && (
            <div className="rounded-xl p-3 space-y-2 bg-black/30 border border-primary/20">
              <p className="text-xs font-semibold text-primary font-orbitron tracking-wide">ACTIONS</p>
              <Button
                size="sm"
                className="w-full gap-1.5 bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80"
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
                    className={`w-full gap-1.5 hover:bg-muted/30 hover:scale-105 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] hover:border-primary/60 bg-black/20 transition-all duration-200 ${skillColor}`}
                    disabled={loading}
                    onClick={() => doAction("skill", skill.id)}
                  >
                    {(() => {
                      const folder = getSkillSpriteFolder(skill.id);
                      return folder
                        ? <img src={`/sprites/skills/${folder}/${skill.id}.png`} alt={skill.name} style={{ width: 24, height: 24, imageRendering: "pixelated" }} onError={e => { e.target.style.display = "none"; }} />
                        : <span className="text-sm">{elem?.icon || <Zap className="w-3.5 h-3.5" />}</span>;
                    })()}
                    {skill.name}
                    <span className="text-xs opacity-60 ml-auto">({skill.mp}MP)</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Defeat */}
          {isDefeat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-5 text-center space-y-3 bg-gradient-to-b from-red-900/30 to-black/40 border-2 border-destructive/40"
            >
              <Skull className="w-10 h-10 text-destructive mx-auto" />
              <p className="font-orbitron text-xl font-bold text-destructive">DEFEATED</p>
              <p className="text-xs text-muted-foreground">You fell on Floor {session.floor}</p>
              <Button size="sm" variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={doLeave}>
                Return to Tower
              </Button>
            </motion.div>
          )}

          {/* Combat Log */}
          <div className="rounded-xl p-3 flex-1 min-h-0 bg-black/30 border border-border/30">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 tracking-widest uppercase">Combat Log</p>
            <div ref={logRef} className="space-y-0.5 max-h-64 md:max-h-full overflow-y-auto">
              {(session.combat_log || []).slice().reverse().map((entry, i) => (
                <p key={i} className={`text-xs leading-relaxed ${
                  entry.type === "victory" ? "text-yellow-400 font-semibold" :
                  entry.type === "defeat" ? "text-destructive font-semibold" :
                  entry.type === "player_attack" ? "text-foreground" :
                  entry.type === "boss_attack" ? "text-orange-400" :
                  entry.type === "heal" ? "text-green-400" :
                  "text-muted-foreground/80"
                }`}>
                  {entry.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== REWARD POPUP (centered overlay) ===== */}
      <AnimatePresence>
        {showRewardPopup && isCleared && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && null}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-[340px] max-w-[90vw] rounded-2xl overflow-hidden"
            >
              {/* Top glow bar */}
              <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

              <div className="bg-gradient-to-b from-amber-900/40 via-card to-card p-6 space-y-4">
                {/* Trophy icon + title */}
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ rotate: -10, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, damping: 10 }}
                    className="inline-flex"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto">
                      <Trophy className="w-7 h-7 text-amber-400" />
                    </div>
                  </motion.div>
                  <p className="font-orbitron text-xl font-bold text-amber-400">
                    Floor {session.floor} Cleared!
                  </p>
                  {floorType !== "normal" && (
                    <Badge className={
                      floorType === "centennial_boss"
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-400/40"
                        : "bg-orange-500/20 text-orange-400 border-orange-500/40"
                    }>
                      {floorType === "centennial_boss" ? "CENTENNIAL VICTORY" : "BOSS DEFEATED"}
                    </Badge>
                  )}
                </div>

                {/* Rewards grid */}
                {session.rewards && (
                  <div className="space-y-1.5">
                    {session.rewards.gold > 0 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-yellow-300 font-semibold">+{session.rewards.gold.toLocaleString()} Gold</span>
                      </motion.div>
                    )}
                    {session.rewards.exp > 0 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Star className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-sm text-blue-300 font-semibold">+{session.rewards.exp.toLocaleString()} EXP</span>
                      </motion.div>
                    )}
                    {session.rewards.gems > 0 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <Gem className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-purple-300 font-semibold">+{session.rewards.gems} Gems</span>
                      </motion.div>
                    )}
                    {session.rewards.tammablocks > 0 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-sm text-amber-300 font-semibold">+{session.rewards.tammablocks} Tammablocks</span>
                      </motion.div>
                    )}
                    {session.rewards.towershards > 0 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <Gem className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-sm text-cyan-300 font-semibold">+{session.rewards.towershards} Tower Shards</span>
                      </motion.div>
                    )}
                    {session.rewards.hasSpecialGear && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/30">
                        <Swords className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                        <span className="text-sm text-yellow-200 font-semibold">Special Gear Unlocked!</span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={doNextFloor}
                    disabled={loading}
                    className="flex-1 gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold"
                    size="lg"
                  >
                    <ArrowUp className="w-4 h-4" /> {autoFight && autoTimer > 0 ? `Next Floor (${autoTimer}s)` : "Next Floor"}
                  </Button>
                  <Button
                    onClick={doLeave}
                    variant="outline"
                    size="lg"
                    className="gap-1.5 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" /> Leave
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defeat overlay */}
      <AnimatePresence>
        {isDefeat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-[320px] max-w-[90vw] rounded-2xl overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
              <div className="bg-gradient-to-b from-red-900/30 via-card to-card p-6 text-center space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                  <Skull className="w-14 h-14 text-destructive mx-auto" />
                </motion.div>
                <p className="font-orbitron text-2xl font-bold text-destructive">DEFEATED</p>
                <p className="text-sm text-muted-foreground">You fell on Floor {session.floor}</p>
                <Button onClick={doLeave} className="w-full bg-destructive/80 hover:bg-destructive text-white" size="lg">
                  Return to Tower
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
