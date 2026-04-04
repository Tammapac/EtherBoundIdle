import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Swords, Skull, Shield, Zap, Play, Pause, LogOut, Users, Crown,
  Trophy, Heart, Coins, Star, Gem, Sparkles, Timer, Lock, ChevronRight,
} from "lucide-react";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import HealthBar from "@/components/game/HealthBar";

const ZONE_THEMES = {
  verdant_forest:  { label: "Verdant Forest",  color: "emerald", bg: "from-emerald-900/40 to-emerald-950/60", border: "border-emerald-500/40", text: "text-emerald-400", accent: "bg-emerald-500" },
  scorched_desert: { label: "Scorched Desert", color: "orange",  bg: "from-orange-900/40 to-orange-950/60",  border: "border-orange-500/40",  text: "text-orange-400",  accent: "bg-orange-500" },
  frozen_peaks:    { label: "Frozen Peaks",    color: "cyan",    bg: "from-cyan-900/40 to-cyan-950/60",    border: "border-cyan-500/40",    text: "text-cyan-400",    accent: "bg-cyan-500" },
  shadow_realm:    { label: "Shadow Realm",    color: "purple",  bg: "from-purple-900/40 to-purple-950/60",  border: "border-purple-500/40",  text: "text-purple-400",  accent: "bg-purple-500" },
  celestial_spire: { label: "Celestial Spire", color: "amber",   bg: "from-amber-900/40 to-amber-950/60",   border: "border-amber-500/40",   text: "text-amber-400",   accent: "bg-amber-500" },
};

const CLASS_COLORS = { warrior: "text-red-400", mage: "text-blue-400", ranger: "text-green-400", rogue: "text-purple-400" };

function formatHp(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatTime(ms) {
  if (ms <= 0) return "0:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Boss Combat View ──────────────────────────────────────────────────────
function WorldBossCombat({ boss, character, onLeave }) {
  const [session, setSession] = useState(null);
  const [myEntry, setMyEntry] = useState(null);
  const [topDamagers, setTopDamagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoFight, setAutoFight] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState(null);
  const autoFightRef = useRef(false);
  const logRef = useRef(null);
  const { toast } = useToast();

  // Skills — computed early so auto-fight can use them
  const allClassSkills = CLASS_SKILLS[character?.class || "warrior"] || [];
  const hotbarIds = character?.hotbar_skills?.length > 0 ? character.hotbar_skills : (character?.skills || []);
  const charSkills = hotbarIds.map(sid => allClassSkills.find(s => s.id === sid)).filter(Boolean).slice(0, 6);

  useEffect(() => { autoFightRef.current = autoFight; }, [autoFight]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session?.combat_log?.length]);

  // Join the boss fight on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("worldBossAction", {
          action: "join", characterId: character.id, zone: boss.zone,
        });
        if (res?.session) setSession(res.session);
        if (res?.myEntry) setMyEntry(res.myEntry);
      } catch (err) {
        toast({ title: err.message || "Failed to join", variant: "destructive" });
      }
    })();
  }, [boss.zone, character.id]);

  // Poll every 2s
  useEffect(() => {
    if (!boss.zone) return;
    const iv = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("worldBossAction", {
          action: "poll", characterId: character.id, zone: boss.zone,
        });
        if (res?.session) setSession(res.session);
        if (res?.myEntry) setMyEntry(res.myEntry);
        if (res?.topDamagers) setTopDamagers(res.topDamagers);
      } catch {}
    }, 2000);
    return () => clearInterval(iv);
  }, [boss.zone, character.id]);

  const doAction = useCallback(async (actionType, skillId) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("worldBossAction", {
        action: actionType, characterId: character.id, zone: boss.zone, skillId,
      });
      if (res?.success === false && res?.error) return;
      if (res?.session) setSession(res.session);
      if (res?.myEntry) setMyEntry(res.myEntry);
      if (res?.bossDefeated) {
        setAutoFight(false);
        toast({ title: "Boss Defeated!", description: "Claim your rewards!" });
      }
    } catch (err) {
      setAutoFight(false);
      toast({ title: err.message || "Action failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [loading, boss.zone, character.id]);

  // Auto-fight — cycles through skills for higher damage
  const autoSkillIdx = useRef(0);
  useEffect(() => {
    if (!autoFight || loading) return;
    if (session?.status === "active" && myEntry?.hp > 0) {
      const timer = setTimeout(() => {
        if (!autoFightRef.current) return;
        if (charSkills.length > 0) {
          const skill = charSkills[autoSkillIdx.current % charSkills.length];
          autoSkillIdx.current++;
          if (skill?.damage > 0) {
            doAction("skill", skill.id);
          } else {
            doAction("attack");
          }
        } else {
          doAction("attack");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoFight, session, loading, doAction, myEntry?.hp, charSkills]);

  useEffect(() => {
    if (session?.status !== "active") setAutoFight(false);
  }, [session?.status]);

  const handleClaim = async () => {
    try {
      const res = await base44.functions.invoke("worldBossAction", {
        action: "claim_rewards", characterId: character.id, zone: boss.zone,
      });
      if (res?.rewards) {
        setRewards(res.rewards);
        setShowRewards(true);
      }
    } catch (err) {
      toast({ title: err.message || "Failed to claim", variant: "destructive" });
    }
  };

  const [bulkLoading, setBulkLoading] = useState(false);
  const doBulkAttack = async (pack) => {
    if (bulkLoading) return;
    setBulkLoading(true);
    try {
      const res = await base44.functions.invoke("worldBossAction", {
        action: "bulk_attack", characterId: character.id, zone: boss.zone, pack,
      });
      if (res?.session) setSession(res.session);
      if (res?.myEntry) setMyEntry(res.myEntry);
      if (res?.bossDefeated) {
        setAutoFight(false);
        toast({ title: "Boss Defeated!", description: res?.message });
      } else {
        toast({ title: res?.message || "Bulk attack complete!" });
      }
    } catch (err) {
      toast({ title: err.message || "Bulk attack failed", variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  const BULK_PACKS = [
    { id: "x10",  attacks: 10,  gems: 50  },
    { id: "x50",  attacks: 50,  gems: 250 },
    { id: "x100", attacks: 100, gems: 500 },
  ];

  const theme = ZONE_THEMES[boss.zone] || ZONE_THEMES.verdant_forest;
  const participants = session?.participants || [];
  const bossHp = session?.boss_hp ?? boss.bossHp;
  const bossMaxHp = session?.boss_max_hp ?? boss.bossMaxHp;
  const bossName = session?.boss_name ?? boss.bossName;
  const bossIcon = session?.boss_icon ?? boss.bossIcon;
  const combatLog = session?.combat_log || [];
  const isDefeated = session?.status === "defeated";
  const isExpired = session?.status === "expired";
  const isActive = session?.status === "active";
  const isDead = myEntry && myEntry.hp <= 0;
  const myMaxAttacks = myEntry?.maxAttacks || 50;
  const attacksLeft = myEntry ? (myMaxAttacks - (myEntry.attacks || 0)) : 50;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-3">
      {/* Boss Card — Top Center */}
      <div className={`bg-gradient-to-b ${theme.bg} border-2 ${theme.border} rounded-2xl p-4 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-destructive gap-1">
              <LogOut className="w-3.5 h-3.5" /> Leave
            </Button>
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />{participants.length} fighters
            </Badge>
            <div className="flex items-center gap-2">
              {isActive && (
                <Button
                  variant={autoFight ? "default" : "outline"} size="sm"
                  onClick={() => setAutoFight(!autoFight)}
                  className={`gap-1.5 text-xs ${autoFight ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-muted-foreground hover:text-emerald-400 border-emerald-500/30"}`}
                >
                  {autoFight ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {autoFight ? "Auto ON" : "Auto OFF"}
                </Button>
              )}
            </div>
          </div>

          <span className="text-4xl block mb-1">{bossIcon}</span>
          <h2 className={`font-orbitron text-xl font-bold ${theme.text}`}>{bossName}</h2>
          <p className="text-xs text-muted-foreground mb-2">{theme.label} World Boss</p>

          {/* Boss HP Bar */}
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between text-xs mb-1">
              <span className={theme.text}>{formatHp(Math.max(0, bossHp))}</span>
              <span className="text-muted-foreground">{formatHp(bossMaxHp)}</span>
            </div>
            <div className="h-5 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className={`h-full ${theme.accent} rounded-full`}
                initial={{ width: "100%" }}
                animate={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
              <span>{((bossHp / bossMaxHp) * 100).toFixed(2)}% HP</span>
              {myEntry && <span>Your DMG: {formatHp(myEntry.totalDamage || 0)} | Attacks: {myEntry.attacks || 0}/{myMaxAttacks}</span>}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex justify-center gap-2 mt-2">
            {isDefeated && <Badge className="bg-green-500/20 text-green-400 border-green-500/40 animate-pulse">DEFEATED</Badge>}
            {isExpired && <Badge className="bg-red-500/20 text-red-400 border-red-500/40">EXPIRED</Badge>}
            {isActive && boss.timeRemaining > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                <Timer className="w-3 h-3 mr-1" />{formatTime(boss.timeRemaining)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {isActive && myEntry && myEntry.hp > 0 && (
        <div className="bg-card border border-border rounded-xl p-2 space-y-1.5">
          {attacksLeft > 0 && (
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
                  : elem ? `border-current/30 ${elem.color}` : "border-violet-500/30 text-secondary";
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
          )}
          {attacksLeft <= 0 && (
            <p className="text-xs text-amber-400 text-center font-semibold">Max attacks reached! Use bulk attacks below:</p>
          )}
          {/* Bulk attack buttons — always visible */}
          <div className="flex gap-1.5 justify-center border-t border-border/30 pt-1.5">
            {BULK_PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => doBulkAttack(pack.id)}
                disabled={bulkLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-600/20 hover:bg-amber-600/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="font-bold text-amber-300">x{pack.attacks}</span>
                <span className="text-[10px] text-violet-300 flex items-center gap-0.5"><Gem className="w-2.5 h-2.5" />{pack.gems}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KO */}
      {isDead && isActive && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
          <Skull className="w-6 h-6 text-red-400 mx-auto mb-1" />
          <p className="text-sm text-red-400 font-bold">You've been knocked out!</p>
          <p className="text-xs text-muted-foreground">Wait for the boss to be defeated to claim rewards.</p>
        </div>
      )}

      {/* Claim Button */}
      {isDefeated && myEntry && !myEntry.claimed && (
        <Button onClick={handleClaim} className="w-full h-12 font-orbitron gap-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 border border-amber-500/30 shadow-lg shadow-amber-500/20">
          <Sparkles className="w-5 h-5" /> Claim Rewards
        </Button>
      )}

      {/* Two columns: participants + log */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Participants — compact cards */}
        <div className="bg-card border border-border rounded-xl p-3">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Fighters ({participants.length})
          </h3>
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
            {[...participants]
              .sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0))
              .slice(0, 30)
              .map((p, i) => {
                const isMe = p.characterId === character.id;
                const pDead = p.hp <= 0;
                return (
                  <div
                    key={p.characterId}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] ${
                      isMe ? "border-violet-500/40 bg-violet-500/5" : "border-border/30 bg-card/50"
                    } ${pDead ? "opacity-40" : ""}`}
                  >
                    {i < 3 && <Crown className={`w-3 h-3 flex-shrink-0 ${i === 0 ? "text-amber-400" : i === 1 ? "text-gray-300" : "text-amber-700"}`} />}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${CLASS_COLORS[p.class] || "text-foreground"}`}>
                        {p.name} {isMe && <span className="text-muted-foreground">(You)</span>}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground capitalize">{p.class}</span>
                        <span className="text-muted-foreground">Lv.{p.level}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-amber-400">{formatHp(p.totalDamage || 0)}</p>
                      {/* Mini HP bar */}
                      <div className="w-10 h-1 bg-black/40 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-card border border-border rounded-xl p-3">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Battle Log</h3>
          <div ref={logRef} className="max-h-64 overflow-y-auto space-y-0.5 text-xs">
            {combatLog.slice(-30).reverse().map((log, i) => (
              <p key={i} className={`${i === 0 ? "opacity-100" : "opacity-60"} ${
                log.type === "player_attack" ? "text-green-400" :
                log.type === "boss_attack" ? "text-red-400" :
                log.type === "heal" ? "text-emerald-400" :
                log.type === "victory" ? "text-yellow-400 font-bold" :
                "text-muted-foreground"
              }`}>
                {log.text}
              </p>
            ))}
            {combatLog.length === 0 && <p className="text-muted-foreground italic">Waiting for combat...</p>}
          </div>
        </div>
      </div>

      {/* Top Damagers sidebar */}
      {topDamagers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" /> Damage Rankings
          </h3>
          <div className="space-y-1">
            {topDamagers.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-5 text-center font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                  #{i + 1}
                </span>
                <span className={`flex-1 ${CLASS_COLORS[p.class] || ""}`}>{p.name}</span>
                <span className="text-amber-400 font-bold">{formatHp(p.totalDamage)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      <AnimatePresence>
        {showRewards && rewards && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-card border-2 border-amber-500/40 rounded-2xl p-6 max-w-md w-full mx-4 text-center space-y-4"
            >
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto" />
              <h2 className="font-orbitron text-2xl font-bold text-amber-400">World Boss Rewards!</h2>
              <p className="text-muted-foreground">
                Rank <span className="text-amber-400 font-bold">#{rewards.rank}</span> of {rewards.totalParticipants} | Damage: <span className="text-amber-400">{rewards.damageFormatted}</span>
              </p>
              <div className="bg-black/30 rounded-xl p-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-400" /> Gold</span>
                  <span className="text-yellow-400 font-bold">{rewards.gold?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-blue-400" /> EXP</span>
                  <span className="text-blue-400 font-bold">{rewards.exp?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Gem className="w-3 h-3 text-violet-400" /> Gems</span>
                  <span className="text-violet-400 font-bold">{rewards.gems}</span>
                </div>
                {rewards.items?.length > 0 && (
                  <div className="border-t border-border pt-2 mt-2 space-y-1">
                    <p className="text-xs font-bold text-amber-400">Items Received:</p>
                    {rewards.items.map((item, i) => (
                      <p key={i} className="text-xs text-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => { setShowRewards(false); onLeave(); }} className="w-full bg-amber-600 hover:bg-amber-700">
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Boss Selection View ───────────────────────────────────────────────────
export default function WorldBoss({ character }) {
  const [selectedBoss, setSelectedBoss] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statusData, refetch } = useQuery({
    queryKey: ["worldBossStatus", character?.id],
    queryFn: () => base44.functions.invoke("worldBossAction", { action: "get_status", characterId: character.id }),
    enabled: !!character?.id,
    refetchInterval: 10000,
  });

  const bosses = statusData?.bosses || [];

  // If we're in combat, show combat view
  if (selectedBoss) {
    return (
      <WorldBossCombat
        boss={selectedBoss}
        character={character}
        onLeave={() => { setSelectedBoss(null); refetch(); }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/30 to-amber-600/30 border-2 border-red-500/50 flex items-center justify-center">
            <Skull className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="font-orbitron text-2xl font-bold tracking-wide">World Bosses</h1>
            <p className="text-sm text-muted-foreground">One boss spawns every 4 hours, rotating through the zones. Deal damage to earn rewards!</p>
          </div>
        </div>
      </div>

      {/* Boss List — one active, others show rotation schedule */}
      <div className="space-y-3">
        {bosses.map((boss) => {
          const theme = ZONE_THEMES[boss.zone] || ZONE_THEMES.verdant_forest;
          const isActive = boss.status === "active";
          const isDefeated = boss.status === "defeated";
          const isExpired = boss.status === "expired";
          const isInactive = boss.status === "inactive";
          const isCurrent = boss.isCurrentBoss;
          const locked = !boss.meetsLevel;
          const canClick = isCurrent && !locked && (isActive || isDefeated);
          const hpPercent = boss.bossMaxHp > 0 ? (boss.bossHp / boss.bossMaxHp) * 100 : 100;

          return (
            <motion.div
              key={boss.zone}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-r ${theme.bg} border ${isCurrent ? `${theme.border} border-2` : "border-border/30"} rounded-xl p-4 ${
                isInactive ? "opacity-40" : locked ? "opacity-50" : canClick ? "cursor-pointer hover:brightness-110" : ""
              } transition-all`}
              onClick={() => {
                if (isInactive) { toast({ title: `Next in ${formatTime(boss.nextActiveAt)}` }); return; }
                if (locked) { toast({ title: `Level ${boss.minLevel} required`, variant: "destructive" }); return; }
                if (isExpired) { toast({ title: "Boss has expired, next one spawns soon" }); return; }
                if (!isCurrent) return;
                setSelectedBoss(boss);
              }}
            >
              <div className="flex items-center gap-4">
                {/* Boss icon */}
                <div className={`w-14 h-14 rounded-xl bg-black/30 border ${isCurrent ? theme.border : "border-border/30"} flex items-center justify-center flex-shrink-0`}>
                  {locked ? <Lock className="w-6 h-6 text-muted-foreground" /> : <span className="text-3xl">{boss.bossIcon}</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-orbitron font-bold ${isCurrent ? theme.text : "text-muted-foreground"}`}>{boss.bossName}</h3>
                    {isCurrent && isActive && <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[10px] animate-pulse">NOW ACTIVE</Badge>}
                    {isCurrent && isDefeated && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">DEFEATED</Badge>}
                    {isCurrent && isExpired && <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">EXPIRED</Badge>}
                    {isInactive && <Badge variant="outline" className="text-[10px] text-muted-foreground">Next in {formatTime(boss.nextActiveAt)}</Badge>}
                    {locked && <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">Lv.{boss.minLevel}+</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{theme.label} · Lv.{boss.minLevel}+ · {boss.bossElement}</p>

                  {/* HP Bar — only for current boss */}
                  {isCurrent && (isActive || isDefeated) && (
                    <div className="mt-1.5">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className={theme.text}>{formatHp(Math.max(0, boss.bossHp))}</span>
                        <span className="text-muted-foreground">{formatHp(boss.bossMaxHp)}</span>
                      </div>
                      <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${theme.accent} rounded-full transition-all duration-500`} style={{ width: `${hpPercent}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    {boss.participantCount > 0 && (
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {boss.participantCount}</span>
                    )}
                    {boss.myDamage > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-400"><Swords className="w-3 h-3" /> {formatHp(boss.myDamage)}</span>
                    )}
                    {isCurrent && isActive && boss.timeRemaining > 0 && (
                      <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" /> {formatTime(boss.timeRemaining)}</span>
                    )}
                    {boss.myClaimed && <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/40 h-4 px-1">CLAIMED</Badge>}
                  </div>
                </div>

                {/* Arrow — only for clickable current boss */}
                {canClick && (
                  <ChevronRight className={`w-5 h-5 ${theme.text} flex-shrink-0`} />
                )}
              </div>
            </motion.div>
          );
        })}

        {bosses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Skull className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Loading world bosses...</p>
          </div>
        )}
      </div>
    </div>
  );
}
