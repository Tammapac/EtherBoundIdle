import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Shield, Swords, Crown, Footprints, CircleDot, Gem, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import { RARITY_CONFIG, CLASSES } from "@/lib/gameData";
import { calculateFinalStats } from "@/lib/statSystem";
import { getItemSprite } from "@/lib/itemIcons";

const SLOT_ICONS = {
  weapon: Swords, armor: Shield, helmet: Crown,
  boots: Footprints, ring: CircleDot, amulet: Gem,
};

const CLASS_COLORS = {
  warrior: "text-red-400", mage: "text-blue-400",
  ranger: "text-green-400", rogue: "text-purple-400",
};

export default function PlayerProfileModal({ characterId, characterName, onClose, onInviteToParty }) {
  const [char, setChar] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, its] = await Promise.all([
          base44.entities.Character.get(characterId),
          base44.entities.Item.filter({ owner_id: characterId, equipped: true }),
        ]);
        setChar(c);
        setItems(its);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [characterId]);

  const classData = char ? CLASSES[char.class] : null;
  const { derived } = char ? calculateFinalStats(char, items) : { derived: {} };

  const equipped = items.reduce((acc, item) => {
    acc[item.type] = item;
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {char && (
              <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                <img src={`/sprites/class_${char.class || "warrior"}.png`} alt={char.class} className="w-10 h-10" style={{ imageRendering: "pixelated" }} />
              </div>
            )}
            <div>
              <h2 className="font-orbitron text-lg font-bold">{char?.name || characterName}</h2>
              {char && (
                <p className={`text-sm font-medium ${CLASS_COLORS[char.class]}`}>
                  Lv.{char.level} {classData?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {onInviteToParty && (
              <PixelButton variant="ok" label="INVITE" onClick={onInviteToParty} />
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : char ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "HP", value: char.max_hp },
                { label: "MP", value: char.max_mp },
                { label: "ATK", value: derived.attackPower || 0 },
                { label: "M.ATK", value: derived.magicAttack || 0 },
                { label: "DEF", value: derived.defense || 0 },
                { label: "Crit", value: `${(derived.critChance || 0).toFixed(1)}%` },
                { label: "Level", value: char.level },
              ].map(s => (
                <div key={s.label} className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Base Stats */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: "STR", val: char.strength },
                { label: "DEX", val: char.dexterity },
                { label: "INT", val: char.intelligence },
                { label: "VIT", val: char.vitality },
                { label: "LCK", val: char.luck },
              ].map(s => (
                <div key={s.label} className="bg-muted/30 rounded p-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-xs font-bold">{s.val}</p>
                </div>
              ))}
            </div>

            {/* Equipment */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">EQUIPMENT</p>
              <div className="grid grid-cols-2 gap-1.5">
                {["weapon", "armor", "helmet", "boots", "ring", "amulet"].map(slot => {
                  const item = equipped[slot];
                  const Icon = SLOT_ICONS[slot] || Shield;
                  const rarity = item ? RARITY_CONFIG[item.rarity] : null;
                  return (
                    <div
                      key={slot}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                        item ? `${rarity?.border || "border-border"} bg-muted/30` : "border-border/30 bg-muted/10"
                      }`}
                    >
                      {item && getItemSprite(item) ? (
                        <img src={getItemSprite(item)} alt="" className="w-7 h-7 flex-shrink-0 sprite-outline" style={{ imageRendering: "pixelated" }} />
                      ) : (
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${item ? rarity?.color : "text-muted-foreground/30"}`} />
                      )}
                      <div className="min-w-0">
                        <p className={`truncate ${item ? rarity?.color : "text-muted-foreground/40"}`}>
                          {item ? item.name : `No ${slot}`}
                        </p>
                        {item && (
                          <p className="text-muted-foreground truncate capitalize">{item.rarity}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">Character not found</p>
        )}
      </motion.div>
    </div>
  );
}