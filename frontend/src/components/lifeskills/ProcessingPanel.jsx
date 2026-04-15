import React, { useState } from "react";
import PixelButton from "@/components/game/PixelButton";
import { Lock, ArrowRight, Minus, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const RARITY_CONFIG = {
  common:    { color: "text-gray-400",   border: "border-gray-500/30",   bg: "bg-gray-500/10"   },
  uncommon:  { color: "text-green-400",  border: "border-green-500/30",  bg: "bg-green-500/10"  },
  rare:      { color: "text-blue-400",   border: "border-blue-500/30",   bg: "bg-blue-500/10"   },
  epic:      { color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  legendary: { color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
  mythic:    { color: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10"    },
  shiny:     { color: "text-yellow-300", border: "border-yellow-400/40", bg: "bg-yellow-400/10" },
};

const RESOURCE_ICONS = {
  // ores
  iron_ore: "🪨", copper_ore: "🟤", silver_ore: "⚪", gold_ore: "🟡",
  platinum_ore: "💎", void_ore: "🔮", crystal_ore: "⭐",
  // bars
  iron_bar: "🔩", copper_bar: "🟠", silver_bar: "⬜", gold_bar: "🟨",
  platinum_bar: "💠", void_bar: "🫧", crystal_bar: "🔷",
  // fish
  carp: "🐟", salmon: "🐠", tuna: "🐡", swordfish: "🐬",
  dragonfish: "🐲", leviathan_fish: "🐉", golden_fish: "✨",
  // cooked
  grilled_carp: "🍤", salmon_steak: "🥩", tuna_soup: "🍜",
  swordfish_feast: "🍽️", dragon_broth: "🫕", leviathan_stew: "🍲", golden_banquet: "✨",
  // herbs
  common_herb: "🌿", greenleaf: "🍃", blue_herb: "🌺", shadow_herb: "🌑",
  sun_blossom: "🌻", ether_plant: "🌸", spirit_herb: "💫",
  // potions
  minor_potion: "🧴", healing_salve: "💊", mana_elixir: "🔵",
  strength_brew: "💪", sun_tincture: "☀️", ether_draught: "🌸", spirit_essence: "💫",
};

function RecipeRow({ recipe, availableQty, characterId, onDone }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const rc = RARITY_CONFIG[recipe.rarity] || RARITY_CONFIG.common;
  const canProcess = availableQty >= qty;

  const handleProcess = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("lifeSkills", {
        action: "process",
        character_id: characterId,
        process_type: recipe.process_type,
        recipe_input: recipe.input,
        quantity: qty,
      });
      if (res?.success) {
        toast({
          title: `Processed ${qty}× ${recipe.input_label}`,
          description: `+${qty}× ${recipe.output_label}`,
        });
        onDone();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 rounded-xl border p-2.5 ${rc.border} ${rc.bg}`}>
      {/* Input */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-lg">{RESOURCE_ICONS[recipe.input] || "📦"}</span>
        <div>
          <p className={`text-xs font-semibold ${rc.color}`}>{recipe.input_label}</p>
          <p className="text-[10px] text-muted-foreground">Have: {availableQty}</p>
        </div>
      </div>

      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

      {/* Output */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-lg">{RESOURCE_ICONS[recipe.output] || "📦"}</span>
        <p className={`text-xs font-semibold ${rc.color}`}>{recipe.output_label}</p>
      </div>

      {/* Qty + Button */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="w-5 h-5 rounded bg-muted text-xs flex items-center justify-center hover:bg-muted/80"
          onClick={() => setQty(q => Math.max(1, q - 1))}
        >
          <Minus className="w-2.5 h-2.5" />
        </button>
        <span className="text-xs w-5 text-center font-bold">{qty}</span>
        <button
          className="w-5 h-5 rounded bg-muted text-xs flex items-center justify-center hover:bg-muted/80"
          onClick={() => setQty(q => Math.min(availableQty, q + 1))}
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        <PixelButton
          variant="ok"
          label={loading ? "..." : "PROCESS"}
          disabled={loading || !canProcess}
          onClick={handleProcess}
        />
      </div>
    </div>
  );
}

export default function ProcessingPanel({ processing, resources, characterId, onResourcesChange }) {
  // Build a resource quantity map: resource_type -> qty (summed across rarities)
  // But for processing we need per-rarity stacks
  const resourceMap = {};
  (resources || []).forEach(r => {
    const key = `${r.resource_type}__${r.rarity}`;
    resourceMap[key] = (resourceMap[key] || 0) + (r.quantity || 0);
  });

  const panels = Object.entries(processing || {});

  return (
    <div className="space-y-5">
      {panels.map(([key, proc]) => {
        const isUnlocked = proc.is_unlocked;
        const reqLabel = `${proc.requires_skill.charAt(0).toUpperCase() + proc.requires_skill.slice(1)} Lv.${proc.requires_level}`;

        return (
          <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-xl">{proc.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{proc.label}</p>
                <p className="text-xs text-muted-foreground">{proc.description}</p>
              </div>
              {!isUnlocked && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                  <Lock className="w-3 h-3" />
                  Requires {reqLabel}
                </div>
              )}
              {isUnlocked && (
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Unlocked
                </span>
              )}
            </div>

            {/* Recipes */}
            <div className={`p-3 space-y-2 ${!isUnlocked ? "opacity-40 pointer-events-none" : ""}`}>
              {proc.recipes.map(recipe => {
                const availableQty = resourceMap[`${recipe.input}__${recipe.rarity}`] || 0;
                return (
                  <RecipeRow
                    key={recipe.input}
                    recipe={{ ...recipe, process_type: key }}
                    availableQty={availableQty}
                    characterId={characterId}
                    onDone={onResourcesChange}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}