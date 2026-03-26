import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function GemLabProgressBar({ gemLab, metrics }) {
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    if (!gemLab?.last_collection_time || !metrics?.cycleTime) {
      setProgressPct(0);
      return;
    }

    const cycleMs = metrics.cycleTime * 60 * 1000;
    const lastCollectionMs = new Date(gemLab.last_collection_time).getTime();

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - lastCollectionMs;
      const withinCycle = elapsed % cycleMs;
      const pct = Math.min((withinCycle / cycleMs) * 100, 99.9);
      setProgressPct(pct);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 200);
    return () => clearInterval(interval);
  }, [gemLab?.last_collection_time, metrics?.cycleTime]);

  const cycleTimeMin = metrics?.cycleTime || 0;
  const timeLeftMin = Math.max(0, ((100 - progressPct) / 100) * cycleTimeMin);

  return (
    <motion.div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Current Cycle</span>
        <span className="text-primary font-mono">{(metrics?.production ?? 0).toFixed(4)} gems</span>
      </div>
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden border border-border/50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {progressPct.toFixed(0)}% — Next gems in ~{timeLeftMin.toFixed(1)}m
      </p>
    </motion.div>
  );
}
