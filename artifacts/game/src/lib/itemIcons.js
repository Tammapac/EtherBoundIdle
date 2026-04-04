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

export { TYPE_ICONS, SUBTYPE_ICONS };