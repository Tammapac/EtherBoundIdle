import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, Swords, Trophy, Timer, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const PET_SPECIES_ICONS = { Wolf:"🐺", Phoenix:"🔥", Dragon:"🐉", Turtle:"🐢", Cat:"🐱", Owl:"🦉", Slime:"🫧", Fairy:"🧚", Serpent:"🐍", Golem:"🪨" };
const PET_EVO_SUFFIX = ["", "⭐", "👑"];
const RARITY_PET_COLORS = { common:"text-gray-400", uncommon:"text-green-400", rare:"text-blue-400", epic:"text-purple-400", legendary:"text-amber-400", mythic:"text-red-400" };

export default function GuildBoss({ guild, myMemberEntry, character, onAttack, onActivate, isAttacking, canActivate, bossCooldown }) {
  const { data: petData } = useQuery({
    queryKey: ["pets", character?.id],
    queryFn: () => base44.functions.invoke("petAction", { characterId: character.id, action: "list" }),
    enabled: !!character?.id,
    staleTime: 60000,
  });
  const equippedPet = (petData?.pets || []).find(p => p.equipped);
  const boss = guild.boss_active;
  const hp = guild.boss_hp || 0;
  const maxHp = guild.boss_max_hp || 1;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const myDmgToday = myMemberEntry?.boss_damage_today || 0;

  const expiresAt = guild.boss_expires_at ? new Date(guild.boss_expires_at) : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeLeftSec = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const timeLeft = Math.floor(timeLeftSec / 60);
  const timeLeftStr = timeLeftSec >= 60 ? `${timeLeft}m ${timeLeftSec % 60}s` : `${timeLeftSec}s`;

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
                    <Timer className="w-3 h-3" /> {timeLeftStr} left
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
              disabled={isAttacking || hp <= 0 || timeLeftSec <= 0 || (bossCooldown && !bossCooldown.ready)}
              className="w-full gap-2 bg-destructive hover:bg-destructive/90"
            >
              <Swords className="w-4 h-4" />
              {timeLeftSec <= 0
                ? "Boss Expired"
                : bossCooldown && !bossCooldown.ready
                  ? bossCooldown.windowFormatted
                  : "Attack Boss"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Your damage today: <span className="text-red-400 font-semibold">{myDmgToday.toLocaleString()}</span>
              {bossCooldown && (
                <span className="block mt-1 text-yellow-400">
                  {bossCooldown.attacksLeft !== undefined
                    ? `${bossCooldown.attacksLeft}/${bossCooldown.maxAttacks || 10} attacks remaining`
                    : bossCooldown.windowFormatted} (resets every 8h)
                </span>
              )}
              <span className="block mt-1 text-purple-400">Tokens awarded when boss is defeated!</span>
            </p>
            {equippedPet && (() => {
              const SKILL_LABELS_GB = { heal: "Heal", shield: "Shield", extra_attack: "Extra Atk" };
              const icon = PET_SPECIES_ICONS[equippedPet.species] || "🐾";
              const evoSuffix = PET_EVO_SUFFIX[equippedPet.evolution || 0] || "";
              const rarityColor = RARITY_PET_COLORS[equippedPet.rarity] || "text-gray-400";
              const xpPct = Math.min(100, ((equippedPet.xp || 0) / 500) * 100);
              const traitNames = (equippedPet.traits || []).map(t => typeof t === 'object' ? `${t.name}: ${t.desc}` : t).join('\n');
              return (
                <div
                  className="mt-2 bg-muted/20 border border-border/50 rounded-lg px-2.5 py-2 cursor-help"
                  title={traitNames ? `Traits:\n${traitNames}` : 'No traits'}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{icon}{evoSuffix}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-[10px] font-semibold leading-none truncate ${rarityColor}`}>
                          {equippedPet.name || equippedPet.species}
                        </p>
                        <span className="text-[9px] text-muted-foreground ml-1">Lv.{equippedPet.level}</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground leading-none mt-0.5">
                        {SKILL_LABELS_GB[equippedPet.skillType] || equippedPet.skillType || "companion"} · {equippedPet.rarity}
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