import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Swords, Skull, Coins, Star, Gem, Play, Pause, LogOut, LogIn,
  ArrowUp, Shield, Zap, Heart, ChevronUp, Users, Crown, Sparkles,
  Trophy, Crosshair, Wind, Flame, Copy, UserPlus, Timer,
} from "lucide-react";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import { Input } from "@/components/ui/input";
import HealthBar from "@/components/game/HealthBar";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

// ─── Portal Combat (matches Battle.jsx layout) ─────────────────────────────
function PortalCombat({ session: initialSession, character, onLeave }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [autoFight, setAutoFight] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const autoFightRef = useRef(false);
  const logRef = useRef(null);
  const { toast } = useToast();
  const combatPollInterval = useSmartPolling(POLL_INTERVALS.COMBAT);

  const [turnCountdown, setTurnCountdown] = useState(null);

  useEffect(() => { autoFightRef.current = autoFight; }, [autoFight]);
  useEffect(() => { setSession(initialSession); }, [initialSession]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session.combat_log?.length]);

  // Turn countdown timer (3s)
  useEffect(() => {
    if (!session.turn_deadline || session.status !== "combat") { setTurnCountdown(null); return; }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((new Date(session.turn_deadline).getTime() - Date.now()) / 1000));
      setTurnCountdown(remaining);
    };
    update();
    const iv = setInterval(update, 200);
    return () => clearInterval(iv);
  }, [session.turn_deadline, session.status]);

  // Fetch pet
  const { data: petData } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    staleTime: 60000,
  });
  const equippedPet = (petData?.pets || []).find(p => p.equipped);

  const doAction = useCallback(async (actionType, skillId) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", {
        action: actionType,
        characterId: character.id,
        sessionId: session.id,
        skillId,
        targetIndex: selectedTarget,
      });
      if (res?.success === false && res?.error) {
        // "Not your turn" or similar — don't freeze, just skip
        return;
      }
      if (res?.session) setSession(res.session);
    } finally {
      setLoading(false);
    }
  }, [loading, session.id, character.id, selectedTarget]);

  const doLeave = async () => {
    setAutoFight(false);
    setShowLeaveConfirm(false);
    await base44.functions.invoke("portalAction", {
      action: "leave",
      characterId: character.id,
      sessionId: session.id,
    });
    onLeave();
  };

  // Poll for session updates (so all players see same enemies/state)
  useEffect(() => {
    if (!session?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("portalAction", { action: "poll", characterId: character.id, sessionId: session.id });
        if (res?.session) setSession(res.session);
        if (res?.success === false) onLeave(); // session ended
      } catch {}
    }, combatPollInterval || 5000);
    return () => clearInterval(interval);
  }, [session?.id, character.id]);

  // Auto-fight every 1.5s (only when it's your turn in group, or always in solo)
  useEffect(() => {
    if (!autoFight || loading) return;
    if (session.status === "combat") {
      const mbrs = session.members || [];
      const me = mbrs.find(m => m.characterId === character.id);
      if (!me || me.hp <= 0) return;
      // In group mode, only auto-attack on your turn
      if (mbrs.length > 1) {
        const myIdx = mbrs.findIndex(m => m.characterId === character.id);
        if (session.current_turn_index !== myIdx) return;
      }
      const timer = setTimeout(() => {
        if (autoFightRef.current) doAction("attack");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoFight, session, loading, doAction, character.id]);

  useEffect(() => {
    if (session.status === "defeat") setAutoFight(false);
  }, [session.status]);

  const members = session.members || [];
  const me = members.find(m => m.characterId === character.id);
  const meIdx = members.findIndex(m => m.characterId === character.id);
  const enemies = session.enemies || [];
  const inCombat = session.status === "combat";
  const isDefeat = session.status === "defeat";
  const wave = session.wave || 1;
  const portalLevel = session.portalLevel || 1;
  const isBossWave = session.isBossWave;
  const totalRewards = session.totalRewards || {};
  const isGroup = members.length > 1;
  const currentTurnIdx = session.current_turn_index ?? 0;
  const isMyTurn = !isGroup || currentTurnIdx === meIdx;
  const turnMember = members[currentTurnIdx];

  const PET_ICONS = { Wolf:"🐺", Phoenix:"🔥", Dragon:"🐉", Turtle:"🐢", Cat:"🐱", Owl:"🦉", Slime:"🫧", Fairy:"🧚", Serpent:"🐍", Golem:"🪨" };
  const RARITY_COLORS = { common:"text-gray-400", uncommon:"text-green-400", rare:"text-blue-400", epic:"text-purple-400", legendary:"text-amber-400", mythic:"text-red-400" };

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
  }, [enemies, inCombat, selectedTarget]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/30 to-indigo-600/30 border-2 border-violet-500/50 flex items-center justify-center">
            <span className="font-orbitron font-bold text-sm text-violet-300">{wave}</span>
          </div>
          <div>
            <span className="font-orbitron font-bold text-lg tracking-wide text-violet-200">Infinite Portal</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-violet-400 border-violet-500/30 bg-violet-500/10">Lv.{portalLevel}</Badge>
              <Badge variant="outline" className={isBossWave ? "text-red-400 border-red-500/30 bg-red-500/10 font-bold" : "text-muted-foreground border-border/50"}>
                {isBossWave ? "BOSS WAVE" : `Wave ${wave}`}
              </Badge>
              {members.length > 1 && (
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/5">
                  <Users className="w-3 h-3 mr-0.5" />{members.length}/4
                </Badge>
              )}
              {isGroup && inCombat && turnMember && (
                <Badge variant="outline" className={`${isMyTurn ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 animate-pulse" : "text-amber-400 border-amber-500/30 bg-amber-500/10"}`}>
                  <Timer className="w-3 h-3 mr-0.5" />
                  {isMyTurn ? "YOUR TURN" : `${turnMember.name}'s turn`}
                  {turnCountdown !== null && ` (${turnCountdown}s)`}
                </Badge>
              )}
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
          <Button variant="ghost" size="sm" onClick={() => setShowLeaveConfirm(true)} className="gap-1 text-muted-foreground hover:text-destructive">
            <LogOut className="w-3.5 h-3.5" /> Leave
          </Button>
        </div>
      </div>

      {/* Battle Arena — 3 column: Player | VS | Enemy (matches Battle.jsx) */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* Left: Player(s) */}
        <div className="space-y-3">
          {members.map((member, mIdx) => {
            const isMe = member.characterId === character.id;
            const isDead = member.hp <= 0;
            const isTurnPlayer = isGroup && inCombat && currentTurnIdx === mIdx && !isDead;
            return (
              <motion.div
                key={member.characterId}
                animate={isDead ? { opacity: 0.4 } : {}}
                className={`bg-card border rounded-xl p-4 ${isTurnPlayer ? "border-emerald-500/60 ring-1 ring-emerald-500/30" : isMe ? "border-violet-500/40" : "border-border/30"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-5 h-5 ${isTurnPlayer ? "text-emerald-400" : isMe ? "text-violet-400" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {member.name} {isMe && <span className="text-muted-foreground text-xs">(You)</span>}
                      {isTurnPlayer && <span className="text-emerald-400 text-xs ml-1">⚔ Turn</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">{member.class} · Lv.{member.level}</p>
                  </div>
                  {isDead && <Badge variant="destructive" className="text-[10px]">KO</Badge>}
                </div>
                <div className="space-y-1">
                  <HealthBar current={Math.max(0, member.hp)} max={member.max_hp} color="bg-red-500" label="HP" />
                  <HealthBar current={Math.max(0, member.mp || 0)} max={member.max_mp || 1} color="bg-blue-500" label="MP" />
                </div>
              </motion.div>
            );
          })}
          {/* Pet */}
          {equippedPet && (
            <div className="bg-card border border-border/30 rounded-xl p-3 flex items-center gap-2">
              <span className="text-2xl">{PET_ICONS[equippedPet.species] || "🐾"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${RARITY_COLORS[equippedPet.rarity] || "text-gray-400"}`}>{equippedPet.name}</p>
                <p className="text-[10px] text-muted-foreground">Lv.{equippedPet.level} {equippedPet.species}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{equippedPet.skill_type}</Badge>
            </div>
          )}
        </div>

        {/* Center VS */}
        <div className="hidden md:flex items-center justify-center">
          <span className="text-xs text-primary/50 font-bold">VS</span>
        </div>

        {/* Right: Enemies */}
        <div className="space-y-2">
          {enemies.map((enemy, idx) => {
            const isTarget = selectedTarget === idx;
            const isDead = enemy.hp <= 0;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: isDead ? 0.3 : 1, x: 0 }}
                onClick={() => !isDead && inCombat && setSelectedTarget(idx)}
                className={`relative overflow-hidden rounded-xl p-3 transition-all ${
                  isDead ? "border border-muted bg-black/20" :
                  isTarget ? "border-2 border-destructive/60 bg-gradient-to-l from-destructive/10 to-card shadow-lg shadow-destructive/10" :
                  "border border-border/50 bg-card cursor-pointer hover:border-destructive/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enemy.isBoss ? "bg-gradient-to-br from-red-500/30 to-violet-500/20 border-2 border-red-500/40" : "bg-muted/30 border border-border/50"
                  }`}>
                    <Skull className={`w-5 h-5 ${enemy.isBoss ? "text-red-400" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${enemy.isBoss ? "text-red-400 font-orbitron" : ""}`}>{enemy.name}</p>
                      {isTarget && inCombat && <Badge className="text-[10px] h-4 px-1.5 bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">TARGET</Badge>}
                      {isDead && <Badge variant="destructive" className="text-[10px] h-4 px-1">SLAIN</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">DMG: {enemy.dmg} · DEF: {enemy.armor || 0}</p>
                  </div>
                  {enemy.element && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-500/50 text-violet-400">{enemy.element}</Badge>
                  )}
                </div>
                <HealthBar current={Math.max(0, enemy.hp)} max={enemy.max_hp} color="bg-red-500" label={`${Math.max(0, enemy.hp).toLocaleString()} / ${enemy.max_hp.toLocaleString()}`} height="h-2.5" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Skills bar */}
      {inCombat && me && me.hp > 0 && (
        <div className="bg-card border border-border rounded-xl p-2">
          {isGroup && !isMyTurn && (
            <div className="text-center text-xs text-amber-400 mb-1.5">
              <Timer className="w-3 h-3 inline mr-1" />
              Waiting for {turnMember?.name || "another player"}...
              {turnCountdown !== null && ` (${turnCountdown}s)`}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => doAction("attack")}
              disabled={loading || (isGroup && !isMyTurn)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border bg-violet-600/30 border-violet-500/50 hover:bg-violet-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[52px]"
            >
              <Swords className="w-3.5 h-3.5 text-foreground" />
              <span className="text-[9px] font-medium leading-none">Attack</span>
            </button>
            {charSkills.map(skill => {
              const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
              const buffColor = skill.buff === "defense" ? "border-blue-500/50 text-blue-400"
                : skill.buff === "attack" ? "border-orange-500/50 text-orange-400"
                : elem ? `border-current/30 ${elem.color}`
                : "border-violet-500/30 text-secondary";
              return (
                <button
                  key={skill.id}
                  onClick={() => doAction("skill", skill.id)}
                  disabled={loading || (isGroup && !isMyTurn)}
                  title={`${skill.description || skill.name}\n${skill.mp}MP`}
                  className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border bg-muted/20 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[52px] ${buffColor}`}
                >
                  <span className="text-sm leading-none">{elem?.icon || <Zap className="w-3 h-3 inline" />}</span>
                  <span className="text-[9px] font-medium leading-none text-center max-w-[60px] truncate">{skill.name}</span>
                  <span className="text-[8px] text-muted-foreground">{skill.mp}MP</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Battle Log (bottom) */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Battle Log</h3>
        <div ref={logRef} className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
          {(session.combat_log || []).slice(-40).reverse().map((log, i) => (
            <p key={i} className={`${i === 0 ? "opacity-100" : "opacity-60"} ${
              log.type === "player_attack" ? "text-green-400" :
              log.type === "boss_attack" ? "text-red-400" :
              log.type === "heal" ? "text-emerald-400" :
              log.type === "victory" ? "text-yellow-400 font-bold" :
              log.type === "defeat" ? "text-red-500 font-bold" :
              "text-muted-foreground"
            }`}>
              {log.text}
            </p>
          ))}
          {(!session.combat_log || session.combat_log.length === 0) && (
            <p className="text-muted-foreground italic">Waiting for combat...</p>
          )}
        </div>
        {/* Run totals inline */}
        {(totalRewards.gold > 0 || totalRewards.portalShards > 0) && (
          <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span><Coins className="w-3 h-3 inline mr-0.5 text-yellow-400" />{(totalRewards.gold || 0).toLocaleString()}g</span>
            <span><Star className="w-3 h-3 inline mr-0.5 text-blue-400" />{(totalRewards.exp || 0).toLocaleString()} exp</span>
            {totalRewards.portalShards > 0 && <span><Gem className="w-3 h-3 inline mr-0.5 text-violet-400" />{totalRewards.portalShards} shards</span>}
            {totalRewards.loot?.length > 0 && <span><Sparkles className="w-3 h-3 inline mr-0.5 text-amber-400" />{totalRewards.loot.length} items</span>}
          </div>
        )}
      </div>

      {/* Defeat Modal */}
      <AnimatePresence>
        {isDefeat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-card border-2 border-red-500/40 rounded-2xl p-6 max-w-md w-full mx-4 text-center space-y-4"
            >
              <Skull className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="font-orbitron text-2xl font-bold text-red-400">Portal Collapsed!</h2>
              <p className="text-muted-foreground">
                All players fell on <span className="text-violet-400 font-bold">Wave {session.finalWave || wave}</span>
              </p>
              <div className="bg-black/30 rounded-xl p-4 space-y-2 text-sm text-left">
                <p className="font-bold text-violet-400 text-center mb-2">Run Summary</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Waves Cleared</span><span className="text-violet-300 font-bold">{(session.finalWave || wave) - 1}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gold Earned</span><span className="text-yellow-400">{(totalRewards.gold || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">EXP Earned</span><span className="text-blue-400">{(totalRewards.exp || 0).toLocaleString()}</span></div>
                {totalRewards.portalShards > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Portal Shards</span><span className="text-violet-400">{totalRewards.portalShards}</span></div>
                )}
                {totalRewards.loot?.length > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Items Looted</span><span className="text-amber-400">{totalRewards.loot.length}</span></div>
                )}
              </div>
              <Button onClick={doLeave} className="w-full bg-violet-600 hover:bg-violet-700">Return to Portal</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border-2 border-violet-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 text-center space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <LogOut className="w-12 h-12 text-violet-400 mx-auto" />
              <h3 className="font-orbitron text-lg font-bold">Leave Portal?</h3>
              <p className="text-sm text-muted-foreground">Are you sure you want to leave?</p>
              {/* Show accumulated rewards */}
              {(totalRewards.gold > 0 || totalRewards.exp > 0 || totalRewards.portalShards > 0 || totalRewards.loot?.length > 0) && (
                <div className="bg-black/30 rounded-xl p-3 space-y-1.5 text-sm text-left">
                  <p className="font-bold text-violet-400 text-center text-xs mb-1.5">Rewards Earned So Far</p>
                  {totalRewards.gold > 0 && (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Gold</span><span className="text-yellow-400">{(totalRewards.gold || 0).toLocaleString()}</span></div>
                  )}
                  {totalRewards.exp > 0 && (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">EXP</span><span className="text-blue-400">{(totalRewards.exp || 0).toLocaleString()}</span></div>
                  )}
                  {totalRewards.portalShards > 0 && (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Portal Shards</span><span className="text-violet-400">{totalRewards.portalShards}</span></div>
                  )}
                  {totalRewards.loot?.length > 0 && (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Items Looted</span><span className="text-amber-400">{totalRewards.loot.length}</span></div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowLeaveConfirm(false)}>Stay</Button>
                <Button variant="destructive" className="flex-1" onClick={doLeave}>Leave</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Portal Leaderboard ─────────────────────────────────────────────────────
function PortalLeaderboard({ character }) {
  const [tab, setTab] = useState("level");

  const TABS = [
    { key: "level", label: "Portal Level", type: "level", valueKey: "portalLevel", valueLabel: "Lv." },
    { key: "wave", label: "All Waves", type: "wave", valueKey: "highestWave", valueLabel: "Wave" },
    { key: "solo", label: "Solo", type: "solo", valueKey: "waveValue", valueLabel: "Wave" },
    { key: "2p", label: "2 Players", type: "2p", valueKey: "waveValue", valueLabel: "Wave" },
    { key: "3p", label: "3 Players", type: "3p", valueKey: "waveValue", valueLabel: "Wave" },
    { key: "4p", label: "4 Players", type: "4p", valueKey: "waveValue", valueLabel: "Wave" },
  ];

  const activeTab = TABS.find(t => t.key === tab) || TABS[0];

  const { data: boardData } = useQuery({
    queryKey: ["portalLeaderboard", activeTab.type],
    queryFn: () => base44.functions.invoke("portalAction", { characterId: character.id, action: "leaderboard", leaderboardType: activeTab.type }),
    enabled: !!character?.id,
    staleTime: 30000,
  });

  const board = boardData?.leaderboard || [];

  return (
    <div className="bg-card/50 border border-violet-500/15 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-violet-500/15 bg-violet-500/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-violet-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Portal Rankings
          </h3>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50 h-7 flex-wrap">
            {TABS.map(t => (
              <TabsTrigger key={t.key} value={t.key} className="text-[10px] h-5 px-1.5">{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {board.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-6">No rankings yet</p>
        ) : (
          board.map((entry, i) => {
            const isMe = entry.id === character.id;
            const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
            const displayValue = entry.waveValue ?? entry[activeTab.valueKey] ?? 0;
            return (
              <div key={entry.id} className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-border/20 ${isMe ? "bg-violet-500/10" : ""}`}>
                <span className={`w-6 text-center font-bold ${i < 3 ? medalColors[i] : "text-muted-foreground"}`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${entry.rank}`}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold truncate ${isMe ? "text-violet-300" : ""}`}>{entry.name}</span>
                  <span className="text-muted-foreground ml-1 capitalize">({entry.class} Lv.{entry.level})</span>
                </div>
                <span className="font-mono font-bold text-violet-400">{displayValue}</span>
                <span className="text-muted-foreground text-[10px]">{activeTab.valueLabel}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Portal Waiting Lobby ────────────────────────────────────────────────────
function PortalLobby({ session: initialSession, character, onLeave, onStart }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Poll for member updates
  useEffect(() => {
    if (session.status !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("portalAction", { action: "poll", characterId: character.id, sessionId: session.id });
        if (res?.session) {
          setSession(res.session);
          if (res.session.status === "combat") onStart(res.session);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [session.id, session.status, character.id]);

  const isLeader = session.ownerId === character.id || ((session.members || [])[0]?.characterId === character.id);
  const members = session.members || [];

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", { action: "start", characterId: character.id, sessionId: session.id });
      if (res?.session) onStart(res.session);
    } catch (err) {
      toast({ title: err.message || "Failed to start", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-2">
        <Sparkles className="w-10 h-10 text-violet-400 mx-auto" />
        <h2 className="font-orbitron text-xl font-bold text-violet-300">Portal Lobby</h2>
        <p className="text-sm text-muted-foreground">Waiting for players to join...</p>
      </div>

      {/* Session ID */}
      <div className="bg-card border border-violet-500/20 rounded-xl p-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex-shrink-0">Session ID:</span>
        <code className="text-xs text-violet-300 flex-1 truncate select-all">{session.id}</code>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(session.id); toast({ title: "Session ID copied!" }); }}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Portal info */}
      <div className="flex justify-center gap-4 text-sm">
        <Badge variant="outline" className="text-violet-400 border-violet-500/30">Lv.{session.portalLevel || 1}</Badge>
        <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
          <Users className="w-3 h-3 mr-1" />{members.length}/4
        </Badge>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((m, i) => {
          const isMe = m.characterId === character.id;
          const isOwner = i === 0;
          return (
            <div key={m.characterId} className={`flex items-center gap-3 bg-card border rounded-xl p-3 ${isMe ? "border-violet-500/40" : "border-border/30"}`}>
              <Shield className={`w-5 h-5 ${isOwner ? "text-amber-400" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{m.name} {isMe && <span className="text-muted-foreground text-xs">(You)</span>}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{m.class} · Lv.{m.level}</p>
              </div>
              {isOwner && <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">Leader</Badge>}
            </div>
          );
        })}
        {/* Empty slots */}
        {Array.from({ length: 4 - members.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 bg-card/30 border border-dashed border-border/20 rounded-xl p-3">
            <Users className="w-5 h-5 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/40 italic">Waiting for player...</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-1.5" onClick={onLeave}>
          <LogOut className="w-4 h-4" /> Leave
        </Button>
        {isLeader && (
          <Button onClick={handleStart} disabled={loading} className="flex-1 gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500">
            <Play className="w-4 h-4" /> {loading ? "Starting..." : "Start Portal"}
          </Button>
        )}
      </div>
      {!isLeader && <p className="text-xs text-muted-foreground text-center">Waiting for the leader to start...</p>}
    </div>
  );
}

// ─── Main Portal Page ───────────────────────────────────────────────────────
export default function Portal({ character, onCharacterUpdate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const portalCombatPoll = useSmartPolling(POLL_INTERVALS.COMBAT);
  const portalSocialPoll = useSmartPolling(POLL_INTERVALS.SOCIAL);

  const { data: portalStatus, refetch } = useQuery({
    queryKey: ["portalStatus", character?.id],
    queryFn: () => base44.functions.invoke("portalAction", { action: "get_status", characterId: character.id }),
    enabled: !!character?.id,
    refetchInterval: portalCombatPoll,
    staleTime: POLL_INTERVALS.COMBAT,
  });

  // Fetch all active public portal sessions
  const { data: activePortals, refetch: refetchPortals } = useQuery({
    queryKey: ["portalActiveSessions"],
    queryFn: () => base44.functions.invoke("portalAction", { action: "list_active", characterId: character.id }),
    enabled: !!character?.id,
    refetchInterval: portalSocialPoll,
    staleTime: POLL_INTERVALS.SOCIAL,
  });
  const publicSessions = (activePortals?.sessions || []).filter(s => s.memberCount < s.maxMembers);

  // Resume active session
  useEffect(() => {
    if (portalStatus?.activeSession && !activeSession) {
      setActiveSession(portalStatus.activeSession);
    }
  }, [portalStatus?.activeSession]);

  const portalLevel = portalStatus?.portalLevel || 1;
  const portalShards = portalStatus?.portalShards || 0;
  const highestWave = portalStatus?.highestWave || 0;
  const nextUpgradeCost = portalStatus?.nextUpgradeCost;
  const entriesUsed = portalStatus?.entriesUsed || 0;
  const maxEntries = portalStatus?.maxEntries || 5;
  const entriesLeft = maxEntries - entriesUsed;
  const entryResetGemCost = portalStatus?.entryResetGemCost || 500;
  const characterGems = portalStatus?.characterGems || 0;
  const minLevel = portalStatus?.minLevel || 50;
  const meetsLevelReq = (character?.level || 1) >= minLevel;

  const handleJoinById = async () => {
    const id = joinId.trim();
    if (!id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", { action: "join", characterId: character.id, targetSessionId: id });
      if (res?.session) { setActiveSession(res.session); setJoinId(""); setShowJoin(false); }
    } catch (err) {
      toast({ title: err.message || "Failed to join session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetEntries = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", { action: "reset_entries", characterId: character.id });
      if (res?.success) {
        toast({ title: `Entries reset! (${res.gemsSpent} gems spent)` });
        refetch();
        queryClient.invalidateQueries({ queryKey: ["characters"] });
      }
    } catch (err) {
      toast({ title: err.message || "Failed to reset entries", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", { action: "enter", characterId: character.id });
      if (res?.session) setActiveSession(res.session);
    } catch (err) {
      toast({ title: err.message || "Failed to enter portal", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", { action: "join", characterId: character.id, targetSessionId: sessionId });
      if (res?.session) setActiveSession(res.session);
    } catch (err) {
      toast({ title: err.message || "Failed to join portal", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("portalAction", { action: "upgrade", characterId: character.id });
      if (res?.success) {
        toast({
          title: `Portal upgraded to Lv.${res.newLevel}!`,
          description: res.newLevel >= 100 ? "Mysterious and glorious rewards await..." : `Enemies are now stronger with better loot.`,
        });
        refetch();
        queryClient.invalidateQueries({ queryKey: ["characters"] });
      }
    } catch (err) {
      toast({ title: err.message || "Upgrade failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    setActiveSession(null);
    refetch();
    refetchPortals();
    queryClient.invalidateQueries({ queryKey: ["characters"] });
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  const doLeaveSession = async () => {
    try {
      await base44.functions.invoke("portalAction", { action: "leave", characterId: character.id, sessionId: activeSession?.id });
    } catch {}
    handleLeave();
  };

  // Waiting lobby
  if (activeSession && (activeSession.status === "waiting")) {
    return <PortalLobby session={activeSession} character={character} onLeave={doLeaveSession} onStart={(s) => setActiveSession(s)} />;
  }

  // Combat
  if (activeSession && activeSession.status === "combat") {
    return <PortalCombat session={activeSession} character={character} onLeave={handleLeave} />;
  }

  const canUpgrade = portalLevel < 100 && nextUpgradeCost && portalShards >= nextUpgradeCost;
  const upgradeProgress = nextUpgradeCost ? Math.min(100, (portalShards / nextUpgradeCost) * 100) : 100;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex gap-4">
        {/* Left: Main Portal Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-orbitron text-xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" /> Infinite Portal
              </h1>
              <p className="text-xs text-muted-foreground">Enter the rift and face endless waves of enemies.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowJoin(v => !v)}>
              <LogIn className="w-3.5 h-3.5" /> Join by ID
            </Button>
          </div>

          {/* Join by Session ID */}
          <AnimatePresence>
            {showJoin && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-card border border-violet-500/30 rounded-xl p-3 flex gap-2"
              >
                <Input value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Paste Session ID..."
                  className="h-8 text-xs flex-1" onKeyDown={e => e.key === 'Enter' && handleJoinById()} />
                <Button size="sm" onClick={handleJoinById} disabled={loading} className="h-8 text-xs">{loading ? "..." : "Join"}</Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Portal Visual */}
          <div className="relative mx-auto w-48 h-48">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-900/60 via-indigo-900/40 to-purple-900/60 border-2 border-violet-500/40 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(139,92,246,0.15),transparent,rgba(99,102,241,0.15),transparent)] animate-spin" style={{ animationDuration: "8s" }} />
              <div className="relative text-center z-10">
                <p className="font-orbitron text-3xl font-bold text-violet-300">{portalLevel}</p>
                <p className="text-[10px] text-violet-400/70 uppercase tracking-wider">Portal Level</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-card border border-violet-500/20 rounded-xl p-2.5 text-center">
              <Gem className="w-3.5 h-3.5 text-violet-400 mx-auto mb-0.5" />
              <p className="text-lg font-bold text-violet-300">{portalShards}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Shards</p>
            </div>
            <div className="bg-card border border-amber-500/20 rounded-xl p-2.5 text-center">
              <Crown className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
              <p className="text-lg font-bold text-amber-300">{highestWave}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Best Wave</p>
            </div>
            <div className="bg-card border border-indigo-500/20 rounded-xl p-2.5 text-center">
              <Swords className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-0.5" />
              <p className="text-lg font-bold text-indigo-300">{(Math.pow(1.25, portalLevel - 1) * 100).toFixed(0)}%</p>
              <p className="text-[9px] text-muted-foreground uppercase">Power</p>
            </div>
            <div className="bg-card border border-green-500/20 rounded-xl p-2.5 text-center">
              <Sparkles className="w-3.5 h-3.5 text-green-400 mx-auto mb-0.5" />
              <p className="text-lg font-bold text-green-300">{entriesLeft}/{maxEntries}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Entries</p>
            </div>
          </div>

          {/* Entry Reset */}
          {entriesLeft < maxEntries && (
            <div className="bg-card/50 border border-border rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{entriesLeft === 0 ? "No entries left" : `${entriesLeft} entries remaining`}</span>
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={handleResetEntries}
                disabled={loading || characterGems < entryResetGemCost}>
                <Gem className="w-3 h-3 text-amber-400" /> Reset ({entryResetGemCost} Gems)
              </Button>
            </div>
          )}

          {/* Enter Portal */}
          {!meetsLevelReq ? (
            <div className="bg-card border-2 border-red-500/30 rounded-xl p-4 text-center space-y-2">
              <Shield className="w-8 h-8 text-red-400 mx-auto" />
              <p className="font-orbitron font-bold text-red-400">Level {minLevel} Required</p>
              <p className="text-sm text-muted-foreground">Your character is Lv.{character?.level || 1}. Reach level {minLevel} to unlock the Infinite Portal.</p>
            </div>
          ) : (
            <Button onClick={handleEnter} disabled={loading || entriesLeft <= 0}
              className="w-full h-12 font-orbitron gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-500/30 shadow-lg shadow-violet-500/20 disabled:opacity-40"
            >
              <Sparkles className="w-5 h-5" />
              {entriesLeft <= 0 ? "No Entries Left" : "Create Portal"}
            </Button>
          )}

          {/* Upgrade Section */}
          {portalLevel < 100 && (
            <div className="bg-card border border-violet-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <ChevronUp className="w-4 h-4 text-violet-400" />
                  Upgrade Portal
                  <span className="text-violet-400">Lv.{portalLevel}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-violet-300">Lv.{portalLevel + 1}</span>
                </h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Portal Shards</span>
                  <span className={portalShards >= nextUpgradeCost ? "text-green-400" : "text-red-400"}>{portalShards} / {nextUpgradeCost}</span>
                </div>
                <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${upgradeProgress}%` }} />
                </div>
              </div>
              <Button onClick={handleUpgrade} disabled={!canUpgrade || loading} variant="outline"
                className="w-full gap-2 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300 disabled:opacity-40">
                <ArrowUp className="w-4 h-4" /> Upgrade ({nextUpgradeCost} Shards)
              </Button>
            </div>
          )}

          {/* Reset Portal Level */}
          {portalLevel > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1.5"
              disabled={loading}
              onClick={async () => {
                if (!confirm("Reset portal to Level 1? You'll get back 50% of shards spent.")) return;
                setLoading(true);
                try {
                  const res = await base44.functions.invoke("portalAction", { action: "reset_level", characterId: character.id });
                  if (res?.success) {
                    toast({ title: "Portal reset to Level 1", description: res.shardsRefunded > 0 ? `Refunded ${res.shardsRefunded} shards` : undefined });
                    refetch();
                  }
                } catch (err) {
                  toast({ title: err.message || "Reset failed", variant: "destructive" });
                } finally { setLoading(false); }
              }}
            >
              Reset Portal to Level 1
            </Button>
          )}

          {/* Max Level Banner */}
          {portalLevel >= 100 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center space-y-2">
              <Crown className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="font-orbitron text-base font-bold text-amber-300">Portal Level 100!</h3>
              <p className="text-xs text-amber-400/80">Mysterious and glorious rewards await...</p>
            </div>
          )}

          {/* Leaderboard */}
          <PortalLeaderboard character={character} />

          {/* Info */}
          <div className="bg-card/50 border border-border/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-bold text-foreground text-sm mb-2">How it works</p>
            <p>- Requires Level {minLevel} to enter</p>
            <p>- Create a portal, wait for players to join, then leader clicks Start</p>
            <p>- Enemies spawn infinitely, getting stronger each wave</p>
            <p>- Drops unique/legendary gear only</p>
            <p>- Up to 4 players can fight together</p>
            <p>- Boss waves every 10 waves with guaranteed shard drops</p>
            <p>- {maxEntries} entries per day (reset with gems)</p>
          </div>
        </div>

        {/* Right Sidebar: Public Portals */}
        <div className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-4 space-y-3">
            <div className="bg-card border border-violet-500/20 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-violet-500/15 bg-violet-500/5">
                <h3 className="text-sm font-bold text-violet-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Public Portals
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {publicSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-6">No active portals</p>
                ) : (
                  publicSessions.map(ps => (
                    <div key={ps.id} className="p-2.5 border-b border-border/20 hover:bg-violet-500/5 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">{ps.ownerName}</span>
                        <Button size="sm" className="h-6 text-[10px] px-2 bg-violet-600 hover:bg-violet-700"
                          onClick={() => handleJoinSession(ps.id)} disabled={loading || !meetsLevelReq}>
                          Join
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-violet-500/30 text-violet-400">P-Lv.{ps.portalLevel}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-400">
                          {ps.status === "waiting" ? "Lobby" : `W${ps.wave}`}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/30 text-cyan-400">
                          {ps.memberCount}/{ps.maxMembers}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ps.members.map((m, i) => (
                          <span key={i} className="text-[9px] text-muted-foreground">{m.name}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Public Portals (below main content) */}
      <div className="md:hidden mt-6">
        {publicSessions.length > 0 && (
          <div className="bg-card border border-violet-500/20 rounded-xl p-3 space-y-2">
            <h3 className="text-sm font-bold text-violet-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Public Portals
            </h3>
            {publicSessions.map(ps => (
              <div key={ps.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
                <div className="text-xs flex-1 min-w-0">
                  <span className="font-semibold text-foreground">{ps.ownerName}</span>
                  <span className="text-muted-foreground ml-1">Lv.{ps.portalLevel}</span>
                  <span className="text-muted-foreground ml-1">{ps.status === "waiting" ? "Lobby" : `W${ps.wave}`}</span>
                  <span className="text-muted-foreground ml-1">{ps.memberCount}/{ps.maxMembers}</span>
                </div>
                <Button size="sm" className="text-xs h-7 bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleJoinSession(ps.id)} disabled={loading || !meetsLevelReq}>
                  Join
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
