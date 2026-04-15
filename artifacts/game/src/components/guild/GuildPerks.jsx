import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Coins, Zap, Clock } from "lucide-react";
import PixelButton from "@/components/game/PixelButton";

const PERKS = [
  { key: "exp_boost", label: "EXP Boost", icon: TrendingUp, color: "text-green-400", desc: "+5% EXP per level", buffKey: "exp_bonus", baseCost: 500 },
  { key: "gold_boost", label: "Gold Boost", icon: Coins, color: "text-yellow-400", desc: "+5% Gold per level", buffKey: "gold_bonus", baseCost: 500 },
  { key: "damage_boost", label: "Damage Boost", icon: Zap, color: "text-red-400", desc: "+3% DMG per level", buffKey: "damage_bonus", baseCost: 500 },
  { key: "idle_boost", label: "Idle Efficiency", icon: Clock, color: "text-blue-400", desc: "+5% Idle per level", buffKey: "idle_bonus", baseCost: 500 },
];

const MAX_LEVEL = 10;

const canManage = (myRole) => ["leader", "co-leader"].includes(myRole);

export default function GuildPerks({ guild, myRole, onUpgrade, isUpgrading }) {
  const perks = guild.perks || {};
  const tokens = guild.guild_tokens || 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        Available tokens: <span className="text-purple-400 font-semibold ml-1">{tokens}</span>
      </p>
      {PERKS.map(perk => {
        const level = perks[perk.key] || 0;
        const cost = Math.floor(perk.baseCost * Math.pow(1.5, level));
        const maxed = level >= MAX_LEVEL;
        const canAfford = tokens >= cost;
        const Icon = perk.icon;
        return (
          <div key={perk.key} className="bg-muted/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${perk.color}`} />
                <span className="font-medium text-sm">{perk.label}</span>
                <Badge variant="outline" className="text-xs">Lv.{level}/{MAX_LEVEL}</Badge>
              </div>
              {!maxed && canManage(myRole) && (
                <PixelButton
                  variant="ok"
                  label={`UPGRADE (${cost}T)`}
                  disabled={!canAfford || isUpgrading || maxed}
                  onClick={() => onUpgrade(perk, level)}
                />
              )}
              {maxed && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">MAX</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{perk.desc}</p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(level / MAX_LEVEL) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}