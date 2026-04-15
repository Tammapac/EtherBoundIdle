import React, { useState } from "react";
import PixelButton from "@/components/game/PixelButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

// Resource metadata keyed by resource_type
const RESOURCE_META = {
  // Mining
  iron_ore:      { label: "Iron Ore",       icon: "🪨", category: "ores"  },
  copper_ore:    { label: "Copper Ore",      icon: "🟤", category: "ores"  },
  silver_ore:    { label: "Silver Ore",      icon: "⚪", category: "ores"  },
  gold_ore:      { label: "Gold Ore",        icon: "🟡", category: "ores"  },
  platinum_ore:  { label: "Platinum Ore",    icon: "💎", category: "ores"  },
  void_ore:      { label: "Void Ore",        icon: "🔮", category: "ores"  },
  crystal_ore:   { label: "Crystal Ore",     icon: "⭐", category: "ores"  },
  // Fishing
  carp:          { label: "Carp",            icon: "🐟", category: "fish"  },
  salmon:        { label: "Salmon",          icon: "🐠", category: "fish"  },
  tuna:          { label: "Tuna",            icon: "🐡", category: "fish"  },
  swordfish:     { label: "Swordfish",       icon: "🐬", category: "fish"  },
  dragonfish:    { label: "Dragonfish",      icon: "🐲", category: "fish"  },
  leviathan_fish:{ label: "Leviathan Fish",  icon: "🐉", category: "fish"  },
  golden_fish:   { label: "Golden Fish",     icon: "✨", category: "fish"  },
  // Herbs
  common_herb:   { label: "Common Herb",     icon: "🌿", category: "herbs" },
  greenleaf:     { label: "Greenleaf",       icon: "🍃", category: "herbs" },
  blue_herb:     { label: "Blue Herb",       icon: "🌺", category: "herbs" },
  shadow_herb:   { label: "Shadow Herb",     icon: "🌑", category: "herbs" },
  sun_blossom:   { label: "Sun Blossom",     icon: "🌻", category: "herbs" },
  ether_plant:   { label: "Ether Plant",     icon: "🌸", category: "herbs" },
  spirit_herb:   { label: "Spirit Herb",     icon: "💫", category: "herbs" },
  // Crafted (legacy)
  cooked_fish:     { label: "Cooked Fish",     icon: "🍤", category: "crafted" },
  hearty_stew:     { label: "Hearty Stew",     icon: "🍲", category: "crafted" },
  mana_bread:      { label: "Mana Bread",      icon: "🍞", category: "crafted" },
  minor_potion:    { label: "Minor Potion",    icon: "🧴", category: "crafted" },
  strength_potion: { label: "Strength Potion", icon: "💪", category: "crafted" },
  xp_potion:       { label: "XP Potion",       icon: "⭐", category: "crafted" },
  defense_potion:  { label: "Defense Potion",  icon: "🛡️", category: "crafted" },
  // Smelting — bars
  iron_bar:      { label: "Iron Bar",      icon: "🔩", category: "bars"     },
  copper_bar:    { label: "Copper Bar",    icon: "🟠", category: "bars"     },
  silver_bar:    { label: "Silver Bar",    icon: "⬜", category: "bars"     },
  gold_bar:      { label: "Gold Bar",      icon: "🟨", category: "bars"     },
  platinum_bar:  { label: "Platinum Bar",  icon: "💠", category: "bars"     },
  void_bar:      { label: "Void Bar",      icon: "🫧", category: "bars"     },
  crystal_bar:   { label: "Crystal Bar",   icon: "🔷", category: "bars"     },
  // Forging — equipment
  iron_sword:    { label: "Iron Sword",    icon: "⚔️", category: "forged"   },
  steel_armor:   { label: "Steel Armor",   icon: "🛡️", category: "forged"   },
  silver_blade:  { label: "Silver Blade",  icon: "🗡️", category: "forged"   },
  gold_shield:   { label: "Gold Shield",   icon: "🔰", category: "forged"   },
  platinum_helm: { label: "Platinum Helm", icon: "⛑️", category: "forged"   },
  void_weapon:   { label: "Void Weapon",   icon: "🔮", category: "forged"   },
  crystal_relic: { label: "Crystal Relic", icon: "💎", category: "forged"   },
  // Cooking — food
  grilled_carp:    { label: "Grilled Carp",    icon: "🍤", category: "food"    },
  salmon_steak:    { label: "Salmon Steak",    icon: "🥩", category: "food"    },
  tuna_soup:       { label: "Tuna Soup",       icon: "🍜", category: "food"    },
  swordfish_feast: { label: "Swordfish Feast", icon: "🍽️", category: "food"    },
  dragon_broth:    { label: "Dragon Broth",    icon: "🫕", category: "food"    },
  leviathan_stew:  { label: "Leviathan Stew",  icon: "🍲", category: "food"    },
  golden_banquet:  { label: "Golden Banquet",  icon: "✨", category: "food"    },
  // Alchemy — potions
  healing_salve:   { label: "Healing Salve",   icon: "💊", category: "potions" },
  mana_elixir:     { label: "Mana Elixir",     icon: "🔵", category: "potions" },
  strength_brew:   { label: "Strength Brew",   icon: "💪", category: "potions" },
  sun_tincture:    { label: "Sun Tincture",    icon: "☀️", category: "potions" },
  ether_draught:   { label: "Ether Draught",   icon: "🌸", category: "potions" },
  spirit_essence:  { label: "Spirit Essence",  icon: "💫", category: "potions" },
};

const RARITY_CONFIG = {
  common:    { color: "text-gray-400",   border: "border-gray-500/30",   bg: "bg-gray-500/10",   label: "Common"    },
  uncommon:  { color: "text-green-400",  border: "border-green-500/30",  bg: "bg-green-500/10",  label: "Uncommon"  },
  rare:      { color: "text-blue-400",   border: "border-blue-500/30",   bg: "bg-blue-500/10",   label: "Rare"      },
  epic:      { color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", label: "Epic"      },
  legendary: { color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", label: "Legendary" },
  mythic:    { color: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10",    label: "Mythic"    },
  shiny:     { color: "text-yellow-300", border: "border-yellow-400/40", bg: "bg-yellow-400/10", label: "✨ Shiny"  },
};

// Sell price per ore (in gold) — balanced for idle grinding
const ORE_SELL_PRICE = {
  common:    2,
  uncommon:  6,
  rare:      18,
  epic:      50,
  legendary: 150,
  mythic:    400,
  shiny:     1000,
};

const RARITY_ORDER = ["shiny","mythic","legendary","epic","rare","uncommon","common"];
const CATEGORIES = ["all", "ores", "bars", "forged", "fish", "food", "herbs", "potions", "crafted"];
const CATEGORY_LABELS = {
  all:     "📦 All",
  ores:    "⛏️ Ores",
  bars:    "🔩 Bars",
  forged:  "⚔️ Forged",
  fish:    "🎣 Fish",
  food:    "🍳 Food",
  herbs:   "🌿 Herbs",
  potions: "⚗️ Potions",
  crafted: "🔨 Crafted",
};

export default function ResourceInventory({ resources, character, onCharacterUpdate, onResourcesChange }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selling, setSelling] = useState(null); // resource id being sold
  const { toast } = useToast();

  const nonEmpty = resources.filter(r => (r.quantity || 0) > 0);

  const byCategory = {};
  CATEGORIES.forEach(c => { byCategory[c] = []; });
  nonEmpty.forEach(r => {
    const meta = RESOURCE_META[r.resource_type];
    const cat = meta?.category || "crafted";
    if (byCategory[cat]) byCategory[cat].push(r);
    byCategory["all"].push(r);
  });

  CATEGORIES.forEach(c => {
    byCategory[c].sort((a, b) => {
      return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    });
  });

  const handleSellAll = async (res) => {
    const priceEach = ORE_SELL_PRICE[res.rarity] || 2;
    const qty = res.quantity || 0;
    if (qty === 0) return;
    const totalGold = priceEach * qty;

    setSelling(res.id);
    try {
      await base44.entities.Resource.update(res.id, { quantity: 0 });
      const newGold = (character.gold || 0) + totalGold;
      await base44.entities.Character.update(character.id, { gold: newGold });
      onCharacterUpdate?.({ gold: newGold });
      onResourcesChange?.();
      toast({ title: `Sold ${qty}× ${RESOURCE_META[res.resource_type]?.label || res.resource_type}`, description: `+${totalGold.toLocaleString()} Gold` });
    } finally {
      setSelling(null);
    }
  };

  const handleSellOne = async (res) => {
    const priceEach = ORE_SELL_PRICE[res.rarity] || 2;
    const qty = res.quantity || 0;
    if (qty === 0) return;

    setSelling(res.id + "_one");
    try {
      await base44.entities.Resource.update(res.id, { quantity: qty - 1 });
      const newGold = (character.gold || 0) + priceEach;
      await base44.entities.Character.update(character.id, { gold: newGold });
      onCharacterUpdate?.({ gold: newGold });
      onResourcesChange?.();
    } finally {
      setSelling(null);
    }
  };

  if (nonEmpty.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-3xl mb-2">📦</p>
        <p className="text-sm">No resources yet. Start gathering!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {CATEGORY_LABELS[cat]}
            {byCategory[cat].length > 0 && (
              <span className="ml-1.5 bg-muted-foreground/20 rounded-full px-1.5 py-0.5 text-[10px]">
                {byCategory[cat].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {byCategory[activeCategory].length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No {CATEGORY_LABELS[activeCategory].split(" ")[1]?.toLowerCase() || "items"} yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {byCategory[activeCategory].map(res => {
            const meta    = RESOURCE_META[res.resource_type] || { label: res.resource_type, icon: "📦" };
            const rarity  = RARITY_CONFIG[res.rarity] || RARITY_CONFIG.common;
            const isShiny = res.rarity === "shiny";
            const isOre   = meta.category === "ores";
            const price   = ORE_SELL_PRICE[res.rarity] || 2;
            const isSelling = selling === res.id || selling === res.id + "_one";

            return (
              <div
                key={res.id || `${res.resource_type}-${res.rarity}`}
                className={`border rounded-xl p-3 flex flex-col gap-1.5 ${rarity.border} ${rarity.bg} ${isShiny ? "ring-1 ring-yellow-400/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{meta.icon}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${rarity.color} ${rarity.border} bg-background/50`}>
                    {rarity.label}
                  </span>
                </div>
                <p className={`text-xs font-semibold leading-snug ${rarity.color}`}>{meta.label}</p>
                <p className="text-sm font-bold text-foreground">×{res.quantity.toLocaleString()}</p>

                {/* Sell buttons — only for ores */}
                {isOre && (
                  <div className="flex gap-1 mt-1">
                    <PixelButton
                      variant="ok"
                      label={`×1 (${price}G)`}
                      disabled={isSelling || res.quantity < 1}
                      onClick={() => handleSellOne(res)}
                    />
                    <PixelButton
                      variant="ok"
                      label={`SELL ALL (${(price * res.quantity).toLocaleString()}G)`}
                      disabled={isSelling || res.quantity < 1}
                      onClick={() => handleSellAll(res)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}