import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Gem, Coins, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function GoldTransmutation({ character, onCharacterUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [spendingMode, setSpendingMode] = useState("single"); // single or max
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate next transmutation cost
  const BASE_COST = 1000;
  const SCALING_FACTOR = 1.5;
  const nextCost = Math.floor(BASE_COST * Math.pow(SCALING_FACTOR, character.transmutation_count || 0));
  const nextNextCost = Math.floor(BASE_COST * Math.pow(SCALING_FACTOR, (character.transmutation_count || 0) + 1));

  // Calculate how many transmutations player can afford
  const maxTransmutations = (() => {
    let count = 0;
    let remaining = character.gold || 0;
    let cost = nextCost;
    while (remaining >= cost && count < 100) {
      remaining -= cost;
      cost = Math.floor(BASE_COST * Math.pow(SCALING_FACTOR, (character.transmutation_count || 0) + count + 1));
      count++;
    }
    return count;
  })();

  const transmuteMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('transmuteGold', {});
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        onCharacterUpdate({
          ...character,
          gold: data.newGold,
          gems: data.newGems,
          transmutation_count: data.totalTransmutations
        });
        toast({
          title: `🔥 Transmuted!`,
          description: `Burned ${data.goldSpent} gold → gained ${data.gemsGained} gems`,
          duration: 2000
        });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Transmutation failed",
        description: error.response?.data?.error || "Unknown error",
        variant: "destructive",
        duration: 2000
      });
    }
  });

  const handleTransmute = async () => {
    if (spendingMode === "single") {
      transmuteMutation.mutate();
    } else {
      // Spend all gold (transmute max times)
      for (let i = 0; i < maxTransmutations; i++) {
        await base44.functions.invoke('transmuteGold', {});
      }
      // Refresh character data
      const updated = await base44.entities.Character.filter({
        created_by: (await base44.auth.me()).email
      }).then(chars => chars[0]);
      onCharacterUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    }
  };

  const canAfford = (character.gold || 0) >= nextCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Gold Transmutation</p>
            <p className="text-xs text-muted-foreground">Convert gold → gems (infinite scaling)</p>
          </div>
        </div>
        <TrendingUp className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border p-4 space-y-4"
        >
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Times Transmuted</p>
              <p className="text-lg font-bold text-primary">{character.transmutation_count || 0}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Next Cost</p>
              <p className="text-lg font-bold text-orange-400">{nextCost.toLocaleString()}</p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2 justify-center">
            <PixelButton
              variant={spendingMode === "single" ? "ok" : "cancel"}
              label={`SPEND ${nextCost.toLocaleString()} GOLD`}
              onClick={() => setSpendingMode("single")}
            />
            <PixelButton
              variant={spendingMode === "max" ? "ok" : "cancel"}
              label={`SPEND ALL (${maxTransmutations}X)`}
              onClick={() => setSpendingMode("max")}
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <PixelButton
              variant="ok"
              label={transmuteMutation.isPending ? "TRANSMUTING..." : "TRANSMUTE GOLD"}
              onClick={handleTransmute}
              disabled={!canAfford || transmuteMutation.isPending}
            />
          </div>

          {/* Cost Progression */}
          <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
            <p className="text-muted-foreground">Cost Progression:</p>
            <div className="flex items-center justify-between font-mono">
              <span className="text-foreground">This: {nextCost.toLocaleString()}</span>
              <span className="text-muted-foreground">→</span>
              <span className={canAfford ? "text-orange-400" : "text-muted-foreground"}>
                Next: {nextNextCost.toLocaleString()}
              </span>
            </div>
            <p className="text-muted-foreground mt-2">Multiplier: {(SCALING_FACTOR * 100 - 100).toFixed(0)}% per transmutation</p>
          </div>

          {/* Info */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-200">
            <p className="font-semibold mb-1">💡 Infinite Progression</p>
            <p>Early transmutations feel inefficient. Keep going—rewards compound infinitely.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}