import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hammer, Zap, Sparkles, ArrowUpRight, Wrench
} from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { getItemIcon, getItemSprite } from "@/lib/itemIcons";
import EquipmentUpgradePanel from "@/components/inventory/EquipmentUpgradePanel";

const SLOT_ORDER = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

export default function GearUpgrading({ character, onCharacterUpdate }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: items = [] } = useQuery({
    queryKey: ["items", character?.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character?.id }),
    enabled: !!character?.id,
  });

  // Only show equipped items that can be upgraded
  const equipmentItems = items
    .filter(i => i.equipped && SLOT_ORDER.includes(i.type))
    .sort((a, b) => SLOT_ORDER.indexOf(a.type) - SLOT_ORDER.indexOf(b.type));

  if (!character) return null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="font-orbitron text-xl font-bold">Forge</h2>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">💰 Safe Upgrades</p>
          <p className="text-sm text-green-400">Material-based progression</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">⭐ Star Upgrades</p>
          <p className="text-sm text-yellow-400">High-risk gem crafting</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">✨ Awakening</p>
          <p className="text-sm text-cyan-400">Legendary transcendence</p>
        </div>
      </div>

      {/* Equipment Items Grid */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">EQUIPPED GEAR</h3>
        
        {equipmentItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Equip items to upgrade them
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipmentItems.map(item => {
              const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
              const Icon = getItemIcon(item);
              const currentUpgrade = item.upgrade_level || 0;
              const currentStar = item.star_level || 0;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedItem(item)}
                  className={`text-left p-4 rounded-lg border-2 transition-all hover:bg-muted/50 ${rarity.border} ${rarity.bg}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getItemSprite(item) ? (
                        <img src={getItemSprite(item)} alt="" className="w-8 h-8" style={{ imageRendering: "pixelated" }} />
                      ) : (
                        <Icon className={`w-7 h-7 ${rarity.color}`} />
                      )}
                      <div>
                        <p className={`font-semibold text-sm ${rarity.color}`}>{item.name}</p>
                        <p className="text-xs text-muted-foreground">Lvl {item.item_level || 1}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  </div>

                  {/* Upgrade Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentUpgrade > 0 && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Hammer className="w-2.5 h-2.5" /> Lvl {currentUpgrade}/20
                      </Badge>
                    )}
                    {currentStar > 0 && (
                      <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                        {"⭐".repeat(currentStar)} {currentStar}/7
                      </Badge>
                    )}
                    {item.is_awakened && (
                      <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
                        <Sparkles className="w-2.5 h-2.5 mr-1" /> AWAKENED
                      </Badge>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade Panel Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedItem(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <EquipmentUpgradePanel
                item={selectedItem}
                character={character}
                onClose={() => setSelectedItem(null)}
                onItemUpdated={(updatedItem) => {
                  setSelectedItem(prev => prev ? { ...prev, ...updatedItem, upgrade_level: updatedItem.upgrade_level ?? updatedItem.upgradeLevel, star_level: updatedItem.star_level ?? updatedItem.starLevel, is_awakened: updatedItem.is_awakened ?? updatedItem.awakened } : prev);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}