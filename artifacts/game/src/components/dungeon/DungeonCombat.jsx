import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, LogOut, Crown, Skull, Clock, User } from "lucide-react";
import { SKILLS, CLASSES } from "@/lib/gameData";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import PlayerProfileModal from "@/components/game/PlayerProfileModal";

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

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.DungeonSession.subscribe((event) => {
      if (event.id === session.id || event.data?.id === session.id) {
        if (event.data) setSession(event.data);
      }
    });
    return unsub;
  }, [session.id]);

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
        <Button variant="ghost" size="sm" onClick={doLeave} className="gap-1 text-muted-foreground">
          <LogOut className="w-3.5 h-3.5" /> Leave
        </Button>
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
                      {m.name[0].toUpperCase()}
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
                  <Button size="sm" className="w-full gap-1.5" onClick={doStart} disabled={loading}>
                    <Swords className="w-3.5 h-3.5" /> Start Battle
                  </Button>
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
              <Button
                size="sm"
                className="w-full gap-1.5"
                disabled={!isMyTurn || loading}
                onClick={() => doAction('attack')}
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
                    disabled={!isMyTurn || loading}
                    onClick={() => doAction('skill', skill.id)}
                  >
                    <span className="text-sm">{elem?.icon || <Zap className="w-3.5 h-3.5" />}</span>
                    {skill.name}
                    <span className="text-xs opacity-60 ml-auto">({skill.mp}MP)</span>
                  </Button>
                );
              })}
              {isMyTurn && (
                <p className="text-xs text-center text-muted-foreground">Auto-attack in 5s if idle</p>
              )}
            </div>
          )}

          {/* Result panel */}
          {(session.status === 'victory' || session.status === 'defeat') && (
            <div className={`bg-card border-2 rounded-xl p-4 text-center space-y-2 ${
              session.status === 'victory' ? "border-yellow-500/50" : "border-destructive/50"
            }`}>
              <p className={`font-orbitron text-xl font-bold ${session.status === 'victory' ? "text-yellow-400" : "text-destructive"}`}>
                {session.status === 'victory' ? '🏆 VICTORY!' : '💀 DEFEAT'}
              </p>
              {session.status === 'victory' && (
                <p className="text-xs text-muted-foreground">Rewards sent to your character!</p>
              )}
              <Button size="sm" variant="outline" className="w-full" onClick={doLeave}>
                Return to Dungeons
              </Button>
            </div>
          )}

          {/* Combat Log */}
          <div className="bg-card border border-border rounded-xl p-3 flex-1 min-h-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2">COMBAT LOG</p>
            <div ref={logRef} className="space-y-0.5 max-h-64 md:max-h-full overflow-y-auto">
              {(session.combat_log || []).slice().reverse().map((entry, i) => (
                <p key={i} className={`text-xs ${
                  entry.type === 'victory' ? "text-yellow-400 font-semibold" :
                  entry.type === 'defeat' ? "text-destructive font-semibold" :
                  entry.type === 'player_attack' ? "text-foreground" :
                  entry.type === 'boss_attack' ? "text-orange-400" :
                  "text-muted-foreground"
                }`}>
                  {entry.text}
                </p>
              ))}
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