import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ITEM_SETS, calculateSetBonuses } from "@/lib/setSystem";
import { PROC_TYPES } from "@/lib/procSystem";
import { CheckCircle, Circle, Lock, ChevronDown, ChevronRight } from "lucide-react";

const ZONE_LABELS = {
  verdant_forest: "Verdant Forest",
  scorched_desert: "Scorched Desert",
  frozen_peaks: "Frozen Peaks",
  shadow_realm: "Shadow Realm",
  celestial_spire: "Celestial Spire",
};

const ZONE_ORDER = ["verdant_forest", "scorched_desert", "frozen_peaks", "shadow_realm", "celestial_spire"];

const CLASS_LABELS = { warrior: "Warrior", mage: "Mage", ranger: "Ranger", rogue: "Rogue" };

export default function SetCollectionPanel({ equippedItems = [], allItems = [], characterClass = null }) {
  const [expandedSet, setExpandedSet] = useState(null);

  const setBonuses = calculateSetBonuses(equippedItems);

  // Group sets by zone
  const setsByZone = {};
  for (const [setKey, set] of Object.entries(ITEM_SETS)) {
    const zone = set.zone || "unknown";
    if (!setsByZone[zone]) setsByZone[zone] = [];
    setsByZone[zone].push({ setKey, ...set });
  }

  // Count owned pieces (in inventory + equipped)
  // Items from API have setId (from set_id column) or set_name (from extraData)
  const ownedPieceNames = new Set([
    ...allItems.filter(i => i.setId || i.set_key || i.set_name).map(i => i.name),
    ...equippedItems.filter(i => i.setId || i.set_key || i.set_name).map(i => i.name),
  ]);

  return (
    <div className="space-y-4">
      {ZONE_ORDER.map(zone => {
        const sets = setsByZone[zone];
        if (!sets || sets.length === 0) return null;

        return (
          <div key={zone}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {ZONE_LABELS[zone] || zone}
            </h4>
            <div className="space-y-2">
              {sets.map(set => {
                const bonus = setBonuses[set.setKey];
                const equippedCount = bonus?.equippedCount || 0;
                const totalPieces = set.pieces.length;
                const isExpanded = expandedSet === set.setKey;
                const isClassMatch = !set.class || set.class === characterClass;
                const ownedCount = set.pieces.filter(p => ownedPieceNames.has(p)).length;

                return (
                  <div
                    key={set.setKey}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      equippedCount >= totalPieces
                        ? `${set.borderColor} bg-card/80`
                        : equippedCount > 0
                        ? "border-border/80 bg-card/50"
                        : "border-border/40 bg-card/30"
                    }`}
                  >
                    {/* Header */}
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedSet(isExpanded ? null : set.setKey)}
                    >
                      <span className="text-lg">{set.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${equippedCount > 0 ? set.color : "text-muted-foreground"}`}>
                            {set.name}
                          </span>
                          {set.class && (
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${isClassMatch ? "border-primary/30 text-primary" : "border-muted text-muted-foreground"}`}>
                              {CLASS_LABELS[set.class]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-xs ${equippedCount > 0 ? set.color : "text-muted-foreground"}`}>
                            {equippedCount}/{totalPieces} equipped
                          </span>
                          {ownedCount > equippedCount && (
                            <span className="text-xs text-muted-foreground">
                              ({ownedCount} owned)
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Progress dots */}
                      <div className="flex gap-0.5">
                        {set.pieces.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < equippedCount ? "bg-primary" : ownedPieceNames.has(set.pieces[i]) ? "bg-muted-foreground/50" : "bg-muted/30"
                            }`}
                          />
                        ))}
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border/30">
                        {/* Pieces */}
                        <div className="pt-2 space-y-1">
                          {set.pieces.map((pieceName, i) => {
                            const isEquipped = bonus?.equippedPieces?.includes(pieceName);
                            const isOwned = ownedPieceNames.has(pieceName);
                            return (
                              <div key={pieceName} className="flex items-center gap-2 text-xs">
                                {isEquipped ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                ) : isOwned ? (
                                  <Circle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                                )}
                                <span className={isEquipped ? set.color : isOwned ? "text-yellow-400/80" : "text-muted-foreground/50"}>
                                  {pieceName}
                                </span>
                                <span className="text-muted-foreground/40 capitalize">{set.slots[i]}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bonuses */}
                        <div className="space-y-1 pt-1">
                          {Object.entries(set.bonuses).map(([threshold, bonusData]) => {
                            const t = Number(threshold);
                            const isActive = equippedCount >= t;
                            const procDef = bonusData.procEffect ? PROC_TYPES[bonusData.procEffect] : null;
                            return (
                              <div
                                key={threshold}
                                className={`text-xs px-2 py-1.5 rounded ${
                                  isActive ? "bg-primary/10 border border-primary/30" : "bg-muted/20 border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={isActive ? "default" : "outline"}
                                    className={`text-[10px] px-1.5 py-0 ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                                  >
                                    {t}pc
                                  </Badge>
                                  <span className={isActive ? "text-foreground" : "text-muted-foreground/60"}>
                                    {bonusData.label}
                                  </span>
                                </div>
                                {procDef && (
                                  <div className={`flex items-center gap-1.5 mt-1 ml-6 ${isActive ? "text-amber-400" : "text-muted-foreground/40"}`}>
                                    <span>{procDef.icon}</span>
                                    <span className="font-medium">{procDef.name}</span>
                                    {isActive && <span className="text-muted-foreground text-[10px]">ACTIVE</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
