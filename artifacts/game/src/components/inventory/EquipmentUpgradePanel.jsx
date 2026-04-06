import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Hammer, Sparkles, AlertTriangle, Skull,
  TrendingUp, Gem, Coins, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RARITY_CONFIG } from "@/lib/gameData";

export default function EquipmentUpgradePanel({ item: initialItem, character, onClose, onItemUpdated }) {
  const [activeTab, setActiveTab] = useState("safe"); // safe, star, awaken
  const [confirmStar, setConfirmStar] = useState(false);
  const [confirmAwaken, setConfirmAwaken] = useState(false);
  const [result, setResult] = useState(null); // { type: "success"|"destroyed"|"failed", title, message }
  const [liveItem, setLiveItem] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const item = liveItem || initialItem;

  // Fetch game config for star upgrade success chances
  const { data: gameConfig } = useQuery({
    queryKey: ["gameConfig"],
    queryFn: () => base44.functions.invoke("gameConfigManager", {}),
    staleTime: 60000,
  });
  const upgCfg = gameConfig?.config?.UPGRADES || {};
  const starChancesArr = upgCfg.STAR_SUCCESS_CHANCES || [90, 75, 50, 35, 12, 8, 2];
  const STAR_SUCCESS_CHANCES = Object.fromEntries(starChancesArr.map((v, i) => [i, v]));

  const configRarityMults = gameConfig?.config?.RARITY_MULTIPLIERS || {};
  const defaultRarityMults = { common: 1.0, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 3.0, mythic: 4.0, set: 3.5, shiny: 5.0 };
  const rarityMultipliers = { ...defaultRarityMults, ...configRarityMults };
  const rarityMult = rarityMultipliers[item.rarity] || 1.0;

  const currentStar = item.star_level || 0;
  const successChance = STAR_SUCCESS_CHANCES[currentStar] || 0;
  const gemCost = Math.ceil((upgCfg.STAR_GEM_BASE || 50) * Math.pow(upgCfg.STAR_GEM_GROWTH || 2.0, currentStar) * rarityMult);

  // Safe upgrade costs — gold only
  const currentUpgrade = item.upgrade_level || 0;
  const goldCost = Math.floor(1000 * Math.pow(1.5, currentUpgrade) * rarityMult);

  // Mutations
  const clearResult = () => setResult(null);

  const safeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('upgradeItemSafe', { itemId: item.id });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        setResult({ type: "success", title: "UPGRADED!", message: `+${(item.upgrade_level || 0) + 1} Success` });
        if (data.gold_spent && character) {
          character.gold = (character.gold || 0) - data.gold_spent;
        }
        if (data.item) {
          setLiveItem({ ...item, ...data.item, upgrade_level: data.item.upgrade_level ?? data.item.upgradeLevel });
          onItemUpdated?.(data.item);
        }
        queryClient.invalidateQueries({ queryKey: ["items"] });
        queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
      } else {
        setResult({ type: "failed", title: "FAILED", message: data.message || "Upgrade failed" });
      }
    },
    onError: (error) => {
      setResult({ type: "failed", title: "ERROR", message: error.response?.data?.error || "Unknown error" });
    }
  });

  const starMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('starUpgradeItem', { itemId: item.id });
      return response;
    },
    onSuccess: (data) => {
      if (data.gems_spent) {
        const newGems = (character.gems || 0) - data.gems_spent;
        if (character && newGems >= 0) {
          character.gems = newGems;
        }
      }
      if (data.success) {
        setResult({ type: "success", title: "STAR UP!", message: `⭐ ${(item.star_level || 0) + 1} Success!` });
        if (data.item) {
          setLiveItem({ ...item, ...data.item, star_level: data.item.star_level ?? data.item.starLevel });
          onItemUpdated?.(data.item);
        }
      } else if (data.itemDestroyed) {
        setResult({ type: "destroyed", title: "DESTROYED!", message: data.message || "Item was destroyed!" });
      } else {
        setResult({ type: "failed", title: "FAILED", message: data.message || "Star upgrade failed" });
      }
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      setConfirmStar(false);
    },
    onError: (error) => {
      setResult({ type: "failed", title: "ERROR", message: error.response?.data?.error || "Unknown error" });
    }
  });

  const awakenMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('awakenItem', { itemId: item.id });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        setResult({ type: "success", title: "AWAKENED!", message: "Item has been awakened with immense power!" });
        if (data.item) {
          setLiveItem({ ...item, ...data.item, is_awakened: true });
          onItemUpdated?.(data.item);
        }
      } else {
        setResult({ type: "failed", title: "FAILED", message: data.message || "Awakening failed" });
      }
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      setConfirmAwaken(false);
    },
    onError: (error) => {
      setResult({ type: "failed", title: "ERROR", message: error.response?.data?.error || "Unknown error" });
    }
  });

  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-card border-2 rounded-xl p-5 w-full max-w-md space-y-4 ${rarity.border}`}
    >
      {/* Item Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${rarity.color}`}>{item.name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Upgrade Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Hammer className="w-3 h-3" /> +{currentUpgrade}
          </Badge>
          {currentStar > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 text-yellow-400 border-yellow-500/30">
              {[...Array(currentStar)].map((_, i) => <span key={i}>⭐</span>)}
            </Badge>
          )}
          {item.is_awakened && (
            <Badge variant="outline" className="flex items-center gap-1 text-cyan-400 border-cyan-500/30">
              <Sparkles className="w-3 h-3" /> AWAKENED
            </Badge>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("safe")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === "safe"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Hammer className="w-4 h-4" /> Safe
        </button>
        <button
          onClick={() => setActiveTab("star")}
          disabled={currentStar >= 7}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === "star"
              ? "bg-yellow-600 text-yellow-100"
              : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          }`}
        >
          <Zap className="w-4 h-4" /> Star
        </button>
        <button
          onClick={() => setActiveTab("awaken")}
          disabled={currentStar < 7 || item.is_awakened}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === "awaken"
              ? "bg-cyan-600 text-cyan-100"
              : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Awaken
        </button>
      </div>

      {/* Result Overlay — big and centered */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative z-10"
          >
            <div
              className={`rounded-xl p-6 text-center border-2 cursor-pointer ${
                result.type === "success"
                  ? "bg-green-500/20 border-green-500/60"
                  : result.type === "destroyed"
                  ? "bg-red-500/20 border-red-500/60"
                  : "bg-orange-500/20 border-orange-500/60"
              }`}
              onClick={clearResult}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 8, stiffness: 200 }}
              >
                <p className={`text-3xl font-black tracking-wider mb-1 ${
                  result.type === "success" ? "text-green-400"
                  : result.type === "destroyed" ? "text-red-400"
                  : "text-orange-400"
                }`}>
                  {result.type === "success" ? "✅" : result.type === "destroyed" ? "💀" : "❌"} {result.title}
                </p>
              </motion.div>
              <p className={`text-sm font-medium mt-2 ${
                result.type === "success" ? "text-green-300"
                : result.type === "destroyed" ? "text-red-300"
                : "text-orange-300"
              }`}>
                {result.message}
              </p>
              <p className="text-xs text-muted-foreground mt-3">Click to continue</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="space-y-3">
        {/* SAFE UPGRADE TAB */}
        {activeTab === "safe" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {currentUpgrade >= 20 ? (
              <div className="bg-muted/50 rounded-lg p-3 text-center text-sm text-muted-foreground">
                Max upgrade level reached (20)
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Gold Cost:</span>
                     <span className={`font-semibold flex items-center gap-1 ${
                       (character.gold || 0) >= goldCost ? "text-accent" : "text-destructive"
                     }`}>
                       <Coins className="w-4 h-4" /> {goldCost.toLocaleString()}
                     </span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Result:</span>
                     <span className="text-green-400 font-semibold">+{currentUpgrade + 1} (was +{currentUpgrade})</span>
                   </div>
                   {item.stats && Object.entries(item.stats).filter(([, v]) => v && v !== 0).length > 0 && (
                     <div className="border-t border-border pt-2 mt-2 space-y-1">
                       <p className="text-xs text-muted-foreground font-semibold">Stat increase (+5% per level):</p>
                       {Object.entries(item.stats)
                         .filter(([, value]) => value && value !== 0)
                         .map(([stat, value]) => {
                           const prevBoost = 1 + currentUpgrade * 0.05;
                           const nextBoost = 1 + (currentUpgrade + 1) * 0.05;
                           const baseVal = Math.round(value / prevBoost);
                           const nextVal = Math.round(baseVal * nextBoost);
                           return (
                             <div key={stat} className="flex justify-between text-xs">
                               <span className="capitalize text-muted-foreground">{stat.replace(/_/g, ' ')}:</span>
                               <span className="text-green-400 font-semibold">{value} → {nextVal}</span>
                             </div>
                           );
                         })}
                     </div>
                   )}
                 </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-xs text-green-200 text-center">
                  ✓ Safe upgrade (no risk)
                </div>

                <Button
                   onClick={() => safeMutation.mutate()}
                   disabled={safeMutation.isPending || (character.gold || 0) < goldCost}
                   className="w-full bg-green-600 hover:bg-green-700 gap-2"
                 >
                   {safeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                   {safeMutation.isPending ? "Upgrading..." : `Upgrade Level ${currentUpgrade + 1}`}
                 </Button>
              </>
            )}
          </motion.div>
        )}

        {/* STAR UPGRADE TAB */}
        {activeTab === "star" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {currentStar >= 7 ? (
              <div className="bg-muted/50 rounded-lg p-3 text-center text-sm text-muted-foreground">
                Max star level reached (7)
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Gem Cost:</span>
                     <span className="font-semibold flex items-center gap-1">
                       <Gem className="w-4 h-4 text-cyan-400" /> {gemCost}
                     </span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Success Chance:</span>
                     <span className={`font-bold ${
                       successChance >= 50 ? "text-green-400" : successChance >= 20 ? "text-orange-400" : "text-destructive"
                     }`}>
                       {successChance}%
                     </span>
                   </div>
                   {item.stats && Object.entries(item.stats).filter(([, v]) => v && v !== 0).length > 0 && (
                     <div className="border-t border-border pt-2 mt-2 space-y-1">
                       <p className="text-xs text-muted-foreground font-semibold">Stat Boost (+15% per star):</p>
                       {Object.entries(item.stats)
                         .filter(([, value]) => value && value !== 0)
                         .map(([stat, value]) => (
                           <div key={stat} className="flex justify-between text-xs">
                             <span className="capitalize text-muted-foreground">{stat.replace(/_/g, ' ')}:</span>
                             <span className="text-yellow-400 font-semibold">{Math.round(value)} → {Math.round(value * 1.15)}</span>
                           </div>
                         ))}
                     </div>
                   )}
                 </div>

                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1 text-xs text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">HIGH RISK!</p>
                      <p>Failure will PERMANENTLY DELETE your item!</p>
                    </div>
                  </div>
                </div>

                {!confirmStar ? (
                  <Button
                    onClick={() => setConfirmStar(true)}
                    disabled={starMutation.isPending || (character.gems || 0) < gemCost}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 gap-2"
                  >
                    <Zap className="w-4 h-4" /> Upgrade to ⭐{currentStar + 1}
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-3 text-sm text-destructive font-semibold text-center">
                      💀 Are you ABSOLUTELY SURE?
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setConfirmStar(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => starMutation.mutate()}
                        disabled={starMutation.isPending}
                        className="flex-1 bg-destructive hover:bg-destructive/90 gap-2"
                      >
                        {starMutation.isPending ? "Rolling..." : ""}
                        <Skull className="w-4 h-4" /> COMMIT
                      </Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* AWAKEN TAB */}
        {activeTab === "awaken" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {currentStar < 7 ? (
              <div className="bg-muted/50 rounded-lg p-3 text-center text-sm text-muted-foreground">
                Requires ⭐ Level 7 to awaken
              </div>
            ) : item.is_awakened ? (
              <div className="bg-cyan-500/10 rounded-lg p-3 text-center text-sm text-cyan-300 font-semibold">
                ✨ Item already awakened
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gem Cost:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Gem className="w-4 h-4 text-cyan-400" /> 5,000
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stat Bonus:</span>
                    <span className="font-semibold text-cyan-400">+100%</span>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-200 text-center space-y-1">
                  <p className="font-semibold">✨ LEGENDARY TRANSFORMATION ✨</p>
                  <p>Your item will transcend and gain immense power!</p>
                </div>

                {!confirmAwaken ? (
                  <Button
                    onClick={() => setConfirmAwaken(true)}
                    disabled={awakenMutation.isPending || (character.gems || 0) < 5000}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Awaken
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="bg-cyan-600/20 border border-cyan-500/50 rounded-lg p-3 text-sm text-cyan-300 font-semibold text-center">
                      ✨ Confirm awakening?
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setConfirmAwaken(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => awakenMutation.mutate()}
                        disabled={awakenMutation.isPending}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> {awakenMutation.isPending ? "Awakening..." : "AWAKEN"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
        Close
      </Button>
    </motion.div>
  );
}