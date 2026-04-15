import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, LogOut, Crown, Skull, Clock, User } from "lucide-react";
import { SKILLS, CLASSES } from "@/lib/gameData";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";

function getSkillSpriteFolder(skillId) {
  if (!skillId) return null;
  if (skillId.startsWith("m_")) return "mage";
  if (skillId.startsWith("w_")) return "warrior";
  if (skillId.startsWith("ro_")) return "rogue";
  if (skillId.startsWith("r_")) return "ranger";
  return null;
}
import PlayerProfileModal from "@/components/game/PlayerProfileModal";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

const CLASS_COLORS = {
  warrior: "text-red-400", mage: "text-blue-400",
  ranger: "text-green-400", rogue: "text-purple-400",
};

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

function TurnTimer({ deadline, onExpire }) {
  const [remaining, setRemaining] = useState(8);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = setInterval(() => {
      const diff = Math.max(0, (new Date(deadline) - Date.now()) / 1000);
      setRemaining(Math.ceil(diff));
      if (diff <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(tick);
        onExpire?.();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
      remaining <= 3
        ? "text-destructive border-destructive/30 bg-destructive/10 animate-pulse"
        : "text-accent border-accent/30 bg-accent/10"
    }`}>
      <Clock className="w-3 h-3" /> {remaining}s
    </div>
  );
}

export default function DungeonCombat({ session: initialSession, character, onLeave }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const logRef = useRef(null);
  const combatPollInterval = useSmartPolling(POLL_INTERVALS.COMBAT);

  const PET_SPECIES_ICONS_DC = { Wolf:"🐺", Phoenix:"🔥", Dragon:"🐉", Turtle:"🐢", Cat:"🐱", Owl:"🦉", Slime:"🫧", Fairy:"🧚", Serpent:"🐍", Golem:"🪨" };
  const PET_EVO_SUFFIX_DC = ["", "⭐", "👑"];
  const RARITY_PET_COLORS_DC = { common:"text-gray-400", uncommon:"text-green-400", rare:"text-blue-400", epic:"text-purple-400", legendary:"text-amber-400", mythic:"text-red-400" };

  const { data: petDataDC } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    staleTime: 60000,
  });
  const equippedPetDC = (petDataDC?.pets || []).find(p => p.equipped);

  // Real-time dungeon combat updates via Socket.IO
  useEffect(() => {
    if (!session?.id) return;
    const handler = (e) => {
      const data = e.detail;
      if (data && data.id === session.id) setSession(prev => ({ ...prev, ...data }));
    };
    window.addEventListener("dungeon-combat-update", handler);
    return () => window.removeEventListener("dungeon-combat-update", handler);
  }, [session?.id]);

  // Fallback poll for dungeon session updates (reduced frequency, socket is primary)
  useEffect(() => {
    if (!session.id) return;
    const poll = async () => {
      try {
        const res = await base44.functions.invoke('dungeonAction', {
          action: 'get_session',
          characterId: character.id,
          sessionId: session.id,
        });
        if (res?.success && res.session) setSession(res.session);
      } catch {}
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [session.id, character.id]);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session.combat_log?.length]);

  const myIndex = session.members?.findIndex(m => m.character_id === character.id) ?? -1;
  const myMember = myIndex >= 0 ? session.members[myIndex] : null;
  const isMyTurn = session.status === 'active' && session.current_turn_index === myIndex;
  const isLeader = session.leader_id === character.id;
  const currentTurnMember = session.members?.[session.current_turn_index];

  const doAction = async (actionType, skillId) => {
    if (loading || !isMyTurn) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('dungeonAction', {
        action: actionType,
        characterId: character.id,
        sessionId: session.id,
        skillId,
      });
      if (res?.session) setSession(res.session);
    } finally {
      setLoading(false);
    }
  };

  const doStart = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('dungeonAction', {
        action: 'start',
        characterId: character.id,
        sessionId: session.id,
      });
      if (res?.session) setSession(res.session);
    } finally {
      setLoading(false);
    }
  };

  const doLeave = async () => {
    await base44.functions.invoke('dungeonAction', {
      action: 'leave',
      characterId: character.id,
      sessionId: session.id,
    });
    onLeave();
  };

  // Auto-attack when turn deadline expires
  const handleTurnExpire = () => {
    if (isMyTurn && !loading) doAction('attack');
  };

  // Use learned skills from CLASS_SKILLS (same as Battle.jsx)
  const allClassSkills = CLASS_SKILLS[character?.class || "warrior"] || [];
  const hotbarIds = character?.hotbar_skills?.length > 0
    ? character.hotbar_skills
    : (character?.skills || []);
  const charSkills = hotbarIds
    .map(sid => allClassSkills.find(s => s.id === sid))
    .filter(Boolean)
    .slice(0, 6);
  const bossHpPct = session.boss_max_hp > 0 ? (session.boss_hp / session.boss_max_hp) * 100 : 0;

  return (
    <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <Skull className="w-5 h-5 text-destructive" />
          <span className="font-orbitron font-bold text-lg">{session.dungeon_name}</span>
          <Badge variant="outline" className={
            session.status === 'active' ? "text-green-400 border-green-500/30" :
            session.status === 'victory' ? "text-yellow-400 border-yellow-500/30" :
            session.status === 'defeat' ? "text-destructive border-destructive/30" :
            "text-muted-foreground"
          }>
            {session.status === 'waiting' ? 'Waiting...' : session.status === 'active' ? 'In Combat' : session.status === 'victory' ? '🏆 Victory!' : '💀 Defeated'}
          </Badge>
          {/* Show whose turn it is */}
          {session.status === 'active' && (
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              isMyTurn ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-border bg-muted/30"
            }`}>
              {isMyTurn ? "⚔️ YOUR TURN" : `⏳ ${currentTurnMember?.name || "..."}'s turn`}
            </div>
          )}
        </div>
        <PixelButton variant="cancel" label="LEAVE" onClick={doLeave} />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4">
        {/* Left: Boss + Party */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Boss */}
          <div className="bg-card border-2 border-destructive/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                <Skull className="w-8 h-8 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-orbitron font-bold text-destructive text-lg">{session.boss_name}</p>
                <p className="text-xs text-muted-foreground">{Math.max(0, session.boss_hp).toLocaleString()} / {session.boss_max_hp.toLocaleString()} HP</p>
                {(session.boss_element || session.boss_weakness || session.boss_resistance) && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {session.boss_element && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/50 text-orange-400">⚡ {session.boss_element}</Badge>}
                    {session.boss_weakness && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/50 text-green-400">▼ Weak: {session.boss_weakness}</Badge>}
                    {session.boss_resistance && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-400">▲ Resist: {session.boss_resistance}</Badge>}
                  </div>
                )}
              </div>
              {session.status === 'active' && session.turn_deadline && (
                <TurnTimer deadline={session.turn_deadline} onExpire={handleTurnExpire} />
              )}
            </div>
            <HpBar
              current={session.boss_hp}
              max={session.boss_max_hp}
              color={bossHpPct > 50 ? "bg-destructive" : bossHpPct > 25 ? "bg-orange-500" : "bg-red-700 animate-pulse"}
            />
            {/* Boss HP phases */}
            <div className="flex gap-1 mt-2">
              {[75, 50, 25].map(pct => (
                <div key={pct} className={`flex-1 h-0.5 rounded-full ${bossHpPct < pct ? "bg-orange-500" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          {/* Party Members */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">
              PARTY ({session.members?.length || 0}/6)
            </p>
            <div className="space-y-2">
              {(session.members || []).map((m, idx) => {
                const isActive = session.status === 'active' && session.current_turn_index === idx;
                const hpPct = m.max_hp > 0 ? m.hp / m.max_hp : 0;
                return (
                  <div
                    key={m.character_id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer hover:bg-muted/50 ${
                      isActive ? "bg-primary/10 border border-primary/30" : "bg-muted/30"
                    }`}
                    onClick={() => setProfileTarget(m)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      m.hp <= 0 ? "bg-muted/30 text-muted-foreground" : "bg-primary/20 text-primary"
                    }`}>
                      <img src={`/sprites/class_${m.class || "warrior"}.png`} alt={m.class} className="w-6 h-6" style={{ imageRendering: "pixelated", opacity: m.hp <= 0 ? 0.4 : 1 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.character_id === session.leader_id && <Crown className="w-3 h-3 text-accent flex-shrink-0" />}
                        <span className={`text-xs font-medium ${CLASS_COLORS[m.class]} truncate`}>{m.name}</span>
                        <span className="text-xs text-muted-foreground">Lv.{m.level}</span>
                        {isActive && <Badge className="text-xs h-4 px-1 bg-primary/20 text-primary border-primary/30">TURN</Badge>}
                        {m.hp <= 0 && <Badge variant="destructive" className="text-xs h-4 px-1">KO</Badge>}
                      </div>
                      <HpBar
                        current={m.hp}
                        max={m.max_hp}
                        color={hpPct > 0.5 ? "bg-green-500" : hpPct > 0.25 ? "bg-yellow-500" : "bg-red-500"}
                      />
                      {m.character_id === character.id && equippedPetDC && (() => {
                        const icon = PET_SPECIES_ICONS_DC[equippedPetDC.species] || "🐾";
                        const evoSuffix = PET_EVO_SUFFIX_DC[equippedPetDC.evolution || 0] || "";
                        const rarityColor = RARITY_PET_COLORS_DC[equippedPetDC.rarity] || "text-gray-400";
                        const xpPct = Math.min(100, ((equippedPetDC.xp || 0) / 500) * 100);
                        return (
                          <div className="mt-1 flex items-center gap-1.5 bg-muted/20 border border-border/50 rounded-lg px-2 py-1">
                            <span className="text-sm leading-none">{icon}{evoSuffix}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[9px] font-semibold leading-none truncate ${rarityColor}`}>
                                {equippedPetDC.name || equippedPetDC.species} Lv.{equippedPetDC.level}
                              </p>
                              <div className="h-0.5 bg-gray-700 rounded-full mt-0.5 overflow-hidden">
                                <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${xpPct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Session ID share + Start */}
            {session.status === 'waiting' && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-xs text-muted-foreground">Share Session ID with party:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all select-all">{session.id}</code>
                {isLeader && (
                  <PixelButton variant="ok" label="START BATTLE" onClick={doStart} disabled={loading} />
                )}
                {!isLeader && (
                  <p className="text-xs text-center text-muted-foreground">Waiting for leader to start...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions + Log */}
        <div className="w-full md:w-72 space-y-3 flex flex-col">
          {/* My turn actions */}
          {session.status === 'active' && myMember && myMember.hp > 0 && (
            <div className="bg-card border border-border rounded-xl p-3 space-y-2">
              <p className={`text-xs font-semibold ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
                {isMyTurn ? "⚡ YOUR TURN — Act now!" : `⏳ ${currentTurnMember?.name}'s turn...`}
              </p>
              <PixelButton variant="ok" label="BASIC ATTACK" onClick={() => doAction('attack')} disabled={!isMyTurn || loading} />
              {charSkills.map(skill => {
                const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
                const buffColor = skill.buff === "defense" ? "border-blue-500/50 text-blue-400"
                  : skill.buff === "attack" ? "border-orange-500/50 text-orange-400"
                  : elem ? `border-current/30 ${elem.color}`
                  : "border-violet-500/30 text-secondary";
                return (
                  <button
                    key={skill.id}
                    onClick={() => doAction('skill', skill.id)}
                    disabled={!isMyTurn || loading}
                    title={`${skill.description || skill.name}\n${skill.mp}MP`}
                    className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border bg-muted/20 hover:bg-muted/50 hover:scale-110 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] hover:border-primary/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 min-w-[52px] ${buffColor}`}
                  >
                    {(() => {
                      const folder = getSkillSpriteFolder(skill.id);
                      return folder
                        ? <img src={`/sprites/skills/${folder}/${skill.id}.png`} alt={skill.name} style={{ width: 24, height: 24, imageRendering: "pixelated" }} onError={e => { e.target.style.display = "none"; }} />
                        : <span className="text-sm leading-none">{elem?.icon || <Zap className="w-3 h-3 inline" />}</span>;
                    })()}
                    <span className="text-[9px] font-medium leading-none text-center max-w-[60px] truncate">{skill.name}</span>
                    <span className="text-[8px] text-muted-foreground">{skill.mp}MP</span>
                  </button>
                );
              })}
              {isMyTurn && (
                <p className="text-xs text-center text-muted-foreground">Auto-attack in 5s if idle</p>
              )}
            </div>
          )}

          {/* Result panel */}
          {(session.status === 'victory' || session.status === 'defeat') && (
            <div className={`bg-card border-2 rounded-xl p-4 text-center space-y-3 ${
              session.status === 'victory' ? "border-yellow-500/50" : "border-destructive/50"
            }`}>
              <p className={`font-orbitron text-xl font-bold ${session.status === 'victory' ? "text-yellow-400" : "text-destructive"}`}>
                {session.status === 'victory' ? '🏆 VICTORY!' : '💀 DEFEAT'}
              </p>
              {session.status === 'victory' && (() => {
                const rewardLogs = (session.combat_log || []).filter(e =>
                  e.type === "system" && (e.text?.includes("gold") || e.text?.includes("exp") || e.text?.includes("found") || e.text?.includes("Egg"))
                );
                return (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-yellow-400">Rewards</p>
                    {rewardLogs.map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{r.text}</p>
                    ))}
                    {rewardLogs.length === 0 && <p className="text-xs text-muted-foreground">Rewards sent to your character!</p>}
                  </div>
                );
              })()}
              <PixelButton variant="cancel" label="RETURN TO DUNGEONS" onClick={doLeave} />
            </div>
          )}

          {/* Combat Log */}
          <div className="bg-card border border-border rounded-xl p-3 flex-1 min-h-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2">COMBAT LOG</p>
            <div ref={logRef} className="space-y-0.5 max-h-64 md:max-h-full overflow-y-auto">
              {(session.combat_log || []).slice().reverse().map((entry, i) => {
                const isMyBossHit = entry.type === 'boss_attack' && entry.target === character?.name;
                return (
                  <p key={i} className={`text-xs ${
                    entry.type === 'victory' ? "text-yellow-400 font-semibold" :
                    entry.type === 'defeat' ? "text-destructive font-semibold" :
                    entry.type === 'player_attack' ? "text-foreground" :
                    isMyBossHit ? "text-red-400 font-semibold" :
                    entry.type === 'boss_attack' ? "text-orange-400" :
                    entry.type === 'heal' ? "text-green-400" :
                    "text-muted-foreground"
                  }`}>
                    {entry.text}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Player Profile Modal */}
      {profileTarget && (
        <PlayerProfileModal
          characterId={profileTarget.character_id}
          characterName={profileTarget.name}
          onClose={() => setProfileTarget(null)}
        />
      )}
    </div>
  );
}