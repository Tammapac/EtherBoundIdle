import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hammer, BookOpen, Landmark, ArrowUp } from "lucide-react";
import PixelButton from "@/components/game/PixelButton";

const BUILDINGS = [
  {
    key: "forge",
    name: "Forge",
    icon: Hammer,
    color: "text-orange-400",
    desc: "Increases item quality drops for all members.",
    bonus: "+5% item quality per level",
    baseCost: 500,
  },
  {
    key: "academy",
    name: "Academy",
    icon: BookOpen,
    color: "text-blue-400",
    desc: "Boosts skill point gain for all members.",
    bonus: "+5% skill EXP per level",
    baseCost: 500,
  },
  {
    key: "treasury",
    name: "Treasury",
    icon: Landmark,
    color: "text-yellow-400",
    desc: "Increases guild token gains from activities.",
    bonus: "+10% tokens per level",
    baseCost: 500,
  },
];

const MAX_LEVEL = 10;
const canManage = (myRole) => ["leader", "co-leader"].includes(myRole);

export default function GuildBase({ guild, myRole, onUpgrade, isUpgrading }) {
  const buildings = guild.buildings || {};
  const tokens = guild.guild_tokens || 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Upgrade your guild base to unlock passive bonuses for all members.</p>
      <div className="grid gap-3">
        {BUILDINGS.map(b => {
          const level = buildings[b.key] || 0;
          const cost = Math.floor(b.baseCost * Math.pow(1.5, level));
          const maxed = level >= MAX_LEVEL;
          const canAfford = tokens >= cost;
          const Icon = b.icon;
          return (
            <div key={b.key} className="bg-muted/40 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${b.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.bonus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Lv.{level}/{MAX_LEVEL}</Badge>
                  {!maxed && canManage(myRole) && (
                    <PixelButton variant="ok" label={`UPGRADE (${cost}T)`} disabled={!canAfford || isUpgrading} onClick={() => onUpgrade(b, level)} />
                  )}
                  {maxed && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">MAX</Badge>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(level / MAX_LEVEL) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}