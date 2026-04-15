import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import { Gem, Coins, TrendingUp, Package, Zap, X } from "lucide-react";

export default function WelcomeBackModal({ rewards, hoursOffline, onClose }) {
  if (!rewards || hoursOffline === undefined) return null;

  const rewardItems = [
    { label: "Gold", value: rewards.gold, icon: Coins, color: "text-accent" },
    { label: "Experience", value: rewards.exp, icon: TrendingUp, color: "text-primary" },
    { label: "Gems", value: rewards.gems, icon: Gem, color: "text-secondary" },
    { label: "Ores", value: rewards.ores, icon: Package, color: "text-orange-400" },
  ].filter(r => r.value > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card border-2 border-primary rounded-xl p-6 w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-orbitron text-2xl font-bold text-primary flex items-center gap-2">
              <Zap className="w-6 h-6" /> Welcome Back!
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Offline Duration */}
          <p className="text-sm text-muted-foreground mb-4">
            You were offline for <span className="text-primary font-semibold">{hoursOffline} hours</span>
          </p>

          {/* Rewards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {rewardItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-muted/50 border border-border rounded-lg p-3 text-center"
                >
                  <Icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`font-bold text-lg ${item.color}`}>
                    +{item.value.toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          {rewards.items?.length > 0 && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-xs text-primary font-semibold mb-1">Items Received</p>
              <p className="text-xs text-muted-foreground">{rewards.items.length} new items added to inventory</p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-center">
            <PixelButton variant="ok" size="lg" label="CLAIM REWARDS" onClick={onClose} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}