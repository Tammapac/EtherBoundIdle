import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ShoppingBag, Coins, Sword, Shield, Crown, Footprints,
  CircleDot, Gem, Heart, RefreshCw, Clock, FlaskConical, Package
} from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { idleEngine } from "@/lib/idleEngine";
import { getItemIcon, getItemSprite } from "@/lib/itemIcons";

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
        extra_data: {
          ...(shopItem.subtype ? { subtype: shopItem.subtype } : {}),
          ...(shopItem.rune_slots ? { rune_slots: shopItem.rune_slots } : {}),
          ...(shopItem.proc_effects ? { proc_effects: shopItem.proc_effects } : {}),
        },
      });
      const newGold = (character.gold || 0) - shopItem.buy_price;
      await base44.entities.Character.update(character.id, { gold: newGold });
      onCharacterUpdate({ ...character, gold: newGold });
      addPurchasedId(character.id, shopItem.id);
      setShopItems(prev => prev.filter(i => i.id !== shopItem.id));
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
      toast({ title: `Purchased ${shopItem.name}!`, duration: 1000 });
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: "#1dffa0" }} />
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "#1dffa0" }}>Shop</span>
          </h2>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#6b6a9a", marginTop: 6 }}>INVENTORY ROTATES EVERY 4 HOURS</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "#e6a800", border: "2px solid #a07200", background: "#130e00", padding: "4px 8px" }}
          >
            <Coins className="w-3 h-3" /> {(character?.gold || 0).toLocaleString()}
          </span>
          <span
            className="flex items-center gap-1.5"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "#c084fc", border: "2px solid #7c3aed60", background: "#120820", padding: "4px 8px" }}
          >
            <Gem className="w-3 h-3" /> {(character?.gems || 0).toLocaleString()}
          </span>
          <span
            className="flex items-center gap-1.5"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "#6b6a9a", border: "2px solid #2a1f5c", background: "#07071a", padding: "4px 8px" }}
          >
            <Clock className="w-3 h-3" /> {timeLeft || "Loading..."}
          </span>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <PixelButton
          variant="ok"
          label={loadingShop ? "REFRESHING..." : "REFRESH STOCK (5💎)"}
          onClick={() => loadShop(true)}
          disabled={loadingShop}
          style={{ background: "#e6a800", border: "2px solid #a07200", boxShadow: "0 3px 0 #7a5500, inset 0 1px 0 rgba(255,255,200,0.3)" }}
        />
      </div>

      {loadingShop ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="p-4 h-24 animate-pulse" style={{ background: "#0d0d1a", border: "2px solid #2a1f5c" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shopItems.map((item, idx) => {
            const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
            const Icon = getItemIcon(item);
            const price = item.buy_price || item.price || 0;
            const canAfford = (character?.gold || 0) >= price;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative p-4 flex items-start gap-4 overflow-visible"
                style={{ background: "#0d0d1a", border: "2px solid #2a1f5c", boxShadow: "2px 2px 0 #1a1040" }}
              >
                {/* Corner accent dots */}
                <span className="absolute -top-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
                <span className="absolute -top-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
                <span className="absolute -bottom-[3px] -left-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />
                <span className="absolute -bottom-[3px] -right-[3px] w-2 h-2 z-10" style={{ background: "#e6a800" }} />

                <div className="flex-shrink-0 overflow-hidden" style={{ padding: 10, background: "#07071a", border: `1px solid #2a1f5c` }}>
                  {getItemSprite(item) ? (
                    <img src={getItemSprite(item)} alt="" className="w-12 h-12 sprite-outline" style={{ imageRendering: "pixelated" }} />
                  ) : (
                    <Icon className={`w-10 h-10 ${rarity.color}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "9px", color: "#e0e0ff" }}>{item.name}</span>
                    <span
                      className={`${rarity.color}`}
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", border: `1px solid currentColor`, padding: "2px 5px", opacity: 0.9 }}
                    >
                      {rarity.label}
                    </span>
                    {item.item_level && (
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#6b6a9a", border: "1px solid #2a1f5c", background: "#07071a", padding: "2px 5px" }}>
                        iLv.{item.item_level}
                      </span>
                    )}
                    {item.rune_slots > 0 && (
                      <span className="flex items-center gap-0.5" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "#c084fc", border: "1px solid #7c3aed60", background: "#120820", padding: "2px 5px" }}>
                        <Gem className="w-2.5 h-2.5" /> {item.rune_slots} slot{item.rune_slots > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs mt-1" style={{ color: "#6b6a9a" }}>{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {item.stats && Object.entries(item.stats).map(([k, v]) => (
                      <span key={k} className="text-green-400" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px" }}>
                        +{v} {k.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
                <PixelButton
                  variant="ok"
                  label={`BUY (${price.toLocaleString()}G)`}
                  disabled={!canAfford || buyMutation.isPending}
                  onClick={() => buyMutation.mutate({ ...item, buy_price: price })}
                  style={{ background: "#e6a800", border: "2px solid #a07200", boxShadow: "0 3px 0 #7a5500, inset 0 1px 0 rgba(255,255,200,0.3)" }}
                />
              </motion.div>
            );
          })}
          {shopItems.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: "#6b6a9a" }}>
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>NO ITEMS AVAILABLE. CLICK REFRESH STOCK.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}