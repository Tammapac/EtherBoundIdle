import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gem, Zap, Gauge, TrendingUp, Clock, Coins } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import hybridPersistence from "@/lib/hybridPersistence";
import GemLabProgressBar from "./GemLabProgressBar";

export default function GemLabPanel({ character, onCharacterUpdate }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch GemLab data
  const { data: gemLab, isLoading } = useQuery({
    queryKey: ["gemlab", character?.id, refreshTrigger],
    queryFn: async () => {
      const labs = await base44.entities.GemLab.filter({ character_id: character?.id });
      return labs[0] || null;
    },
    enabled: !!character?.id,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Process gem generation (calculate pending gems)
  const processMutation = useMutation({
    mutationFn: () => base44.functions.invoke("processGemLab", { characterId: character.id }),
    onSuccess: (response) => {
      setRefreshTrigger(t => t + 1);
      if (response?.gemsGenerated > 0) {
        toast({
          title: `Generated ${response.gemsGenerated.toFixed(3)} gems while offline (${response.offlineHours}h)`,
          duration: 2000,
        });
      }
    },
  });

  const claimMutation = useMutation({
    mutationFn: () => base44.functions.invoke("claimGemLabGems", { characterId: character.id }),
    onSuccess: (response) => {
      if (response?.claimedGems > 0) {
        onCharacterUpdate({ ...character, gems: response.newTotal });
        queryClient.invalidateQueries({ queryKey: ["gemlab"] });
        toast({
          title: `Claimed ${response.claimedGems} gems!`,
          duration: 1500,
        });
      }
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: (upgradeType) =>
      base44.functions.invoke("upgradeGemLab", { characterId: character.id, upgradeType }),
    onSuccess: (response) => {
      if (response?.goldRemaining !== undefined) {
        onCharacterUpdate({ ...character, gold: response.goldRemaining });
        queryClient.invalidateQueries({ queryKey: ["gemlab"] });
        toast({
          title: `Upgraded ${response.upgradeType}!`,
          duration: 1500,
        });
      }
    },
    onError: (err) => {
      toast({
        title: err?.message || "Upgrade failed",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // Calculate metrics
  const calculateMetrics = () => {
    if (!gemLab) return { production: 0.001, cycleTime: 10, efficiency: 1, nextCost: 1000 };

    const labData = gemLab.data || {};
    const BASE_PRODUCTION = 0.001;
    const BASE_COST = 1000;
    const COST_MULTIPLIER = 1.15;

    const prodLevel = labData.production_level || 0;
    const speedLevel = labData.speed_level || 0;
    const effLevel = labData.efficiency_level || 0;

    const prodMult = 1 + (prodLevel * 0.05);
    const speedMult = 1 + (speedLevel * 0.02);
    const effMult = 1 + (effLevel * 0.03);

    const gemsPerCycle = BASE_PRODUCTION * prodMult * effMult;
    const cycleTime = 10 / speedMult;

    const nextProdCost = Math.floor(BASE_COST * Math.pow(COST_MULTIPLIER, prodLevel));
    const nextSpeedCost = Math.floor(BASE_COST * Math.pow(COST_MULTIPLIER, speedLevel));
    const nextEffCost = Math.floor(BASE_COST * Math.pow(COST_MULTIPLIER, effLevel));

    return {
      production: gemsPerCycle,
      cycleTime,
      efficiency: effMult,
      prodLevel,
      speedLevel,
      effLevel,
      nextProdCost,
      nextSpeedCost,
      nextEffCost,
      pendingGems: Math.floor(labData.pending_gems || 0),
    };
  };

  const metrics = calculateMetrics();

  // Bootstrap GemLab on first load + process offline gems (silent, no toast)
  useEffect(() => {
    if (!character?.id) return;
    // Process silently - just calculate pending gems, don't show toast
    base44.functions.invoke("processGemLab", { characterId: character.id })
      .then(() => setRefreshTrigger(t => t + 1))
      .catch(() => {});
  }, [character?.id]);

  // Save gem state on unmount (for resume)
  useEffect(() => {
    return () => {
      if (gemLab?.data && character?.id) {
        hybridPersistence.saveGemLab(
          character.id,
          gemLab.data.last_collection_time,
          gemLab.data.pending_gems
        );
      }
    };
  }, [character?.id, gemLab?.data?.last_collection_time, gemLab?.data?.pending_gems]);

  if (!character) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron text-lg font-bold flex items-center gap-2 text-primary">
          <Gem className="w-5 h-5" /> Gem Lab
        </h3>
        <Badge className="bg-secondary/20 text-secondary border-secondary/30">
          Lvl {gemLab?.data?.production_level || 0} / {gemLab?.data?.speed_level || 0} / {gemLab?.data?.efficiency_level || 0}
        </Badge>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card/50 border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Per Cycle</p>
          <p className="font-bold text-lg text-primary">{(metrics.production ?? 0).toFixed(3)}</p>
          <p className="text-xs text-muted-foreground mt-1">{(metrics.cycleTime ?? 0).toFixed(1)}m</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="font-bold text-lg text-secondary">{metrics.pendingGems ?? 0}</p>
          <Button
            size="xs"
            className="mt-1 h-6 text-xs w-full"
            onClick={() => claimMutation.mutate()}
            disabled={metrics.pendingGems === 0 || claimMutation.isPending}
          >
            Claim
          </Button>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-bold text-lg text-accent">{(gemLab?.data?.total_gems_generated ?? 0).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-1">all-time</p>
        </div>
      </div>

      {/* Progress Bar */}
      <GemLabProgressBar gemLab={gemLab} metrics={metrics} />


      {/* Upgrade Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Production */}
        <motion.div className="bg-card border border-border/50 rounded-lg p-3 space-y-2 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">Production</span>
            <Badge className="bg-primary/20 text-primary text-[10px] h-5 flex items-center">
              {metrics.prodLevel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            +{((metrics.production ?? 0) * 0.05).toFixed(4)} per level
          </p>
          <Button
            size="sm"
            variant={(character?.gold || 0) >= metrics.nextProdCost ? "default" : "outline"}
            onClick={() => upgradeMutation.mutate("production")}
            disabled={upgradeMutation.isPending || (character?.gold || 0) < metrics.nextProdCost}
            className="w-full h-7 text-xs gap-1"
          >
            <Coins className="w-3 h-3" />
            {(metrics.nextProdCost ?? 0).toLocaleString()}
            </Button>
            </motion.div>

            {/* Speed */}
        <motion.div className="bg-card border border-border/50 rounded-lg p-3 space-y-2 hover:border-secondary/30 transition-colors">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-semibold">Speed</span>
            <Badge className="bg-secondary/20 text-secondary text-[10px] h-5 flex items-center">
              {metrics.speedLevel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            -{((metrics.cycleTime ?? 0) * 0.02).toFixed(1)}m per level
          </p>
          <Button
            size="sm"
            variant={(character?.gold || 0) >= metrics.nextSpeedCost ? "default" : "outline"}
            onClick={() => upgradeMutation.mutate("speed")}
            disabled={upgradeMutation.isPending || (character?.gold || 0) < metrics.nextSpeedCost}
            className="w-full h-7 text-xs gap-1"
          >
            <Coins className="w-3 h-3" />
            {(metrics.nextSpeedCost ?? 0).toLocaleString()}
            </Button>
            </motion.div>

            {/* Efficiency */}
        <motion.div className="bg-card border border-border/50 rounded-lg p-3 space-y-2 hover:border-accent/30 transition-colors">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold">Efficiency</span>
            <Badge className="bg-accent/20 text-accent text-[10px] h-5 flex items-center">
              {metrics.effLevel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            +{((metrics.production ?? 0) * 0.03).toFixed(4)} per level
          </p>
          <Button
            size="sm"
            variant={(character?.gold || 0) >= metrics.nextEffCost ? "default" : "outline"}
            onClick={() => upgradeMutation.mutate("efficiency")}
            disabled={upgradeMutation.isPending || (character?.gold || 0) < metrics.nextEffCost}
            className="w-full h-7 text-xs gap-1"
          >
            <Coins className="w-3 h-3" />
            {(metrics.nextEffCost ?? 0).toLocaleString()}
            </Button>
            </motion.div>
            </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded-lg border border-border/30">
        <p>💡 Gem Lab generates gems passively. Early progression is slow—invest heavily for exponential growth!</p>
      </div>
    </div>
  );
}