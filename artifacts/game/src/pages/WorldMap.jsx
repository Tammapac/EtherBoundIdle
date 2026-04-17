import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import {
  Map, Lock, Users, AlertTriangle
} from "lucide-react";
import { REGIONS } from "@/lib/gameData";
import { useToast } from "@/components/ui/use-toast";
import PartyActivityNotifier from "@/components/game/PartyActivityNotifier";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

// Zone hotspot positions on the 320x320 map image (as percentages)
const ZONE_HOTSPOTS = {
  verdant_forest:  { x: 18, y: 82, labelY: 90 },
  scorched_desert: { x: 72, y: 62, labelY: 70 },
  frozen_peaks:    { x: 18, y: 42, labelY: 50 },
  mud_swamps:      { x: 48, y: 80, labelY: 88 },
  forgotten_cave:  { x: 18, y: 60, labelY: 68 },
  dark_seas:       { x: 55, y: 92, labelY: 97 },
  shadow_realm:    { x: 48, y: 55, labelY: 63 },
  volcanos_path:   { x: 15, y: 22, labelY: 30 },
  crystal_lands:   { x: 78, y: 42, labelY: 50 },
  celestial_spire: { x: 45, y: 18, labelY: 26 },
  tammas_castle:   { x: 78, y: 18, labelY: 26 },
};

export default function WorldMap({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [travelConfirm, setTravelConfirm] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
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

  // Fetch fresh party member levels
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
      const updated = await base44.entities.Character.update(character.id, { current_region: regionKey });
      onCharacterUpdate(updated);

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
      setSelectedZone(null);
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

  const selectedRegion = selectedZone ? REGIONS[selectedZone] : null;
  const isSelectedCurrent = selectedZone === character.current_region;
  const isSelectedLocked = selectedRegion && character.level < selectedRegion.levelRange[0];

  return (
    <>
    <PartyActivityNotifier
      character={character}
      partyId={partyData?.id}
      onJoinZone={handleJoinZone}
    />
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
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

      {/* Pixel Art World Map */}
      <div className="relative w-full mx-auto" style={{ maxWidth: 640 }}>
        <img
          src="/sprites/worldmap.png"
          alt="World Map of Etherbound"
          className="w-full h-auto rounded-xl border-2 border-border"
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />

        {/* Zone hotspots */}
        {Object.entries(REGIONS).map(([key, region]) => {
          const hotspot = ZONE_HOTSPOTS[key];
          if (!hotspot) return null;
          const isCurrent = character.current_region === key;
          const isLocked = character.level < region.levelRange[0];
          const isSelected = selectedZone === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedZone(isSelected ? null : key)}
              className="absolute group"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Pulse ring for current zone */}
              {isCurrent && (
                <span className="absolute inset-0 -m-2 rounded-full border-2 border-primary animate-ping opacity-40" />
              )}
              {/* Marker dot */}
              <span
                className={`relative block w-5 h-5 rounded-full border-2 transition-all ${
                  isCurrent
                    ? "bg-primary border-primary shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-110"
                    : isLocked
                      ? "bg-muted border-muted-foreground/40 opacity-50"
                      : isSelected
                        ? "bg-yellow-400 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] scale-110"
                        : "bg-white/80 border-white/60 hover:bg-yellow-300 hover:border-yellow-200 hover:scale-110"
                }`}
              >
                {isLocked && <Lock className="w-3 h-3 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
              </span>
              {/* Level label */}
              <span
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-orbitron text-[9px] font-bold pointer-events-none select-none"
                style={{
                  top: "calc(100% + 2px)",
                  color: isCurrent ? "#38bdf8" : isLocked ? "#6b7280" : "#e5e7eb",
                  textShadow: "0 0 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)",
                }}
              >
                Lv.{region.levelRange[0]}-{region.levelRange[1]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Zone info panel — shows when a zone is selected */}
      <AnimatePresence mode="wait">
        {selectedZone && selectedRegion && (
          <motion.div
            key={selectedZone}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`bg-card border rounded-xl p-4 md:p-5 ${
              isSelectedCurrent
                ? "border-primary glow-cyan"
                : isSelectedLocked
                  ? "border-border opacity-70"
                  : "border-border"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-bold text-lg ${selectedRegion.color}`}>{selectedRegion.name}</h3>
                  {isSelectedCurrent && <Badge className="bg-primary/20 text-primary text-xs">Current Zone</Badge>}
                  {isSelectedLocked && <Badge variant="outline" className="text-xs"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{selectedRegion.description}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    Lv. {selectedRegion.levelRange[0]}-{selectedRegion.levelRange[1]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedRegion.enemies.length} enemy types
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {!isSelectedCurrent && !isSelectedLocked && (
                  <PixelButton
                    variant="ok"
                    label="TRAVEL"
                    onClick={() => handleTravelClick(selectedZone)}
                    disabled={travelMutation.isPending}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone list (compact, below the map) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {Object.entries(REGIONS).map(([key, region]) => {
          const isCurrent = character.current_region === key;
          const isLocked = character.level < region.levelRange[0];
          const isSelected = selectedZone === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedZone(isSelected ? null : key)}
              className={`text-left rounded-lg px-3 py-2 border transition-all text-xs ${
                isSelected
                  ? "border-yellow-400/60 bg-yellow-400/10"
                  : isCurrent
                    ? "border-primary/40 bg-primary/10"
                    : isLocked
                      ? "border-border/50 opacity-40"
                      : "border-border/50 hover:border-muted-foreground/30"
              }`}
            >
              <span className={`font-bold block truncate ${isCurrent ? "text-primary" : region.color}`}>
                {region.name}
              </span>
              <span className="text-muted-foreground text-[10px]">
                Lv.{region.levelRange[0]}-{region.levelRange[1]}
                {isCurrent && " (here)"}
                {isLocked && " (locked)"}
              </span>
            </button>
          );
        })}
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
                  <p className="text-xs text-muted-foreground">-> {REGIONS[travelConfirm]?.name}</p>
                </div>
              </div>

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
                          {m.name} (Lv.{freshMemberLevels[m.character_id] || m.level}) — needs Lv.{minLevel}
                        </p>
                      ))}
                      <p className="text-xs text-muted-foreground mt-1">These members cannot follow you.</p>
                    </div>
                  );
                }
                return (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-primary">
                      All {partyData?.members?.length} party members meet the level requirement (Lv.{REGIONS[travelConfirm]?.levelRange[0]}).
                      They will receive a join request.
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <PixelButton
                  variant="ok"
                  label="INVITE PARTY"
                  onClick={() => travelMutation.mutate({ regionKey: travelConfirm, inviteParty: true })}
                  disabled={travelMutation.isPending}
                />
                <PixelButton
                  variant="ok"
                  label="GO ALONE"
                  onClick={() => travelMutation.mutate({ regionKey: travelConfirm, inviteParty: false })}
                  disabled={travelMutation.isPending}
                />
              </div>
              <div className="flex justify-center">
                <PixelButton variant="cancel" label="CANCEL" onClick={() => setTravelConfirm(null)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
