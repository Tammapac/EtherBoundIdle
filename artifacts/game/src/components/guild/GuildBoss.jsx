import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, Swords, Trophy, Timer, Flame } from "lucide-react";

export default function GuildBoss({ guild, myMemberEntry, onAttack, onActivate, isAttacking, canActivate, bossCooldown }) {
  const boss = guild.boss_active;
  const hp = guild.boss_hp || 0;
  const maxHp = guild.boss_max_hp || 1;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const myDmgToday = myMemberEntry?.boss_damage_today || 0;

  const expiresAt = guild.boss_expires_at ? new Date(guild.boss_expires_at) : null;
  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000 / 60)) : 0;

  const members = guild.members || [];
  const topDamage = [...members].sort((a, b) => (b.boss_damage_today || 0) - (a.boss_damage_today || 0)).slice(0, 5);

  return (
    <div className="space-y-4">
      {boss ? (
        <>
          <div className="bg-card border border-destructive/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                <Skull className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{guild.boss_name || "Guild Boss"}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">ACTIVE</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {timeLeft}m left
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-2 flex justify-between text-xs">
              <span className="text-muted-foreground">Boss HP</span>
              <span className="font-medium">{hp.toLocaleString()} / {maxHp.toLocaleString()}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <motion.div
                className="bg-destructive h-3 rounded-full"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <Button
              onClick={onAttack}
              disabled={isAttacking || hp <= 0 || (bossCooldown && !bossCooldown.ready)}
              className="w-full gap-2 bg-destructive hover:bg-destructive/90"
            >
              <Swords className="w-4 h-4" />
              {bossCooldown && !bossCooldown.ready
                ? bossCooldown.windowFormatted
                : "Attack Boss"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Your damage today: <span className="text-red-400 font-semibold">{myDmgToday.toLocaleString()}</span>
              {bossCooldown && (
                <span className="block mt-1 text-yellow-400">
                  {bossCooldown.windowFormatted} (resets every 8h)
                </span>
              )}
              <span className="block mt-1 text-purple-400">Tokens awarded when boss is defeated!</span>
            </p>
          </div>

          {/* Leaderboard */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Damage Rankings
            </h4>
            {topDamage.map((m, i) => (
              <div key={m.character_id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                <span className={`w-5 text-sm font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>#{i + 1}</span>
                <span className="flex-1 text-sm truncate">{m.name}</span>
                <span className="text-red-400 text-sm font-medium">{(m.boss_damage_today || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Skull className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-semibold mb-1">No Active Boss</p>
          <p className="text-sm text-muted-foreground mb-2">Leaders can activate a guild boss for all members to fight.</p>
          <p className="text-xs text-purple-400 mb-4">
            Next Raid: Lv.{(guild.boss_kills || 0) + 1} | Bosses defeated: {guild.boss_kills || 0}
          </p>
          {canActivate && (
            <Button onClick={onActivate} className="gap-2">
              <Flame className="w-4 h-4" /> Activate Raid Lv.{(guild.boss_kills || 0) + 1}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}