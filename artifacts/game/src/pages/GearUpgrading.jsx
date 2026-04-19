import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hammer, Zap, Sparkles, ArrowUpRight, Wrench, Coins, Gem
} from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { getItemIcon, getItemSprite } from "@/lib/itemIcons";
import EquipmentUpgradePanel from "@/components/inventory/EquipmentUpgradePanel";

const SLOT_ORDER = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

const RARITY_GLOW = {
  common:    "shadow-[0_0_6px_rgba(160,160,160,0.3)]",
  uncommon:  "shadow-[0_0_6px_rgba(30,200,30,0.4)]",
  rare:      "shadow-[0_0_8px_rgba(60,130,255,0.5)]",
  epic:      "shadow-[0_0_8px_rgba(180,60,255,0.5)]",
  legendary: "shadow-[0_0_10px_rgba(255,170,0,0.6)]",
  mythic:    "shadow-[0_0_12px_rgba(255,50,50,0.6)]",
  set:       "shadow-[0_0_10px_rgba(0,220,180,0.5)]",
  shiny:     "shadow-[0_0_12px_rgba(255,215,0,0.7)]",
};

export default function GearUpgrading({ character, onCharacterUpdate }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: items = [] } = useQuery({
    queryKey: ["equippedItems", character?.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character?.id, equipped: true }),
    enabled: !!character?.id,
  });

  const equipmentItems = items
    .filter(i => SLOT_ORDER.includes(i.type))
    .sort((a, b) => SLOT_ORDER.indexOf(a.type) - SLOT_ORDER.indexOf(b.type));

  if (!character) return null;

  return (
    <div className="p-3 md:p-4 max-w-5xl mx-auto space-y-3">
      {/* Header */}
      <div className="rpg-frame rounded-xl border-2 border-amber-700/60 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-600/50 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="font-orbitron text-xl font-bold text-amber-200 tracking-wider uppercase">Equipment Upgrade</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-3 py-1.5 border border-yellow-600/30">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 font-semibold text-sm">{(character.gold || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-3 py-1.5 border border-cyan-600/30">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 font-semibold text-sm">{(character.gems || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 max-h-[70vh]">
        {/* Left: Equipment Grid */}
        <div className="lg:col-span-3 rpg-frame rounded-xl border-2 border-amber-700/40 bg-gradient-to-b from-[#1a1a2e] to-[#0f1629] p-3 overflow-y-auto">
          <h3 className="text-sm font-bold text-amber-400/80 tracking-widest uppercase mb-3">Equipped Gear</h3>

          {equipmentItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Equip items to upgrade them
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {equipmentItems.map(item => {
                const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
                const Icon = getItemIcon(item);
                const sprite = getItemSprite(item);
                const currentUpgrade = item.upgrade_level || 0;
                const currentStar = item.star_level || 0;
                const isSelected = selectedItem?.id === item.id;
                const glow = RARITY_GLOW[item.rarity] || "";

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedItem(item)}
                    className={`relative text-left rounded-lg border-2 transition-all p-2 ${
                      isSelected
                        ? `${rarity.border} bg-white/10 ring-2 ring-amber-400/50`
                        : `border-gray-700/60 bg-black/30 hover:bg-white/5 hover:border-gray-600/80`
                    } ${glow}`}
                  >
                    {/* Item sprite/icon */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-lg border ${rarity.border} ${rarity.bg} flex items-center justify-center`}>
                        {sprite ? (
                          <img src={sprite} alt="" className="w-10 h-10" style={{ imageRendering: "pixelated" }} />
                        ) : (
                          <Icon className={`w-8 h-8 ${rarity.color}`} />
                        )}
                      </div>

                      {/* Item name + upgrade */}
                      <div className="text-center w-full">
                        <p className={`font-semibold text-sm leading-tight ${rarity.color} truncate`}>
                          {item.name}{currentUpgrade > 0 ? ` +${currentUpgrade}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Item Level: {item.item_level || 1}
                        </p>
                        {currentUpgrade > 0 && (
                          <p className="text-xs text-green-400">
                            Upgrade Level: +{currentUpgrade}
                          </p>
                        )}
                        <p className={`text-xs ${rarity.color}`}>
                          Rarity: {(item.rarity || "common").charAt(0).toUpperCase() + (item.rarity || "common").slice(1)}
                        </p>
                      </div>

                      {/* Star + stats row */}
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {currentStar > 0 && (
                          <span className="text-xs text-yellow-400">{"*".repeat(currentStar)}{currentStar}</span>
                        )}
                        {item.is_awakened && (
                          <span className="text-xs text-cyan-400">AWK</span>
                        )}
                      </div>

                      {/* Stat preview */}
                      {item.stats && (
                        <div className="w-full space-y-0.5">
                          {Object.entries(item.stats)
                            .filter(([, v]) => v && v !== 0)
                            .slice(0, 3)
                            .map(([stat, value]) => (
                              <div key={stat} className="flex justify-between text-xs">
                                <span className="text-gray-400 capitalize">{stat.replace(/_/g, " ")}</span>
                                <span className="text-green-400">+{value}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Upgrade Panel */}
        <div className="lg:col-span-2 rpg-frame rounded-xl border-2 border-amber-700/40 bg-gradient-to-b from-[#1a1a2e] to-[#0f1629] p-3 overflow-y-auto">
          {selectedItem ? (
            <div className="[&>div]:max-w-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:rounded-none [&>div]:p-0">
              <EquipmentUpgradePanel
                item={selectedItem}
                character={character}
                onClose={() => setSelectedItem(null)}
                onItemUpdated={(updatedItem) => {
                  setSelectedItem(prev => prev ? { ...prev, ...updatedItem, upgrade_level: updatedItem.upgrade_level ?? updatedItem.upgradeLevel, star_level: updatedItem.star_level ?? updatedItem.starLevel, is_awakened: updatedItem.is_awakened ?? updatedItem.awakened } : prev);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground space-y-3">
              <Hammer className="w-12 h-12 text-amber-700/40" />
              <p className="text-sm text-center">Select an item from the left to upgrade</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
