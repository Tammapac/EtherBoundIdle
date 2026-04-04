import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, Skull, Trophy, Gem, Star, Lock, ChevronUp, ChevronDown, Swords } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { TOWER_CONFIG, generateTowerFloorData } from "@/lib/gameData";
import TowerCombat from "@/components/tower/TowerCombat";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

const PET_SPECIES_ICONS_TOT = { Wolf:"🐺", Phoenix:"🔥", Dragon:"🐉", Turtle:"🐢", Cat:"🐱", Owl:"🦉", Slime:"🫧", Fairy:"🧚", Serpent:"🐍", Golem:"🪨" };
const PET_EVO_SUFFIX_TOT = ["", "⭐", "👑"];
const RARITY_PET_COLORS_TOT = { common:"text-gray-400", uncommon:"text-green-400", rare:"text-blue-400", epic:"text-purple-400", legendary:"text-amber-400", mythic:"text-red-400" };

const FLOOR_MILESTONES = [
  { floor: 100, label: "The Iron Colossus", color: "text-gray-300", borderColor: "border-gray-500/40" },
  { floor: 200, label: "Abyssal Warlord", color: "text-purple-400", borderColor: "border-purple-500/40" },
  { floor: 300, label: "Frost Emperor", color: "text-cyan-400", borderColor: "border-cyan-500/40" },
  { floor: 400, label: "Void Empress", color: "text-violet-400", borderColor: "border-violet-500/40" },
  { floor: 500, label: "Storm God", color: "text-yellow-400", borderColor: "border-yellow-500/40" },
  { floor: 600, label: "Plague Lord", color: "text-green-400", borderColor: "border-green-500/40" },
  { floor: 700, label: "Sand King", color: "text-amber-400", borderColor: "border-amber-500/40" },
  { floor: 800, label: "Celestial Dragon", color: "text-blue-400", borderColor: "border-blue-500/40" },
  { floor: 900, label: "Omega Sentinel", color: "text-red-400", borderColor: "border-red-500/40" },
  { floor: 1000, label: "Tammapac", color: "text-yellow-300", borderColor: "border-yellow-400/60" },
];

export default function TowerOfTrials({ character, onCharacterUpdate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewOffset, setViewOffset] = useState(0);
  const { toast } = useToast();
  const pollInterval = useSmartPolling(POLL_INTERVALS.GAME_STATE);

  // Fetch equipped pet
  const { data: petData } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    staleTime: 60000,
  });
  const equippedPetTOT = (petData?.pets || []).find(p => p.equipped);

  // Fetch tower status
  const { data: towerStatus, refetch } = useQuery({
    queryKey: ["towerStatus", character?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("towerAction", {
        action: "get_status",
        characterId: character.id,
      });
      return res;
    },
    enabled: !!character?.id,
    refetchInterval: pollInterval,
    staleTime: POLL_INTERVALS.GAME_STATE,
  });

  // If there's an active session from the server, resume it
  React.useEffect(() => {
    if (towerStatus?.activeSession && !activeSession) {
      const s = towerStatus.activeSession;
      setActiveSession({ id: s.id, floor: s.floor, status: s.status, ...(s.data || {}) });
    }
  }, [towerStatus?.activeSession]);

  const highestFloor = towerStatus?.highestFloor || 0;
  const nextFloor = Math.min(highestFloor + 1, TOWER_CONFIG.MAX_FLOOR);
  const entriesRemaining = towerStatus?.entriesRemaining ?? 3;
  const tammablocks = towerStatus?.tammablocks || 0;
  const towershards = towerStatus?.towershards || 0;

  const handleEnter = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("towerAction", {
        action: "enter",
        characterId: character.id,
      });
      if (res?.success && res.session) {
        setActiveSession(res.session);
        refetch();
      } else {
        toast({ title: res?.error || "Failed to enter tower", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [buyingEntry, setBuyingEntry] = useState(false);
  const entryGemCost = towerStatus?.entryGemCost || 1000;

  const handleBuyEntry = async () => {
    setBuyingEntry(true);
    try {
      const res = await base44.functions.invoke("towerAction", {
        action: "buy_entry",
        characterId: character.id,
      });
      if (res?.success) {
        toast({ title: `Bought 1 Tower Entry for ${res.gemsSpent} gems!` });
        refetch();
        if (onCharacterUpdate) onCharacterUpdate();
      } else {
        toast({ title: res?.error || "Failed to buy entry", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setBuyingEntry(false);
    }
  };

  const handleLeave = () => {
    setActiveSession(null);
    refetch();
  };

  const handleFloorCleared = () => {
    refetch();
  };

  // If in an active session, show combat
  if (activeSession) {
    return (
      <TowerCombat
        session={activeSession}
        character={character}
        onLeave={handleLeave}
        onFloorCleared={handleFloorCleared}
      />
    );
  }

  // Build floor ladder display
  const VISIBLE_FLOORS = 15;
  const startFloor = Math.max(1, nextFloor - 7 + viewOffset);
  const floors = [];
  for (let i = startFloor + VISIBLE_FLOORS - 1; i >= startFloor; i--) {
    if (i < 1 || i > TOWER_CONFIG.MAX_FLOOR) continue;
    const cleared = i <= highestFloor;
    const isNext = i === nextFloor;
    const isBoss = i % 10 === 0;
    const isCentennial = i % 100 === 0;
    const milestone = FLOOR_MILESTONES.find(m => m.floor === i);

    floors.push({ floor: i, cleared, isNext, isBoss, isCentennial, milestone });
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-amber-400" /> Tower of Trials
          </h2>
          <p className="text-xs text-muted-foreground">Ascend 1000 floors of increasing challenge</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Floor <span className="font-bold text-amber-400">{highestFloor}</span></span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
            <span className={entriesRemaining > 0 ? "text-green-400" : "text-red-400"}>
              {entriesRemaining}/{TOWER_CONFIG.MAX_ENTRIES} tries
            </span>
          </div>
        </div>
      </div>

      {/* Currency display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Highest Floor</p>
            <p className="font-bold text-sm">{highestFloor} / {TOWER_CONFIG.MAX_FLOOR}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <Gem className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Tammablocks</p>
            <p className="font-bold text-sm">{tammablocks}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <Gem className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Tower Shards</p>
            <p className="font-bold text-sm">{towershards}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <Skull className="w-4 h-4 text-destructive" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Next Boss</p>
            <p className="font-bold text-sm">Floor {Math.ceil(nextFloor / 10) * 10}</p>
          </div>
        </div>
      </div>

      {/* Enter button */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-xl p-4 text-center space-y-3">
        <p className="font-orbitron text-lg font-bold text-amber-400">
          {highestFloor === 0 ? "Begin Your Ascent" : `Continue from Floor ${nextFloor}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {highestFloor === 0
            ? "Challenge the Tower of Trials — 1000 floors of increasingly powerful enemies await."
            : `You cleared Floor ${highestFloor}. Your HP carries over between floors!`
          }
        </p>
        <Button
          onClick={handleEnter}
          disabled={loading || entriesRemaining <= 0}
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          size="lg"
        >
          <Swords className="w-4 h-4" />
          {loading ? "Entering..." : entriesRemaining <= 0 ? "No Tries Left" : `Enter Floor ${nextFloor}`}
        </Button>
        {entriesRemaining <= 0 && towerStatus?.windowResetsAt && (
          <p className="text-xs text-yellow-400">
            Resets at {new Date(towerStatus.windowResetsAt).toLocaleTimeString()}
          </p>
        )}
        {/* Buy Entry with Gems */}
        <div className="pt-2 border-t border-amber-500/20">
          <Button
            onClick={handleBuyEntry}
            disabled={buyingEntry || (character?.gems || 0) < entryGemCost}
            variant="outline"
            className="gap-2 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
          >
            <Gem className="w-4 h-4 text-purple-400" />
            {buyingEntry ? "Buying..." : `Buy Entry — ${entryGemCost.toLocaleString()} Gems`}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">
            You have {(character?.gems || 0).toLocaleString()} gems
          </p>
        </div>
        {/* Pet Companion Display */}
        {equippedPetTOT && (() => {
          const SKILL_LABELS_TOT = { heal: "Heal", shield: "Shield", extra_attack: "Extra Atk" };
          const icon = PET_SPECIES_ICONS_TOT[equippedPetTOT.species] || "🐾";
          const evoSuffix = PET_EVO_SUFFIX_TOT[equippedPetTOT.evolution || 0] || "";
          const rarityColor = RARITY_PET_COLORS_TOT[equippedPetTOT.rarity] || "text-gray-400";
          const xpPct = Math.min(100, ((equippedPetTOT.xp || 0) / 500) * 100);
          const traitNames = (equippedPetTOT.traits || []).map(t => typeof t === 'object' ? `${t.name}: ${t.desc}` : t).join('\n');
          return (
            <div
              className="bg-muted/20 border border-border/50 rounded-lg px-2.5 py-2 mt-1 cursor-help"
              title={traitNames ? `Traits:\n${traitNames}` : 'No traits'}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{icon}{evoSuffix}</span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-semibold leading-none truncate ${rarityColor}`}>
                      {equippedPetTOT.name || equippedPetTOT.species}
                    </p>
                    <span className="text-[9px] text-muted-foreground ml-1">Lv.{equippedPetTOT.level}</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground leading-none mt-0.5">
                    {SKILL_LABELS_TOT[equippedPetTOT.skillType] || equippedPetTOT.skillType || "companion"} · {equippedPetTOT.rarity}
                  </p>
                  {/* XP Bar */}
                  <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-cyan-500/60 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Floor Ladder */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-amber-400" /> Floor Progress
          </p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewOffset(v => v + 10)} disabled={startFloor + VISIBLE_FLOORS > TOWER_CONFIG.MAX_FLOOR}>
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewOffset(v => v - 10)} disabled={startFloor <= 1}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border">
          {floors.map(({ floor, cleared, isNext, isBoss, isCentennial, milestone }) => (
            <div
              key={floor}
              className={`flex items-center gap-3 px-4 py-2 transition-all ${
                isNext ? "bg-amber-500/10" :
                cleared ? "bg-green-500/5" : "opacity-50"
              }`}
            >
              {/* Floor number */}
              <div className={`w-12 text-right font-mono text-sm font-bold ${
                isCentennial ? "text-yellow-400" :
                isBoss ? "text-orange-400" :
                cleared ? "text-green-400" :
                isNext ? "text-amber-400" : "text-muted-foreground"
              }`}>
                {floor}
              </div>

              {/* Connector line */}
              <div className="flex flex-col items-center w-4">
                <div className={`w-3 h-3 rounded-full border-2 ${
                  cleared ? "bg-green-500 border-green-400" :
                  isNext ? "bg-amber-500 border-amber-400 animate-pulse" :
                  "bg-muted border-muted-foreground/30"
                }`} />
              </div>

              {/* Floor info */}
              <div className="flex-1 min-w-0">
                {milestone ? (
                  <div className="flex items-center gap-2">
                    <Skull className={`w-4 h-4 ${milestone.color}`} />
                    <span className={`text-sm font-bold ${milestone.color}`}>{milestone.label}</span>
                    <Badge className={`text-[10px] border ${milestone.borderColor} ${milestone.color} bg-transparent`}>
                      CENTENNIAL
                    </Badge>
                  </div>
                ) : isBoss ? (
                  <div className="flex items-center gap-2">
                    <Skull className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-semibold text-orange-400">Boss Floor</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {floor >= 200 ? "Multiple enemies" : "Single enemy"}
                  </span>
                )}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                {cleared ? (
                  <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/30">Cleared</Badge>
                ) : isNext ? (
                  <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">NEXT</Badge>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/30" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <ArrowUp className="w-4 h-4 text-amber-400" /> How the Tower Works
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>* Progress saves permanently — you always continue from your highest floor</li>
          <li>* HP carries over between floors within a single run</li>
          <li>* 3 attempts per hour — use them wisely!</li>
          <li>* Every 10th floor has a boss with better rewards</li>
          <li>* Every 100th floor has a centennial boss with special gear + profile frame</li>
          <li>* Floor 200+ spawns multiple enemies at once</li>
          <li>* Floor 1000: Face the ultimate challenge — Tammapac!</li>
          <li>* Earn Tammablocks (for Temple) and Tower Shards (for Pet Ascension)</li>
        </ul>
      </div>
    </div>
  );
}
