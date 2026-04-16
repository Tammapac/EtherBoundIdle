import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PixelButton from "@/components/game/PixelButton";
import PixelBar from "@/components/game/PixelBar";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, LogOut, Crown, Skull, Clock, User, ScrollText } from "lucide-react";
import { SKILLS, CLASSES } from "@/lib/gameData";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import PlayerProfileModal from "@/components/game/PlayerProfileModal";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

function getSkillSpriteFolder(skillId) {
  if (!skillId) return null;
  if (skillId.startsWith("m_")) return "mage";
  if (skillId.startsWith("w_")) return "warrior";
  if (skillId.startsWith("ro_")) return "rogue";
  if (skillId.startsWith("r_")) return "ranger";
  return null;
}

const CLASS_COLORS = {
  warrior: "text-red-400", mage: "text-blue-400",
  ranger: "text-green-400", rogue: "text-purple-400",
};

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
    <Badge
      variant="outline"
      className={`flex items-center gap-1 font-bold text-xs ${
        remaining <= 3
          ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse"
          : "text-yellow-400 border-yellow-500/50 bg-yellow-500/10"
      }`}
    >
      <Clock className="w-3 h-3" /> {remaining}s
    </Badge>
  );
}

/* ── Player Card ────────────────────────────────────────────────────────── */
function PlayerCard({ member, character, session, charSkills, isMyTurn, loading, doAction, onProfileClick, equippedPet }) {
  const isMe = member.character_id === character.id;
  const isActive = session.status === 'active' && session.current_turn_index === session.members?.indexOf(member);
  const isDead = member.hp <= 0;

  const PET_ICONS = { Wolf: "🐺", Phoenix: "🔥", Dragon: "🐉", Turtle: "🐢", Cat: "🐱", Owl: "🦉", Slime: "🫧", Fairy: "🧚", Serpent: "🐍", Golem: "🪨" };
  const PET_EVO = ["", "⭐", "👑"];
  const RARITY_COLORS = { common: "text-gray-400", uncommon: "text-green-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-amber-400", mythic: "text-red-400" };

  return (
    <div
      className={`bg-card border border-border rounded-xl p-3 rpg-frame flex flex-col gap-2 cursor-pointer transition-all hover:border-primary/40 ${
        isActive ? "ring-2 ring-yellow-500/60 border-yellow-500/50" : ""
      } ${isDead ? "opacity-50" : ""}`}
      onClick={() => onProfileClick(member)}
    >
      {/* Player Name & Role */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <img
              src={`/sprites/class_${member.class || "warrior"}.png`}
              alt={member.class}
              className="w-8 h-8"
              style={{ imageRendering: "pixelated", opacity: isDead ? 0.4 : 1 }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {member.character_id === session.leader_id && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
              <span className={`text-sm font-bold truncate ${CLASS_COLORS[member.class] || "text-foreground"}`}>
                {member.name}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Lv.{member.level} {member.class}
            </span>
          </div>
        </div>
        {isActive && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shrink-0">TURN</Badge>
        )}
        {isDead && (
          <Badge variant="destructive" className="text-[9px] h-4 px-1.5 shrink-0">KO</Badge>
        )}
      </div>

      {/* HP & MP Bars — using game's PixelBar component */}
      <PixelBar current={Math.max(0, member.hp)} max={member.max_hp} type="hp" label="HP" />
      <PixelBar current={Math.max(0, member.mp || 0)} max={member.max_mp || 0} type="mp" label="MP" />

      {/* Status Effects (buff/debuff slots) */}
      {(member.buffs || []).length > 0 && (
        <div className="flex gap-1">
          {(member.buffs || []).slice(0, 4).map((buff, bi) => (
            <div
              key={bi}
              className={`w-6 h-6 flex items-center justify-center rounded-md border ${
                buff.type === "defense" ? "bg-blue-500/20 border-blue-500/40" : "bg-orange-500/20 border-orange-500/40"
              }`}
              title={buff.name || buff.type}
            >
              <span className="text-xs">{buff.type === "defense" ? "🛡" : "⚔"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pet */}
      {isMe && equippedPet && (
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-sm leading-none">{PET_ICONS[equippedPet.species] || "🐾"}{PET_EVO[equippedPet.evolution || 0]}</span>
          <span className={`${RARITY_COLORS[equippedPet.rarity] || "text-gray-400"} truncate`}>
            {equippedPet.name || equippedPet.species} Lv.{equippedPet.level}
          </span>
        </div>
      )}

      {/* Skill hotbar — only on current player's card, at the bottom */}
      {isMe && charSkills.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1">
          {charSkills.slice(0, 6).map(skill => {
            const folder = getSkillSpriteFolder(skill.id);
            const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
            const buffColor = skill.buff === "defense"
              ? "border-blue-500/40 hover:border-blue-500/70 hover:bg-blue-500/10"
              : skill.buff === "attack"
              ? "border-orange-500/40 hover:border-orange-500/70 hover:bg-orange-500/10"
              : elem
              ? "border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/10"
              : "border-border hover:border-primary/60 hover:bg-primary/10";
            return (
              <button
                key={skill.id}
                onClick={(e) => { e.stopPropagation(); if (isMyTurn && !loading) doAction('skill', skill.id); }}
                disabled={!isMyTurn || loading}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border bg-background/40 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.03] transition-all ${buffColor}`}
                title={skill.description || skill.name}
                style={{ minWidth: 60 }}
              >
                {folder ? (
                  <img
                    src={`/sprites/skills/${folder}/${skill.id}.png`}
                    alt={skill.name}
                    style={{ width: 20, height: 20, imageRendering: "pixelated" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span className="text-sm leading-none">{elem?.icon || <Zap className="w-3.5 h-3.5 inline text-violet-400" />}</span>
                )}
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[10px] font-bold truncate max-w-[60px]">
                    {skill.name}
                  </span>
                  <span className="text-[9px] text-blue-400 font-semibold">
                    {skill.mp}MP
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Dungeon Combat ─────────────────────────────────────────────────── */
export default function DungeonCombat({ session: initialSession, character, onLeave }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const logRef = useRef(null);
  const combatPollInterval = useSmartPolling(POLL_INTERVALS.COMBAT);

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

  // Fallback poll for dungeon session updates
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

  const handleTurnExpire = () => {
    if (isMyTurn && !loading) doAction('attack');
  };

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
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <Skull className="w-4 h-4 text-red-400" />
          <h2 className="font-orbitron font-bold text-sm text-primary">
            {session.dungeon_name}
          </h2>
          {session.status === 'active' && (
            <Badge
              variant="outline"
              className={`text-[10px] ${
                isMyTurn ? "text-yellow-400 border-yellow-500/50 bg-yellow-500/10" : "text-muted-foreground"
              }`}
            >
              {isMyTurn ? "YOUR TURN" : `${currentTurnMember?.name || "..."}'s turn`}
            </Badge>
          )}
          {session.status === 'active' && session.turn_deadline && (
            <TurnTimer deadline={session.turn_deadline} onExpire={handleTurnExpire} />
          )}
        </div>
        <PixelButton variant="cancel" label="LEAVE" onClick={doLeave} />
      </div>

      {/* ── Main Content: Left (boss+party) + Right (actions+log) ────────── */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4">

        {/* ── Left Column: Boss + Party ─────────────────────────────────── */}
        <div className="flex-1 space-y-4 overflow-y-auto">

          {/* ── Boss Section ────────────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-xl p-4 rpg-frame flex flex-col items-center gap-3">
            {/* Boss Name */}
            <h1 className="font-orbitron font-bold text-xl text-primary tracking-wide">
              {session.boss_name}
            </h1>

            {/* Boss Sprite Container */}
            <div className="flex items-center justify-center bg-background/50 border border-border rounded-lg" style={{ width: 288, height: 208 }}>
              {session.boss_sprite ? (
                <img
                  src={session.boss_sprite}
                  alt={session.boss_name}
                  style={{ maxWidth: 200, maxHeight: 180, imageRendering: "pixelated" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Skull className="w-20 h-20 text-red-500" style={{ filter: "drop-shadow(0 0 8px rgba(220,38,38,0.4))" }} />
                  <span className="font-orbitron font-bold text-sm text-primary">
                    {session.boss_name}
                  </span>
                </div>
              )}
            </div>

            {/* Boss elemental info */}
            {(session.boss_element || session.boss_weakness || session.boss_resistance) && (
              <div className="flex gap-2 flex-wrap justify-center">
                {session.boss_element && (
                  <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-400 bg-orange-500/10">
                    ⚡ {session.boss_element}
                  </Badge>
                )}
                {session.boss_weakness && (
                  <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400 bg-green-500/10">
                    ▼ Weak: {session.boss_weakness}
                  </Badge>
                )}
                {session.boss_resistance && (
                  <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400 bg-red-500/10">
                    ▲ Resist: {session.boss_resistance}
                  </Badge>
                )}
              </div>
            )}

            {/* Boss HP Bar — using game's PixelBar component */}
            <div className="w-full max-w-xl">
              <PixelBar current={Math.max(0, session.boss_hp)} max={session.boss_max_hp} type="hp" label="BOSS HP" />
              {/* HP phase markers */}
              <div className="flex gap-1 mt-1.5">
                {[75, 50, 25].map(pct => (
                  <div
                    key={pct}
                    className={`flex-1 h-0.5 rounded-full ${bossHpPct < pct ? "bg-orange-500" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>

            {/* Attack button */}
            {session.status === 'active' && isMyTurn && myMember?.hp > 0 && (
              <PixelButton variant="ok" label="BASIC ATTACK" onClick={() => doAction('attack')} disabled={loading} size="lg" />
            )}
          </div>

          {/* ── Waiting / Result States ──────────────────────────────────── */}
          {session.status === 'waiting' && (
            <div className="bg-card border border-border rounded-xl p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Share Session ID with party:
              </p>
              <code className="text-xs bg-background/60 border border-border text-primary px-3 py-1.5 rounded block break-all select-all">
                {session.id}
              </code>
              {isLeader ? (
                <PixelButton variant="ok" label="START BATTLE" onClick={doStart} disabled={loading} size="lg" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for leader...
                </p>
              )}
            </div>
          )}

          {(session.status === 'victory' || session.status === 'defeat') && (
            <div className={`bg-card border rounded-xl p-4 text-center space-y-3 ${
              session.status === 'victory' ? "border-yellow-500/60" : "border-red-500/60"
            }`}>
              <p className={`font-orbitron font-bold text-2xl ${
                session.status === 'victory' ? "text-yellow-400" : "text-red-400"
              }`}>
                {session.status === 'victory' ? 'VICTORY!' : 'DEFEAT'}
              </p>
              {session.status === 'victory' && (() => {
                const rewardLogs = (session.combat_log || []).filter(e =>
                  e.type === "system" && (e.text?.includes("gold") || e.text?.includes("exp") || e.text?.includes("found") || e.text?.includes("Egg"))
                );
                return (
                  <div className="space-y-1">
                    <p className="font-orbitron font-bold text-sm text-yellow-400">REWARDS</p>
                    {rewardLogs.map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{r.text}</p>
                    ))}
                    {rewardLogs.length === 0 && (
                      <p className="text-xs text-muted-foreground">Rewards sent to your character!</p>
                    )}
                  </div>
                );
              })()}
              <PixelButton variant="cancel" label="RETURN TO DUNGEONS" onClick={doLeave} />
            </div>
          )}

          {/* ── Party Members Grid ───────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-xl p-3 rpg-frame">
            <div className="font-orbitron font-bold text-sm text-primary text-center mb-3 tracking-wide">
              PARTY MEMBERS ({session.members?.length || 0}/6)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(session.members || []).map((m) => (
                <PlayerCard
                  key={m.character_id}
                  member={m}
                  character={character}
                  session={session}
                  charSkills={charSkills}
                  isMyTurn={isMyTurn}
                  loading={loading}
                  doAction={doAction}
                  onProfileClick={setProfileTarget}
                  equippedPet={m.character_id === character.id ? equippedPetDC : null}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Actions + Combat Log (always visible) ────────── */}
        <div className="w-full md:w-80 flex flex-col gap-3">

          {/* My turn skill actions */}
          {session.status === 'active' && myMember && myMember.hp > 0 && (
            <div className="bg-card border border-border rounded-xl p-3 rpg-frame space-y-2">
              <p className={`font-orbitron font-bold text-xs ${isMyTurn ? "text-yellow-400" : "text-muted-foreground"}`}>
                {isMyTurn ? "YOUR TURN" : `${currentTurnMember?.name}'s turn...`}
              </p>
              <div className="space-y-1.5">
                {charSkills.map(skill => {
                  const folder = getSkillSpriteFolder(skill.id);
                  const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
                  const buffColor = skill.buff === "defense"
                    ? "border-blue-500/40 hover:border-blue-500/70 hover:bg-blue-500/5"
                    : skill.buff === "attack"
                    ? "border-orange-500/40 hover:border-orange-500/70 hover:bg-orange-500/5"
                    : elem
                    ? "border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/5"
                    : "border-border hover:border-primary/60 hover:bg-primary/5";
                  return (
                    <button
                      key={skill.id}
                      onClick={() => doAction('skill', skill.id)}
                      disabled={!isMyTurn || loading}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-background/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${buffColor}`}
                    >
                      <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                        {folder ? (
                          <img
                            src={`/sprites/skills/${folder}/${skill.id}.png`}
                            alt={skill.name}
                            style={{ width: 24, height: 24, imageRendering: "pixelated" }}
                            onError={e => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span className="text-base leading-none">{elem?.icon || "⚡"}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-xs truncate">
                          {skill.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          <span className="text-blue-400 font-semibold">{skill.mp}MP</span>
                          {skill.description ? ` · ${skill.description}` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {isMyTurn && (
                <p className="text-center text-[10px] text-muted-foreground">
                  Auto-attack in 5s if idle
                </p>
              )}
            </div>
          )}

          {/* Combat Log (always visible) */}
          <div className="bg-card border border-border rounded-xl p-3 rpg-frame flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <ScrollText className="w-4 h-4 text-yellow-400" />
              <span className="font-orbitron font-bold text-xs text-primary tracking-wide">COMBAT LOG</span>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto space-y-0.5 min-h-[120px]">
              {(session.combat_log || []).slice().reverse().map((entry, i) => {
                const isMyBossHit = entry.type === 'boss_attack' && entry.target === character?.name;
                return (
                  <p key={i} className={`text-[11px] ${
                    entry.type === 'victory' ? "text-yellow-400" :
                    entry.type === 'defeat' ? "text-red-400" :
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
              {(!session.combat_log || session.combat_log.length === 0) && (
                <p className="text-[11px] text-muted-foreground">
                  Waiting for combat to begin...
                </p>
              )}
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
