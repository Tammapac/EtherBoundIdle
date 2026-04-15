import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { base44 } from "@/api/base44Client";
import { Coins, Gem, Gift, Star, X, Flame } from "lucide-react";

export default function DailyLoginModal({ character, onCharacterUpdate }) {
  const [reward, setReward] = useState(null);
  const [streak, setStreak] = useState(1);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!character?.id) return;
    const claim = async () => {
      try {
        const res = await base44.functions.invoke("claimDailyLogin", { characterId: character.id });
        if (res?.success) {
          setReward(res.reward);
          setStreak(res.streak);
          onCharacterUpdate({
            gold: (character.gold || 0) + (res.reward?.gold || 0),
            gems: (character.gems || 0) + (res.reward?.gems || 0),
          });
          setShow(true);
        }
        // alreadyClaimed → show stays false, modal never opens
      } catch (e) {
        console.error("Daily login error:", e);
      } finally {
        setLoading(false);
      }
    };
    claim();
  }, [character?.id]);

  if (loading || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            className="relative bg-card border-2 border-accent rounded-2xl p-6 w-full max-w-sm text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                  <Gift className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h2 className="font-orbitron text-2xl font-bold text-accent">Daily Reward!</h2>
              <p className="text-sm text-muted-foreground">
                Day <span className="text-accent font-bold">{streak}</span> streak
              </p>
            </div>

            {/* Streak bar */}
            <div className="flex justify-between gap-1">
              {[1,2,3,4,5,6,7].map(d => (
                <div
                  key={d}
                  className={`flex-1 h-2 rounded-full ${d <= (streak % 7 || 7) ? "bg-accent" : "bg-muted"}`}
                />
              ))}
            </div>

            {/* Rewards */}
            {reward && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 border border-border rounded-xl p-3">
                  <Coins className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Gold</p>
                  <p className="font-bold text-accent">+{(reward.gold || 0).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-xl p-3">
                  <Gem className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Gems</p>
                  <p className="font-bold text-secondary">+{reward.gems || 0}</p>
                </div>
                {reward.hasItem && (
                  <div className="col-span-2 bg-primary/10 border border-primary/30 rounded-xl p-3">
                    <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-primary font-semibold">Bonus Item!</p>
                    <p className="text-xs text-muted-foreground">Check your inventory</p>
                  </div>
                )}
              </div>
            )}

            {streak < 30 && (
              <p className="text-xs text-muted-foreground">
                Day 30 reward: <span className="text-secondary font-semibold">120 Gems + EXP Scroll</span>
              </p>
            )}

            <div className="flex justify-center">
              <PixelButton variant="ok" label="COLLECT & CONTINUE" onClick={() => setShow(false)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}