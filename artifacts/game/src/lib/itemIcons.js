// ===== ITEM ICON RESOLVER =====
// Returns the correct Lucide icon component based on item type and subtype.

import {
  Swords,
  Axe,
  Hammer,
  Wand2,
  Crosshair,
  ShieldCheck,
  Crown,
  Footprints,
  CircleDot,
  Gem,
  FlaskConical,
  Package,
  Hand,
  Sword,
  Hourglass,
  ScrollText,
  Ticket,
  Egg,
  Sparkles,
  Wrench,
} from "lucide-react";

// Subtype -> icon
const SUBTYPE_ICONS = {
  sword:    Sword,
  axe:      Axe,
  mace:     Hammer,
  staff:    Wand2,
  wand:     Wand2,
  bow:      Crosshair,
  crossbow: Crosshair,
  dagger:   Sword,
  blade:    Swords,
  heavy:    ShieldCheck,
  medium:   ShieldCheck,
  light:    ShieldCheck,
};

// Consumable type -> icon (matched via extraData.consumableType or extraData.materialType)
const CONSUMABLE_ICONS = {
  hourglass:       Hourglass,
  scroll_exp:      ScrollText,
  scroll_gold:     ScrollText,
  scroll_dmg:      ScrollText,
  scroll_loot:     ScrollText,
  dungeon_ticket:  Ticket,
  pet_egg_shiny:   Egg,
  pet_egg:         Egg,
  upgrade_stone:   Wrench,
  pet_incubator:   Sparkles,
  health_potion:   FlaskConical,
  mana_potion:     FlaskConical,
};

// Consumable type -> pixel art sprite path (takes priority over Lucide icons)
// NOTE: health/mana potions intentionally NOT mapped here (they use FlaskConical, not scrolls)
const CONSUMABLE_SPRITES = {
  scroll_exp:      "/sprites/items/scroll_teal.png",
  scroll_gold:     "/sprites/items/scroll_gold.png",
  scroll_dmg:      "/sprites/items/scroll_purple.png",
  scroll_loot:     "/sprites/items/scroll_gold.png",
  dungeon_ticket:  "/sprites/currencies/dungeon_ticket.png",
  hourglass:       "/sprites/items/scroll_brown.png",
  upgrade_stone:   "/sprites/currencies/upgrade_stone.png",
};

// Name-based sprite matching for items that don't have consumableType set
// NOTE: potions are excluded - they keep the FlaskConical icon until we have potion sprites
const NAME_SPRITE_MAP = [
  { match: /scroll.*exp/i,        sprite: "/sprites/items/scroll_teal.png" },
  { match: /scroll.*experience/i, sprite: "/sprites/items/scroll_teal.png" },
  { match: /scroll.*gold/i,       sprite: "/sprites/items/scroll_gold.png" },
  { match: /scroll.*power/i,      sprite: "/sprites/items/scroll_purple.png" },
  { match: /scroll.*damage/i,     sprite: "/sprites/items/scroll_purple.png" },
  { match: /scroll.*fortune/i,    sprite: "/sprites/items/scroll_gold.png" },
  { match: /scroll.*loot/i,       sprite: "/sprites/items/scroll_gold.png" },
  { match: /dungeon.*ticket/i,    sprite: "/sprites/currencies/dungeon_ticket.png" },
  { match: /hourglass/i,          sprite: "/sprites/items/scroll_brown.png" },
  { match: /exp.*boost/i,         sprite: "/sprites/items/scroll_teal.png" },
  { match: /gold.*boost/i,        sprite: "/sprites/items/scroll_gold.png" },
  { match: /upgrade.*stone/i,     sprite: "/sprites/currencies/upgrade_stone.png" },
];

// Type -> fallback icon (when no subtype)
const TYPE_ICONS = {
  weapon:     Swords,
  armor:      ShieldCheck,
  helmet:     Crown,
  gloves:     Hand,
  boots:      Footprints,
  ring:       CircleDot,
  amulet:     Gem,
  consumable: FlaskConical,
  material:   Package,
};

/**
 * Returns the correct icon component for an item.
 * Weapon subtypes get specialized icons (sword/dagger=Sword, axe=Axe, mace=Hammer,
 * staff/wand=Wand2, bow/crossbow=Crosshair, blade=Swords).
 */
export function getItemIcon(item) {
  if (!item) return Package;
  if (item.subtype && SUBTYPE_ICONS[item.subtype]) {
    return SUBTYPE_ICONS[item.subtype];
  }
  // Check consumable/material subtype from extraData
  const extra = item.extraData || item.extra_data || {};
  const consumableType = extra.consumableType || extra.materialType;
  if (consumableType && CONSUMABLE_ICONS[consumableType]) {
    return CONSUMABLE_ICONS[consumableType];
  }
  return TYPE_ICONS[item.type] || Package;
}

// Weapon sprite tier system: maps rarity to sprite tier folder
// Tier A (common) = common/uncommon, Tier B (rare) = rare/epic, Tier C (legendary) = legendary/mythic/set/shiny
const RARITY_TO_TIER = {
  common: "common", uncommon: "common",
  rare: "rare", epic: "rare",
  legendary: "legendary", mythic: "legendary", set: "legendary", shiny: "legendary",
};

// Number of sprites available per item subtype per tier
const WEAPON_SPRITE_COUNTS = {
  staff:      { common: 64, rare: 64, legendary: 32 },
  wand:       { common: 64, rare: 64, legendary: 32 },
  light:      { common: 29, rare: 22, legendary: 20 },
  cloth_helm: { common: 63, rare: 34, legendary: 26 },
};

// Simple hash from item ID or name to get a consistent sprite index
function spriteHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns the pixel art sprite path for equipment based on its subtype and rarity.
 * Uses item ID/name to consistently assign the same sprite to the same item.
 */
function getEquipmentSprite(item) {
  if (!item) return null;
  const extra = item.extraData || item.extra_data || {};
  const subtype = item.subtype || extra.subtype;
  if (!subtype || !WEAPON_SPRITE_COUNTS[subtype]) return null;
  const tier = RARITY_TO_TIER[item.rarity] || "common";
  const count = WEAPON_SPRITE_COUNTS[subtype][tier];
  if (!count) return null;
  const seed = String(item.name || item.id || "");
  const idx = (spriteHash(seed) % count) + 1;
  return `/sprites/weapons/${subtype}/${tier}/${subtype === "light" ? "armor" : subtype}_${String(idx).padStart(3, "0")}.png`;
}

/**
 * Returns the pixel art sprite path for an item, if available.
 * Returns null if no sprite exists (use getItemIcon() as fallback).
 */
export function getItemSprite(item) {
  if (!item) return null;
  const extra = item.extraData || item.extra_data || {};
  if (extra.sprite) return extra.sprite;
  // Check equipment sprites (weapons, armor, etc.)
  const equipSprite = getEquipmentSprite(item);
  if (equipSprite) return equipSprite;
  const consumableType = extra.consumableType || extra.materialType;
  if (consumableType && CONSUMABLE_SPRITES[consumableType]) {
    return CONSUMABLE_SPRITES[consumableType];
  }
  // Name-based fallback for items without consumableType
  if (item.name) {
    const match = NAME_SPRITE_MAP.find(m => m.match.test(item.name));
    if (match) return match.sprite;
  }
  return null;
}

export { TYPE_ICONS, SUBTYPE_ICONS };