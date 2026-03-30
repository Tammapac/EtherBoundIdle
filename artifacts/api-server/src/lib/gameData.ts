export const ENEMIES: Record<string, { name: string; expReward: number; goldReward: number; isElite?: boolean; isBoss?: boolean }> = {
  forest_wolf: { name: "Forest Wolf", expReward: 15, goldReward: 5 },
  goblin_scout: { name: "Goblin Scout", expReward: 18, goldReward: 8 },
  giant_spider: { name: "Giant Spider", expReward: 22, goldReward: 10 },
  wild_boar: { name: "Wild Boar", expReward: 17, goldReward: 6 },
  moss_golem: { name: "Moss Golem", expReward: 20, goldReward: 8 },
  vine_serpent: { name: "Vine Serpent", expReward: 24, goldReward: 10 },
  forest_bandit: { name: "Forest Bandit", expReward: 26, goldReward: 14 },
  poison_frog: { name: "Poison Frog", expReward: 16, goldReward: 6 },
  bark_spider: { name: "Bark Spider", expReward: 20, goldReward: 8 },
  goblin_shaman: { name: "Goblin Shaman", expReward: 25, goldReward: 12 },
  treant_sprout: { name: "Treant Sprout", expReward: 18, goldReward: 7 },
  thornback_boar: { name: "Thornback Boar", expReward: 19, goldReward: 8 },
  ancient_treant: { name: "Ancient Treant", expReward: 120, goldReward: 80, isElite: true },
  forest_troll: { name: "Forest Troll", expReward: 140, goldReward: 90, isElite: true },
  forest_guardian: { name: "Forest Guardian", expReward: 80, goldReward: 50, isBoss: true },
  sand_scorpion: { name: "Sand Scorpion", expReward: 35, goldReward: 15 },
  desert_bandit: { name: "Desert Bandit", expReward: 40, goldReward: 20 },
  sand_golem: { name: "Sand Golem", expReward: 45, goldReward: 22 },
  fire_lizard: { name: "Fire Lizard", expReward: 42, goldReward: 18 },
  cactus_wraith: { name: "Cactus Wraith", expReward: 38, goldReward: 16 },
  dune_raider: { name: "Dune Raider", expReward: 50, goldReward: 25 },
  tomb_scarab: { name: "Tomb Scarab", expReward: 36, goldReward: 17 },
  sandstorm_elemental: { name: "Sandstorm Elemental", expReward: 55, goldReward: 28 },
  desert_cobra: { name: "Desert Cobra", expReward: 40, goldReward: 19 },
  mummy_warrior: { name: "Mummy Warrior", expReward: 42, goldReward: 20 },
  sand_phantom: { name: "Sand Phantom", expReward: 48, goldReward: 24 },
  flame_jackal: { name: "Flame Jackal", expReward: 46, goldReward: 22 },
  tomb_guardian: { name: "Tomb Guardian", expReward: 52, goldReward: 26 },
  sand_titan: { name: "Sand Titan", expReward: 250, goldReward: 150, isElite: true },
  fire_colossus: { name: "Fire Colossus", expReward: 300, goldReward: 180, isElite: true },
  desert_wyrm: { name: "Desert Wyrm", expReward: 180, goldReward: 100, isBoss: true },
  frost_wolf: { name: "Frost Wolf", expReward: 70, goldReward: 30 },
  ice_elemental: { name: "Ice Elemental", expReward: 85, goldReward: 40 },
  yeti: { name: "Yeti", expReward: 100, goldReward: 50 },
  glacial_golem: { name: "Glacial Golem", expReward: 95, goldReward: 45 },
  snow_harpy: { name: "Snow Harpy", expReward: 90, goldReward: 42 },
  frozen_knight: { name: "Frozen Knight", expReward: 105, goldReward: 52 },
  ice_witch: { name: "Ice Witch", expReward: 110, goldReward: 55 },
  blizzard_sprite: { name: "Blizzard Sprite", expReward: 80, goldReward: 38 },
  frost_troll: { name: "Frost Troll", expReward: 85, goldReward: 40 },
  avalanche_wraith: { name: "Avalanche Wraith", expReward: 92, goldReward: 44 },
  ice_basilisk: { name: "Ice Basilisk", expReward: 98, goldReward: 48 },
  polar_bear_spirit: { name: "Polar Bear Spirit", expReward: 105, goldReward: 52 },
  crystal_golem: { name: "Crystal Golem", expReward: 108, goldReward: 54 },
  frost_colossus: { name: "Frost Colossus", expReward: 500, goldReward: 300, isElite: true },
  blizzard_titan: { name: "Blizzard Titan", expReward: 600, goldReward: 350, isElite: true },
  frost_dragon: { name: "Frost Dragon", expReward: 400, goldReward: 250, isBoss: true },
  shadow_wraith: { name: "Shadow Wraith", expReward: 150, goldReward: 70 },
  demon_knight: { name: "Demon Knight", expReward: 200, goldReward: 90 },
  void_walker: { name: "Void Walker", expReward: 180, goldReward: 85 },
  soul_harvester: { name: "Soul Harvester", expReward: 190, goldReward: 88 },
  nightmare_hound: { name: "Nightmare Hound", expReward: 185, goldReward: 82 },
  cursed_revenant: { name: "Cursed Revenant", expReward: 205, goldReward: 95 },
  dark_sorcerer: { name: "Dark Sorcerer", expReward: 210, goldReward: 100 },
  abyssal_fiend: { name: "Abyssal Fiend", expReward: 220, goldReward: 105 },
  blood_shade: { name: "Blood Shade", expReward: 195, goldReward: 90 },
  necrotic_golem: { name: "Necrotic Golem", expReward: 210, goldReward: 98 },
  void_assassin: { name: "Void Assassin", expReward: 215, goldReward: 105 },
  rift_stalker: { name: "Rift Stalker", expReward: 220, goldReward: 108 },
  shadow_dragon: { name: "Shadow Dragon", expReward: 230, goldReward: 112 },
  void_titan: { name: "Void Titan", expReward: 1200, goldReward: 700, isElite: true },
  blood_colossus: { name: "Blood Colossus", expReward: 1400, goldReward: 800, isElite: true },
  shadow_lord: { name: "Shadow Lord", expReward: 1000, goldReward: 600, isBoss: true },
  celestial_guardian: { name: "Celestial Guardian", expReward: 350, goldReward: 150 },
  seraph_warrior: { name: "Seraph Warrior", expReward: 400, goldReward: 180 },
  titan: { name: "Titan", expReward: 500, goldReward: 250 },
  star_phantom: { name: "Star Phantom", expReward: 380, goldReward: 170 },
  nova_knight: { name: "Nova Knight", expReward: 430, goldReward: 200 },
  divine_construct: { name: "Divine Construct", expReward: 460, goldReward: 210 },
  astral_wyrm: { name: "Astral Wyrm", expReward: 490, goldReward: 230 },
  cosmic_sentinel: { name: "Cosmic Sentinel", expReward: 520, goldReward: 240 },
  light_golem: { name: "Light Golem", expReward: 370, goldReward: 160 },
  empyrean_shade: { name: "Empyrean Shade", expReward: 410, goldReward: 185 },
  starfire_drake: { name: "Starfire Drake", expReward: 460, goldReward: 215 },
  void_seraph: { name: "Void Seraph", expReward: 480, goldReward: 225 },
  genesis_elemental: { name: "Genesis Elemental", expReward: 510, goldReward: 240 },
  celestial_titan: { name: "Celestial Titan", expReward: 2500, goldReward: 1200, isElite: true },
  omega_seraph: { name: "Omega Seraph", expReward: 3000, goldReward: 1500, isElite: true },
  cosmic_overlord: { name: "Cosmic Overlord", expReward: 2000, goldReward: 1000, isBoss: true },
};

export function calculateExpToLevel(level: number): number {
  // Steeper curve: base growth 1.18 per level + quadratic scaling at higher levels
  // Lv1=100, Lv10=~430, Lv20=~2750, Lv37=~45000, Lv50=~350000, Lv100=~45M
  const base = 100 * Math.pow(1.18, level - 1);
  const quadratic = level > 10 ? Math.pow(level - 10, 2) * 15 : 0;
  return Math.floor(base + quadratic);
}

const RARITY_STAT_MULTIPLIERS: Record<string, number> = {
  common: 1.0, uncommon: 1.2, rare: 1.5, epic: 2.0, legendary: 2.8, mythic: 4.0, set: 3.2, shiny: 6.0,
};

export const RARITY_SELL_PRICES: Record<string, number> = {
  common: 8, uncommon: 25, rare: 70, epic: 200, legendary: 600, mythic: 2000, set: 1500, shiny: 8000,
};

export const RARITY_MULTIPLIER: Record<string, number> = {
  common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25, mythic: 50, shiny: 100,
};

const TYPE_STAT_POOLS: Record<string, string[]> = {
  weapon:  ["damage", "strength", "dexterity", "intelligence", "crit_chance", "crit_dmg_pct", "attack_speed", "mp_regen"],
  armor:   ["defense", "vitality", "hp_bonus", "strength", "hp_regen", "block_chance", "evasion"],
  helmet:  ["defense", "intelligence", "vitality", "mp_bonus", "mp_regen", "hp_regen"],
  gloves:  ["strength", "dexterity", "crit_chance", "crit_dmg_pct", "attack_speed", "defense"],
  boots:   ["dexterity", "defense", "luck", "evasion", "attack_speed"],
  ring:    ["luck", "strength", "dexterity", "intelligence", "crit_chance", "crit_dmg_pct", "gold_gain_pct", "exp_gain_pct"],
  amulet:  ["vitality", "hp_bonus", "mp_bonus", "luck", "intelligence", "hp_regen", "mp_regen", "block_chance"],
  consumable: ["hp_bonus", "mp_bonus"],
  material: [],
};

const PCT_STATS = new Set([
  "crit_chance", "crit_dmg_pct", "evasion", "block_chance",
  "lifesteal", "gold_gain_pct", "exp_gain_pct", "attack_speed"
]);

function generateItemStats(type: string, rarity: string, itemLevel: number): Record<string, number> {
  const pool = TYPE_STAT_POOLS[type] || ["strength"];
  const rarityConfig: Record<string, { slots: number; basePerSlot: number }> = {
    common:    { slots: 1, basePerSlot: 0.5 },
    uncommon:  { slots: 2, basePerSlot: 0.55 },
    rare:      { slots: 3, basePerSlot: 0.6 },
    epic:      { slots: 4, basePerSlot: 0.65 },
    legendary: { slots: 5, basePerSlot: 0.75 },
    mythic:    { slots: 6, basePerSlot: 0.85 },
    shiny:     { slots: 7, basePerSlot: 1.0 },
  };
  const cfg = rarityConfig[rarity] || { slots: 1, basePerSlot: 0.5 };
  const mult = RARITY_STAT_MULTIPLIERS[rarity] || 1.0;
  const lvlScale = 1 + (itemLevel - 1) * 0.07;
  const stats: Record<string, number> = {};
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < cfg.slots && i < shuffled.length; i++) {
    const stat = shuffled[i];
    const lifestealsReduction = stat === "lifesteal" ? 0.2 : 1.0;
    const pctReduction = PCT_STATS.has(stat) ? 0.35 : 1.0;
    const base = cfg.basePerSlot * mult * lvlScale * lifestealsReduction * pctReduction;
    const value = Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)));
    stats[stat] = (stats[stat] || 0) + value;
  }
  return stats;
}

const ZONE_LOOT: Record<string, { levelRange: [number, number]; itemLevelRange: [number, number]; weights: Record<string, number> }> = {
  verdant_forest:  { levelRange: [1, 10],   itemLevelRange: [1, 12],   weights: { common: 66, uncommon: 24, rare: 7, epic: 2.5, legendary: 0.4, mythic: 0.06, set: 0.02, shiny: 0.02 } },
  scorched_desert: { levelRange: [10, 25],  itemLevelRange: [11, 28],  weights: { common: 61, uncommon: 26, rare: 9, epic: 3.5, legendary: 0.4, mythic: 0.06, set: 0.02, shiny: 0.02 } },
  frozen_peaks:    { levelRange: [25, 45],  itemLevelRange: [27, 48],  weights: { common: 56, uncommon: 28, rare: 12, epic: 3.5, legendary: 0.4, mythic: 0.07, set: 0.02, shiny: 0.01 } },
  shadow_realm:    { levelRange: [45, 70],  itemLevelRange: [47, 75],  weights: { common: 52, uncommon: 29, rare: 14, epic: 4.5, legendary: 0.4, mythic: 0.08, set: 0.02, shiny: 0.02 } },
  celestial_spire: { levelRange: [70, 100], itemLevelRange: [72, 105], weights: { common: 48, uncommon: 30, rare: 17, epic: 4.5, legendary: 0.4, mythic: 0.08, set: 0.01, shiny: 0.01 } },
};

const BOSS_WEIGHT_BONUS: Record<string, number> = { common: -25, uncommon: -12, rare: 15, epic: 15, legendary: 10, mythic: 5, set: 5, shiny: 1 };

const CLASS_WEAPON_SUBTYPES: Record<string, string[]> = {
  warrior: ["sword", "axe", "mace"],
  mage: ["staff", "wand"],
  ranger: ["bow", "crossbow"],
  rogue: ["dagger", "blade"],
};

const CLASS_ARMOR_WEIGHT: Record<string, string> = {
  warrior: "heavy", mage: "light", ranger: "medium", rogue: "light",
};

const CLASS_HELMET_WEIGHT: Record<string, string> = {
  warrior: "plate_helm", ranger: "leather_helm", mage: "cloth_helm", rogue: "cloth_helm",
};

function getZoneForLevel(level: number): string {
  for (const [key, zone] of Object.entries(ZONE_LOOT)) {
    if (level >= zone.levelRange[0] && level <= zone.levelRange[1]) return key;
  }
  return "verdant_forest";
}

function weightedRarityRoll(weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([_, w]) => w > 0);
  const total = entries.reduce((s, [_, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[0]?.[0] || "common";
}

const ITEM_NAMES: Record<string, any> = {
  verdant_forest: {
    weapon: {
      sword: ["Rusty Shortsword","Iron Sword","Elven Blade","Verdant Edge","Thornblade","Forest Sentinel"],
      axe: ["Stone Hatchet","Iron Axe","Woodcutter's Axe","Forest Cleaver","Thornwood Axe"],
      mace: ["Wooden Club","Iron Mace","Mossy Flail","Grove Hammer"],
      staff: ["Gnarled Branch","Mystic Staff","Arcane Rod","Nature Staff","Druid's Focus"],
      wand: ["Twig Wand","Vine Wand","Bark Wand","Petal Wand","Leaf Focus"],
      bow: ["Worn Shortbow","Hunter's Bow","Elven Longbow","Thornbow","Greenwood Recurve"],
      crossbow: ["Makeshift Crossbow","Ranger Crossbow","Thornshot Crossbow"],
      dagger: ["Rusty Dagger","Bone Knife","Serpent Fang","Forest Shiv","Thornprick"],
      blade: ["Jagged Blade","Broken Shortsword","Leaf Blade","Split Fang"],
    },
    armor: {
      heavy: ["Iron Chestplate","Forest Platemail","Guardsman's Plate","Thornskin Mail"],
      medium: ["Reinforced Cloak","Forestweave Tunic","Scout's Jerkin","Hunter's Vest"],
      light: ["Torn Cloak","Druidic Bark Armor","Mossy Robe","Nature's Vestment"],
    },
    helmet: {
      plate_helm: ["Iron Helmet","War Helm","Bark Helm","Thornwood Cap"],
      leather_helm: ["Ranger's Hood","Antler Crown","Forest Cowl","Scout's Cap"],
      cloth_helm: ["Frayed Helmet","Leaf Circlet","Vine Wreath","Dryad's Diadem"],
    },
    gloves: ["Tattered Gloves","Leather Gauntlets","Iron Grips","Mossy Handwraps"],
    boots: ["Old Boots","Leather Boots","Swift Boots","Thornstep Boots","Forest Treads"],
    ring: ["Cracked Ring","Silver Ring","Emerald Ring","Ring of Growth","Vine Ring"],
    amulet: ["Hemp Amulet","Jade Amulet","Forest Spirit Amulet","Nature's Amulet"],
  },
  scorched_desert: {
    weapon: {
      sword: ["Scimitar","Flame Sword","Dragon Fang","Sunfire Scimitar","Sunblade of Ra"],
      axe: ["Bone Axe","Sand Cleaver","Dune Splitter","Sunfire Hatchet"],
      mace: ["Bone Club","Desert Flail","Sandstone Hammer","Sunscorch Mace"],
      staff: ["Scorpion Staff","Sun Staff","Staff of the Oasis","Sandfire Scepter"],
      wand: ["Desert Wand","Sun Wand","Amber Wand","Heatwave Focus"],
      bow: ["Desert Longbow","Sandstorm Bow","Hunter's Recurve","Scorpion Bow"],
      crossbow: ["Sand Crossbow","Bandit Crossbow","Scorpion Repeater"],
      dagger: ["Curved Knife","Sand Fang","Scorpion Stinger","Viper Blade"],
      blade: ["Bandit's Blade","Desert Kris","Heat Blade","Sandstorm Cutter"],
    },
    armor: {
      heavy: ["Sunscale Platemail","Sandstorm Platemail","Pharaoh's Plate"],
      medium: ["Bandit's Chainmail","Dune Guard Vest","Sandweave Coat"],
      light: ["Sand Wrap Armor","Heatweave Robe","Desert Wraps","Pharaoh's Linen"],
    },
    helmet: {
      plate_helm: ["Dune Helm","Pharaoh's Crown","Warlord's Helm","Scarab Visage"],
      leather_helm: ["Desert Wrap","Oasis Hood","Scorpion Crown","Heat Cap"],
      cloth_helm: ["Tomb Mask","Desert Cowl","Heatwave Veil","Mirage Hood"],
    },
    gloves: ["Sand Gauntlets","Scorpion Grips","Warlord's Gloves","Dune Handwraps"],
    boots: ["Traveler's Boots","Sand Dancer Boots","Dunerunner Boots","Miragewalker Boots"],
    ring: ["Copper Ring","Amber Ring","Topaz Ring","Ring of the Sun"],
    amulet: ["Desert Fox Amulet","Scarab Amulet","Phoenix Amulet","Eye of Ra"],
  },
  frozen_peaks: {
    weapon: {
      sword: ["Frostfire Greatsword","Icefang Blade","Glacial Sword","Permafrost Edge"],
      axe: ["Glacial Axe","Frostbite Axe","Ice Splitter","Yeti's Cleaver"],
      mace: ["Frost Hammer","Ice Club","Glacial Mace","Blizzard Mallet"],
      staff: ["Crystal Staff","Arcane Scepter","Blizzard Staff","Permafrost Conduit"],
      wand: ["Ice Wand","Crystal Wand","Blizzard Focus","Frost Focus"],
      bow: ["Frost Bow","Ice Longbow","Snowstorm Bow","Glacial Recurve"],
      crossbow: ["Glacial Crossbow","Ice Hunter","Blizzard Repeater"],
      dagger: ["Ice Shard Dagger","Frost Shiv","Icicle Blade","Blizzard Dagger"],
      blade: ["Frozen Kris","Blizzard Blade","Frostbite Knife"],
    },
    armor: {
      heavy: ["Permafrost Armor","Glacier Plate","Iceguard Plate"],
      medium: ["Bear Hide Armor","Frostweave Coat","Snowhunter's Vest"],
      light: ["Padded Coat","Frostweave Robe","Blizzard Robes"],
    },
    helmet: {
      plate_helm: ["Yeti Skull Helm","Dragon Ice Helm","Frostforged Helm"],
      leather_helm: ["Snowpeak Hood","Blizzard Crown","Blizzard Cowl"],
      cloth_helm: ["Wool Cap","Icecrystal Crown","Cryomancer's Crown"],
    },
    gloves: ["Fur Mitts","Ice Gauntlets","Frost Grips","Yeti Handwraps"],
    boots: ["Fur Boots","Snowtreader Boots","Icestep Greaves","Frostwalker Boots"],
    ring: ["Tin Circlet","Sapphire Ring","Frost Ring","Diamond Ring"],
    amulet: ["Frozen Amulet","Blizzard Amulet","Avalanche Amulet","Permafrost Amulet"],
  },
  shadow_realm: {
    weapon: {
      sword: ["Nightmare Blade","Void Blade","Shadowmourne","Dreadedge","Shadow Edge"],
      axe: ["Void Cleaver","Dread Axe","Soul Splitter","Nightmare Hatchet"],
      mace: ["Nightmare Flail","Doom Mace","Wraith Hammer","Soul Crusher"],
      staff: ["Void Wand","Hex Scepter","Oblivion Staff","Void Reaper"],
      wand: ["Shadow Wand","Void Focus","Curse Wand","Nightmare Rod"],
      bow: ["Shadow Bow","Void Longbow","Nightmare Recurve","Cursed Hunter"],
      crossbow: ["Dread Crossbow","Shadow Hunter","Void Repeater"],
      dagger: ["Cracked Obsidian Dagger","Shadow Blade","Soul Reaper","Void Shiv"],
      blade: ["Cursed Blade","Shadowstep Kris","Rift Knife","Void Kris"],
    },
    armor: {
      heavy: ["Soulshred Armor","Armor of the Void","Dreadweave Plate"],
      medium: ["Darkweave Armor","Voidweave Vest","Shadow Scout Coat"],
      light: ["Tattered Shadow Robe","Darkweave Robe","Shadowstitch Coat"],
    },
    helmet: {
      plate_helm: ["Horned Shadow Helm","Deathmask","Soulfire Helm"],
      leather_helm: ["Shroud Helm","Void Hood","Cursed Cowl"],
      cloth_helm: ["Lich Crown","Wraith Crown","Soul Crown"],
    },
    gloves: ["Shadow Grips","Void Gauntlets","Lich Handwraps","Dread Gloves"],
    boots: ["Shadowwalker Sandals","Phantom Boots","Duskstrider Boots"],
    ring: ["Dim Ring","Obsidian Ring","Shadow Ring","Ring of Void"],
    amulet: ["Soul Charm","Rift Amulet","Amulet of Despair"],
  },
  celestial_spire: {
    weapon: {
      sword: ["Starforged Sword","Nova Sword","Godslayer","Cosmic Blade","Solarburst Edge"],
      axe: ["Starfire Axe","Celestial Cleaver","Nova Splitter","Divine Hatchet"],
      mace: ["Divine Hammer","Cosmic Mace","Star Flail","Nova Basher"],
      staff: ["Pulsar Staff","Celestial Scepter","Genesis Staff","Astral Focus"],
      wand: ["Star Wand","Nova Wand","Cosmic Focus","Divine Rod"],
      bow: ["Celestial Longbow","Starborn Bow","Nova Recurve","Cosmic Hunter"],
      crossbow: ["Astral Crossbow","Star Hunter","Celestial Repeater"],
      dagger: ["Starlight Dagger","Nova Fang","Astral Shiv","Celestial Stiletto"],
      blade: ["Cosmic Kris","Starblade","Nebula Knife","Celestial Cutter"],
    },
    armor: {
      heavy: ["Divine Plate","Celestial Godplate","Starfire Plate"],
      medium: ["Stardust Armor","Astral Guard Coat","Nova Scout Vest"],
      light: ["Pale Celestial Wrap","Astral Robe","Nebula Vestments"],
    },
    helmet: {
      plate_helm: ["Titan Helm","Halo of Divinity","Celestial Visor"],
      leather_helm: ["Halo Helm","Nebula Helm","Empyrean Cowl"],
      cloth_helm: ["Starlight Crown","Divinity Crown","Quasar Crown"],
    },
    gloves: ["Celestial Grips","Nova Gauntlets","Divine Handwraps"],
    boots: ["Skywalker Boots","Aurora Boots","Voidwalker Boots","Starwalker Boots"],
    ring: ["Nebula Ring","Quasar Ring","Ring of Stars","Ring of the Cosmos"],
    amulet: ["Comet Amulet","Zodiac Amulet","Supernova Amulet","Amulet of Creation"],
  },
};

const ZONE_SET_DROPS: Record<string, Array<{ name: string; slot: string; class: string | null; setKey: string }>> = {
  verdant_forest: [
    { name: "Wildwood Helm", slot: "helmet", class: null, setKey: "wildwood" },
    { name: "Wildwood Chestguard", slot: "armor", class: null, setKey: "wildwood" },
    { name: "Wildwood Gloves", slot: "gloves", class: null, setKey: "wildwood" },
    { name: "Wildwood Treads", slot: "boots", class: null, setKey: "wildwood" },
    { name: "Wildwood Amulet", slot: "amulet", class: null, setKey: "wildwood" },
    { name: "Thornblade Sword", slot: "weapon", class: "warrior", setKey: "thornblade" },
    { name: "Thornblade Helm", slot: "helmet", class: "warrior", setKey: "thornblade" },
    { name: "Thornblade Chestplate", slot: "armor", class: "warrior", setKey: "thornblade" },
    { name: "Leafwhisper Bow", slot: "weapon", class: "ranger", setKey: "leafwhisper" },
    { name: "Leafwhisper Hood", slot: "helmet", class: "ranger", setKey: "leafwhisper" },
    { name: "Leafwhisper Vest", slot: "armor", class: "ranger", setKey: "leafwhisper" },
  ],
  scorched_desert: [
    { name: "Flamewarden Blade", slot: "weapon", class: "warrior", setKey: "flamewarden" },
    { name: "Flamewarden Helm", slot: "helmet", class: "warrior", setKey: "flamewarden" },
    { name: "Flamewarden Plate", slot: "armor", class: "warrior", setKey: "flamewarden" },
    { name: "Sun Staff", slot: "weapon", class: "mage", setKey: "desertmystic" },
    { name: "Desert Mystic Hood", slot: "helmet", class: "mage", setKey: "desertmystic" },
    { name: "Sandviper Blade", slot: "weapon", class: "rogue", setKey: "sandviper" },
    { name: "Sandviper Hood", slot: "helmet", class: "rogue", setKey: "sandviper" },
  ],
  frozen_peaks: [
    { name: "Glacial Veil Helm", slot: "helmet", class: null, setKey: "glacialveil" },
    { name: "Glacial Veil Chest", slot: "armor", class: null, setKey: "glacialveil" },
    { name: "Glacial Veil Ring", slot: "ring", class: null, setKey: "glacialveil" },
    { name: "Froststrike Axe", slot: "weapon", class: "warrior", setKey: "froststrike" },
    { name: "Arctic Spell Staff", slot: "weapon", class: "mage", setKey: "arcticspell" },
    { name: "Arctic Spell Crown", slot: "helmet", class: "mage", setKey: "arcticspell" },
  ],
  shadow_realm: [
    { name: "Void Reaper Blade", slot: "weapon", class: "rogue", setKey: "voidreaper" },
    { name: "Void Reaper Hood", slot: "helmet", class: "rogue", setKey: "voidreaper" },
    { name: "Shadowlord Greatblade", slot: "weapon", class: "warrior", setKey: "shadowlord" },
    { name: "Shadowlord Helm", slot: "helmet", class: "warrior", setKey: "shadowlord" },
    { name: "Void Weaver Staff", slot: "weapon", class: "mage", setKey: "voidweaver" },
    { name: "Void Weaver Crown", slot: "helmet", class: "mage", setKey: "voidweaver" },
  ],
  celestial_spire: [
    { name: "Cosmic Guardian Crown", slot: "helmet", class: null, setKey: "cosmicguardian" },
    { name: "Cosmic Guardian Plate", slot: "armor", class: null, setKey: "cosmicguardian" },
    { name: "Cosmic Guardian Amulet", slot: "amulet", class: null, setKey: "cosmicguardian" },
    { name: "Starblade", slot: "weapon", class: "warrior", setKey: "starbornslayer" },
    { name: "Genesis Staff", slot: "weapon", class: "mage", setKey: "celestialarchmage" },
    { name: "Nova Recurve", slot: "weapon", class: "ranger", setKey: "novastriker" },
    { name: "Cosmic Kris", slot: "weapon", class: "rogue", setKey: "voidassassin" },
  ],
};

const ZONE_ITEM_LEVEL: Record<string, { base: number; range: number }> = {
  verdant_forest: { base: 8, range: 8 },
  scorched_desert: { base: 22, range: 10 },
  frozen_peaks: { base: 38, range: 12 },
  shadow_realm: { base: 58, range: 14 },
  celestial_spire: { base: 80, range: 18 },
};

const SET_STAT_THEMES: Record<string, Record<string, number>> = {
  wildwood: { hp_bonus: 3, defense: 2, vitality: 2, strength: 1 },
  glacialveil: { defense: 3, vitality: 3, hp_bonus: 2, strength: 1 },
  cosmicguardian: { hp_bonus: 4, mp_bonus: 4, defense: 3, vitality: 3, strength: 2, dexterity: 2, intelligence: 2 },
  thornblade: { strength: 3, damage: 3, defense: 2, crit_chance: 1 },
  flamewarden: { strength: 4, damage: 3, defense: 3, hp_bonus: 2 },
  froststrike: { strength: 5, damage: 4, defense: 4, hp_bonus: 3 },
  shadowlord: { strength: 6, damage: 5, defense: 5, hp_bonus: 4 },
  starbornslayer: { strength: 8, damage: 7, defense: 6, crit_chance: 3 },
  desertmystic: { intelligence: 4, mp_bonus: 3, damage: 3, luck: 1 },
  arcticspell: { intelligence: 5, mp_bonus: 4, damage: 4, luck: 2 },
  voidweaver: { intelligence: 6, mp_bonus: 5, damage: 5, luck: 3 },
  celestialarchmage: { intelligence: 8, mp_bonus: 7, damage: 6, luck: 4 },
  leafwhisper: { dexterity: 3, luck: 2, crit_chance: 2, damage: 1 },
  novastriker: { dexterity: 8, luck: 5, crit_chance: 4, damage: 5 },
  sandviper: { dexterity: 4, luck: 3, crit_chance: 3, lifesteal: 1 },
  voidreaper: { dexterity: 6, luck: 4, crit_chance: 4, lifesteal: 2 },
  voidassassin: { dexterity: 8, luck: 6, crit_chance: 5, lifesteal: 3, damage: 4 },
};

function generateSetItemStats(setKey: string, slot: string, zone: string) {
  const theme = SET_STAT_THEMES[setKey] || { strength: 2, defense: 2 };
  const lvlConfig = ZONE_ITEM_LEVEL[zone] || { base: 10, range: 5 };
  const itemLevel = lvlConfig.base + Math.floor(Math.random() * lvlConfig.range);
  const scale = 1 + (itemLevel - 1) * 0.10;
  const stats: Record<string, number> = {};
  for (const [stat, weight] of Object.entries(theme)) {
    const base = weight * scale;
    stats[stat] = Math.max(1, Math.round(base * (0.85 + Math.random() * 0.3)));
  }
  if (slot === "weapon" && !stats.damage) stats.damage = Math.round(5 * scale);
  const levelBase = ZONE_ITEM_LEVEL[zone]?.base || 5;
  return { stats, itemLevel, levelReq: Math.max(1, levelBase - 3) };
}

export function generateLoot(
  enemyLevel: number,
  luck: number,
  isBoss: boolean = false,
  regionKey: string | null = null,
  characterClass: string | null = null
): any {
  const zoneKey = regionKey || getZoneForLevel(enemyLevel);
  const zone = ZONE_LOOT[zoneKey];
  if (!zone) return null;

  const dropChance = isBoss ? 0.35 : Math.min(0.10, 0.03 + luck * 0.0005);
  if (Math.random() > dropChance) return null;

  let weights = { ...zone.weights };
  if (isBoss) {
    for (const [r, delta] of Object.entries(BOSS_WEIGHT_BONUS)) {
      weights[r] = Math.max(0, (weights[r] || 0) + delta);
    }
  }
  if (luck > 5) {
    const bonus = (luck - 5) * 0.1;
    weights.rare = (weights.rare || 0) + bonus;
    weights.epic = (weights.epic || 0) + bonus * 0.5;
  }

  const rarity = weightedRarityRoll(weights);

  const [iLvlMin, iLvlMax] = zone.itemLevelRange;
  const itemLevel = isBoss
    ? Math.floor(iLvlMax * 0.85 + Math.random() * iLvlMax * 0.15)
    : Math.floor(iLvlMin + Math.random() * (iLvlMax - iLvlMin));
  const levelReq = Math.max(1, itemLevel - 2);

  const zoneNames = ITEM_NAMES[zoneKey] || ITEM_NAMES.verdant_forest;
  const allTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

  if (rarity === "set") {
    const zoneSetList = ZONE_SET_DROPS[zoneKey] || [];
    const eligible = zoneSetList.filter(p => !p.class || !characterClass || p.class === characterClass);
    if (eligible.length > 0) {
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      const { stats: setStats, itemLevel: sItemLevel, levelReq: sLevelReq } = generateSetItemStats(pick.setKey, pick.slot, zoneKey);
      const sellPrice = Math.floor((RARITY_SELL_PRICES.legendary || 600) * (1 + sItemLevel * 0.15));
      return {
        name: pick.name,
        rarity: "set",
        type: pick.slot,
        subtype: pick.slot === "weapon"
          ? (characterClass === "warrior" ? "sword" : characterClass === "mage" ? "staff" : characterClass === "ranger" ? "bow" : "dagger")
          : undefined,
        item_level: sItemLevel,
        level_req: sLevelReq,
        stats: setStats,
        sell_price: sellPrice,
        set_name: pick.setKey,
        set_key: pick.setKey,
        class_restriction: pick.class ? [pick.class] : undefined,
      };
    }
  }

  const useSmartLoot = characterClass && Math.random() < 0.65;
  let type: string, subtype: string | null = null, name: string;

  if (useSmartLoot && Math.random() < 0.4) {
    type = "weapon";
    const subtypes = CLASS_WEAPON_SUBTYPES[characterClass!] || ["sword"];
    subtype = subtypes[Math.floor(Math.random() * subtypes.length)];
    const namePool = zoneNames.weapon?.[subtype] || ["Unknown Weapon"];
    name = namePool[Math.floor(Math.random() * namePool.length)];
  } else if (useSmartLoot && Math.random() < 0.35) {
    type = "armor";
    subtype = CLASS_ARMOR_WEIGHT[characterClass!] || "light";
    const namePool = zoneNames.armor?.[subtype] || zoneNames.armor?.light || ["Unknown Armor"];
    name = namePool[Math.floor(Math.random() * namePool.length)];
  } else {
    type = allTypes[Math.floor(Math.random() * allTypes.length)];
    if (type === "weapon") {
      const subtypes = characterClass ? (CLASS_WEAPON_SUBTYPES[characterClass] || ["sword"]) : ["sword", "axe", "staff", "wand", "bow", "dagger"];
      subtype = subtypes[Math.floor(Math.random() * subtypes.length)];
      const namePool = zoneNames.weapon?.[subtype] || ["Unknown Weapon"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else if (type === "armor") {
      const weight = characterClass ? (CLASS_ARMOR_WEIGHT[characterClass] || "light") : "light";
      subtype = weight;
      const namePool = zoneNames.armor?.[weight] || ["Unknown Armor"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else if (type === "helmet") {
      const helmWeight = characterClass ? (CLASS_HELMET_WEIGHT[characterClass] || "cloth_helm") : "cloth_helm";
      subtype = helmWeight;
      const helmNames = zoneNames.helmet;
      const namePool = (helmNames && typeof helmNames === "object" && !Array.isArray(helmNames))
        ? (helmNames[helmWeight] || helmNames.cloth_helm || ["Unknown Helmet"])
        : (Array.isArray(helmNames) ? helmNames : ["Unknown Helmet"]);
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else {
      subtype = null;
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Item"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    }
  }

  const stats = generateItemStats(type, rarity, itemLevel);
  const sellPrice = Math.floor((RARITY_SELL_PRICES[rarity] || 10) * (1 + itemLevel * 0.08));

  return {
    name,
    rarity,
    type,
    subtype: subtype || undefined,
    item_level: itemLevel,
    level_req: levelReq,
    stats,
    sell_price: sellPrice,
  };
}
