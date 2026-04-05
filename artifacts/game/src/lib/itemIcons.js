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
const CONSUMABLE_SPRITES = {
  scroll_exp:      "/sprites/items/scroll_teal.png",
  scroll_gold:     "/sprites/items/scroll_gold.png",
  scroll_dmg:      "/sprites/items/scroll_red.png",
  scroll_loot:     "/sprites/items/scroll_purple.png",
  dungeon_ticket:  "/sprites/currencies/dungeon_ticket.png",
  health_potion:   "/sprites/items/scroll_red.png",
  mana_potion:     "/sprites/items/scroll_blue.png",
  pet_incubator:   "/sprites/currencies/incubators.png",
  hourglass:       "/sprites/items/scroll_brown.png",
  upgrade_stone:   "/sprites/currencies/upgrade_stone.png",
};

// Name-based sprite matching for items that don't have consumableType set
const NAME_SPRITE_MAP = [
  { match: /health.*potion/i,     sprite: "/sprites/items/scroll_red.png" },
  { match: /mana.*potion/i,       sprite: "/sprites/items/scroll_blue.png" },
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
  { match: /pet.*incubator/i,     sprite: "/sprites/currencies/incubators.png" },
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

/**
 * Returns the pixel art sprite path for an item, if available.
 * Returns null if no sprite exists (use getItemIcon() as fallback).
 */
export function getItemSprite(item) {
  if (!item) return null;
  const extra = item.extraData || item.extra_data || {};
  if (extra.sprite) return extra.sprite;
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