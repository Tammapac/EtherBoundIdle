import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Users, Star } from "lucide-react";
import PixelButton from "@/components/game/PixelButton";

const EMBLEM_ICONS = { shield: Shield, sword: Shield, crown: Star, dragon: Star, phoenix: Star, wolf: Shield };

export default function GuildHeader({ guild, myRole, onLeave, isLeaving }) {
  const Icon = EMBLEM_ICONS[guild.emblem] || Shield;
  return (
    <div className="bg-card border border-primary/30 rounded-xl p-5 glow-cyan">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-xl">{guild.name}</h3>
              {guild.tag && <Badge variant="outline" className="text-xs font-mono">[{guild.tag}]</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              Level {guild.level} • <Users className="w-3 h-3 inline" /> {guild.member_count}/{guild.max_members || 20} Members
            </p>
            <Badge className="mt-1 text-xs capitalize bg-secondary/20 text-secondary border-secondary/30">{myRole}</Badge>
          </div>
        </div>
        <PixelButton variant="cancel" label="LEAVE" onClick={onLeave} disabled={isLeaving} className="flex-shrink-0" />
      </div>
      {guild.description && <p className="text-sm text-muted-foreground mt-3">{guild.description}</p>}
      <div className="flex gap-2 flex-wrap mt-3">
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">+{guild.buffs?.exp_bonus || 0}% EXP</Badge>
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">+{guild.buffs?.gold_bonus || 0}% Gold</Badge>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">+{guild.buffs?.damage_bonus || 0}% DMG</Badge>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">+{guild.buffs?.idle_bonus || 0}% Idle</Badge>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{guild.guild_tokens || 0} Tokens</Badge>
      </div>
    </div>
  );
}