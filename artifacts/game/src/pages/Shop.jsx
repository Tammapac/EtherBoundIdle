import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ShoppingBag, Coins, Sword, Shield, Crown, Footprints,
  CircleDot, Gem, Heart, RefreshCw, Clock, FlaskConical, Package
} from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { idleEngine } from "@/lib/idleEngine";

const TYPE_ICONS = {
  weapon: Sword, armor: Shield, helmet: Crown, boots: Footprints,
  ring: CircleDot, amulet: Gem, consumable: FlaskConical, material: Package
};

function formatTimeLeft(nextRefreshAt) {
  if (!nextRefreshAt) return "";
  const diff = new Date(nextRefreshAt) - new Date();
  if (diff <= 0) return "Refreshing...";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function getPurchasedIds(charId) {
  try {
    const data = JSON.parse(localStorage.getItem(`shop_purchased_${charId}`) || "{}");
    const ROTATION_MS = 4 * 60 * 60 * 1000;
    const currentSeed = Math.floor(Date.now() / ROTATION_MS);
    if (data.seed !== currentSeed) return new Set();
    return new Set(data.ids || []);
  } catch { return new Set(); }
}
function addPurchasedId(charId, itemId) {
  try {
    const ROTATION_MS = 4 * 60 * 60 * 1000;
    const currentSeed = Math.floor(Date.now() / ROTATION_MS);
    const data = JSON.parse(localStorage.getItem(`shop_purchased_${charId}`) || "{}");
    const ids = data.seed === currentSeed ? (data.ids || []) : [];
    ids.push(itemId);
    localStorage.setItem(`shop_purchased_${charId}`, JSON.stringify({ seed: currentSeed, ids }));
  } catch {}
}

export default function Shop({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shopItems, setShopItems] = useState([]);
  const [nextRefreshAt, setNextRefreshAt] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  const loadShop = async (forceRefresh = false) => {
    try {
      setLoadingShop(true);
      const res = await base44.functions.invoke("getShopRotation", {
        characterId: character.id, forceRefresh
      });
      if (res?.gemsSpent > 0) {
        // Force refresh was used — clear purchase cache so new items show
        localStorage.removeItem(`shop_purchased_${character.id}`);
        const newGems = (character.gems || 0) - res.gemsSpent;
        onCharacterUpdate({ ...character, gems: newGems });
        toast({ title: `Stock refreshed! (${res.gemsSpent} gems spent)`, duration: 2000 });
      }
      const purchased = getPurchasedIds(character.id);
      setShopItems((res?.items || []).filter(i => !purchased.has(i.id)));
      setNextRefreshAt(res?.refreshes_at || res?.nextRefreshAt || null);
    } catch (e) {
      console.error(e);
      toast({ title: "Could not load shop", variant: "destructive" });
    } finally {
      setLoadingShop(false);
    }
  };

  useEffect(() => { loadShop(); }, [character?.id]);

  useEffect(() => {
    if (!nextRefreshAt) return;
    const interval = setInterval(() => {
      const tl = formatTimeLeft(nextRefreshAt);
      setTimeLeft(tl);
      if (tl === "Refreshing...") loadShop(false);
    }, 1000);
    setTimeLeft(formatTimeLeft(nextRefreshAt));
    return () => clearInterval(interval);
  }, [nextRefreshAt]);

  useEffect(() => {
    const unsub = idleEngine.on('shopRotation', (data) => {
      setTimeLeft(data.timeLeftFormatted);
    });
    return unsub;
  }, []);

  const buyMutation = useMutation({
    mutationFn: async (shopItem) => {
      if ((character.gold || 0) < shopItem.buy_price) {
        toast({ title: "Not enough gold!", variant: "destructive" });
        return;
      }
      await base44.entities.Item.create({
        name: shopItem.name,
        type: shopItem.type,
        subtype: shopItem.subtype || null,
        rarity: shopItem.rarity,
        stats: shopItem.stats,
        item_level: shopItem.item_level,
        level_req: shopItem.level_req || Math.max(1, (shopItem.item_level || 1) - 2),
        owner_id: character.id,
        sell_price: shopItem.sell_price || Math.floor(shopItem.buy_price * 0.3),
        buy_price: shopItem.buy_price,
        description: shopItem.description || `Purchased from the rotating shop`,
      });
      const newGold = (character.gold || 0) - shopItem.buy_price;
      await base44.entities.Character.update(character.id, { gold: newGold });
      onCharacterUpdate({ ...character, gold: newGold });
      addPurchasedId(character.id, shopItem.id);
      setShopItems(prev => prev.filter(i => i.id !== shopItem.id));
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: `Purchased ${shopItem.name}!`, duration: 1000 });
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Shop
          </h2>
          <p className="text-xs text-muted-foreground">Inventory rotates every 4 hours</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-accent border-accent/30 gap-1 text-sm">
            <Coins className="w-3.5 h-3.5" /> {(character?.gold || 0).toLocaleString()}
          </Badge>
          <Badge variant="outline" className="text-purple-400 border-purple-400/30 gap-1 text-sm">
            <Gem className="w-3.5 h-3.5" /> {(character?.gems || 0).toLocaleString()}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {timeLeft || "Loading..."}
          </Badge>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => loadShop(true)}
          disabled={loadingShop}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingShop ? "animate-spin" : ""}`} />
          Refresh Stock (<Gem className="w-3 h-3 inline" /> 5)
        </Button>
      </div>

      {loadingShop ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shopItems.map((item, idx) => {
            const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
            const Icon = TYPE_ICONS[item.type] || ShoppingBag;
            const price = item.buy_price || item.price || 0;
            const canAfford = (character?.gold || 0) >= price;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-card border rounded-xl p-4 flex items-start gap-4 ${rarity.border}`}
              >
                <div className={`p-2.5 rounded-lg ${rarity.bg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${rarity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${rarity.color}`}>{item.name}</span>
                    <Badge variant="outline" className={`text-xs ${rarity.color} ${rarity.border}`}>
                      {rarity.label}
                    </Badge>
                    {item.item_level && (
                      <Badge variant="outline" className="text-xs">iLv.{item.item_level}</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {item.stats && Object.entries(item.stats).map(([k, v]) => (
                      <span key={k} className="text-xs text-green-400">
                        +{v} {k.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={canAfford ? "default" : "outline"}
                  disabled={!canAfford || buyMutation.isPending}
                  onClick={() => buyMutation.mutate({ ...item, buy_price: price })}
                  className="shrink-0 gap-1"
                >
                  <Coins className="w-3.5 h-3.5" /> {price.toLocaleString()}
                </Button>
              </motion.div>
            );
          })}
          {shopItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No items available. Click Refresh Stock.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}