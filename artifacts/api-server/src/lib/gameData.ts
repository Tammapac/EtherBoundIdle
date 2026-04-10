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
  weapon:  ["damage", "strength", "dexterity", "intelligence", "crit_chance", "crit_dmg_pct", "attack_speed", "mp_regen", "lifesteal"],
  armor:   ["defense", "vitality", "hp_bonus", "strength", "hp_regen", "block_chance", "evasion"],
  helmet:  ["defense", "intelligence", "vitality", "mp_bonus", "mp_regen", "hp_regen"],
  gloves:  ["strength", "dexterity", "crit_chance", "crit_dmg_pct", "attack_speed", "defense"],
  boots:   ["dexterity", "defense", "luck", "evasion", "attack_speed"],
  ring:    ["luck", "strength", "dexterity", "intelligence", "crit_chance", "crit_dmg_pct", "gold_gain_pct", "exp_gain_pct", "lifesteal"],
  amulet:  ["vitality", "hp_bonus", "mp_bonus", "luck", "intelligence", "hp_regen", "mp_regen", "block_chance"],
  consumable: ["hp_bonus", "mp_bonus"],
  material: [],
};

const ZONE_ELEMENTAL_POOL: Record<string, string[]> = {
  verdant_forest: ["poison_dmg"],
  scorched_desert: ["fire_dmg", "sand_dmg"],
  frozen_peaks: ["ice_dmg"],
  shadow_realm: ["blood_dmg", "poison_dmg"],
  celestial_spire: ["lightning_dmg", "fire_dmg", "ice_dmg"],
};

const PCT_STATS = new Set([
  "crit_chance", "crit_dmg_pct", "evasion", "block_chance",
  "lifesteal", "gold_gain_pct", "exp_gain_pct", "attack_speed"
]);

function generateItemStats(type: string, rarity: string, itemLevel: number, zone?: string): Record<string, number> {
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

  // Weapons ALWAYS get damage as their primary stat first
  if (type === "weapon") {
    const dmgBase = cfg.basePerSlot * mult * lvlScale;
    stats["damage"] = Math.max(1, Math.round(dmgBase * (0.85 + Math.random() * 0.3)));
  }

  // Shuffle remaining pool (exclude damage for weapons since already assigned)
  const remainingPool = type === "weapon" ? pool.filter(s => s !== "damage") : [...pool];
  const shuffled = remainingPool.sort(() => Math.random() - 0.5);
  const slotsLeft = type === "weapon" ? cfg.slots - 1 : cfg.slots;
  for (let i = 0; i < slotsLeft && i < shuffled.length; i++) {
    const stat = shuffled[i];
    const lifestealsReduction = stat === "lifesteal" ? 0.2 : 1.0;
    const pctReduction = PCT_STATS.has(stat) ? 0.35 : 1.0;
    const base = cfg.basePerSlot * mult * lvlScale * lifestealsReduction * pctReduction;
    const value = Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)));
    stats[stat] = (stats[stat] || 0) + value;
  }

  // Epic+ weapons/rings/amulets have a 40% chance to add one elemental stat from the zone's pool
  const epicRarities = new Set(["epic", "legendary", "mythic", "shiny"]);
  const elementalEligibleTypes = new Set(["weapon", "ring", "amulet"]);
  if (epicRarities.has(rarity) && elementalEligibleTypes.has(type) && zone) {
    const elemPool = ZONE_ELEMENTAL_POOL[zone];
    if (elemPool && elemPool.length > 0 && Math.random() < 0.40) {
      const elemStat = elemPool[Math.floor(Math.random() * elemPool.length)];
      const elemScale = 0.03 + (itemLevel / 100) * 0.12; // 3-15% range scaled by item level
      const elemValue = Math.max(3, Math.round(elemScale * 100 * (0.8 + Math.random() * 0.4)));
      stats[elemStat] = (stats[elemStat] || 0) + elemValue;
    }
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
  warrior: "heavy", mage: "light", ranger: "medium", rogue: "leather",
};

const CLASS_HELMET_WEIGHT: Record<string, string> = {
  warrior: "plate_helm", ranger: "leather_helm", mage: "cloth_helm", rogue: "hood",
};

const CLASS_GLOVES_WEIGHT: Record<string, string> = {
  warrior: "plate_gloves", mage: "cloth_gloves", ranger: "leather_gloves", rogue: "shadow_gloves",
};

const CLASS_BOOTS_WEIGHT: Record<string, string> = {
  warrior: "plate_boots", mage: "cloth_boots", ranger: "leather_boots", rogue: "shadow_boots",
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
      sword: [
        "Mosscutter","Greenleaf Rapier","Briarfang","Thornstrike","Wildwood Falchion",
        "Ivyvein Saber","Fernblade","Oakguard Broadsword","Rootsplitter","Willowsting",
        "Ancient Elm Blade","Dryad's Claymore","Verdant Edge","Forest Sentinel","Thorn Duelist",
      ],
      axe: [
        "Stone Hatchet","Woodcutter's Axe","Bramblesplit Axe","Forest Cleaver","Thornwood Axe",
        "Grovekeeper's Hatchet","Barkbiter","Roottorn Axe","Canopy Cleaver","Wild Elm Axe",
        "Dryad's Felling Axe","Gnarlfang Axe",
      ],
      mace: [
        "Mossy Flail","Grove Hammer","Treant's Fist","Ironbark Club","Briarknot Mace",
        "Rootcrown Maul","Thornwood Hammer","Fungal Mace","Earthgrip Mace","Ancient Bark Maul",
        "Dryad's Gavel",
      ],
      staff: [
        "Gnarled Branch","Druid's Focus","Nature Staff","Arcane Sapling","Living Vine Staff",
        "Elder Bough Scepter","Heartwood Rod","Mossgrown Staff","Thornweave Conduit","Dryad's Wand",
        "Owlfeather Staff","Bloomcrest Stave","Rootsong Focus",
      ],
      wand: [
        "Twig Wand","Vine Wand","Bark Wand","Petal Wand","Leaf Focus",
        "Spore Wand","Seedling Focus","Fernspray Wand","Budding Wand","Briarvine Focus",
        "Dew-kissed Wand","Sproutling Rod",
      ],
      bow: [
        "Worn Shortbow","Hunter's Bow","Elven Longbow","Thornbow","Greenwood Recurve",
        "Snapvine Bow","Canopy Hunter","Briar Longbow","Fernstring Bow","Mossgrown Recurve",
        "Ancient Oak Bow","Dryad's Shortbow","Owlsong Longbow",
      ],
      crossbow: [
        "Makeshift Crossbow","Ranger Crossbow","Thornshot Crossbow","Mossvine Repeater",
        "Bark Crossbow","Fernwood Bolt-thrower","Briarshot Crossbow","Greenwood Repeater",
        "Forest Warden's Crossbow","Canopy Crossbow",
      ],
      dagger: [
        "Bone Knife","Serpent Fang","Forest Shiv","Thornprick","Briarshard Dagger",
        "Mossbite Stiletto","Fernfang Knife","Splinterbark Dagger","Root-carved Shiv","Dewclaw Dagger",
        "Dryad's Fang","Sporebloom Dagger","Ivy Piercer",
      ],
      blade: [
        "Leaf Blade","Split Fang","Thornkris","Briarweave Blade","Fernedge Kris",
        "Barkstrip Cutter","Mossveil Blade","Rootbind Kris","Canopy Slasher","Dewvine Blade",
        "Overgrown Kris",
      ],
    },
    armor: {
      heavy: [
        "Iron Chestplate","Forest Platemail","Guardsman's Plate","Thornskin Mail",
        "Barksteel Breastplate","Ironoak Warplate","Treant's Carapace","Grove Sentinel's Plate",
      ],
      medium: [
        "Reinforced Cloak","Forestweave Tunic","Scout's Jerkin","Hunter's Vest",
        "Briarweave Coat","Thornbark Vest","Mosshide Tunic","Canopy Ranger's Coat",
      ],
      light: [
        "Torn Cloak","Druidic Bark Armor","Mossy Robe","Nature's Vestment",
        "Leafweave Robes","Fernspun Wrap","Vinethread Coat","Dryad's Shroud",
      ],
      leather: [
        "Shadow Jerkin","Nightleaf Vest","Thief's Tunic","Whisper Leather",
        "Briarshadow Coat","Mosswalk Vest","Stalker's Jerkin","Fern Shadowvest",
      ],
    },
    helmet: {
      plate_helm: [
        "Iron Helmet","War Helm","Bark Helm","Thornwood Cap",
        "Ironbark Greathelm","Grove Warden's Visor","Briarforged Helm","Oakleaf War Mask",
      ],
      leather_helm: [
        "Ranger's Hood","Antler Crown","Forest Cowl","Scout's Cap",
        "Thornleaf Hood","Mosswarden Cowl","Ferntracker's Cap","Canopy Hood",
      ],
      cloth_helm: [
        "Frayed Helmet","Leaf Circlet","Vine Wreath","Dryad's Diadem",
        "Bloomcrown","Fernweave Cowl","Spore-dusted Hood","Briarvine Circlet",
      ],
      hood: [
        "Tattered Hood","Shadow Cowl","Thief's Mask","Nightshade Hood",
        "Briarshadow Cowl","Mossveil Mask","Stalker's Hood","Fern Shadow Mask",
      ],
    },
    gloves: [
      "Tattered Gloves","Leather Gauntlets","Iron Grips","Mossy Handwraps",
      "Thornweave Gloves","Briar Grips","Forestwarden's Gauntlets","Fernbind Wraps",
      "Bark-strip Handguards","Vinethread Gloves","Druid's Grips","Oakmoss Grips",
    ],
    boots: [
      "Old Boots","Leather Boots","Swift Boots","Thornstep Boots","Forest Treads",
      "Mosscrawler Boots","Briarpatch Sandals","Fernstride Greaves","Rootrunner Boots",
      "Canopy Treads","Dryad's Slippers","Vinebound Boots",
    ],
    ring: [
      "Cracked Ring","Silver Ring","Emerald Ring","Ring of Growth","Vine Ring",
      "Band of the Grove","Oakmoss Ring","Thornroot Band","Ferncoil Ring","Blossom Band",
      "Druid's Circlet","Ring of the Ancient Oak",
    ],
    amulet: [
      "Hemp Amulet","Jade Amulet","Forest Spirit Amulet","Nature's Amulet",
      "Pendant of Thorns","Heartwood Amulet","Dryad's Charm","Mosstone Pendant",
      "Briar Talisman","Canopy Locket","Fernweave Amulet",
    ],
  },
  scorched_desert: {
    weapon: {
      sword: [
        "Scimitar","Sunfire Scimitar","Sunblade of Ra","Pharaoh's Edge","Blazing Falchion",
        "Sandstorm Saber","Dune Reaper","Scorched Khopesh","Flame-kissed Scimitar","Pyrestone Sword",
        "Mirage Blade","Desert Viper's Fang","Ember Khopesh","Inferno Saber",
      ],
      axe: [
        "Bone Axe","Sand Cleaver","Dune Splitter","Sunfire Hatchet",
        "Scorpion's Cleave","Flamecrest Axe","Sandstone Hatchet","Ember Axe",
        "Tomb Raider's Axe","Pyrewarden's Cleaver","Desert Warlord's Axe","Scorched Tomahawk",
      ],
      mace: [
        "Bone Club","Desert Flail","Sandstone Hammer","Sunscorch Mace",
        "Pharaoh's Flail","Ember Maul","Dune Basher","Scorpion Tail Mace",
        "Blazing Hammer","Tomb Warden's Club","Sunbaked Maul",
      ],
      staff: [
        "Scorpion Staff","Staff of the Oasis","Sandfire Scepter","Pharaoh's Crook",
        "Solar Conduit","Ember Staff","Pyramid Focus","Sandstorm Scepter",
        "Obelisk Rod","Desert Oracle's Staff","Mirage Focus","Sunpriest Stave","Flamecaller's Staff",
      ],
      wand: [
        "Desert Wand","Amber Wand","Heatwave Focus","Sun Wand",
        "Scarab Focus","Sandglass Wand","Mirage Rod","Solarheat Wand",
        "Emberglass Wand","Tomb Inscribed Wand","Pyrestone Focus","Heatbloom Wand",
      ],
      bow: [
        "Desert Longbow","Sandstorm Bow","Scorpion Bow","Hunter's Recurve",
        "Pharaoh's Longbow","Ember Recurve","Dune Runner's Bow","Blazing Shortbow",
        "Sand Harpy Bow","Oasis Stalker's Bow","Pyrestring Recurve","Mirageshot Longbow",
        "Sunscorched Bow",
      ],
      crossbow: [
        "Sand Crossbow","Scorpion Repeater","Bandit Crossbow",
        "Ember Crossbow","Dune Striker","Tomb Warden's Repeater","Pharaoh's Arbalest",
        "Sandstrike Crossbow","Flame-bolt Repeater","Desert Brigand's Crossbow",
      ],
      dagger: [
        "Curved Knife","Sand Fang","Scorpion Stinger","Viper Blade",
        "Ember Stiletto","Dune Shiv","Tomb Raider's Knifepoint","Sandcrack Fang",
        "Scorching Dirk","Pharaoh's Needle","Mirage Slicer","Boneshank Dagger","Sandviper's Fang",
      ],
      blade: [
        "Desert Kris","Sandstorm Cutter","Bandit's Blade","Heat Blade",
        "Mirage Kris","Emberedge Saber","Dune Dancer's Blade","Scorch Kris",
        "Sand Bandit's Cutter","Flamestep Blade","Tomb Raider's Kris",
      ],
    },
    armor: {
      heavy: [
        "Sunscale Platemail","Sandstorm Platemail","Pharaoh's Plate",
        "Burnished Warlord's Plate","Embersteel Breastplate","Pyreguard Chestplate",
        "Dune Conqueror's Mail","Scarab-forged Platemail",
      ],
      medium: [
        "Bandit's Chainmail","Dune Guard Vest","Sandweave Coat",
        "Scorpion-hide Tunic","Desert Ranger's Vest","Ember-trimmed Coat",
        "Sandcrawler's Jacket","Mirage Duelist's Coat",
      ],
      light: [
        "Sand Wrap Armor","Heatweave Robe","Pharaoh's Linen","Desert Wraps",
        "Sunpriest's Vestment","Emberweave Robes","Sandstorm Shawl","Tomb Oracle's Wrap",
      ],
      leather: [
        "Sandthief's Jerkin","Dune Prowler's Vest","Tomb Raider's Leather","Scorpion-scale Vest",
        "Mirage Stalker's Coat","Ember Shadow Tunic","Desert Cutthroat's Jerkin","Sandviper Leather",
      ],
    },
    helmet: {
      plate_helm: [
        "Dune Helm","Pharaoh's Crown","Warlord's Helm","Scarab Visage",
        "Burnished War Visor","Sunfire Greathelm","Pyreguard's Faceplate","Sandstone War Mask",
      ],
      leather_helm: [
        "Oasis Hood","Scorpion Crown","Desert Wrap","Heat Cap",
        "Dune Runner's Cowl","Mirage Stalker's Hood","Sandstorm Cap","Scorched Leather Crown",
      ],
      cloth_helm: [
        "Tomb Mask","Desert Cowl","Heatwave Veil","Mirage Hood",
        "Sandpriest's Headwrap","Ember Oracle's Veil","Sun Seer's Diadem","Pharaoh's Veil",
      ],
      hood: [
        "Tomb Robber's Hood","Desert Shade Cowl","Sandthief's Mask","Scorpion Veil",
        "Dune Lurker's Hood","Mirage Phantom Cowl","Ember Assassin's Mask","Sand Wraith Hood",
      ],
    },
    gloves: [
      "Sand Gauntlets","Scorpion Grips","Warlord's Gloves","Dune Handwraps",
      "Ember Bracers","Pyreforged Gauntlets","Sandstone Grips","Mirage Duelist's Gloves",
      "Tomb Warden's Handguards","Sunscorched Wraps","Scarab-plate Gauntlets","Flamewarden's Grips",
    ],
    boots: [
      "Traveler's Boots","Sand Dancer Boots","Dunerunner Boots","Miragewalker Boots",
      "Scorpion's Stride","Ember Treads","Pharaoh's Sandals","Sandstorm Greaves",
      "Desert Fox Boots","Pyrewarden's Sabatons","Dune Strider's Sandals",
    ],
    ring: [
      "Copper Ring","Amber Ring","Topaz Ring","Ring of the Sun",
      "Scarab Band","Pharaoh's Signet","Band of Embers","Scorpion's Coil",
      "Sunstone Ring","Desert Mirage Band","Pyrestone Ring","Sandstone Circlet",
    ],
    amulet: [
      "Desert Fox Amulet","Scarab Amulet","Phoenix Amulet","Eye of Ra",
      "Pendant of the Oasis","Tomb Guardian's Locket","Sunfire Talisman","Amber Scarab Amulet",
      "Dune Prophet's Charm","Ember Phoenix Pendant","Sandstorm Amulet",
    ],
  },
  frozen_peaks: {
    weapon: {
      sword: [
        "Frostfire Greatsword","Icefang Blade","Glacial Sword","Permafrost Edge",
        "Avalanche Saber","Tundra Claymore","Shattersteel Greatsword","Blizzard Falchion",
        "Crystal Shard Blade","Frozen Rampart Sword","Yeti's Fang Blade","Snowpeak Saber",
        "Cryosteel Longsword",
      ],
      axe: [
        "Glacial Axe","Frostbite Axe","Ice Splitter","Yeti's Cleaver",
        "Avalanche Hatchet","Permafrost Cleaver","Blizzard Axe","Snowpeak Waraxe",
        "Tundra Raider's Axe","Crystaledge Hatchet","Cryoforged Axe","Froststrike Tomahawk",
      ],
      mace: [
        "Frost Hammer","Glacial Mace","Blizzard Mallet","Ice Club",
        "Avalanche Maul","Permafrost Crusher","Tundra Basher","Yeti Knuckle Mace",
        "Crystal Flail","Blizzard Hammer","Snowpeak Warhammer",
      ],
      staff: [
        "Crystal Staff","Blizzard Staff","Permafrost Conduit","Arcane Scepter",
        "Frostweave Stave","Glacial Tome Staff","Tundra Oracle's Scepter","Avalanche Focus",
        "Cryomancer's Rod","Snowdrift Conduit","Icebound Staff","Polar Vortex Stave","Frozen Pinnacle Staff",
      ],
      wand: [
        "Ice Wand","Crystal Wand","Blizzard Focus","Frost Focus",
        "Tundra Wand","Avalanche Rod","Snowflake Focus","Cryoglass Wand",
        "Permafrost Wand","Glacial Shard Wand","Polar Wand","Blizzard Spark Wand",
      ],
      bow: [
        "Frost Bow","Snowstorm Bow","Glacial Recurve","Ice Longbow",
        "Permafrost Hunter","Tundra Longbow","Avalanche Recurve","Yeti Bone Bow",
        "Crystalstring Bow","Blizzard Shortbow","Polar Bear Sinew Bow","Snowpeak Longbow","Cryoshard Recurve",
      ],
      crossbow: [
        "Glacial Crossbow","Blizzard Repeater","Ice Hunter",
        "Permafrost Arbalest","Tundra Crossbow","Crystal Bolt Repeater","Avalanche Repeater",
        "Snowblast Crossbow","Froststrike Arbalest","Polar Crossbow",
      ],
      dagger: [
        "Ice Shard Dagger","Frost Shiv","Icicle Blade","Blizzard Dagger",
        "Crystalpick Dagger","Tundra Shiv","Glacial Fang","Snowflake Stiletto",
        "Permafrost Piercer","Frostbite Knife","Avalanche Dirk","Cryoblade Shiv","Frozen Sliver",
      ],
      blade: [
        "Frozen Kris","Blizzard Blade","Frostbite Knife",
        "Tundra Cutter","Glacial Kris","Avalanche Slicer","Crystal Kris",
        "Permafrost Edge","Snowpeak Blade","Cryoedge Kris","Blizzard Slasher",
      ],
    },
    armor: {
      heavy: [
        "Permafrost Armor","Glacier Plate","Iceguard Plate",
        "Avalanche Warplate","Frostforged Breastplate","Tundra Sentinel's Mail","Glacial Titan Plate","Cryosteel Chestguard",
      ],
      medium: [
        "Bear Hide Armor","Frostweave Coat","Snowhunter's Vest",
        "Glacial Ranger's Jacket","Tundra Scout Coat","Permafrost Tunic","Blizzard Stalker's Vest","Yeti Hide Armor",
      ],
      light: [
        "Padded Coat","Frostweave Robe","Blizzard Robes",
        "Glacial Oracle's Wrap","Snowdrift Vestment","Tundra Mage's Robes","Cryomancer's Coat","Permafrost Shawl",
      ],
      leather: [
        "Frost Prowler's Jerkin","Tundra Thief's Vest","Icewalker Leather","Glacial Cutpurse Coat",
        "Snowshadow Jerkin","Permafrost Lurker's Vest","Blizzard Stalker Leather","Avalanche Shade Tunic",
      ],
    },
    helmet: {
      plate_helm: [
        "Yeti Skull Helm","Frostforged Helm","Dragon Ice Helm",
        "Glacial War Visor","Avalanche Greathelm","Permafrost Faceplate","Tundra Warlord's Helm","Cryosteel Visage",
      ],
      leather_helm: [
        "Snowpeak Hood","Blizzard Cowl","Blizzard Crown",
        "Tundra Ranger's Hood","Glacial Cowl","Permafrost Cap","Bearfur Hood","Crystal-laced Hood",
      ],
      cloth_helm: [
        "Wool Cap","Icecrystal Crown","Cryomancer's Crown",
        "Tundra Oracle's Circlet","Snowdrift Diadem","Glacial Mage's Cap","Avalanche Cowl","Blizzard Crown of Frost",
      ],
      hood: [
        "Frost Assassin's Hood","Tundra Shade Cowl","Icewalker's Mask","Glacial Phantom Hood",
        "Snowdrift Shadow Cowl","Permafrost Wraith Mask","Blizzard Lurker's Hood","Avalanche Thief's Cowl",
      ],
    },
    gloves: [
      "Fur Mitts","Ice Gauntlets","Frost Grips","Yeti Handwraps",
      "Glacial Gauntlets","Permafrost Bracers","Blizzard Grips","Tundra War Mitts",
      "Crystal-plated Gloves","Snowpeak Handguards","Cryoforged Gauntlets","Avalanche Grips",
    ],
    boots: [
      "Fur Boots","Snowtreader Boots","Icestep Greaves","Frostwalker Boots",
      "Glacial Sabatons","Permafrost Treads","Blizzard Striders","Tundra Ranger's Boots",
      "Crystalstep Greaves","Avalanche Treads","Cryostep Boots","Yeti-hide Boots",
    ],
    ring: [
      "Tin Circlet","Sapphire Ring","Frost Ring","Diamond Ring",
      "Glacial Band","Permafrost Circlet","Snowflake Ring","Tundra Signet",
      "Crystalice Band","Avalanche Ring","Cryoglass Ring","Blizzard Coil",
    ],
    amulet: [
      "Frozen Amulet","Blizzard Amulet","Avalanche Amulet","Permafrost Amulet",
      "Tundra Pendant","Glacial Crystal Locket","Snowdrift Charm","Yeti Bone Talisman",
      "Cryomancer's Amulet","Polar Heart Pendant","Icebound Locket",
    ],
  },
  shadow_realm: {
    weapon: {
      sword: [
        "Nightmare Blade","Void Blade","Shadowmourne","Dreadedge","Soulpiercer",
        "Wraith's Despair","Abyssal Greatsword","Riftcleave","Umbral Saber","Dread Reaper Sword",
        "Bloodmourne Blade","Cursed Phantom Edge","Voidforged Claymore","Necrotic Longsword",
      ],
      axe: [
        "Void Cleaver","Soul Splitter","Dread Axe","Nightmare Hatchet",
        "Abyssal Waraxe","Rift Cleaver","Umbral Hatchet","Wraith's Fury Axe",
        "Blood Toll Axe","Shadowforged Cleaver","Cursed Tomahawk","Soulshred Axe",
      ],
      mace: [
        "Nightmare Flail","Soul Crusher","Doom Mace","Wraith Hammer",
        "Abyss Maul","Rift Flail","Void Basher","Shadowcast Warhammer",
        "Necrotic Flail","Cursed Mace","Dread Maul","Oblivion Hammer",
      ],
      staff: [
        "Hex Scepter","Oblivion Staff","Void Reaper","Shadow Wand",
        "Dread Conduit","Lich's Stave","Abyssal Focus","Rift Scepter",
        "Necrotic Rod","Umbral Staff","Cursed Tome Staff","Soul Drain Stave","Nightmare Conduit",
      ],
      wand: [
        "Shadow Wand","Void Focus","Curse Wand","Nightmare Rod",
        "Abyssal Wand","Rift Focus","Wraith Wand","Dread Pulse Rod",
        "Necrotic Wand","Umbral Focus","Soul Spark Wand","Bleeding Wand",
      ],
      bow: [
        "Shadow Bow","Void Longbow","Nightmare Recurve","Cursed Hunter",
        "Abyssal Bow","Rift Longbow","Wraith Stalker's Bow","Dread Recurve",
        "Umbral Shortbow","Necrotic Longbow","Soul Weep Bow","Crimson Nightmare Bow","Rift Hunter's Recurve",
      ],
      crossbow: [
        "Dread Crossbow","Void Repeater","Shadow Hunter",
        "Abyssal Crossbow","Rift Repeater","Nightmare Arbalest","Wraith Bolt Repeater",
        "Cursed Crossbow","Umbral Arbalest","Necrotic Repeater",
      ],
      dagger: [
        "Shadow Blade","Soul Reaper","Void Shiv","Cracked Obsidian Dagger",
        "Abyssal Stiletto","Rift Fang","Wraith's Bite","Nightmare Dirk",
        "Blood Harvest Dagger","Umbral Piercer","Cursed Obsidian Shiv","Necrotic Fang","Soul Siphon Dagger",
      ],
      blade: [
        "Cursed Blade","Shadowstep Kris","Rift Knife","Void Kris",
        "Abyssal Slicer","Nightmare Kris","Wraith Cutter","Umbral Kris",
        "Blood Veil Blade","Necrotic Kris","Dread Slasher","Oblivion Kris",
      ],
    },
    armor: {
      heavy: [
        "Soulshred Armor","Armor of the Void","Dreadweave Plate",
        "Abyssal Warplate","Riftforged Breastplate","Necrotic Plate Mail","Umbral Warlord's Plate","Nightmare Battleplate",
      ],
      medium: [
        "Darkweave Armor","Voidweave Vest","Shadow Scout Coat",
        "Abyssal Duelist's Coat","Rift Stalker's Vest","Wraith-hide Tunic","Dread Scout Jacket","Umbral Ranger's Coat",
      ],
      light: [
        "Tattered Shadow Robe","Darkweave Robe","Shadowstitch Coat",
        "Void Oracle's Robes","Abyssal Vestment","Lich Robes","Cursed Shroud","Necrotic Wrap",
      ],
      leather: [
        "Shadowstep Jerkin","Void Stalker's Vest","Abyssal Cutthroat Leather","Wraith-touched Vest",
        "Dread Assassin's Coat","Umbral Prowler Tunic","Nightmare Thief's Jerkin","Rift Shadow Leather",
      ],
    },
    helmet: {
      plate_helm: [
        "Horned Shadow Helm","Deathmask","Soulfire Helm",
        "Void Warlord's Greathelm","Abyssal Visor","Rift-forged Faceplate","Nightmare Plate Helm","Necrotic War Mask",
      ],
      leather_helm: [
        "Shroud Helm","Void Hood","Cursed Cowl",
        "Abyssal Stalker's Hood","Rift Shadow Cowl","Wraith Hood","Dread Phantom's Cowl","Umbral Leather Helm",
      ],
      cloth_helm: [
        "Lich Crown","Wraith Crown","Soul Crown",
        "Void Oracle's Diadem","Abyssal Circlet","Nightmare Mage's Cowl","Necrotic Crown","Umbral Seer's Diadem",
      ],
      hood: [
        "Shadow Assassin's Hood","Void Phantom Cowl","Abyssal Shade Mask","Wraith Lurker's Hood",
        "Dread Shadow Cowl","Umbral Killer's Mask","Nightmare Veil","Rift Phantom's Hood",
      ],
    },
    gloves: [
      "Shadow Grips","Void Gauntlets","Lich Handwraps","Dread Gloves",
      "Abyssal Bracers","Rift Gauntlets","Wraith Grips","Necrotic Handguards",
      "Umbral War Gloves","Cursed Gauntlets","Nightmare Handwraps","Soulstitch Grips",
    ],
    boots: [
      "Shadowwalker Sandals","Phantom Boots","Duskstrider Boots",
      "Void Strider's Greaves","Abyssal Treads","Rift Walker's Boots","Wraith Step Greaves",
      "Necrotic Sabatons","Umbral Phantom Boots","Cursed Whisper Boots","Nightmare Treads","Dread Stalker's Sandals",
    ],
    ring: [
      "Dim Ring","Obsidian Ring","Shadow Ring","Ring of Void",
      "Abyssal Coil","Rift Band","Wraith's Signet","Necrotic Ring",
      "Umbral Circlet","Cursed Obsidian Band","Soul Drain Ring","Nightmare Ring",
    ],
    amulet: [
      "Soul Charm","Rift Amulet","Amulet of Despair",
      "Void Pendant","Abyssal Locket","Wraith's Talisman","Necrotic Amulet",
      "Umbral Charm","Cursed Soul Pendant","Nightmare Locket","Dread Talisman","Lich's Amulet",
    ],
  },
  celestial_spire: {
    weapon: {
      sword: [
        "Starforged Sword","Nova Sword","Solarburst Edge","Cosmic Blade","Eternity's Edge",
        "Astral Claymore","Empyrean Greatsword","Seraph's Judgment","Zodiac Saber","Constellation Blade",
        "Pulsar Sword","Nebula Falchion","Quasar Edge","Radiant Divinity Blade",
      ],
      axe: [
        "Starfire Axe","Celestial Cleaver","Divine Hatchet","Nova Splitter",
        "Empyrean Waraxe","Cosmic Fury Axe","Astral Hatchet","Quasar Cleaver",
        "Pulsar Axe","Supernova Waraxe","Zodiac Axe","Seraph's Tomahawk",
      ],
      mace: [
        "Divine Hammer","Cosmic Mace","Star Flail","Nova Basher",
        "Empyrean Maul","Celestial Warhammer","Astral Basher","Quasar Flail",
        "Pulsar Hammer","Supernova Mace","Zodiac Maul","Seraph's Sceptre","Starlight Basher",
      ],
      staff: [
        "Pulsar Staff","Celestial Scepter","Astral Focus","Genesis Staff",
        "Empyrean Conduit","Nova Tome Staff","Cosmic Oracle's Stave","Quasar Focus",
        "Starweave Staff","Zodiac Scepter","Supernova Conduit","Nebula Stave","Seraph's Arcane Focus",
      ],
      wand: [
        "Star Wand","Nova Wand","Divine Rod","Cosmic Focus",
        "Empyrean Wand","Astral Spark Wand","Quasar Rod","Nebula Focus",
        "Pulsar Wand","Celestial Beam Wand","Zodiac Wand","Seraph's Wand",
      ],
      bow: [
        "Celestial Longbow","Starborn Bow","Nova Recurve","Cosmic Hunter",
        "Empyrean Longbow","Astral Recurve","Quasar Bow","Nebula Shortbow",
        "Pulsar Hunter","Zodiac Longbow","Supernova Recurve","Seraph's Bow","Starfall Recurve",
      ],
      crossbow: [
        "Astral Crossbow","Celestial Repeater","Star Hunter",
        "Empyrean Arbalest","Nova Repeater","Cosmic Bolt Crossbow","Quasar Repeater",
        "Pulsar Arbalest","Zodiac Crossbow","Seraph's Arbalest",
      ],
      dagger: [
        "Starlight Dagger","Nova Fang","Celestial Stiletto","Astral Shiv",
        "Empyrean Piercer","Cosmic Fang","Quasar Dirk","Nebula Stiletto",
        "Pulsar Dagger","Zodiac Fang","Supernova Shiv","Seraph's Needle","Starbright Dagger",
      ],
      blade: [
        "Cosmic Kris","Starblade","Nebula Knife","Celestial Cutter",
        "Empyrean Kris","Astral Slasher","Quasar Blade","Pulsar Kris",
        "Nova Slicer","Zodiac Blade","Supernova Kris","Seraph's Cutter",
      ],
    },
    armor: {
      heavy: [
        "Divine Plate","Celestial Godplate","Starfire Plate",
        "Empyrean Warplate","Nova Titan's Breastplate","Cosmic Warlord's Mail","Astral Titan Plate","Seraph's Plate",
      ],
      medium: [
        "Stardust Armor","Astral Guard Coat","Nova Scout Vest",
        "Empyrean Ranger's Coat","Cosmic Duelist's Vest","Celestial Sentinel's Tunic","Zodiac Scout's Vest","Quasar Guard Coat",
      ],
      light: [
        "Pale Celestial Wrap","Astral Robe","Nebula Vestments",
        "Empyrean Oracle's Robes","Cosmic Archmage Robes","Zodiac Vestment","Starweave Robes","Seraph's Shroud",
      ],
      leather: [
        "Starshade Jerkin","Celestial Prowler's Vest","Nova Assassin's Leather","Cosmic Shadow Vest",
        "Empyrean Cutthroat's Coat","Astral Phantom Tunic","Zodiac Thief's Jerkin","Quasar Shade Leather",
      ],
    },
    helmet: {
      plate_helm: [
        "Titan Helm","Halo of Divinity","Celestial Visor",
        "Empyrean Greathelm","Nova Conqueror's Helm","Cosmic Titan Visor","Astral War Mask","Seraph's Faceplate",
      ],
      leather_helm: [
        "Halo Helm","Nebula Helm","Empyrean Cowl",
        "Nova Stalker's Hood","Astral Ranger's Hood","Celestial Scout's Cowl","Zodiac Hood","Cosmic Cowl",
      ],
      cloth_helm: [
        "Starlight Crown","Divinity Crown","Quasar Crown",
        "Empyrean Circlet","Nova Archmage's Crown","Cosmic Diadem","Zodiac Mage's Crown","Seraph's Diadem",
      ],
      hood: [
        "Starshade Hood","Celestial Phantom Cowl","Nova Assassin's Mask","Cosmic Wraith Hood",
        "Empyrean Shadow Cowl","Astral Lurker's Mask","Zodiac Shade Hood","Quasar Phantom Veil",
      ],
    },
    gloves: [
      "Celestial Grips","Nova Gauntlets","Divine Handwraps",
      "Empyrean Bracers","Astral Gauntlets","Cosmic War Gloves","Quasar Grips",
      "Pulsar Handguards","Zodiac Gauntlets","Starfire Grips","Seraph's Handwraps","Nebula Bracers",
    ],
    boots: [
      "Skywalker Boots","Aurora Boots","Starwalker Boots","Voidwalker Boots",
      "Empyrean Sabatons","Nova Treads","Cosmic Striders","Astral Greaves",
      "Quasar Boots","Zodiac Treads","Pulsar Sabatons","Seraph's Sandals",
    ],
    ring: [
      "Nebula Ring","Quasar Ring","Ring of Stars","Ring of the Cosmos",
      "Empyrean Band","Astral Signet","Nova Circlet","Zodiac Ring",
      "Pulsar Band","Seraph's Ring","Cosmic Coil","Starburst Ring",
    ],
    amulet: [
      "Comet Amulet","Zodiac Amulet","Supernova Amulet","Amulet of Creation",
      "Empyrean Pendant","Astral Locket","Nova Talisman","Cosmic Heart Amulet",
      "Pulsar Charm","Seraph's Amulet","Celestial Convergence Pendant","Starborn Locket",
    ],
  },
};

const RARITY_PREFIX: Record<string, string> = {
  common: "",
  uncommon: "Fine",
  rare: "Superior",
  epic: "Exquisite",
  legendary: "Legendary",
  mythic: "Mythical",
  shiny: "Divine",
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
  // Zone 1 — Verdant Forest
  wildwood: { hp_bonus: 8, defense: 6, vitality: 6, strength: 3 },
  thornblade: { strength: 8, damage: 8, defense: 5, crit_chance: 2 },
  leafwhisper: { dexterity: 8, luck: 5, crit_chance: 4, damage: 3 },
  // Zone 2 — Scorched Desert
  flamewarden: { strength: 10, damage: 8, defense: 7, hp_bonus: 5 },
  desertmystic: { intelligence: 10, mp_bonus: 8, damage: 7, luck: 3 },
  sandviper: { dexterity: 10, luck: 7, crit_chance: 6, lifesteal: 2 },
  // Zone 3 — Frozen Peaks
  glacialveil: { defense: 10, vitality: 9, hp_bonus: 7, strength: 4 },
  froststrike: { strength: 13, damage: 10, defense: 9, hp_bonus: 7 },
  arcticspell: { intelligence: 13, mp_bonus: 10, damage: 9, luck: 5 },
  // Zone 4 — Shadow Realm
  shadowlord: { strength: 16, damage: 13, defense: 12, hp_bonus: 10 },
  voidweaver: { intelligence: 16, mp_bonus: 13, damage: 12, luck: 7 },
  voidreaper: { dexterity: 16, luck: 10, crit_chance: 9, lifesteal: 4 },
  // Zone 5 — Celestial Spire
  cosmicguardian: { hp_bonus: 12, mp_bonus: 12, defense: 10, vitality: 10, strength: 6, dexterity: 6, intelligence: 6 },
  starbornslayer: { strength: 20, damage: 18, defense: 15, crit_chance: 7 },
  celestialarchmage: { intelligence: 20, mp_bonus: 18, damage: 15, luck: 10 },
  novastriker: { dexterity: 20, luck: 13, crit_chance: 10, damage: 13 },
  voidassassin: { dexterity: 20, luck: 15, crit_chance: 12, lifesteal: 6, damage: 10 },
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

// ── PROC EFFECT GENERATION ──────────────────────────────────────────────
const PROC_IDS_OFFENSIVE = [
  "lightning_bolt", "fireball_burst", "frost_nova", "poison_cloud",
  "blood_drain", "sand_blast", "arcane_surge", "triple_strike", "soul_harvest",
];
const PROC_IDS_CRIT = ["thunder_god", "frozen_shatter", "execute"];
const PROC_IDS_KILL = ["soul_reap", "gold_rush", "exp_surge"];
const PROC_IDS_DEFENSIVE = ["thorns", "divine_shield", "counter_strike"];

const PROC_POOLS_BY_TYPE: Record<string, { pool: string[]; maxProcs: Record<string, number> }> = {
  weapon:  { pool: [...PROC_IDS_OFFENSIVE, ...PROC_IDS_CRIT], maxProcs: { epic: 1, legendary: 1, mythic: 2, shiny: 2 } },
  armor:   { pool: [...PROC_IDS_DEFENSIVE, "soul_reap"], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
  helmet:  { pool: ["divine_shield", "exp_surge", "arcane_surge"], maxProcs: { legendary: 1, mythic: 1, shiny: 1 } },
  gloves:  { pool: PROC_IDS_OFFENSIVE.slice(0, 6), maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
  boots:   { pool: ["thorns", "counter_strike", "gold_rush"], maxProcs: { legendary: 1, mythic: 1, shiny: 1 } },
  ring:    { pool: [...PROC_IDS_KILL, "arcane_surge", "execute"], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
  amulet:  { pool: [...PROC_IDS_DEFENSIVE, ...PROC_IDS_KILL], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
};

// Shiny-exclusive unique effects — powerful procs only on shiny gear
const SHINY_UNIQUE_EFFECTS: Record<string, Array<{ id: string; name: string; description: string }>> = {
  weapon: [
    { id: "elemental_amplifier", name: "Elemental Amplifier", description: "Elemental skills deal 30% more damage" },
    { id: "cleave_strike", name: "Cleave Strike", description: "Every 3rd hit damages ALL enemies" },
    { id: "executioner", name: "Executioner's Edge", description: "Deals 50% more damage to enemies below 30% HP" },
    { id: "berserker_fury", name: "Berserker's Fury", description: "Gain +2% ATK for each 10% HP missing" },
  ],
  armor: [
    { id: "parry_master", name: "Parry Master", description: "15% chance to parry attacks, reflecting 250% damage" },
    { id: "undying_will", name: "Undying Will", description: "Survive a killing blow once per fight with 20% HP" },
    { id: "fortification", name: "Fortification", description: "Take 20% less damage when above 80% HP" },
  ],
  helmet: [
    { id: "wisdom_aura", name: "Wisdom Aura", description: "+25% EXP from all sources" },
    { id: "third_eye", name: "Third Eye", description: "+15% chance to find rare loot" },
  ],
  gloves: [
    { id: "rapid_strikes", name: "Rapid Strikes", description: "20% chance for attacks to hit twice" },
    { id: "mana_siphon", name: "Mana Siphon", description: "Restore 5% MP on hit" },
  ],
  boots: [
    { id: "phantom_step", name: "Phantom Step", description: "+20% Evasion for 3s after being hit" },
    { id: "gold_magnet", name: "Gold Magnet", description: "+30% gold from all sources" },
  ],
  ring: [
    { id: "soul_collector", name: "Soul Collector", description: "Killing an enemy heals 8% of max HP" },
    { id: "lucky_star", name: "Lucky Star", description: "+10% to all drop rates" },
  ],
  amulet: [
    { id: "life_link", name: "Life Link", description: "5% of damage dealt heals HP" },
    { id: "elemental_shield", name: "Elemental Shield", description: "Reduce elemental damage taken by 25%" },
  ],
};

function generateItemProcs(itemType: string, rarity: string, itemLevel: number): any[] {
  const config = PROC_POOLS_BY_TYPE[itemType];
  if (!config) return [];
  const maxProcs = (config.maxProcs as any)[rarity] || 0;
  if (maxProcs === 0) return [];

  const procChance = rarity === "shiny" ? 1.0 : Math.min(0.9, 0.3 + (itemLevel / 100) * 0.4);
  const procs: any[] = [];
  const pool = [...config.pool];

  for (let i = 0; i < maxProcs && pool.length > 0; i++) {
    if (Math.random() > procChance) continue;
    const idx = Math.floor(Math.random() * pool.length);
    const procId = pool.splice(idx, 1)[0];
    procs.push({ id: procId });
  }

  // Shiny items get a guaranteed unique effect
  if (rarity === "shiny") {
    const shinyPool = SHINY_UNIQUE_EFFECTS[itemType] || SHINY_UNIQUE_EFFECTS.weapon;
    const shinyEffect = shinyPool[Math.floor(Math.random() * shinyPool.length)];
    procs.push({ id: shinyEffect.id, unique: true, name: shinyEffect.name, description: shinyEffect.description });
  }

  return procs;
}

// ── UNIQUE ITEM DEFINITIONS (server-side for drop rolling) ─────────────
const UNIQUE_DROPS: Record<string, { name: string; dropChance: number; class_restriction?: string[] | null; type: string; subtype?: string; rarity: string; level_req: number; item_level: number; stats: Record<string, number>; proc_effects: any[]; is_unique: boolean; lore: string; uniqueEffect: string }[]> = {
  forest_guardian: [
    { name: "Heartwood Guardian", dropChance: 0.08, class_restriction: ["warrior"], type: "weapon", subtype: "mace", rarity: "legendary", level_req: 8, item_level: 12, stats: { damage: 18, strength: 12, vitality: 15, hp_regen: 1.0, defense: 8 }, proc_effects: [{ id: "thorns" }], is_unique: true, lore: "Carved from the heart of an ancient treant.", uniqueEffect: "Nature's Wrath: 25% reflect" },
  ],
  ancient_treant: [
    { name: "Serpent's Kiss", dropChance: 0.06, class_restriction: ["rogue"], type: "weapon", subtype: "dagger", rarity: "legendary", level_req: 8, item_level: 12, stats: { damage: 14, dexterity: 15, luck: 10, crit_chance: 5, poison_dmg: 15 }, proc_effects: [{ id: "poison_cloud" }], is_unique: true, lore: "The blade weeps a venom that never dries.", uniqueEffect: "Venom Drip: 15% poison" },
  ],
  desert_wyrm: [
    { name: "Ra's Chosen Blade", dropChance: 0.06, class_restriction: ["warrior"], type: "weapon", subtype: "sword", rarity: "legendary", level_req: 20, item_level: 28, stats: { damage: 45, strength: 35, fire_dmg: 25, crit_chance: 8, attack_speed: 0.1 }, proc_effects: [{ id: "fireball_burst" }], is_unique: true, lore: "Blessed by the sun god.", uniqueEffect: "Solar Flare: 12% fire burst" },
  ],
  fire_colossus: [
    { name: "Mirage Codex", dropChance: 0.05, class_restriction: ["mage"], type: "weapon", subtype: "staff", rarity: "legendary", level_req: 20, item_level: 28, stats: { damage: 35, intelligence: 45, sand_dmg: 20, mp_bonus: 40, mp_regen: 1.5 }, proc_effects: [{ id: "sand_blast" }], is_unique: true, lore: "Pages shift like sand dunes.", uniqueEffect: "Sandstorm Surge" },
  ],
  sand_titan: [
    { name: "Scorpion King's Recurve", dropChance: 0.05, class_restriction: ["ranger"], type: "weapon", subtype: "bow", rarity: "legendary", level_req: 20, item_level: 28, stats: { damage: 40, dexterity: 38, poison_dmg: 20, crit_chance: 10, luck: 12 }, proc_effects: [{ id: "poison_cloud" }], is_unique: true, lore: "Strung with the Scorpion King's sinew.", uniqueEffect: "King's Venom" },
  ],
  frost_dragon: [
    { name: "Frostbite's Edge", dropChance: 0.04, class_restriction: ["warrior"], type: "weapon", subtype: "axe", rarity: "mythic", level_req: 38, item_level: 48, stats: { damage: 85, strength: 70, ice_dmg: 30, crit_chance: 12, defense: 25 }, proc_effects: [{ id: "frost_nova" }, { id: "frozen_shatter" }], is_unique: true, lore: "Forged in the heart of a dying glacier.", uniqueEffect: "Permafrost: nova + shatter" },
  ],
  blizzard_titan: [
    { name: "Crystal Heart", dropChance: 0.04, class_restriction: ["mage"], type: "weapon", subtype: "staff", rarity: "mythic", level_req: 38, item_level: 48, stats: { damage: 70, intelligence: 85, ice_dmg: 35, mp_bonus: 80, crit_dmg_pct: 15 }, proc_effects: [{ id: "frost_nova" }], is_unique: true, lore: "A crystallized dragon heart.", uniqueEffect: "Dragon's Breath: 12% ice nova" },
  ],
  shadow_lord: [
    { name: "Soulreaver", dropChance: 0.03, class_restriction: ["rogue"], type: "weapon", subtype: "blade", rarity: "mythic", level_req: 60, item_level: 75, stats: { damage: 130, dexterity: 110, blood_dmg: 35, lifesteal: 12, crit_chance: 18, luck: 30 }, proc_effects: [{ id: "blood_drain" }, { id: "execute" }], is_unique: true, lore: "This blade hungers for souls.", uniqueEffect: "Soul Siphon" },
  ],
  void_titan: [
    { name: "Voidheart Grimoire", dropChance: 0.03, class_restriction: ["mage"], type: "weapon", subtype: "staff", rarity: "mythic", level_req: 60, item_level: 75, stats: { damage: 110, intelligence: 130, blood_dmg: 30, mp_bonus: 120, mp_regen: 3.0 }, proc_effects: [{ id: "blood_drain" }, { id: "arcane_surge" }], is_unique: true, lore: "Written in blood on void-touched parchment.", uniqueEffect: "Void Pulse" },
  ],
  cosmic_overlord: [
    { name: "Godslayer", dropChance: 0.02, class_restriction: ["warrior"], type: "weapon", subtype: "sword", rarity: "mythic", level_req: 85, item_level: 105, stats: { damage: 250, strength: 200, crit_chance: 20, crit_dmg_pct: 25, fire_dmg: 20, lightning_dmg: 20 }, proc_effects: [{ id: "thunder_god" }, { id: "fireball_burst" }], is_unique: true, lore: "The blade that slew a god.", uniqueEffect: "Divine Wrath" },
    { name: "Edge of Oblivion", dropChance: 0.02, class_restriction: ["rogue"], type: "weapon", subtype: "blade", rarity: "mythic", level_req: 85, item_level: 105, stats: { damage: 210, dexterity: 240, crit_chance: 25, lifesteal: 15, blood_dmg: 30, luck: 40 }, proc_effects: [{ id: "execute" }, { id: "blood_drain" }], is_unique: true, lore: "A blade forged at the edge of existence.", uniqueEffect: "Oblivion" },
    { name: "Celestial Stone of Ascension", dropChance: 0.03, class_restriction: null, type: "amulet", rarity: "mythic", level_req: 80, item_level: 100, stats: { strength: 80, dexterity: 80, intelligence: 80, vitality: 80, luck: 40, exp_gain_pct: 25, gold_gain_pct: 25 }, proc_effects: [{ id: "soul_reap" }, { id: "exp_surge" }], is_unique: true, lore: "A fragment of the Celestial Spire itself.", uniqueEffect: "Ascension" },
  ],
  omega_seraph: [
    { name: "Genesis Tome", dropChance: 0.02, class_restriction: ["mage"], type: "weapon", subtype: "staff", rarity: "mythic", level_req: 85, item_level: 105, stats: { damage: 200, intelligence: 250, mp_bonus: 200, mp_regen: 5.0, ice_dmg: 25, lightning_dmg: 25 }, proc_effects: [{ id: "frost_nova" }, { id: "lightning_bolt" }], is_unique: true, lore: "This tome contains the first words ever spoken.", uniqueEffect: "Genesis" },
    { name: "Elemental Convergence Ring", dropChance: 0.03, class_restriction: null, type: "ring", rarity: "mythic", level_req: 75, item_level: 95, stats: { fire_dmg: 15, ice_dmg: 15, lightning_dmg: 15, poison_dmg: 15, blood_dmg: 15, sand_dmg: 15, luck: 30 }, proc_effects: [{ id: "lightning_bolt" }, { id: "fireball_burst" }], is_unique: true, lore: "Six elemental crystals orbit this ring.", uniqueEffect: "Convergence" },
  ],
  celestial_titan: [
    { name: "Starfall", dropChance: 0.02, class_restriction: ["ranger"], type: "weapon", subtype: "bow", rarity: "mythic", level_req: 85, item_level: 105, stats: { damage: 220, dexterity: 230, crit_chance: 22, luck: 50, fire_dmg: 15, ice_dmg: 15 }, proc_effects: [{ id: "triple_strike" }, { id: "fireball_burst" }], is_unique: true, lore: "Arrows fall like meteors from the heavens.", uniqueEffect: "Meteor Rain" },
  ],
  blood_colossus: [
    { name: "Boots of the Phantom", dropChance: 0.04, class_restriction: null, type: "boots", rarity: "mythic", level_req: 55, item_level: 70, stats: { dexterity: 60, evasion: 8, attack_speed: 0.15, luck: 25 }, proc_effects: [{ id: "counter_strike" }], is_unique: true, lore: "Once belonging to the Phantom King.", uniqueEffect: "Phantom Step: 18% counter" },
  ],
};

export function rollUniqueDrop(enemyKey: string, characterClass: string | null, luck: number): any | null {
  const drops = UNIQUE_DROPS[enemyKey];
  if (!drops) return null;
  const luckBonus = 1 + Math.min(0.5, luck * 0.005);
  for (const item of drops) {
    if (item.class_restriction && characterClass && !item.class_restriction.includes(characterClass)) continue;
    if (Math.random() < item.dropChance * luckBonus) {
      return {
        ...item,
        sell_price: Math.floor((RARITY_SELL_PRICES[item.rarity] || 600) * (1 + item.item_level * 0.15)),
      };
    }
  }
  return null;
}

// ── CELESTIAL STONE DROPS ──────────────────────────────────────────────
const CELESTIAL_STONE_DROPS: Record<string, { name: string; dropChance: number }> = {
  forest_guardian: { name: "Emerald Heartstone", dropChance: 0.25 },
  desert_wyrm: { name: "Solar Keystone", dropChance: 0.20 },
  frost_dragon: { name: "Glacial Core", dropChance: 0.15 },
  shadow_lord: { name: "Void Shard", dropChance: 0.10 },
  cosmic_overlord: { name: "Celestial Fragment", dropChance: 0.08 },
};

export function rollStoneDrop(enemyKey: string, luck: number): any | null {
  const stone = CELESTIAL_STONE_DROPS[enemyKey];
  if (!stone) return null;
  const luckBonus = 1 + Math.min(0.5, luck * 0.003);
  if (Math.random() < stone.dropChance * luckBonus) {
    return {
      name: stone.name,
      type: "material",
      rarity: "mythic",
      is_unique: true,
      stats: {},
      sell_price: 0,
      item_level: 1,
      level_req: 1,
    };
  }
  return null;
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
    } else if (type === "gloves") {
      subtype = characterClass ? (CLASS_GLOVES_WEIGHT[characterClass] || "cloth_gloves") : "cloth_gloves";
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Gloves"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else if (type === "boots") {
      subtype = characterClass ? (CLASS_BOOTS_WEIGHT[characterClass] || "cloth_boots") : "cloth_boots";
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Boots"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else {
      subtype = null;
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Item"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    }
  }

  const prefix = RARITY_PREFIX[rarity] || "";
  if (prefix) name = `${prefix} ${name}`;

  const stats = generateItemStats(type, rarity, itemLevel, zoneKey);
  const sellPrice = Math.floor((RARITY_SELL_PRICES[rarity] || 10) * (1 + itemLevel * 0.08));

  // Generate proc effects for epic+ items
  const procEffects = generateItemProcs(type, rarity, itemLevel);

  // Rune slots: higher rarity = more chance of slots, max 3
  let runeSlots = 0;
  const slotRoll = Math.random() * 100;
  const rarityIdx = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "shiny"].indexOf(rarity);
  if (rarityIdx >= 5) runeSlots = slotRoll < 60 ? 3 : slotRoll < 85 ? 2 : 1;       // mythic/shiny: 1-3 slots
  else if (rarityIdx >= 4) runeSlots = slotRoll < 30 ? 3 : slotRoll < 70 ? 2 : 1;   // legendary: 1-3 slots
  else if (rarityIdx >= 3) runeSlots = slotRoll < 15 ? 3 : slotRoll < 50 ? 2 : slotRoll < 85 ? 1 : 0; // epic: 0-3
  else if (rarityIdx >= 2) runeSlots = slotRoll < 40 ? 1 : slotRoll < 60 ? 2 : 0;   // rare: 0-2
  else if (rarityIdx >= 1) runeSlots = slotRoll < 25 ? 1 : 0;                        // uncommon: 0-1
  // common: 0 slots

  // For shiny/mythic/legendary items, chance to be a unique with special proc effects
  let isUnique = false;
  let uniqueEffect: string | null = null;
  let lore: string | null = null;
  if (rarity === "shiny" || (rarity === "mythic" && isBoss) || (rarity === "legendary" && Math.random() < 0.15)) {
    // Roll from ALL unique drops matching the character class
    const allUniques: any[] = [];
    for (const drops of Object.values(UNIQUE_DROPS)) {
      for (const d of drops) {
        if (d.class_restriction && characterClass && !d.class_restriction.includes(characterClass)) continue;
        if (d.item_level <= itemLevel + 10) allUniques.push(d);
      }
    }
    if (allUniques.length > 0) {
      const luckBonus = 1 + Math.min(0.5, (luck || 0) * 0.005);
      const uniqueRoll = Math.random();
      const uniqueChance = rarity === "shiny" ? 1.0 : rarity === "mythic" ? 0.4 : 0.15;
      if (uniqueRoll < uniqueChance * luckBonus) {
        const pick = allUniques[Math.floor(Math.random() * allUniques.length)];
        return {
          name: pick.name,
          rarity: pick.rarity || rarity,
          type: pick.type,
          subtype: pick.subtype || undefined,
          item_level: pick.item_level,
          level_req: pick.level_req,
          stats: pick.stats,
          sell_price: Math.floor((RARITY_SELL_PRICES[pick.rarity] || 600) * (1 + pick.item_level * 0.15)),
          proc_effects: pick.proc_effects || [],
          is_unique: true,
          uniqueEffect: pick.uniqueEffect,
          lore: pick.lore,
          ...(runeSlots > 0 ? { rune_slots: runeSlots } : {}),
        };
      }
    }
  }

  return {
    name,
    rarity,
    type,
    subtype: subtype || undefined,
    item_level: itemLevel,
    level_req: levelReq,
    stats,
    sell_price: sellPrice,
    ...(procEffects.length > 0 ? { proc_effects: procEffects } : {}),
    ...(runeSlots > 0 ? { rune_slots: runeSlots } : {}),
  };
}

/**
 * Generate a shop item using the same name/stat system as combat loot.
 * Uses seeded RNG for deterministic shop rotations.
 */
export function generateShopItem(
  charLevel: number,
  charClass: string,
  rarity: string,
  rngFn: () => number // seeded RNG
): any {
  const zoneKey = getZoneForLevel(charLevel);
  const zoneNames = ITEM_NAMES[zoneKey] || ITEM_NAMES.verdant_forest;
  const allTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

  const useSmartLoot = rngFn() < 0.65;
  let type: string, subtype: string | null = null, name: string;

  if (useSmartLoot && rngFn() < 0.4) {
    type = "weapon";
    const subtypes = CLASS_WEAPON_SUBTYPES[charClass] || ["sword"];
    subtype = subtypes[Math.floor(rngFn() * subtypes.length)];
    const namePool = zoneNames.weapon?.[subtype] || ["Unknown Weapon"];
    name = namePool[Math.floor(rngFn() * namePool.length)];
  } else if (useSmartLoot && rngFn() < 0.35) {
    type = "armor";
    subtype = CLASS_ARMOR_WEIGHT[charClass] || "light";
    const namePool = zoneNames.armor?.[subtype] || zoneNames.armor?.light || ["Unknown Armor"];
    name = namePool[Math.floor(rngFn() * namePool.length)];
  } else {
    type = allTypes[Math.floor(rngFn() * allTypes.length)];
    if (type === "weapon") {
      const subtypes = CLASS_WEAPON_SUBTYPES[charClass] || ["sword"];
      subtype = subtypes[Math.floor(rngFn() * subtypes.length)];
      const namePool = zoneNames.weapon?.[subtype] || ["Unknown Weapon"];
      name = namePool[Math.floor(rngFn() * namePool.length)];
    } else if (type === "armor") {
      const weight = CLASS_ARMOR_WEIGHT[charClass] || "light";
      subtype = weight;
      const namePool = zoneNames.armor?.[weight] || ["Unknown Armor"];
      name = namePool[Math.floor(rngFn() * namePool.length)];
    } else if (type === "helmet") {
      const helmWeight = CLASS_HELMET_WEIGHT[charClass] || "cloth_helm";
      subtype = helmWeight;
      const helmNames = zoneNames.helmet;
      const namePool = (helmNames && typeof helmNames === "object" && !Array.isArray(helmNames))
        ? (helmNames[helmWeight] || helmNames.cloth_helm || ["Unknown Helmet"])
        : (Array.isArray(helmNames) ? helmNames : ["Unknown Helmet"]);
      name = namePool[Math.floor(rngFn() * namePool.length)];
    } else if (type === "gloves") {
      subtype = CLASS_GLOVES_WEIGHT[charClass] || "cloth_gloves";
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Gloves"];
      name = namePool[Math.floor(rngFn() * namePool.length)];
    } else if (type === "boots") {
      subtype = CLASS_BOOTS_WEIGHT[charClass] || "cloth_boots";
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Boots"];
      name = namePool[Math.floor(rngFn() * namePool.length)];
    } else {
      subtype = null;
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Item"];
      name = namePool[Math.floor(rngFn() * namePool.length)];
    }
  }

  const prefix = RARITY_PREFIX[rarity] || "";
  if (prefix) name = `${prefix} ${name}`;

  const itemLevel = Math.max(1, charLevel + Math.floor((rngFn() - 0.5) * 6));
  const stats = generateItemStats(type, rarity, itemLevel, zoneKey);
  const procEffects = generateItemProcs(type, rarity, itemLevel);
  const sellPrice = Math.floor((RARITY_SELL_PRICES[rarity] || 10) * (1 + itemLevel * 0.08));
  const buyPrice = Math.floor(sellPrice * 3.5);

  // Rune slots: same logic as generateLoot
  let runeSlots = 0;
  const slotRoll = rngFn() * 100;
  const rarityIdx = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "shiny"].indexOf(rarity);
  if (rarityIdx >= 5) runeSlots = slotRoll < 60 ? 3 : slotRoll < 85 ? 2 : 1;
  else if (rarityIdx >= 4) runeSlots = slotRoll < 30 ? 3 : slotRoll < 70 ? 2 : 1;
  else if (rarityIdx >= 3) runeSlots = slotRoll < 15 ? 3 : slotRoll < 50 ? 2 : slotRoll < 85 ? 1 : 0;
  else if (rarityIdx >= 2) runeSlots = slotRoll < 40 ? 1 : slotRoll < 60 ? 2 : 0;
  else if (rarityIdx >= 1) runeSlots = slotRoll < 25 ? 1 : 0;

  return {
    name,
    type,
    subtype: subtype || undefined,
    rarity,
    item_level: itemLevel,
    level_req: Math.max(1, itemLevel - 2),
    stats,
    sell_price: sellPrice,
    buy_price: buyPrice,
    ...(procEffects.length > 0 ? { proc_effects: procEffects } : {}),
    ...(runeSlots > 0 ? { rune_slots: runeSlots } : {}),
  };
}
