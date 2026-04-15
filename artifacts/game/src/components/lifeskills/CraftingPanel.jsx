import React from "react";
import PixelButton from "@/components/game/PixelButton";
import { Lock } from "lucide-react";

// Recipes using new resource_type names
const RECIPES = [
  { id: "cooked_fish",     label: "Cooked Fish",     icon: "🍤", inputs: [{ resource: "carp",        qty: 2, label: "Carp" }],                                                         output: "cooked_fish",     xp: 40,  minFishLevel: 1  },
  { id: "hearty_stew",     label: "Hearty Stew",     icon: "🍲", inputs: [{ resource: "salmon",      qty: 1, label: "Salmon" }, { resource: "common_herb", qty: 1, label: "Common Herb" }],  output: "hearty_stew",     xp: 80,  minFishLevel: 5  },
  { id: "mana_bread",      label: "Mana Bread",      icon: "🍞", inputs: [{ resource: "blue_herb",   qty: 2, label: "Blue Herb" }],                                                    output: "mana_bread",      xp: 120, minHerbLevel: 5  },
  { id: "minor_potion",    label: "Minor Potion",    icon: "🧴", inputs: [{ resource: "common_herb", qty: 2, label: "Common Herb" }],                                                  output: "minor_potion",    xp: 40,  minHerbLevel: 1  },
  { id: "strength_potion", label: "Strength Potion", icon: "💪", inputs: [{ resource: "greenleaf",   qty: 1, label: "Greenleaf" }, { resource: "iron_ore", qty: 1, label: "Iron Ore" }], output: "strength_potion", xp: 80,  minHerbLevel: 3  },
  { id: "xp_potion",       label: "XP Potion",       icon: "⭐", inputs: [{ resource: "blue_herb",   qty: 2, label: "Blue Herb" }, { resource: "copper_ore", qty: 1, label: "Copper Ore" }], output: "xp_potion",    xp: 150, minHerbLevel: 5  },
  { id: "defense_potion",  label: "Defense Potion",  icon: "🛡️", inputs: [{ resource: "shadow_herb", qty: 1, label: "Shadow Herb" }, { resource: "silver_ore", qty: 1, label: "Silver Ore" }], output: "defense_potion", xp: 200, minHerbLevel: 10 },
];

export default function CraftingPanel({ skills, resources }) {
  const fishingLevel  = skills?.find(s => s.skill_type === "fishing")?.level  || 0;
  const herbLevel     = skills?.find(s => s.skill_type === "herbalism")?.level || 0;
  const miningLevel   = skills?.find(s => s.skill_type === "mining")?.level   || 0;

  // Build a resource quantity map: resource_type -> total quantity across all rarities
  const resourceMap = {};
  (resources || []).forEach(r => {
    resourceMap[r.resource_type] = (resourceMap[r.resource_type] || 0) + (r.quantity || 0);
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Crafting coming soon — requires gathered resources.</p>
      {RECIPES.map(recipe => {
        const reqLevel = recipe.minFishLevel
          ? { skill: "fishing", lvl: recipe.minFishLevel, have: fishingLevel }
          : { skill: "herbalism", lvl: recipe.minHerbLevel, have: herbLevel };
        const locked = reqLevel.have < reqLevel.lvl;
        const hasIngredients = recipe.inputs.every(i => (resourceMap[i.resource] || 0) >= i.qty);

        return (
          <div
            key={recipe.id}
            className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${locked ? "opacity-50" : ""}`}
          >
            <span className="text-2xl w-8 text-center">{recipe.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{recipe.label}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {recipe.inputs.map(inp => {
                  const have = resourceMap[inp.resource] || 0;
                  const ok   = have >= inp.qty;
                  return (
                    <span
                      key={inp.resource}
                      className={`text-xs px-1.5 py-0.5 rounded border ${ok ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}
                    >
                      {inp.label} ×{inp.qty} ({have})
                    </span>
                  );
                })}
              </div>
              {locked && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Req. {reqLevel.skill} Lv.{reqLevel.lvl}
                </p>
              )}
            </div>
            <PixelButton
              variant="ok"
              label={locked ? `LV.${reqLevel.lvl}` : "CRAFT"}
              disabled={locked || !hasIngredients}
            />
          </div>
        );
      })}
    </div>
  );
}