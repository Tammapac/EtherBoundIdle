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

/* ── Pixel-art CSS helper classes (inline styles to avoid global CSS) ────── */
const pixelBorder = {
  border: "4px solid #d4af37",
  boxShadow: "inset 2px 2px 0 #c9a227, inset -2px -2px 0 #8b7355, 4px 4px 0 rgba(0,0,0,0.5)",
};
const pixelBorderThin = {
  border: "2px solid #d4af37",
  boxShadow: "inset 1px 1px 0 #c9a227, inset -1px -1px 0 #8b7355",
};
const pixelInset = {
  border: "2px solid #8b7355",
  boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.5), inset -1px -1px 0 #c9a227",
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
    <div className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded border ${
      remaining <= 3
        ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse"
        : "text-yellow-400 border-yellow-500/50 bg-yellow-500/10"
    }`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
      <Clock className="w-3 h-3" /> {remaining}s
    </div>
  );
}

/* ── Player Card (RPG-style, matching ZIP2 reference) ────────────────────── */
function PlayerCard({ member, character, session, charSkills, isMyTurn, loading, doAction, onProfileClick, equippedPet }) {
  const isMe = member.character_id === character.id;
  const isActive = session.status === 'active' && session.current_turn_index === session.members?.indexOf(member);
  const isDead = member.hp <= 0;
  const hpPct = member.max_hp > 0 ? (member.hp / member.max_hp) * 100 : 0;
  const mpPct = member.max_mp > 0 ? ((member.mp || 0) / member.max_mp) * 100 : 0;

  const PET_ICONS = { Wolf:"🐺", Phoenix:"🔥", Dragon:"🐉", Turtle:"🐢", Cat:"🐱", Owl:"🦉", Slime:"🫧", Fairy:"🧚", Serpent:"🐍", Golem:"🪨" };
  const PET_EVO = ["", "⭐", "👑"];
  const RARITY_COLORS = { common:"text-gray-400", uncommon:"text-green-400", rare:"text-blue-400", epic:"text-purple-400", legendary:"text-amber-400", mythic:"text-red-400" };

  return (
    <div
      className={`p-2 flex flex-col gap-1.5 cursor-pointer transition-all ${
        isActive ? "ring-1 ring-yellow-500/60" : ""
      } ${isDead ? "opacity-50" : ""}`}
      style={{
        ...pixelBorderThin,
        background: isActive ? "rgba(212,175,55,0.08)" : "#1b263b",
        borderRadius: 0,
      }}
      onClick={() => onProfileClick(member)}
    >
      {/* Player Name & Role */}
      <div className="flex justify-between items-center gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <img
            src={`/sprites/class_${member.class || "warrior"}.png`}
            alt={member.class}
            className="w-6 h-6 shrink-0"
            style={{ imageRendering: "pixelated", opacity: isDead ? 0.4 : 1 }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {member.character_id === session.leader_id && <Crown className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
              <span className={`text-[7px] font-medium truncate ${CLASS_COLORS[member.class] || "text-foreground"}`}
                style={{ fontFamily: "'Press Start 2P', monospace" }}>
                {member.name}
              </span>
            </div>
            <span className="text-[6px] text-muted-foreground" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              Lv.{member.level} {member.class}
            </span>
          </div>
        </div>
        {isActive && (
          <Badge className="text-[6px] h-3.5 px-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shrink-0">TURN</Badge>
        )}
        {isDead && (
          <Badge variant="destructive" className="text-[6px] h-3.5 px-1 shrink-0">KO</Badge>
        )}
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex justify-between mb-0.5" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#f0e6d3" }}>
          <span>HP</span>
          <span>{Math.max(0, Math.ceil(member.hp))}/{member.max_hp}</span>
        </div>
        <div className="h-2" style={{ ...pixelInset, background: "#2d5a27" }}>
          <div
            className="h-full transition-all duration-400"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 50 ? "#4ade80" : hpPct > 25 ? "#facc15" : "#ef4444",
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>

      {/* MP Bar */}
      <div>
        <div className="flex justify-between mb-0.5" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#f0e6d3" }}>
          <span>MP</span>
          <span>{Math.max(0, Math.ceil(member.mp || 0))}/{member.max_mp || 0}</span>
        </div>
        <div className="h-2" style={{ ...pixelInset, background: "#1e3a5f" }}>
          <div
            className="h-full transition-all duration-400"
            style={{
              width: `${mpPct}%`,
              background: "#60a5fa",
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>

      {/* Status Effects (buff/debuff slots) */}
      <div className="flex gap-0.5">
        {(member.buffs || []).slice(0, 3).map((buff, bi) => (
          <div key={bi} className="w-4 h-4 flex items-center justify-center rounded-sm"
            style={{ ...pixelInset, background: buff.type === "defense" ? "#1e3a5f" : "#5a3a1e" }}
            title={buff.name || buff.type}>
            <span className="text-[7px]">{buff.type === "defense" ? "🛡" : "⚔"}</span>
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 3 - (member.buffs?.length || 0)) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-4 h-4" style={{ ...pixelInset, background: "#1b263b" }} />
        ))}
      </div>

      {/* Skill Bar (only for current player) — readable size with name + MP */}
      {isMe && (
        <div className="flex gap-1 flex-wrap mt-1">
          {charSkills.slice(0, 6).map(skill => {
            const folder = getSkillSpriteFolder(skill.id);
            const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
            return (
              <button
                key={skill.id}
                onClick={(e) => { e.stopPropagation(); if (isMyTurn && !loading) doAction('skill', skill.id); }}
                disabled={!isMyTurn || loading}
                className="disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-all flex items-center gap-1 px-1.5 py-1"
                title={skill.description || skill.name}
                style={{ ...pixelInset, background: "#1b263b", minWidth: 52 }}
              >
                {folder ? (
                  <img src={`/sprites/skills/${folder}/${skill.id}.png`} alt={skill.name}
                    style={{ width: 18, height: 18, imageRendering: "pixelated" }}
                    onError={e => { e.target.style.display = "none"; }} />
                ) : (
                  <span className="text-sm leading-none">{elem?.icon || "⚡"}</span>
                )}
                <div className="flex flex-col items-start min-w-0">
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#f0e6d3" }} className="truncate max-w-[45px]">
                    {skill.name}
                  </span>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#60a5fa" }}>
                    {skill.mp}MP
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pet */}
      {isMe && equippedPet && (
        <div className="flex items-center gap-1 mt-0.5" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6 }}>
          <span className="text-xs leading-none">{PET_ICONS[equippedPet.species] || "🐾"}{PET_EVO[equippedPet.evolution || 0]}</span>
          <span className={`${RARITY_COLORS[equippedPet.rarity] || "text-gray-400"} truncate`}>
            {equippedPet.name || equippedPet.species} Lv.{equippedPet.level}
          </span>
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
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#0a0a14", color: "#f0e6d3" }}>
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "2px solid #d4af37" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Skull className="w-4 h-4 text-red-400" />
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#d4af37" }}>
            {session.dungeon_name}
          </span>
          {session.status === 'active' && (
            <div className={`px-2 py-0.5 rounded border ${
              isMyTurn ? "text-yellow-400 border-yellow-500/50 bg-yellow-500/10" : "text-muted-foreground border-gray-600 bg-gray-800/50"
            }`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>
              {isMyTurn ? "YOUR TURN" : `${currentTurnMember?.name || "..."}'s turn`}
            </div>
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

        {/* ── Boss Section (top, centered) ──────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          {/* Boss Name */}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#d4af37", letterSpacing: "0.1em" }}>
            {session.boss_name}
          </div>

          {/* Boss Sprite Container */}
          <div className="flex items-center justify-center" style={{
            ...pixelBorder,
            background: "#0d1b2a",
            width: 288,
            height: 208,
            borderRadius: 0,
          }}>
            {/* Boss sprite placeholder - replace with actual boss sprite when available */}
            <div className="flex flex-col items-center gap-2">
              <Skull className="w-16 h-16 text-red-400" style={{ opacity: 0.6 }} />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8b7355" }}>
                Boss Sprite
              </span>
            </div>
          </div>

          {/* Boss elemental info */}
          {(session.boss_element || session.boss_weakness || session.boss_resistance) && (
            <div className="flex gap-2 flex-wrap justify-center">
              {session.boss_element && (
                <span className="px-2 py-0.5 rounded border border-orange-500/50 text-orange-400" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>
                  ⚡ {session.boss_element}
                </span>
              )}
              {session.boss_weakness && (
                <span className="px-2 py-0.5 rounded border border-green-500/50 text-green-400" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>
                  ▼ Weak: {session.boss_weakness}
                </span>
              )}
              {session.boss_resistance && (
                <span className="px-2 py-0.5 rounded border border-red-500/50 text-red-400" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>
                  ▲ Resist: {session.boss_resistance}
                </span>
              )}
            </div>
          )}

          {/* Boss HP Bar */}
          <div className="w-full max-w-xl p-3" style={{ ...pixelBorderThin, background: "#0d1b2a" }}>
            <div className="flex justify-between mb-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4af37" }}>
              <span>BOSS HP</span>
              <span>{Math.max(0, session.boss_hp).toLocaleString()} / {session.boss_max_hp.toLocaleString()}</span>
            </div>
            <div className="h-6" style={{ ...pixelInset, background: "#5a1a1a" }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${bossHpPct}%`,
                  background: bossHpPct > 50 ? "#dc2626" : bossHpPct > 25 ? "#f97316" : "#7f1d1d",
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
                }}
              />
            </div>
            {/* HP phase markers */}
            <div className="flex gap-1 mt-1.5">
              {[75, 50, 25].map(pct => (
                <div key={pct} className="flex-1 h-0.5" style={{ background: bossHpPct < pct ? "#f97316" : "#2a2a3a" }} />
              ))}
            </div>
          </div>

          {/* Attack button (centered, for quick access) */}
          {session.status === 'active' && isMyTurn && myMember?.hp > 0 && (
            <PixelButton variant="ok" label="BASIC ATTACK" onClick={() => doAction('attack')} disabled={loading} size="lg" />
          )}
        </div>

        {/* ── Waiting / Result States ────────────────────────────────────── */}
        {session.status === 'waiting' && (
          <div className="text-center space-y-3 p-4" style={{ ...pixelBorderThin, background: "#0d1b2a" }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8b7355" }}>
              Share Session ID with party:
            </p>
            <code className="text-xs bg-black/50 px-3 py-1.5 rounded block break-all select-all border border-yellow-500/30" style={{ color: "#d4af37" }}>
              {session.id}
            </code>
            {isLeader ? (
              <PixelButton variant="ok" label="START BATTLE" onClick={doStart} disabled={loading} size="lg" />
            ) : (
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#8b7355" }}>
                Waiting for leader...
              </p>
            )}
          </div>
        )}

        {(session.status === 'victory' || session.status === 'defeat') && (
          <div className="text-center space-y-3 p-4" style={{
            ...pixelBorder,
            background: "#0d1b2a",
            borderColor: session.status === 'victory' ? "#d4af37" : "#dc2626",
          }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: session.status === 'victory' ? "#d4af37" : "#dc2626" }}>
              {session.status === 'victory' ? 'VICTORY!' : 'DEFEAT'}
            </p>
            {session.status === 'victory' && (() => {
              const rewardLogs = (session.combat_log || []).filter(e =>
                e.type === "system" && (e.text?.includes("gold") || e.text?.includes("exp") || e.text?.includes("found") || e.text?.includes("Egg"))
              );
              return (
                <div className="space-y-1">
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4af37" }}>REWARDS</p>
                  {rewardLogs.map((r, i) => (
                    <p key={i} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#8b7355" }}>{r.text}</p>
                  ))}
                  {rewardLogs.length === 0 && (
                    <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#8b7355" }}>Rewards sent to your character!</p>
                  )}
                </div>
              );
            })()}
            <PixelButton variant="cancel" label="RETURN TO DUNGEONS" onClick={doLeave} />
          </div>
        )}

        {/* ── Party Members Grid (bottom) ─────────────────────────────── */}
        <div className="p-3" style={{ ...pixelBorder, background: "#0d1b2a" }}>
          <div className="text-center mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4af37", letterSpacing: "0.1em" }}>
            PARTY MEMBERS ({session.members?.length || 0}/6)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
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
            <div className="p-3 space-y-2" style={{ ...pixelBorderThin, background: "#0d1b2a" }}>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: isMyTurn ? "#d4af37" : "#8b7355" }}>
                {isMyTurn ? "YOUR TURN" : `${currentTurnMember?.name}'s turn...`}
              </p>
              <div className="space-y-1.5">
                {charSkills.map(skill => {
                  const folder = getSkillSpriteFolder(skill.id);
                  const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => doAction('skill', skill.id)}
                      disabled={!isMyTurn || loading}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded border border-gray-600 hover:border-yellow-500/60 hover:bg-yellow-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      style={{ background: "#131a2b" }}
                    >
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded" style={{ ...pixelInset, background: "#1b263b" }}>
                        {folder ? (
                          <img src={`/sprites/skills/${folder}/${skill.id}.png`} alt={skill.name}
                            style={{ width: 24, height: 24, imageRendering: "pixelated" }}
                            onError={e => { e.target.style.display = "none"; }} />
                        ) : (
                          <span className="text-base leading-none">{elem?.icon || "⚡"}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#f0e6d3" }} className="truncate">
                          {skill.name}
                        </p>
                        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }} className="text-muted-foreground truncate">
                          {skill.mp}MP {skill.description ? `- ${skill.description.slice(0, 40)}...` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {isMyTurn && (
                <p className="text-center" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#8b7355" }}>
                  Auto-attack in 5s if idle
                </p>
              )}
            </div>
          )}

          {/* Combat Log (always visible) */}
          <div className="flex-1 min-h-0 flex flex-col p-3" style={{ ...pixelBorder, background: "#0d1b2a" }}>
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: "2px solid #d4af37" }}>
              <ScrollText className="w-3.5 h-3.5 text-yellow-400" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4af37" }}>COMBAT LOG</span>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto space-y-0.5 min-h-[120px]">
              {(session.combat_log || []).slice().reverse().map((entry, i) => {
                const isMyBossHit = entry.type === 'boss_attack' && entry.target === character?.name;
                return (
                  <p key={i} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }} className={
                    entry.type === 'victory' ? "text-yellow-400" :
                    entry.type === 'defeat' ? "text-red-400" :
                    entry.type === 'player_attack' ? "text-foreground" :
                    isMyBossHit ? "text-red-400 font-semibold" :
                    entry.type === 'boss_attack' ? "text-orange-400" :
                    entry.type === 'heal' ? "text-green-400" :
                    "text-muted-foreground"
                  }>
                    {entry.text}
                  </p>
                );
              })}
              {(!session.combat_log || session.combat_log.length === 0) && (
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#8b7355" }}>
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
