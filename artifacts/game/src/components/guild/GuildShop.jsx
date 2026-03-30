import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, Zap, Shield, Gem, Timer } from "lucide-react";

const SHOP_ITEMS = [
  { id: "exp_scroll", name: "EXP Scroll", desc: "+50% EXP for 1 hour", cost: 100, icon: TrendingUp, color: "text-green-400", minGuildLevel: 1, durationMs: 60 * 60 * 1000, cooldownMs: 2 * 60 * 60 * 1000 },
  { id: "gold_scroll", name: "Gold Scroll", desc: "+50% Gold for 1 hour", cost: 100, icon: Gem, color: "text-yellow-400", minGuildLevel: 1, durationMs: 60 * 60 * 1000, cooldownMs: 2 * 60 * 60 * 1000 },
  { id: "damage_rune", name: "Damage Rune", desc: "+30% DMG for 30 min", cost: 150, icon: Zap, color: "text-red-400", minGuildLevel: 2, durationMs: 30 * 60 * 1000, cooldownMs: 60 * 60 * 1000 },
  { id: "defense_rune", name: "Defense Rune", desc: "+30% DEF for 30 min", cost: 150, icon: Shield, color: "text-blue-400", minGuildLevel: 2, durationMs: 30 * 60 * 1000, cooldownMs: 60 * 60 * 1000 },
  { id: "rare_chest", name: "Rare Chest", desc: "Contains a rare+ item", cost: 500, icon: ShoppingBag, color: "text-purple-400", minGuildLevel: 3, cooldownMs: 4 * 60 * 60 * 1000 },
  { id: "epic_chest", name: "Epic Chest", desc: "Contains an epic+ item", cost: 1500, icon: ShoppingBag, color: "text-yellow-400", minGuildLevel: 5, cooldownMs: 8 * 60 * 60 * 1000 },
];

function formatTime(ms) {
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function GuildShop({ guild, onBuy, isBuying, characterId }) {
  const tokens = guild.guild_tokens || 0;
  const guildLevel = guild.level || 1;
  const [now, setNow] = useState(Date.now());

  // Update timer every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Get purchase history from localStorage
  const getLastPurchase = (itemId) => {
    try {
      const data = JSON.parse(localStorage.getItem(`guild_shop_${characterId}`) || "{}");
      return data[itemId] || 0;
    } catch { return 0; }
  };

  const getCooldownRemaining = (item) => {
    const lastPurchase = getLastPurchase(item.id);
    if (!lastPurchase || !item.cooldownMs) return 0;
    return Math.max(0, (lastPurchase + item.cooldownMs) - now);
  };

  const handleBuy = (item) => {
    // Save purchase time
    try {
      const data = JSON.parse(localStorage.getItem(`guild_shop_${characterId}`) || "{}");
      data[item.id] = Date.now();
      localStorage.setItem(`guild_shop_${characterId}`, JSON.stringify(data));
    } catch {}
    setNow(Date.now());
    onBuy(item);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Your tokens: <span className="text-purple-400 font-semibold">{tokens}</span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SHOP_ITEMS.map(item => {
          const Icon = item.icon;
          const locked = guildLevel < item.minGuildLevel;
          const canAfford = tokens >= item.cost;
          const cooldown = getCooldownRemaining(item);
          const onCooldown = cooldown > 0;
          return (
            <div
              key={item.id}
              className={`bg-muted/40 rounded-lg p-4 border ${locked ? "border-border opacity-60" : "border-border"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-medium text-sm">{item.name}</span>
                {locked && <Badge variant="outline" className="text-xs ml-auto">Guild Lv.{item.minGuildLevel}+</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
              {onCooldown ? (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium py-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  Cooldown: {formatTime(cooldown)}
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  disabled={locked || !canAfford || isBuying}
                  onClick={() => handleBuy(item)}
                >
                  {item.cost} Tokens
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
