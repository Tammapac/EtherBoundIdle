import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import PixelBar from "@/components/game/PixelBar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Swords, Skull, Coins, Star, Play, LogOut, LogIn,
  Shield, Zap, Heart, Users, Crown, Sparkles,
  Crosshair, Flame, Snowflake, Droplets, Wind,
  ArrowRight, AlertTriangle, ShieldCheck, RefreshCw,
  ChevronUp, ChevronDown, Gem,
} from "lucide-react";
import { CLASS_SKILLS, ELEMENT_CONFIG } from "@/lib/skillData";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

function getSkillSpriteFolder(skillId) {
  if (!skillId) return null;
  if (skillId.startsWith("m_")) return "mage";
  if (skillId.startsWith("w_")) return "warrior";
  if (skillId.startsWith("ro_")) return "rogue";
  if (skillId.startsWith("r_")) return "ranger";
  return null;
}
import { getPlayerSprite, getEnemySpriteUrl, getDeadSprite } from "@/lib/pixelSprites";
import CombatEffects from "@/components/game/CombatEffects";

const ELEMENT_ICONS = {
  fire: Flame, ice: Snowflake, lightning: Zap, poison: Droplets,
  blood: Heart, sand: Wind, neutral: Star,
};
const ELEMENT_COLORS = {
  fire: "text-orange-400", ice: "text-cyan-400", lightning: "text-yellow-400",
  poison: "text-green-400", blood: "text-red-400", sand: "text-amber-400", neutral: "text-gray-400",
};

// ── Pixel art landscape SVG generator ──
// Creates an inline SVG data URI with a pixelated landscape per element
function generatePixelLandscape(element, width = 320, height = 200) {
  const px = 8;
  const cols = Math.ceil(width / px);
  const rows = Math.ceil(height / px);

  const themes = {
    fire: {
      sky1: "#1a0500", sky2: "#3d1000", sky3: "#5c1a00", sky4: "#7a2500",
      cloud: "#4a2000", mountain1: "#2d0800", mountain2: "#451200",
      field1: "#8b3000", field2: "#a64000", field3: "#c25000",
      grass: "#3d1500", grassTip: "#5c2000",
    },
    ice: {
      sky1: "#0a1628", sky2: "#1a3050", sky3: "#3a6090", sky4: "#5a8ab8",
      cloud: "#c8dff0", mountain1: "#4a6a8a", mountain2: "#6a8aaa",
      field1: "#b8d8f0", field2: "#d0e8f8", field3: "#e8f4ff",
      grass: "#2a4a68", grassTip: "#4a6a88",
    },
    lightning: {
      sky1: "#0a0a1a", sky2: "#1a1530", sky3: "#2d2545", sky4: "#403060",
      cloud: "#3a3050", mountain1: "#252040", mountain2: "#352a50",
      field1: "#8a7a30", field2: "#a89838", field3: "#c8b840",
      grass: "#3a3520", grassTip: "#504a30",
    },
    poison: {
      sky1: "#0a1a0a", sky2: "#0a2a10", sky3: "#103a18", sky4: "#185025",
      cloud: "#1a3a20", mountain1: "#0a2a0a", mountain2: "#1a3a15",
      field1: "#2a5a20", field2: "#3a7a2a", field3: "#4a9a34",
      grass: "#1a3a10", grassTip: "#2a5a1a",
    },
    blood: {
      sky1: "#1a0508", sky2: "#2d0a10", sky3: "#450f18", sky4: "#601520",
      cloud: "#3a1520", mountain1: "#2d0a0a", mountain2: "#451515",
      field1: "#5a1520", field2: "#7a2030", field3: "#9a2a3a",
      grass: "#2d0a10", grassTip: "#451520",
    },
    sand: {
      sky1: "#2a2010", sky2: "#4a3818", sky3: "#6a5028", sky4: "#8a6838",
      cloud: "#d8c898", mountain1: "#6a5530", mountain2: "#8a7040",
      field1: "#c8a850", field2: "#d8b860", field3: "#e8c870",
      grass: "#5a4820", grassTip: "#7a6030",
    },
    neutral: {
      sky1: "#6ab8e0", sky2: "#88ccee", sky3: "#a8ddf0", sky4: "#c8eeff",
      cloud: "#ffffff", mountain1: "#6a8aaa", mountain2: "#8aaaca",
      field1: "#c8b830", field2: "#d8c840", field3: "#b8a828",
      grass: "#2a4a18", grassTip: "#3a5a20",
    },
  };

  const t = themes[element] || themes.neutral;
  let rects = [];

  // Mountain shape function - returns height (0-1) at column position
  const mountainAt = (col) => {
    const x = col / cols;
    // Three overlapping peaks
    const p1 = Math.max(0, 1 - Math.abs(x - 0.2) * 5) * 0.7;
    const p2 = Math.max(0, 1 - Math.abs(x - 0.5) * 4) * 0.9;
    const p3 = Math.max(0, 1 - Math.abs(x - 0.78) * 4.5) * 0.8;
    // Smaller bumps
    const b1 = Math.max(0, 1 - Math.abs(x - 0.35) * 8) * 0.4;
    const b2 = Math.max(0, 1 - Math.abs(x - 0.92) * 7) * 0.35;
    return Math.max(p1, p2, p3, b1, b2);
  };

  // Cloud shapes
  const clouds = [
    { cx: 4, cy: 3, w: 7, h: 3 },   // left cloud
    { cx: 15, cy: 2, w: 5, h: 2 },   // small center
    { cx: 26, cy: 4, w: 9, h: 3 },   // right cloud
    { cx: 35, cy: 2, w: 4, h: 2 },   // far right
  ];
  const isCloud = (col, row) => {
    const c = col % 40;
    const r = row;
    for (const cloud of clouds) {
      const dx = c - cloud.cx;
      const dy = r - cloud.cy;
      // Elliptical shape
      if ((dx * dx) / (cloud.w * cloud.w / 4) + (dy * dy) / (cloud.h * cloud.h / 4) <= 1) {
        return true;
      }
    }
    return false;
  };

  // Grass blade heights (pre-computed)
  const grassBlades = [];
  for (let c = 0; c < cols; c++) {
    grassBlades[c] = ((Math.sin(c * 0.8) + Math.sin(c * 1.7) * 0.5 + 1.5) / 3) * 4 + 1;
  }

  for (let row = 0; row < rows; row++) {
    const y = row * px;
    const rowPct = row / rows;

    for (let col = 0; col < cols; col++) {
      const x = col * px;
      let color;

      const skyEnd = 0.38;
      const mountainStart = 0.30;
      const mountainEnd = 0.52;
      const fieldEnd = 0.82;

      // Sky (top 38%)
      if (rowPct < 0.10) color = t.sky1;
      else if (rowPct < 0.20) color = t.sky2;
      else if (rowPct < 0.30) color = t.sky3;
      else if (rowPct < skyEnd) color = t.sky4;

      // Clouds overlay (10%-30%)
      if (rowPct >= 0.08 && rowPct <= 0.30) {
        const cloudRow = Math.floor(row * 0.5);
        if (isCloud(col, cloudRow)) {
          color = t.cloud;
        }
      }

      // Mountains zone (30%-52%)
      if (rowPct >= mountainStart && rowPct < mountainEnd) {
        const mh = mountainAt(col);
        const mountainRowPct = (rowPct - mountainStart) / (mountainEnd - mountainStart);
        const mountainThreshold = 1 - mh;
        if (mountainRowPct > mountainThreshold) {
          // How deep into the mountain
          const depth = (mountainRowPct - mountainThreshold) / (1 - mountainThreshold);
          color = depth < 0.5 ? t.mountain1 : t.mountain2;
        } else if (rowPct >= skyEnd && !color) {
          color = t.sky4;
        }
      }

      // Fields (52%-82%)
      if (rowPct >= mountainEnd && rowPct < fieldEnd) {
        const fieldRow = (rowPct - mountainEnd) / (fieldEnd - mountainEnd);
        // Horizontal stripe variation + checkerboard texture
        const stripe = (row + col) % 3;
        const vStripe = Math.floor(col / 4) % 2;
        if (fieldRow < 0.25) {
          color = vStripe ? t.field1 : t.field2;
        } else if (fieldRow < 0.50) {
          color = stripe === 0 ? t.field2 : t.field3;
        } else if (fieldRow < 0.75) {
          color = vStripe ? t.field3 : t.field1;
        } else {
          color = stripe === 0 ? t.field1 : t.field2;
        }
        // Darker patches for depth
        if ((col * 7 + row * 13) % 23 === 0) color = t.field1;
        // Green path/edge near bottom of field
        if (fieldRow > 0.85) {
          color = ((col + row) % 4 === 0) ? t.grass : color;
        }
      }

      // Grass foreground (82%-100%)
      if (rowPct >= fieldEnd) {
        const grassZone = (rowPct - fieldEnd) / (1 - fieldEnd);
        const bladeH = grassBlades[col] / rows;
        // Grass blades extend upward with varying heights
        if (grassZone < 0.3) {
          // Blade tips area - mix of grass and field
          const bladeReach = grassBlades[col] > 2.5;
          color = bladeReach && (col % 2 === 0) ? t.grass : t.grassTip;
          if ((col + row) % 3 === 0) color = t.field1; // some field showing through
        } else {
          // Solid grass
          color = (col % 3 === 0) ? t.grassTip : t.grass;
        }
      }

      if (!color) color = t.sky4;
      rects.push(`<rect x="${x}" y="${y}" width="${px}" height="${px}" fill="${color}"/>`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ── Pixel art background component ──
function PixelArtBackground({ element }) {
  const bgUrl = useMemo(() => generatePixelLandscape(element), [element]);
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("${bgUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        imageRendering: "pixelated",
        opacity: 0.6,
      }}
    />
  );
}

// ─── Path Choice Screen with Buff/Debuff Selection ────────────────────────
function PathChoiceScreen({ session, element, rewards, loading, autoFight, doAction }) {
  const [selectedBuffs, setSelectedBuffs] = useState([]);
  const [selectedDebuffs, setSelectedDebuffs] = useState([]);
  const [pathChoice, setPathChoice] = useState(null); // "safe" or "risk"
  const autoPathDone = useRef(false);

  const data = session?.data || {};
  const availableBuffs = data.availableBuffs || [];
  const availableDebuffs = data.availableDebuffs || [];
  const fieldNumber = session?.fieldNumber || 1;

  // Safe: pick 1 buff + 1 debuff minimum. Risk: pick 2 buffs + 2 debuffs minimum.
  const requiredBuffs = pathChoice === "risk" ? 2 : 1;
  const requiredDebuffs = pathChoice === "risk" ? 2 : 1;
  const canConfirm = pathChoice && selectedBuffs.length >= requiredBuffs && selectedDebuffs.length >= requiredDebuffs;

  const toggleBuff = (id) => {
    setSelectedBuffs(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };
  const toggleDebuff = (id) => {
    setSelectedDebuffs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const handleConfirm = () => {
    if (!canConfirm || loading) return;
    doAction("choose_path", {
      pathChoice,
      selectedBuffIds: selectedBuffs,
      selectedDebuffIds: selectedDebuffs,
    });
  };

  // Auto-fight: auto-pick safe path with random modifiers
  useEffect(() => {
    if (!autoFight || autoPathDone.current) return;
    autoPathDone.current = true;
    const autoBuffs = availableBuffs.slice(0, 1).map(b => b.id);
    const autoDebuffs = availableDebuffs.slice(0, 1).map(d => d.id);
    doAction("choose_path", {
      pathChoice: "safe",
      selectedBuffIds: autoBuffs,
      selectedDebuffIds: autoDebuffs,
    });
  }, [autoFight, availableBuffs, availableDebuffs, doAction]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden">
      <PixelArtBackground element={element} />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 bg-black/80 backdrop-blur-sm border-2 border-green-500/40 p-6 max-w-2xl w-full text-center space-y-4">
        <Sparkles className="w-12 h-12 text-green-400 mx-auto" />
        <h2 className="text-xl font-bold text-green-400">Field {fieldNumber} Cleared!</h2>
        <p className="text-muted-foreground text-sm">Choose your path and select modifiers for the next field:</p>

        {/* Path selection */}
        <div className="grid grid-cols-2 gap-4">
          <PixelButton
            variant="ok"
            label="SAFE PATH"
            onClick={() => { setPathChoice("safe"); setSelectedBuffs([]); setSelectedDebuffs([]); }}
          />
          <PixelButton
            variant="cancel"
            label="RISK PATH"
            onClick={() => { setPathChoice("risk"); setSelectedBuffs([]); setSelectedDebuffs([]); }}
          />
        </div>

        {/* Modifier selection */}
        {pathChoice && (
          <div className="space-y-3 text-left">
            {/* Buffs */}
            <div>
              <p className="text-xs font-bold text-green-400 mb-1">Choose Buffs (min {requiredBuffs}):</p>
              <div className="grid grid-cols-2 gap-1.5">
                {availableBuffs.map(buff => (
                  <button
                    key={buff.id}
                    onClick={() => toggleBuff(buff.id)}
                    className={`p-2 border text-left text-xs transition-all cursor-pointer ${selectedBuffs.includes(buff.id) ? "bg-green-500/20 border-green-500/60" : "bg-black/30 border-white/10 hover:border-green-500/40"}`}
                  >
                    <span className="font-bold text-green-400">{buff.name}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{buff.description}</p>
                  </button>
                ))}
              </div>
            </div>
            {/* Debuffs */}
            <div>
              <p className="text-xs font-bold text-red-400 mb-1">Choose Debuffs (min {requiredDebuffs}):</p>
              <div className="grid grid-cols-2 gap-1.5">
                {availableDebuffs.map(debuff => (
                  <button
                    key={debuff.id}
                    onClick={() => toggleDebuff(debuff.id)}
                    className={`p-2 border text-left text-xs transition-all cursor-pointer ${selectedDebuffs.includes(debuff.id) ? "bg-red-500/20 border-red-500/60" : "bg-black/30 border-white/10 hover:border-red-500/40"}`}
                  >
                    <span className="font-bold text-red-400">{debuff.name}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{debuff.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <PixelButton
              variant="ok"
              label={loading ? "LOADING..." : `ENTER FIELD ${fieldNumber + 1} (${pathChoice === "risk" ? "RISK" : "SAFE"})`}
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
            />
          </div>
        )}

        <div className="pt-1">
          <p className="text-xs text-muted-foreground">Rewards so far: {rewards.dublons || 0} Dublons, {rewards.gold || 0} Gold, {rewards.exp || 0} EXP</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Field Combat ─────────────────────────────────────────────────────────
function FieldCombat({ session: initialSession, character, onLeave }) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [autoFight, setAutoFight] = useState(false);
  const autoFightRef = useRef(false);
  const logRef = useRef(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const combatPollInterval = useSmartPolling(POLL_INTERVALS.COMBAT);

  useEffect(() => { autoFightRef.current = autoFight; }, [autoFight]);
  useEffect(() => { setSession(initialSession); }, [initialSession]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session?.combatLog?.length]);

  const doAction = useCallback(async (actionType, extra = {}) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("fieldAction", {
        characterId: character.id,
        action: actionType,
        sessionId: session.id,
        ...extra,
      });
      if (res?.session) setSession(res.session);
      if (res?.success === false && res?.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }, [loading, session?.id, character?.id, toast]);

  // Auto-attack
  useEffect(() => {
    if (!autoFight || session?.status !== "combat") return;
    const iv = setInterval(() => {
      if (!autoFightRef.current) return;
      const aliveEnemy = (session?.enemies || []).find(e => e.hp > 0);
      if (aliveEnemy) {
        doAction("attack", { targetEnemyId: selectedTarget || aliveEnemy.id });
      }
    }, 1200);
    return () => clearInterval(iv);
  }, [autoFight, session?.status, session?.enemies, selectedTarget, doAction]);

  // Real-time field combat updates via Socket.IO
  useEffect(() => {
    if (!session?.id) return;
    const handler = (e) => {
      const data = e.detail;
      if (data && data.id === session.id) setSession(prev => ({ ...prev, ...data }));
    };
    window.addEventListener("field-combat-update", handler);
    return () => window.removeEventListener("field-combat-update", handler);
  }, [session?.id]);

  // Fallback polling (reduced frequency, socket is primary)
  useEffect(() => {
    if (!session?.id) return;
    const iv = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("fieldAction", {
          characterId: character.id, action: "poll", sessionId: session.id,
        });
        if (res?.session) setSession(res.session);
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [session?.id, character?.id]);

  const me = (session?.members || []).find(m => m.characterId === character.id || m.character_id === character.id);
  const enemies = session?.enemies || [];
  const members = session?.members || [];
  const modifiers = session?.modifiers || [];
  const combatLog = session?.combatLog || [];
  const element = session?.element || "neutral";
  const ElemIcon = ELEMENT_ICONS[element] || Star;
  const elemColor = ELEMENT_COLORS[element] || "text-gray-400";
  const isDefeated = session?.status === "defeated";
  const isFieldClear = session?.status === "field_clear";
  const pendingPath = session?.data?.pendingPathChoice;
  const rewards = session?.rewards || {};
  // Use hotbar skills (same pattern as Battle.jsx)
  const allClassSkills = CLASS_SKILLS[character?.class] || [];
  const hotbarIds = character?.hotbar_skills?.length > 0
    ? character.hotbar_skills
    : (character?.skills || []);
  const mySkills = hotbarIds
    .map(sid => allClassSkills.find(s => s.id === sid))
    .filter(Boolean)
    .slice(0, 6);

  const handleLeave = async () => {
    await doAction("leave");
    queryClient.invalidateQueries(["character"]);
    onLeave();
  };

  // Defeat screen
  if (isDefeated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden">
        <PixelArtBackground element={element} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 bg-black/80 backdrop-blur-sm border-2 border-red-500/50 p-6 max-w-lg w-full text-center space-y-4" style={{ imageRendering: "pixelated" }}>
          <Skull className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-red-400">Defeated on Field {session?.fieldNumber}</h2>
          <p className="text-muted-foreground">Your party has fallen. Here are your total rewards:</p>
          <div className="bg-black/50 border border-white/10 p-4 space-y-2 text-left">
            {rewards.gold > 0 && <div className="flex justify-between"><span className="text-yellow-400">Gold</span><span>+{rewards.gold.toLocaleString()}</span></div>}
            {rewards.exp > 0 && <div className="flex justify-between"><span className="text-blue-400">EXP</span><span>+{rewards.exp.toLocaleString()}</span></div>}
            {rewards.dublons > 0 && <div className="flex justify-between"><span className="text-purple-400">Dublons</span><span>+{rewards.dublons}</span></div>}
            {rewards.crystals > 0 && <div className="flex justify-between"><span className="text-cyan-400">Crystals</span><span>+{rewards.crystals}</span></div>}
            {rewards.ascension_shards > 0 && <div className="flex justify-between"><span className="text-amber-400">Ascension Shards</span><span>+{rewards.ascension_shards}</span></div>}
            {rewards.celestial_stones > 0 && <div className="flex justify-between"><span className="text-pink-400">Celestial Stones</span><span>+{rewards.celestial_stones}</span></div>}
            {rewards.incubators > 0 && <div className="flex justify-between"><span className="text-green-400">Incubators</span><span>+{rewards.incubators}</span></div>}
            {rewards.sqrizzscrolls > 0 && <div className="flex justify-between"><span className="text-orange-400">Sqrizzscrolls</span><span>+{rewards.sqrizzscrolls}</span></div>}
            {rewards.boss_stones > 0 && <div className="flex justify-between"><span className="text-red-400">Boss Stones</span><span>+{rewards.boss_stones}</span></div>}
            {(rewards.loot || []).length > 0 && <div className="pt-2 border-t border-white/10"><span className="text-amber-300 text-sm font-semibold">Loot:</span> {rewards.loot.join(", ")}</div>}
          </div>
          <PixelButton variant="cancel" label="LEAVE THE FIELDS" onClick={handleLeave} />
        </motion.div>
      </div>
    );
  }

  // Path choice screen with buff/debuff selection
  if (isFieldClear && pendingPath) {
    return (
      <PathChoiceScreen
        session={session}
        element={element}
        rewards={rewards}
        loading={loading}
        autoFight={autoFight}
        doAction={doAction}
      />
    );
  }

  return (
    <div className="min-h-[80vh] relative overflow-hidden flex flex-col">
      {/* Pixel art landscape background */}
      <PixelArtBackground element={element} />

      {/* Content overlay — flex column layout: header, enemies (center), players (bottom) */}
      <div className="relative z-10 p-2 flex flex-col flex-1 gap-2">
        {/* Header */}
        <div className="flex items-center justify-between bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <ElemIcon className={`w-5 h-5 ${elemColor}`} />
            <span className="font-bold text-sm">Field {session?.fieldNumber}</span>
            <Badge variant="outline" className={`${elemColor} border-current text-xs`}>{element}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-400 border-purple-500/50 text-xs">{rewards.dublons || 0} Dublons</Badge>
            <Button size="sm" variant={autoFight ? "destructive" : "outline"} onClick={() => setAutoFight(!autoFight)} className="h-7 text-xs">
              {autoFight ? "Stop" : "Auto"}
            </Button>
            <PixelButton variant="cancel" label="LEAVE" onClick={handleLeave} />
          </div>
        </div>

        {/* Modifiers bar */}
        {modifiers.length > 0 && (
          <div className="flex gap-1 flex-wrap bg-black/50 backdrop-blur-sm border border-white/5 px-2 py-1">
            {modifiers.map((mod, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] ${mod.type === "buff" ? "text-green-400 border-green-500/40" : "text-red-400 border-red-500/40"}`} title={mod.description}>
                {mod.type === "buff" ? <ChevronUp className="w-2.5 h-2.5 mr-0.5" /> : <ChevronDown className="w-2.5 h-2.5 mr-0.5" />}
                {mod.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Enemies (center section — takes remaining space) */}
        <div className="flex-1 bg-black/60 backdrop-blur-sm border border-white/10 p-2">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Skull className="w-3 h-3" /> Enemies ({enemies.filter(e => e.hp > 0).length}/{enemies.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {enemies.map((enemy, i) => {
              const dead = enemy.hp <= 0;
              const hpPct = enemy.max_hp > 0 ? (enemy.hp / enemy.max_hp * 100) : 0;
              const isSelected = selectedTarget === enemy.id;
              const spriteUrl = dead
                ? getDeadSprite(3)
                : getEnemySpriteUrl(enemy.element || element, enemy.name, enemy.isBoss, enemy.isElite, 3);
              return (
                <motion.div
                  key={enemy.id}
                  onClick={() => !dead && setSelectedTarget(enemy.id)}
                  whileHover={!dead ? { y: -2 } : {}}
                  whileTap={!dead ? { scale: 0.95 } : {}}
                  className={`relative p-1.5 border cursor-pointer transition-all ${dead ? "opacity-30 border-gray-700" : isSelected ? "border-yellow-500 bg-yellow-500/10 ring-1 ring-yellow-500/30" : "border-white/10 hover:border-white/30 bg-black/30"}`}
                >
                  {enemy.isElite && <Badge className="absolute -top-1 -right-1 text-[7px] px-1 py-0 bg-yellow-600 z-10">ELITE</Badge>}
                  {enemy.isBoss && <Badge className="absolute -top-1 -right-1 text-[7px] px-1 py-0 bg-red-600 z-10">BOSS</Badge>}
                  <div className="flex items-center gap-1.5 mb-1">
                    <motion.img
                      src={spriteUrl}
                      alt={enemy.name}
                      className="w-10 h-10"
                      style={{ imageRendering: "pixelated" }}
                      animate={!dead && isSelected ? { y: [0, -3, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold truncate ${dead ? "line-through" : ""} ${enemy.isElite ? "text-yellow-400" : enemy.isBoss ? "text-red-400" : "text-foreground"}`}>
                          {enemy.name}
                        </span>
                        {/* Debuff icons next to enemy name */}
                        {modifiers.filter(m => m.type === "debuff").map((mod, mi) => (
                          <div key={mi} className="w-4 h-4 rounded border border-red-500/60 bg-red-500/20 flex items-center justify-center shrink-0" title={`${mod.name}: ${mod.description || "Debuff"}`}>
                            <span className="text-[7px]">⬇</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-1.5 bg-gray-800 overflow-hidden mt-0.5">
                        <div className={`h-full transition-all ${hpPct > 50 ? "bg-red-500" : hpPct > 25 ? "bg-orange-500" : "bg-red-700"}`} style={{ width: `${hpPct}%` }} />
                      </div>
                      <p className="text-[8px] text-muted-foreground">{dead ? "DEAD" : `${enemy.hp}/${enemy.max_hp}`}</p>
                    </div>
                  </div>
                  {(enemy.attackers || []).length >= 3 && <span className="text-[8px] text-yellow-400">x{enemy.attackers.length} co-op!</span>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {session?.status === "waiting" && (
          <div className="text-center p-4">
            <PixelButton variant="ok" label="START BATTLE" onClick={() => doAction("start")} />
          </div>
        )}

        {/* Players (bottom section) */}
        <div className="bg-black/60 backdrop-blur-sm border border-white/10 p-2">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Players ({members.length}/10)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {members.map((m, i) => {
              const isMe = (m.characterId || m.character_id) === character.id;
              const dead = !m.alive || m.hp <= 0;
              const hpPct = m.max_hp > 0 ? (m.hp / m.max_hp * 100) : 0;
              const mpPct = m.max_mp > 0 ? ((m.mp || 0) / m.max_mp * 100) : 0;
              const playerSprite = dead ? getDeadSprite(3) : getPlayerSprite(m.class, 3);
              return (
                <div key={m.characterId || m.character_id || i} className={`p-1.5 border transition-all ${dead ? "opacity-50 border-gray-700" : isMe ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-black/30"}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <img src={playerSprite} alt={m.class} className="w-10 h-10" style={{ imageRendering: "pixelated" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {isMe && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                        <span className={`text-[10px] font-bold truncate ${dead ? "line-through text-gray-500" : ""}`}>{m.name}</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground">Lv{m.level} {m.class}</span>
                    </div>
                    {/* Active modifiers next to character */}
                    {isMe && modifiers.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap">
                        {modifiers.map((mod, mi) => (
                          <div
                            key={mi}
                            className={`w-5 h-5 rounded border flex items-center justify-center ${mod.type === "buff" ? "border-green-500/60 bg-green-500/20" : "border-red-500/60 bg-red-500/20"}`}
                            title={`${mod.name}: ${mod.description || (mod.type === "buff" ? "Buff active" : "Debuff active")}`}
                          >
                            <span className="text-[8px]">{mod.type === "buff" ? "⬆" : "⬇"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <PixelBar current={dead ? 0 : m.hp} max={m.max_hp} type="hp" showText={false} />
                  <p className="text-[8px] text-muted-foreground">{dead ? "KO'd" : `${m.hp}/${m.max_hp}`}</p>
                  <PixelBar current={m.mp} max={m.max_mp} type="mp" showText={false} />
                  {m.reviveTimer > 0 && <p className="text-[8px] text-cyan-400 mt-0.5">Reviving... ({m.reviveTimer}/3)</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons (below players) */}
        {session?.status === "combat" && me?.alive && me?.hp > 0 && (
          <div className="flex gap-1 flex-wrap bg-black/60 backdrop-blur-sm border border-white/10 p-2">
            <PixelButton variant="ok" label="ATTACK" onClick={() => doAction("attack", { targetEnemyId: selectedTarget })} disabled={loading} />
            {mySkills.map(skill => {
              const elem = skill.element ? ELEMENT_CONFIG[skill.element] : null;
              const buffColor = skill.buff === "defense" ? "border-blue-500/50 text-blue-400"
                : skill.buff === "attack" ? "border-orange-500/50 text-orange-400"
                : skill.special === "pickpocket" ? "border-yellow-500/50 text-yellow-400"
                : elem ? `border-current/30 ${elem.color}`
                : "border-secondary/40 text-secondary";
              return (
                <button
                  key={skill.id}
                  onClick={() => doAction("skill", { skillId: skill.id, targetEnemyId: selectedTarget })}
                  disabled={loading}
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
            {character?.class === "warrior" && (
              <PixelButton variant="ok" label="TAUNT" onClick={() => doAction("aggro")} disabled={loading} />
            )}
            {character?.class === "mage" && (
              <>
                {members.filter(m => m.characterId !== character.id && m.alive && m.hp > 0 && m.hp < m.max_hp).map(m => (
                  <PixelButton key={m.characterId} variant="ok" label={`HEAL ${m.name.toUpperCase()}`} onClick={() => doAction("heal_ally", { targetCharacterId: m.characterId || m.character_id })} disabled={loading} />
                ))}
              </>
            )}
            {members.filter(m => (m.characterId || m.character_id) !== character.id && (!m.alive || m.hp <= 0)).map(m => (
              <PixelButton key={`rev-${m.characterId || m.character_id}`} variant="ok" label={`REVIVE ${m.name.toUpperCase()}${m.reviveTimer > 0 ? ` (${m.reviveTimer}/3)` : ""}`} onClick={() => doAction("revive", { targetCharacterId: m.characterId || m.character_id })} disabled={loading} />
            ))}
          </div>
        )}

        {/* Combat Log */}
        <div ref={logRef} className="bg-black/70 backdrop-blur-sm border border-white/10 p-2 h-32 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-gray-700">
          {combatLog.map((log, i) => (
            <p key={i} className={`text-[10px] ${log.type === "victory" ? "text-green-400 font-bold" : log.type === "defeat" ? "text-red-400 font-bold" : log.type === "player_attack" ? "text-blue-300" : log.type === "enemy_attack" ? "text-red-300" : "text-gray-400"}`}>
              {log.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fields Lobby ─ ─────────────────────────────────────────────────────────
export default function Fields({ character, onCharacterUpdate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [lobbySessions, setLobbySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("fieldAction", {
        characterId: character.id, action: "get_status",
      });
      if (res?.session) { setActiveSession(res.session); setLoading(false); return; }

      const listRes = await base44.functions.invoke("fieldAction", {
        characterId: character.id, action: "list_active",
      });
      setLobbySessions(listRes?.sessions || []);
      setActiveSession(null);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }, [character?.id, toast]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const enterFields = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("fieldAction", {
        characterId: character.id, action: "enter",
      });
      if (res?.session) setActiveSession(res.session);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const joinSession = async (sessionId) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("fieldAction", {
        characterId: character.id, action: "join", sessionId,
      });
      if (res?.session) setActiveSession(res.session);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
        <PixelArtBackground element="neutral" />
        <div className="relative z-10 animate-pulse text-muted-foreground">Loading The Fields...</div>
      </div>
    );
  }

  // Active session — show combat
  if (activeSession) {
    return (
      <FieldCombat
        session={activeSession}
        character={character}
        onLeave={() => { setActiveSession(null); fetchStatus(); queryClient.invalidateQueries(["character"]); }}
      />
    );
  }

  // Lobby
  return (
    <div className="min-h-[80vh] relative overflow-hidden">
      <PixelArtBackground element="neutral" />

      <div className="relative z-10 p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">The Fields</h1>
            <p className="text-muted-foreground text-sm">Battle endless waves of enemies with up to 10 players. Fight until you fall!</p>
          </motion.div>
        </div>

        {/* Enter Button */}
        <div className="text-center">
          <PixelButton variant="ok" label="ENTER THE FIELDS" onClick={enterFields} />
        </div>

        {/* Active Sessions to Join */}
        {lobbySessions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Active Sessions</h2>
            <div className="grid gap-2">
              {lobbySessions.map(s => {
                const EIcon = ELEMENT_ICONS[s.element] || Star;
                return (
                  <div key={s.id} className="flex items-center justify-between bg-black/60 backdrop-blur-sm border border-white/10 p-3">
                    <div className="flex items-center gap-3">
                      <EIcon className={`w-5 h-5 ${ELEMENT_COLORS[s.element] || "text-gray-400"}`} />
                      <div>
                        <p className="text-sm font-bold">Field {s.fieldNumber} <Badge variant="outline" className="ml-1 text-[10px]">{s.element}</Badge></p>
                        <p className="text-xs text-muted-foreground">{s.members.map(m => m.name).join(", ")} ({s.memberCount}/{s.maxPlayers})</p>
                      </div>
                    </div>
                    <PixelButton variant="ok" label="JOIN" onClick={() => joinSession(s.id)} disabled={s.memberCount >= s.maxPlayers} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 p-3 space-y-1">
            <h3 className="text-sm font-bold text-green-400 flex items-center gap-1"><Shield className="w-4 h-4" /> Class Roles</h3>
            <p className="text-xs text-muted-foreground">Warriors can taunt enemies. Mages can heal allies. Any player can revive KO'd teammates (3 turns).</p>
          </div>
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 p-3 space-y-1">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-1"><Gem className="w-4 h-4" /> Rewards</h3>
            <p className="text-xs text-muted-foreground">Earn Dublons, Crystals, Sqrizzscrolls, Boss Stones, gold, EXP, and gear. Teamwork on enemies = bonus loot!</p>
          </div>
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 p-3 space-y-1">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Risk vs Safe</h3>
            <p className="text-xs text-muted-foreground">After each field, choose Risk Path (harder + better rewards) or Safe Path (easier). Fields get harder with more debuffs!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
