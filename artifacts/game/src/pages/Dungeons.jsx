import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Skull, Flame, Snowflake, Zap, Shield, Swords,
  Users, Lock, ChevronRight, UserPlus, LogIn, User, Gem, Info
} from "lucide-react";
import { ELEMENT_CONFIG } from "@/lib/skillData";
import DungeonCombat from "@/components/dungeon/DungeonCombat";
import PartyActivityNotifier from "@/components/game/PartyActivityNotifier";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

const DUNGEONS = [
  {
    id: "inferno_keep",
    name: "Inferno Keep",
    description: "A fortress consumed by eternal flames. The Flame Tyrant awaits.",
    boss: "Flame Tyrant",
    bossIcon: Flame,
    color: "text-orange-400",
    bg: "from-orange-500/10",
    border: "border-orange-500/40",
    minLevel: 1,
    recommended: 3,
    difficulty: "Normal",
    diffColor: "text-green-400 border-green-500/30 bg-green-500/10",
    setBonus: "2pc: +15% 🔥 Fire DMG · 4pc: +30% Fire DMG + Ignite DoT",
    bossSetName: "Tyrant's Blaze Set",
    bossSetPieces: ["Tyrant's Emberhelm", "Tyrant's Scorcheplate", "Tyrant's Flame Greaves", "Tyrant's Ashring"],
    bossSetDropChance: 1.5,
    bossSetElement: "fire",
    bossSetBonus: { fire_dmg: 20, damage: 15, crit_chance: 5 },
  },
  {
    id: "frost_citadel",
    name: "Frost Citadel",
    description: "Eternal winter grips this citadel. The Frost Warden rules with ice.",
    boss: "Frost Warden",
    bossIcon: Snowflake,
    color: "text-cyan-400",
    bg: "from-cyan-500/10",
    border: "border-cyan-500/40",
    minLevel: 15,
    recommended: 4,
    difficulty: "Hard",
    diffColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    setBonus: "2pc: +15% ❄️ Ice DMG · 4pc: +30% Ice DMG + Freeze Chance",
    bossSetName: "Warden's Permafrost Set",
    bossSetPieces: ["Warden's Frostcrown", "Warden's Glacial Plate", "Warden's Icewalkers", "Warden's Frost Amulet"],
    bossSetDropChance: 1.2,
    bossSetElement: "ice",
    bossSetBonus: { ice_dmg: 20, defense: 20, evasion: 5 },
  },
  {
    id: "void_sanctum",
    name: "Void Sanctum",
    description: "A rift between worlds. The Void Reaper harvests souls.",
    boss: "Void Reaper",
    bossIcon: Skull,
    color: "text-purple-400",
    bg: "from-purple-500/10",
    border: "border-purple-500/40",
    minLevel: 30,
    recommended: 5,
    difficulty: "Expert",
    diffColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    setBonus: "2pc: +15% 🩸 Blood DMG · 4pc: +30% Blood DMG + Lifesteal +8%",
    bossSetName: "Reaper's Soulshred Set",
    bossSetPieces: ["Reaper's Deathmask", "Reaper's Voidplate", "Reaper's Shadow Boots", "Reaper's Soul Ring"],
    bossSetDropChance: 1.0,
    bossSetElement: "blood",
    bossSetBonus: { blood_dmg: 25, lifesteal: 8, strength: 15 },
  },
  {
    id: "storm_peak",
    name: "Storm Peak",
    description: "The Storm Colossus commands lightning at the apex of the world.",
    boss: "Storm Colossus",
    bossIcon: Zap,
    color: "text-yellow-400",
    bg: "from-yellow-500/10",
    border: "border-yellow-500/40",
    minLevel: 50,
    recommended: 6,
    difficulty: "Legendary",
    diffColor: "text-red-400 border-red-500/30 bg-red-500/10",
    setBonus: "2pc: +15% ⚡ Lightning DMG · 4pc: +35% Lightning DMG + Chain",
    bossSetName: "Colossus's Stormforge Set",
    bossSetPieces: ["Colossus's Stormhelm", "Colossus's Thunderplate", "Colossus's Galewalkers", "Colossus's Voltring"],
    bossSetDropChance: 0.7,
    bossSetElement: "lightning",
    bossSetBonus: { lightning_dmg: 30, crit_chance: 10, crit_dmg_pct: 25 },
  },
  {
    id: "poison_swamp",
    name: "Plague Swamp",
    description: "A fetid swamp ruled by the Plague Matriarch. Deadly toxins fill the air.",
    boss: "Plague Matriarch",
    bossIcon: Shield,
    color: "text-green-400",
    bg: "from-green-500/10",
    border: "border-green-500/40",
    minLevel: 25,
    recommended: 4,
    difficulty: "Hard",
    diffColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    setBonus: "2pc: +15% ☠️ Poison DMG · 4pc: +30% Poison DMG + Instant Poison",
    bossSetName: "Matriarch's Toxin Set",
    bossSetPieces: ["Matriarch's Plague Hood", "Matriarch's Venomweave Robe", "Matriarch's Bog Boots", "Matriarch's Venom Amulet"],
    bossSetDropChance: 1.1,
    bossSetElement: "poison",
    bossSetBonus: { poison_dmg: 25, intelligence: 15, mp_bonus: 40 },
  },
  {
    id: "sand_tomb",
    name: "Sand Tomb of Kings",
    description: "A buried pharaoh's tomb where the Sand King commands eternal armies.",
    boss: "Sand King",
    bossIcon: Users,
    color: "text-amber-400",
    bg: "from-amber-500/10",
    border: "border-amber-500/40",
    minLevel: 40,
    recommended: 5,
    difficulty: "Expert",
    diffColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    setBonus: "2pc: +15% 🌪️ Sand DMG · 4pc: +30% Sand DMG + Blind Enemies",
    bossSetName: "Pharaoh's Sandstorm Set",
    bossSetPieces: ["Pharaoh's War Crown", "Pharaoh's Dune Plate", "Pharaoh's Miragewalkers", "Pharaoh's Desert Ring"],
    bossSetDropChance: 0.9,
    bossSetElement: "sand",
    bossSetBonus: { sand_dmg: 25, evasion: 8, dexterity: 15 },
  },
];

export default function Dungeons({ character, onCharacterUpdate }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [joinId, setJoinId] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const { toast } = useToast();

  // Dungeon entry limit status
  const { data: entryStatus, refetch: refetchEntryStatus } = useQuery({
    queryKey: ["dungeonEntries", character?.id],
    queryFn: () => base44.functions.invoke("dungeonEntryStatus", { characterId: character.id }),
    enabled: !!character?.id,
    refetchInterval: 60000,
  });

  // Get current party
  const { data: partyData } = useQuery({
    queryKey: ["party", character?.id],
    queryFn: async () => {
      const led = await base44.entities.Party.filter({ leader_id: character.id });
      const active = led.find(p => p.status !== 'disbanded');
      if (active) return active;
      const all = await base44.entities.Party.list('-updated_date', 50);
      return all.find(p => p.status !== 'disbanded' && p.members?.some(m => m.character_id === character.id)) || null;
    },
    enabled: !!character?.id,
    refetchInterval: 15000,
  });

  // Broadcast party activity when entering dungeon
  const broadcastDungeonEntry = async (sessionId, dungeonId, dungeonName) => {
    if (!partyData?.id) return;
    try {
      await base44.entities.PartyActivity.create({
        party_id: partyData.id,
        character_id: character.id,
        character_name: character.name,
        activity_type: "enter_dungeon",
        payload: { session_id: sessionId, dungeon_id: dungeonId, dungeon_name: dungeonName },
        expires_at: new Date(Date.now() + 60000).toISOString(),
      });
    } catch {}
  };

  const handleCreate = async (dungeon) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("dungeonAction", {
        action: "create",
        characterId: character.id,
        dungeonId: dungeon.id,
      });
      if (res?.success) {
        setActiveSession(res.session);
        refetchEntryStatus();
        await broadcastDungeonEntry(res.session.id, dungeon.id, dungeon.name);
      } else {
        toast({ title: res?.error || "Failed to create session", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("dungeonAction", {
        action: "join",
        characterId: character.id,
        sessionId: joinId.trim(),
      });
      if (res?.success) {
        setActiveSession(res.session);
        setShowJoin(false);
        setJoinId("");
      } else {
        toast({ title: res?.error || "Session not found", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinDungeonFromParty = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("dungeonAction", {
        action: "join",
        characterId: character.id,
        sessionId,
      });
      if (res?.success) {
        setActiveSession(res.session);
      } else {
        toast({ title: res?.error || "Could not join", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // If in an active dungeon session, show combat UI
  if (activeSession) {
    return (
      <DungeonCombat
        session={activeSession}
        character={character}
        onLeave={() => {
          setActiveSession(null);
          setSelected(null);
        }}
      />
    );
  }

  return (
    <>
    <PartyActivityNotifier
      character={character}
      partyId={partyData?.id}
      onJoinDungeon={(sessionId) => handleJoinDungeonFromParty(sessionId)}
    />
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" /> Dungeons
          </h2>
          <p className="text-xs text-muted-foreground">Real-time party boss encounters with exclusive loot</p>
          {entryStatus && (
            <p className="text-xs mt-1">
              <span className={entryStatus.entriesLeft > 0 ? "text-green-400" : "text-red-400"}>
                Entries: {entryStatus.entriesLeft}/{entryStatus.maxEntries}
              </span>
              {entryStatus.entriesLeft === 0 && entryStatus.windowRemaining > 0 && (
                <span className="text-yellow-400 ml-2">
                  Resets in {Math.ceil(entryStatus.windowRemaining / 60000)}m
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowJoin(v => !v)}
          >
            <LogIn className="w-3.5 h-3.5" /> Join Session
          </Button>
        </div>
      </div>

      {/* Join by session ID */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-primary/30 rounded-xl p-3 flex gap-2"
          >
            <Input
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="Paste Session ID..."
              className="h-8 text-xs flex-1"
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <Button size="sm" onClick={handleJoin} disabled={loading} className="h-8 text-xs">
              {loading ? "..." : "Join"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dungeon Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {DUNGEONS.map(dungeon => {
          const BossIcon = dungeon.bossIcon;
          const locked = character.level < dungeon.minLevel;
          const isSelected = selected?.id === dungeon.id;

          return (
            <motion.div
              key={dungeon.id}
              whileHover={!locked ? { scale: 1.01 } : {}}
              onClick={() => !locked && setSelected(isSelected ? null : dungeon)}
              className={`relative bg-gradient-to-br ${dungeon.bg} to-card border-2 rounded-xl p-4 transition-all cursor-pointer ${
                isSelected ? dungeon.border : "border-border"
              } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {locked && (
                <div className="absolute top-3 right-3">
                  <Lock className={`w-4 h-4 ${dungeon.color}`} />
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl bg-card border ${dungeon.border}`}>
                  <BossIcon className={`w-6 h-6 ${dungeon.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-orbitron font-bold ${dungeon.color}`}>{dungeon.name}</h3>
                    <Badge className={`text-xs border ${dungeon.diffColor}`}>{dungeon.difficulty}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Min Lv.{dungeon.minLevel} · Recommended: {dungeon.recommended} players
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{dungeon.description}</p>

              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${dungeon.color}`}>⚔️ Boss: {dungeon.boss}</span>
                {!locked && (
                  <ChevronRight className={`w-4 h-4 ${dungeon.color} transition-transform ${isSelected ? "rotate-90" : ""}`} />
                )}
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-border space-y-3"
                  >
                    {/* Set bonus */}
                    <div className={`p-2 rounded-lg bg-card border ${dungeon.border} text-xs`}>
                      <span className={`font-semibold ${dungeon.color}`}>Set Bonus: </span>
                      <span className="text-muted-foreground">{dungeon.setBonus}</span>
                    </div>

                    {/* Boss Set Drop */}
                    <div className="p-3 rounded-xl bg-card border border-yellow-500/30 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <Gem className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="font-semibold text-yellow-400">{dungeon.bossSetName}</span>
                        <span className="ml-auto text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5 font-bold text-yellow-300">
                          {dungeon.bossSetDropChance}% drop
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dungeon.bossSetPieces?.map((piece, pi) => (
                          <span key={pi} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded px-1.5 py-0.5 text-[10px]">
                            {piece}
                          </span>
                        ))}
                      </div>
                      {dungeon.bossSetBonus && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-yellow-500/20">
                          {Object.entries(dungeon.bossSetBonus).map(([k, v]) => {
                            const elemEntry = Object.values(ELEMENT_CONFIG).find(e => e.stat === k);
                            return (
                              <span key={k} className={`text-[10px] font-bold ${elemEntry?.color || "text-muted-foreground"}`}>
                                {elemEntry?.icon || "+"}{v > 0 ? "+" : ""}{v} {k.replace(/_/g, " ").replace("dmg", "DMG")}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 italic flex items-center gap-1">
                        <Info className="w-3 h-3" /> Boss set pieces drop at ~{dungeon.bossSetDropChance}% per piece per kill — very rare!
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleCreate(dungeon); }}
                        disabled={loading}
                        className="flex-1 gap-1.5"
                        variant="outline"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> {loading ? "Creating..." : "Solo Run"}
                      </Button>
                      {partyData && partyData.members?.length > 1 && (
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setLoading(true);
                            try {
                              const res = await base44.functions.invoke("dungeonAction", {
                                action: "create",
                                characterId: character.id,
                                dungeonId: dungeon.id,
                              });
                              if (res?.success) {
                                const sess = res.session;
                                setActiveSession(sess);
                                // Broadcast to all party members
                                if (partyData?.id) {
                                  await base44.entities.PartyActivity.create({
                                    party_id: partyData.id,
                                    character_id: character.id,
                                    character_name: character.name,
                                    activity_type: "enter_dungeon",
                                    payload: { session_id: sess.id, dungeon_id: dungeon.id, dungeon_name: dungeon.name },
                                    expires_at: new Date(Date.now() + 120000).toISOString(),
                                  });
                                  toast({ title: `Dungeon invite sent to ${partyData.members.length - 1} party member(s)!`, duration: 3000 });
                                }
                              } else {
                                toast({ title: res?.error || "Failed to create", variant: "destructive" });
                              }
                            } catch (err) {
                              toast({ title: err.message, variant: "destructive" });
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="flex-1 gap-1.5 bg-secondary hover:bg-secondary/90"
                        >
                          <Users className="w-3.5 h-3.5" /> {loading ? "..." : `Invite Party (${partyData.members.length})`}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {partyData && partyData.members?.length > 1
                        ? "Invite Party sends all members a join notification automatically"
                        : "Create a session and share the Session ID with your party"
                      }
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> How Dungeons Work
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong className="text-foreground">Solo Run</strong>: Create a session and share the Session ID manually</li>
          <li>• <strong className="text-foreground">Invite Party</strong>: Automatically notifies all party members to join</li>
          <li>• Party members click "Join Dungeon" on the notification popup</li>
          <li>• Turn-based combat — each player has 5 seconds to act or auto-attacks</li>
          <li>• Loot drops for every participant individually</li>
          <li>• Minimum level requirement applies to enter each dungeon</li>
        </ul>
      </div>
    </div>
    </>
  );
}