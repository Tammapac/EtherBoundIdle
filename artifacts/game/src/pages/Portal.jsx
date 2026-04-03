import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Swords, Skull, Coins, Star, Gem, Play, Pause, LogOut,
  ArrowUp, Shield, Zap, Heart, ChevronUp, Users, Crown, Sparkles,
  Trophy, Crosshair, Wind, Flame,
} from "lucide-react";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import HealthBar from "@/components/game/HealthBar";

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

  useEffect(() => { autoFightRef.current = autoFight; }, [autoFight]);
  useEffect(() => { setSession(initialSession); }, [initialSession]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session.combat_log?.length]);

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

  // Auto-fight every 1.5s
  useEffect(() => {
    if (!autoFight || loading) return;
    if (session.status === "combat") {
      const me = (session.members || []).find(m => m.characterId === character.id);
      if (!me || me.hp <= 0) return;
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
  const enemies = session.enemies || [];
  const inCombat = session.status === "combat";
  const isDefeat = session.status === "defeat";
  const wave = session.wave || 1;
  const portalLevel = session.portalLevel || 1;
  const isBossWave = session.isBossWave;
  const totalRewards = session.totalRewards || {};

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
          {members.map((member) => {
            const isMe = member.characterId === character.id;
            const isDead = member.hp <= 0;
            return (
              <motion.div
                key={member.characterId}
                animate={isDead ? { opacity: 0.4 } : {}}
                className={`bg-card border rounded-xl p-4 ${isMe ? "border-violet-500/40" : "border-border/30"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-5 h-5 ${isMe ? "text-violet-400" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {member.name} {isMe && <span className="text-muted-foreground text-xs">(You)</span>}
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
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => doAction("attack")}
              disabled={loading}
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
                  disabled={loading}
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

  const { data: levelBoard } = useQuery({
    queryKey: ["portalLeaderboard", "level"],
    queryFn: () => base44.functions.invoke("portalAction", { characterId: character.id, action: "leaderboard", leaderboardType: "level" }),
    enabled: !!character?.id,
    staleTime: 30000,
  });

  const { data: waveBoard } = useQuery({
    queryKey: ["portalLeaderboard", "wave"],
    queryFn: () => base44.functions.invoke("portalAction", { characterId: character.id, action: "leaderboard", leaderboardType: "wave" }),
    enabled: !!character?.id,
    staleTime: 30000,
  });

  const board = tab === "level" ? (levelBoard?.leaderboard || []) : (waveBoard?.leaderboard || []);
  const valueKey = tab === "level" ? "portalLevel" : "highestWave";
  const valueLabel = tab === "level" ? "Portal Lv." : "Wave";

  return (
    <div className="bg-card/50 border border-violet-500/15 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-violet-500/15 bg-violet-500/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-violet-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Portal Rankings
          </h3>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50 h-7">
            <TabsTrigger value="level" className="text-[10px] h-5 px-2">Highest Level</TabsTrigger>
            <TabsTrigger value="wave" className="text-[10px] h-5 px-2">Highest Wave</TabsTrigger>
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
            return (
              <div key={entry.id} className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-border/20 ${isMe ? "bg-violet-500/10" : ""}`}>
                <span className={`w-6 text-center font-bold ${i < 3 ? medalColors[i] : "text-muted-foreground"}`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${entry.rank}`}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold truncate ${isMe ? "text-violet-300" : ""}`}>{entry.name}</span>
                  <span className="text-muted-foreground ml-1 capitalize">({entry.class} Lv.{entry.level})</span>
                </div>
                <span className="font-mono font-bold text-violet-400">{entry[valueKey]}</span>
                <span className="text-muted-foreground text-[10px]">{valueLabel}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Portal Page ───────────────────────────────────────────────────────
export default function Portal({ character, onCharacterUpdate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portalStatus, refetch } = useQuery({
    queryKey: ["portalStatus", character?.id],
    queryFn: () => base44.functions.invoke("portalAction", { action: "get_status", characterId: character.id }),
    enabled: !!character?.id,
    refetchInterval: 5000,
  });

  // Fetch party data for "Enter with Party" option
  const { data: partyData } = useQuery({
    queryKey: ["party", character?.id],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("portalAction", { action: "get_party_sessions", characterId: character.id });
        return res;
      } catch { return { sessions: [] }; }
    },
    enabled: !!character?.id,
    staleTime: 10000,
  });
  const partySessions = partyData?.sessions || [];

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
    queryClient.invalidateQueries({ queryKey: ["characters"] });
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  if (activeSession) {
    return <PortalCombat session={activeSession} character={character} onLeave={handleLeave} />;
  }

  const canUpgrade = portalLevel < 100 && nextUpgradeCost && portalShards >= nextUpgradeCost;
  const upgradeProgress = nextUpgradeCost ? Math.min(100, (portalShards / nextUpgradeCost) * 100) : 100;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-orbitron text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Infinite Portal
        </h1>
        <p className="text-muted-foreground text-sm">Enter the rift and face endless waves of enemies.</p>
      </div>

      {/* Portal Visual */}
      <div className="relative mx-auto w-56 h-56">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-900/60 via-indigo-900/40 to-purple-900/60 border-2 border-violet-500/40 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(139,92,246,0.15),transparent,rgba(99,102,241,0.15),transparent)] animate-spin" style={{ animationDuration: "8s" }} />
          <div className="relative text-center z-10">
            <p className="font-orbitron text-4xl font-bold text-violet-300">{portalLevel}</p>
            <p className="text-xs text-violet-400/70 uppercase tracking-wider">Portal Level</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card border border-violet-500/20 rounded-xl p-3 text-center">
          <Gem className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-violet-300">{portalShards}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Shards</p>
        </div>
        <div className="bg-card border border-amber-500/20 rounded-xl p-3 text-center">
          <Crown className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-300">{highestWave}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Best Wave</p>
        </div>
        <div className="bg-card border border-indigo-500/20 rounded-xl p-3 text-center">
          <Swords className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-indigo-300">{(Math.pow(1.25, portalLevel - 1) * 100).toFixed(0)}%</p>
          <p className="text-[9px] text-muted-foreground uppercase">Power</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-xl p-3 text-center">
          <Sparkles className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-300">{entriesLeft}/{maxEntries}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Entries</p>
        </div>
      </div>

      {/* Enter Portal */}
      {!meetsLevelReq ? (
        <div className="bg-card border-2 border-red-500/30 rounded-xl p-4 text-center space-y-2">
          <Shield className="w-8 h-8 text-red-400 mx-auto" />
          <p className="font-orbitron font-bold text-red-400">Level {minLevel} Required</p>
          <p className="text-sm text-muted-foreground">Your character is Lv.{character?.level || 1}. Reach level {minLevel} to unlock the Infinite Portal.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            onClick={handleEnter}
            disabled={loading || entriesLeft <= 0}
            className="w-full h-14 text-lg font-orbitron gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-500/30 shadow-lg shadow-violet-500/20 disabled:opacity-40"
          >
            <Sparkles className="w-5 h-5" />
            {entriesLeft <= 0 ? "No Entries Left Today" : "Enter Portal Solo"}
          </Button>
          {entriesLeft <= 0 && (
            <Button
              onClick={handleResetEntries}
              disabled={loading || characterGems < entryResetGemCost}
              variant="outline"
              className="w-full gap-2 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 disabled:opacity-40"
            >
              <Gem className="w-4 h-4 text-amber-400" />
              Reset Entries ({entryResetGemCost} Gems)
              <span className="text-xs text-muted-foreground ml-1">({characterGems} available)</span>
            </Button>
          )}
        </div>
      )}

      {/* Party Sessions */}
      {partySessions.length > 0 && (
        <div className="bg-card border border-cyan-500/20 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Party Portals
          </h3>
          {partySessions.map(ps => (
            <div key={ps.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
              <div className="text-xs">
                <span className="text-foreground">Wave {ps.wave}</span>
                <span className="text-muted-foreground ml-2">Lv.{ps.portalLevel}</span>
                <span className="text-muted-foreground ml-2">{ps.memberCount}/4 players</span>
              </div>
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/30 hover:bg-cyan-500/10" onClick={() => handleJoinSession(ps.id)} disabled={loading}>
                Join
              </Button>
            </div>
          ))}
        </div>
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

      {/* Max Level Banner */}
      {portalLevel >= 100 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center space-y-2">
          <Crown className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-orbitron text-lg font-bold text-amber-300">Portal Level 100 - Maximum Power!</h3>
          <p className="text-sm text-amber-400/80">Mysterious and glorious rewards are awaiting those who dare to push beyond...</p>
        </div>
      )}

      {/* Leaderboard */}
      <PortalLeaderboard character={character} />

      {/* Info */}
      <div className="bg-card/50 border border-border/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-bold text-foreground text-sm mb-2">How it works</p>
        <p>- Requires Level {minLevel} to enter</p>
        <p>- Enemies spawn infinitely, getting stronger each wave</p>
        <p>- When all players die, the portal records your highest wave</p>
        <p>- Drops unique/legendary gear only — the best farming ground!</p>
        <p>- Rewards: Gold, EXP, Magic Dust, Portal Shards, and unique gear</p>
        <p>- Use Portal Shards to upgrade the portal (stronger enemies = better loot)</p>
        <p>- Up to 4 party members can fight together</p>
        <p>- Boss waves appear every 10 waves with guaranteed shard drops</p>
        <p>- {maxEntries} entries per day (reset with gems)</p>
      </div>
    </div>
  );
}
