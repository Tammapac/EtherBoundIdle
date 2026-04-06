import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Map, Trees, Sun, Snowflake, Moon, Star, Lock, ChevronRight, Users, AlertTriangle
} from "lucide-react";
import { REGIONS } from "@/lib/gameData";
import { useToast } from "@/components/ui/use-toast";
import PartyActivityNotifier from "@/components/game/PartyActivityNotifier";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

const REGION_ICONS = { Trees, Sun, Snowflake, Moon, Star };

export default function WorldMap({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [travelConfirm, setTravelConfirm] = useState(null); // regionKey awaiting confirm
  const pollInterval = useSmartPolling(POLL_INTERVALS.GAME_STATE);

  // Get current party
  const { data: partyData } = useQuery({
    queryKey: ["party", character?.id],
    queryFn: async () => {
      const led = await base44.entities.Party.filter({ leader_id: character.id });
      const active = led.find(p => p.status !== 'disbanded');
      if (active) return active;
      const all = await base44.entities.Party.list('-updated_date', 20);
      return all.find(p => p.status !== 'disbanded' && p.members?.some(m => m.character_id === character.id)) || null;
    },
    enabled: !!character?.id,
    staleTime: 120_000,
  });

  // Fetch fresh party member levels (party members array stores stale join-time levels)
  const { data: freshMemberLevels = {} } = useQuery({
    queryKey: ["partyMemberLevels", partyData?.id],
    queryFn: async () => {
      const memberIds = partyData.members.map(m => m.character_id);
      const res = await base44.functions.invoke("getPublicProfiles", { characterIds: memberIds });
      const levels = {};
      for (const p of (res?.profiles || [])) {
        levels[p.id] = p.level;
      }
      return levels;
    },
    enabled: !!partyData?.members?.length,
    staleTime: 120_000,
  });

  const travelMutation = useMutation({
    mutationFn: async ({ regionKey, inviteParty }) => {
      // Update own region
      const updated = await base44.entities.Character.update(character.id, { current_region: regionKey });
      onCharacterUpdate(updated);

      // If in a party and leader chooses to invite, broadcast the zone travel
      if (inviteParty && partyData?.id) {
        await base44.entities.PartyActivity.create({
          party_id: partyData.id,
          character_id: character.id,
          character_name: character.name,
          activity_type: "enter_zone",
          payload: {
            zone: regionKey,
            zone_name: REGIONS[regionKey]?.name || regionKey,
          },
          expires_at: new Date(Date.now() + 120000).toISOString(),
        });
      }
    },
    onSuccess: (_, { regionKey }) => {
      toast({ title: `Traveled to ${REGIONS[regionKey]?.name}!`, duration: 2000 });
      setTravelConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["party"] });
    },
  });

  const handleTravelClick = (regionKey) => {
    const region = REGIONS[regionKey];
    const isLocked = character.level < region.levelRange[0];
    if (isLocked) return;

    const hasParty = partyData && partyData.members?.length > 1;
    const isLeader = partyData?.leader_id === character.id;

    if (hasParty && isLeader) {
      // Ask if they want to bring party
      setTravelConfirm(regionKey);
    } else {
      travelMutation.mutate({ regionKey, inviteParty: false });
    }
  };

  const handleJoinZone = async (zone) => {
    if (!zone) return;
    const reg = REGIONS[zone];
    if (!reg || character.level < reg.levelRange[0]) return;
    travelMutation.mutate({ regionKey: zone, inviteParty: false });
  };

  if (!character) return null;

  return (
    <>
    <PartyActivityNotifier
      character={character}
      partyId={partyData?.id}
      onJoinZone={handleJoinZone}
    />
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" /> World Map
        </h2>
        {partyData && partyData.members?.length > 1 && (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1.5">
            <Users className="w-3 h-3" /> Party: {partyData.members.length} members
          </Badge>
        )}
      </div>

      {/* Party travel confirmation modal */}
      <AnimatePresence>
        {travelConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setTravelConfirm(null)}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              className="bg-card border-2 border-primary/30 rounded-2xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold">Travel with Party?</p>
                  <p className="text-xs text-muted-foreground">→ {REGIONS[travelConfirm]?.name}</p>
                </div>
              </div>

              {/* Check party members who can't enter */}
              {(() => {
                const minLevel = REGIONS[travelConfirm]?.levelRange[0] || 1;
                const blocked = partyData?.members?.filter(m => m.character_id !== character.id && (freshMemberLevels[m.character_id] || m.level) < minLevel) || [];
                if (blocked.length > 0) {
                  return (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-destructive text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Level Restriction
                      </div>
                      {blocked.map(m => (
                        <p key={m.character_id} className="text-xs text-muted-foreground">
                          ❌ {m.name} (Lv.{freshMemberLevels[m.character_id] || m.level}) — needs Lv.{minLevel}
                        </p>
                      ))}
                      <p className="text-xs text-muted-foreground mt-1">These members cannot follow you.</p>
                    </div>
                  );
                }
                return (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-primary">
                      ✅ All {partyData?.members?.length} party members meet the level requirement (Lv.{REGIONS[travelConfirm]?.levelRange[0]}).
                      They will receive a join request.
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => travelMutation.mutate({ regionKey: travelConfirm, inviteParty: true })}
                  disabled={travelMutation.isPending}
                >
                  <Users className="w-3.5 h-3.5" /> Invite Party
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => travelMutation.mutate({ regionKey: travelConfirm, inviteParty: false })}
                  disabled={travelMutation.isPending}
                >
                  <ChevronRight className="w-3.5 h-3.5" /> Go Alone
                </Button>
              </div>
              <button onClick={() => setTravelConfirm(null)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {Object.entries(REGIONS).map(([key, region], idx) => {
          const Icon = REGION_ICONS[region.icon] || Map;
          const isCurrent = character.current_region === key;
          const isLocked = character.level < region.levelRange[0];
          const hasParty = partyData && partyData.members?.length > 1;
          const isLeader = partyData?.leader_id === character.id;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              className={`bg-card border rounded-xl p-4 md:p-5 transition-all ${
                isCurrent
                  ? "border-primary glow-cyan"
                  : isLocked
                    ? "border-border opacity-50"
                    : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${region.bgColor} to-transparent flex-shrink-0`}>
                  <Icon className={`w-7 h-7 ${region.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-lg ${region.color}`}>{region.name}</h3>
                    {isCurrent && <Badge className="bg-primary/20 text-primary text-xs">Current</Badge>}
                    {isLocked && <Badge variant="outline" className="text-xs"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>}
                    {hasParty && !isLocked && !isCurrent && isLeader && (
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs gap-1">
                        <Users className="w-2.5 h-2.5" /> Party Travel Available
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{region.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      Lv. {region.levelRange[0]}–{region.levelRange[1]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {region.enemies.length} enemy types
                    </span>
                    {isCurrent && hasParty && (
                      <span className="text-xs text-primary">
                        ⚔️ Fighting with {partyData.members.length} party members
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden md:block flex-shrink-0">
                  {!isCurrent && !isLocked && (
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => handleTravelClick(key)}
                      disabled={travelMutation.isPending}
                    >
                      {hasParty && isLeader ? <Users className="w-3.5 h-3.5" /> : <ChevronRight className="w-4 h-4" />}
                      Travel
                    </Button>
                  )}
                </div>
              </div>
              {!isCurrent && !isLocked && (
                <Button
                  size="sm"
                  className="w-full mt-3 md:hidden gap-1"
                  onClick={() => handleTravelClick(key)}
                  disabled={travelMutation.isPending}
                >
                  {hasParty && isLeader ? <Users className="w-3.5 h-3.5" /> : <ChevronRight className="w-4 h-4" />}
                  Travel
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
    </>
  );
}