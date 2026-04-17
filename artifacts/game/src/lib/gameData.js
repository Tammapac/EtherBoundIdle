// ===== CLASSES =====
export const CLASSES = {
  warrior: {
    name: "Warrior",
    icon: "Shield",
    description: "A mighty frontline fighter with high HP and strength.",
    baseStats: { strength: 14, dexterity: 8, intelligence: 5, vitality: 13, luck: 5 },
    color: "text-red-400",
    skills: ["power_strike", "shield_bash", "war_cry", "berserker_rage"]
  },
  mage: {
    name: "Mage",
    icon: "Sparkles",
    description: "A master of arcane magic dealing devastating spell damage.",
    baseStats: { strength: 5, dexterity: 7, intelligence: 15, vitality: 8, luck: 5 },
    color: "text-blue-400",
    skills: ["fireball", "ice_lance", "arcane_shield", "meteor"]
  },
  ranger: {
    name: "Ranger",
    icon: "Target",
    description: "A swift hunter with ranged attacks and high dexterity.",
    baseStats: { strength: 8, dexterity: 15, intelligence: 7, vitality: 8, luck: 7 },
    color: "text-green-400",
    skills: ["arrow_rain", "poison_shot", "eagle_eye", "multishot"]
  },
  rogue: {
    name: "Rogue",
    icon: "Swords",
    description: "A cunning assassin with critical hits and evasion.",
    baseStats: { strength: 9, dexterity: 13, intelligence: 6, vitality: 7, luck: 10 },
    color: "text-purple-400",
    skills: ["backstab", "smoke_bomb", "blade_dance", "assassinate"]
  }
};

// ===== SKILLS =====
export const SKILLS = {
  // Warrior
  power_strike: { name: "Power Strike", damage: 1.5, mp: 10, cooldown: 3, icon: "Sword", desc: "A powerful melee strike" },
  shield_bash: { name: "Shield Bash", damage: 1.2, mp: 8, cooldown: 4, icon: "Shield", desc: "Stuns enemy briefly", stun: 1 },
  war_cry: { name: "War Cry", damage: 0, mp: 15, cooldown: 8, icon: "Volume2", desc: "Boost ATK by 30%", buff: { stat: "strength", mult: 1.3, duration: 3 } },
  berserker_rage: { name: "Berserker Rage", damage: 2.5, mp: 25, cooldown: 12, icon: "Flame", desc: "Devastating attack" },
  // Mage
  fireball: { name: "Fireball", damage: 1.8, mp: 12, cooldown: 3, icon: "Flame", desc: "A ball of fire" },
  ice_lance: { name: "Ice Lance", damage: 1.4, mp: 10, cooldown: 3, icon: "Snowflake", desc: "Piercing ice shard", slow: 1 },
  arcane_shield: { name: "Arcane Shield", damage: 0, mp: 20, cooldown: 10, icon: "ShieldCheck", desc: "Absorbs damage", shield: 0.3 },
  meteor: { name: "Meteor", damage: 3.0, mp: 30, cooldown: 15, icon: "Zap", desc: "Calls down a meteor" },
  // Ranger
  arrow_rain: { name: "Arrow Rain", damage: 1.6, mp: 12, cooldown: 4, icon: "CloudRain", desc: "AoE arrow attack" },
  poison_shot: { name: "Poison Shot", damage: 1.0, mp: 8, cooldown: 3, icon: "Crosshair", desc: "Poisons enemy", dot: { damage: 0.3, duration: 3 } },
  eagle_eye: { name: "Eagle Eye", damage: 0, mp: 10, cooldown: 8, icon: "Eye", desc: "+50% crit chance", buff: { stat: "crit", mult: 1.5, duration: 3 } },
  multishot: { name: "Multishot", damage: 2.2, mp: 20, cooldown: 10, icon: "ArrowUpRight", desc: "Multiple arrows" },
  // Rogue
  backstab: { name: "Backstab", damage: 2.0, mp: 10, cooldown: 3, icon: "Knife", desc: "Critical from behind" },
  smoke_bomb: { name: "Smoke Bomb", damage: 0, mp: 12, cooldown: 8, icon: "Cloud", desc: "+50% evasion", buff: { stat: "evasion", mult: 1.5, duration: 2 } },
  blade_dance: { name: "Blade Dance", damage: 1.8, mp: 15, cooldown: 6, icon: "Swords", desc: "Rapid blade combo" },
  assassinate: { name: "Assassinate", damage: 3.5, mp: 30, cooldown: 15, icon: "Skull", desc: "Lethal finishing blow" }
};

// ===== REGIONS =====
export const REGIONS = {
  verdant_forest: {
    name: "Verdant Forest",
    description: "A lush forest teeming with wildlife and low-level creatures.",
    levelRange: [1, 5],
    icon: "Trees",
    color: "text-emerald-400",
    bgColor: "from-emerald-500/10",
    enemies: ["forest_wolf", "goblin_scout", "giant_spider", "wild_boar", "moss_golem", "vine_serpent", "forest_bandit", "poison_frog", "bark_spider", "goblin_shaman", "treant_sprout", "thornback_boar"],
    eliteEnemy: "ancient_treant",
    eliteEnemy2: "forest_troll",
    boss: "forest_guardian"
  },
  scorched_desert: {
    name: "Scorched Desert",
    description: "A vast, burning desert filled with scorpions and sand golems.",
    levelRange: [5, 10],
    icon: "Sun",
    color: "text-orange-400",
    bgColor: "from-orange-500/10",
    enemies: ["sand_scorpion", "desert_bandit", "sand_golem", "fire_lizard", "cactus_wraith", "dune_raider", "tomb_scarab", "sandstorm_elemental", "desert_cobra", "mummy_warrior", "sand_phantom", "flame_jackal", "tomb_guardian"],
    eliteEnemy: "sand_titan",
    eliteEnemy2: "fire_colossus",
    boss: "desert_wyrm"
  },
  frozen_peaks: {
    name: "Frozen Peaks",
    description: "Icy mountains inhabited by frost creatures and ancient dragons.",
    levelRange: [10, 20],
    icon: "Snowflake",
    color: "text-cyan-400",
    bgColor: "from-cyan-500/10",
    enemies: ["frost_wolf", "ice_elemental", "yeti", "glacial_golem", "snow_harpy", "frozen_knight", "ice_witch", "blizzard_sprite", "frost_troll", "avalanche_wraith", "ice_basilisk", "polar_bear_spirit", "crystal_golem"],
    eliteEnemy: "frost_colossus",
    eliteEnemy2: "blizzard_titan",
    boss: "frost_dragon"
  },
  mud_swamps: {
    name: "Mud Swamps",
    description: "A fetid marshland of poisonous bogs and lurking horrors beneath the murk.",
    levelRange: [20, 30],
    icon: "Droplets",
    color: "text-lime-400",
    bgColor: "from-lime-500/10",
    enemies: ["swamp_lurker", "bog_toad", "mud_golem", "marsh_hag", "leech_swarm", "rotting_treant", "mire_crawler", "toxic_spore", "swamp_hydra", "sludge_beast", "quicksand_wraith", "fungal_horror"],
    eliteEnemy: "swamp_king",
    eliteEnemy2: "ancient_hydra",
    boss: "bog_mother"
  },
  forgotten_cave: {
    name: "Forgotten Cave",
    description: "Ancient caverns filled with glowing crystals and creatures that lurk in the dark.",
    levelRange: [30, 40],
    icon: "Mountain",
    color: "text-amber-400",
    bgColor: "from-amber-500/10",
    enemies: ["cave_bat", "stone_golem", "crystal_spider", "deep_dweller", "blind_stalker", "gem_beetle", "cave_troll", "stalactite_mimic", "tunnel_serpent", "echo_wraith", "mushroom_giant", "ore_elemental"],
    eliteEnemy: "crystal_guardian",
    eliteEnemy2: "deep_horror",
    boss: "cave_dragon"
  },
  dark_seas: {
    name: "Dark Seas",
    description: "Treacherous waters haunted by sea monsters and ghost ships.",
    levelRange: [40, 50],
    icon: "Anchor",
    color: "text-blue-400",
    bgColor: "from-blue-500/10",
    enemies: ["drowned_sailor", "sea_serpent", "ghost_pirate", "reef_golem", "abyssal_squid", "siren", "barnacle_fiend", "tide_elemental", "shark_spirit", "coral_wraith", "deep_angler", "phantom_kraken"],
    eliteEnemy: "leviathan",
    eliteEnemy2: "ghost_captain",
    boss: "kraken_lord"
  },
  shadow_realm: {
    name: "Shadow Realm",
    description: "A dark dimension where powerful demons lurk in the shadows.",
    levelRange: [50, 60],
    icon: "Moon",
    color: "text-purple-400",
    bgColor: "from-purple-500/10",
    enemies: ["shadow_wraith", "demon_knight", "void_walker", "soul_harvester", "nightmare_hound", "cursed_revenant", "dark_sorcerer", "abyssal_fiend", "blood_shade", "necrotic_golem", "void_assassin", "rift_stalker", "shadow_dragon"],
    eliteEnemy: "void_titan",
    eliteEnemy2: "blood_colossus",
    boss: "shadow_lord"
  },
  volcanos_path: {
    name: "Volcano's Path",
    description: "Rivers of molten lava and volcanic creatures forged in eternal fire.",
    levelRange: [60, 70],
    icon: "Flame",
    color: "text-red-500",
    bgColor: "from-red-500/10",
    enemies: ["lava_golem", "fire_imp", "magma_serpent", "volcanic_drake", "ember_elemental", "infernal_hound", "ash_wraith", "obsidian_knight", "flame_djinn", "molten_spider", "pyroclast_titan", "cinder_shade"],
    eliteEnemy: "magma_lord",
    eliteEnemy2: "infernal_dragon",
    boss: "volcano_guardian"
  },
  crystal_lands: {
    name: "Crystal Lands",
    description: "A surreal landscape of crystalline formations pulsing with raw magical energy.",
    levelRange: [70, 80],
    icon: "Diamond",
    color: "text-pink-400",
    bgColor: "from-pink-500/10",
    enemies: ["crystal_sentinel", "prism_golem", "gem_wyrm", "refraction_spirit", "shard_elemental", "diamond_spider", "amethyst_knight", "quartz_phantom", "opal_shade", "ruby_construct", "sapphire_serpent", "topaz_guardian"],
    eliteEnemy: "crystal_colossus",
    eliteEnemy2: "prismatic_dragon",
    boss: "crystal_overlord"
  },
  celestial_spire: {
    name: "Celestial Spire",
    description: "A divine tower reaching into the heavens, guarded by angelic warriors.",
    levelRange: [80, 90],
    icon: "Star",
    color: "text-yellow-400",
    bgColor: "from-yellow-500/10",
    enemies: ["celestial_guardian", "seraph_warrior", "titan", "star_phantom", "nova_knight", "divine_construct", "astral_wyrm", "cosmic_sentinel", "light_golem", "empyrean_shade", "starfire_drake", "void_seraph", "genesis_elemental"],
    eliteEnemy: "celestial_titan",
    eliteEnemy2: "omega_seraph",
    boss: "cosmic_overlord"
  },
  tammas_castle: {
    name: "Tamma's Castle",
    description: "The final stronghold — a dark fortress ruled by the ultimate evil. Only the worthy survive.",
    levelRange: [90, 100],
    icon: "Castle",
    color: "text-rose-500",
    bgColor: "from-rose-500/10",
    enemies: ["castle_knight", "dark_paladin", "throne_guardian", "cursed_duke", "royal_revenant", "shadow_vizier", "doom_sentinel", "fallen_champion", "void_prince", "death_bishop", "chaos_warden", "nightmare_lord"],
    eliteEnemy: "arch_demon",
    eliteEnemy2: "eternal_guardian",
    boss: "tamma_the_fallen"
  }
};

// ===== ENEMIES =====
export const ENEMIES = {
  // Forest (lv 1-10)
  forest_wolf:     { name: "Forest Wolf",     baseHp: 120,  baseDmg: 18,  expReward: 15,  goldReward: 5  },
  goblin_scout:    { name: "Goblin Scout",    baseHp: 110,  baseDmg: 20, expReward: 18,  goldReward: 8  },
  giant_spider:    { name: "Giant Spider",    baseHp: 140,  baseDmg: 22, expReward: 22,  goldReward: 10 },
  wild_boar:       { name: "Wild Boar",       baseHp: 150,  baseDmg: 19,  expReward: 17,  goldReward: 6  },
  moss_golem:      { name: "Moss Golem",      baseHp: 180,  baseDmg: 16,  expReward: 20,  goldReward: 8  },
  vine_serpent:    { name: "Vine Serpent",    baseHp: 130,  baseDmg: 24, expReward: 24,  goldReward: 10 },
  forest_bandit:   { name: "Forest Bandit",   baseHp: 140,  baseDmg: 25, expReward: 26,  goldReward: 14 },
  // Forest extras
  poison_frog:      { name: "Poison Frog",      baseHp: 100,  baseDmg: 22, expReward: 16,  goldReward: 6  },
  bark_spider:      { name: "Bark Spider",       baseHp: 125,  baseDmg: 26, expReward: 20,  goldReward: 8  },
  goblin_shaman:    { name: "Goblin Shaman",     baseHp: 115,  baseDmg: 30, expReward: 25,  goldReward: 12 },
  treant_sprout:    { name: "Treant Sprout",     baseHp: 160,  baseDmg: 17, expReward: 18,  goldReward: 7  },
  thornback_boar:   { name: "Thornback Boar",    baseHp: 170,  baseDmg: 21, expReward: 19,  goldReward: 8  },
  // Forest Elites & Boss
  ancient_treant:   { name: "⚡ Ancient Treant",   baseHp: 1200, baseDmg: 60,  expReward: 300,  goldReward: 150, isElite: true },
  forest_troll:     { name: "⚡ Forest Troll",      baseHp: 1500, baseDmg: 75,  expReward: 350,  goldReward: 175, isElite: true },
  forest_guardian:  { name: "Forest Guardian",     baseHp: 800,  baseDmg: 45,  expReward: 150,  goldReward: 80,  isBoss: true  },

  // Desert (lv 10-25)
  sand_scorpion:       { name: "Sand Scorpion",       baseHp: 300, baseDmg: 35, expReward: 35,  goldReward: 15 },
  desert_bandit:       { name: "Desert Bandit",       baseHp: 280, baseDmg: 40, expReward: 40,  goldReward: 20 },
  sand_golem:          { name: "Sand Golem",           baseHp: 400, baseDmg: 32, expReward: 45,  goldReward: 22 },
  fire_lizard:         { name: "Fire Lizard",          baseHp: 320, baseDmg: 42, expReward: 42,  goldReward: 18 },
  cactus_wraith:       { name: "Cactus Wraith",        baseHp: 290, baseDmg: 38, expReward: 38,  goldReward: 16 },
  dune_raider:         { name: "Dune Raider",          baseHp: 360, baseDmg: 45, expReward: 50,  goldReward: 25 },
  tomb_scarab:         { name: "Tomb Scarab",          baseHp: 260,  baseDmg: 41, expReward: 36,  goldReward: 17 },
  sandstorm_elemental: { name: "Sandstorm Elemental",  baseHp: 380, baseDmg: 38, expReward: 55,  goldReward: 28 },
  // Desert extras
  desert_cobra:    { name: "Desert Cobra",    baseHp: 270, baseDmg: 44, expReward: 40,  goldReward: 19 },
  mummy_warrior:   { name: "Mummy Warrior",   baseHp: 350, baseDmg: 36, expReward: 42,  goldReward: 20 },
  sand_phantom:    { name: "Sand Phantom",    baseHp: 300, baseDmg: 48, expReward: 48,  goldReward: 24 },
  flame_jackal:    { name: "Flame Jackal",    baseHp: 290, baseDmg: 50, expReward: 46,  goldReward: 22 },
  tomb_guardian:   { name: "Tomb Guardian",   baseHp: 420, baseDmg: 38, expReward: 52,  goldReward: 26 },
  // Desert Elites & Boss
  sand_titan:      { name: "⚡ Sand Titan",    baseHp: 3000, baseDmg: 110, expReward: 600,  goldReward: 300, isElite: true },
  fire_colossus:   { name: "⚡ Fire Colossus", baseHp: 3500, baseDmg: 130, expReward: 700,  goldReward: 350, isElite: true },
  desert_wyrm:     { name: "Desert Wyrm",     baseHp: 2000, baseDmg: 85,  expReward: 400,  goldReward: 200, isBoss: true  },

  // Frozen (lv 25-45)
  frost_wolf:       { name: "Frost Wolf",       baseHp: 600, baseDmg: 55, expReward: 70,  goldReward: 30 },
  ice_elemental:    { name: "Ice Elemental",    baseHp: 700, baseDmg: 62, expReward: 85,  goldReward: 40 },
  yeti:             { name: "Yeti",             baseHp: 850, baseDmg: 68, expReward: 100, goldReward: 50 },
  glacial_golem:    { name: "Glacial Golem",    baseHp: 950, baseDmg: 58, expReward: 95,  goldReward: 45 },
  snow_harpy:       { name: "Snow Harpy",       baseHp: 550, baseDmg: 72, expReward: 90,  goldReward: 42 },
  frozen_knight:    { name: "Frozen Knight",    baseHp: 800, baseDmg: 65, expReward: 105, goldReward: 52 },
  ice_witch:        { name: "Ice Witch",        baseHp: 650, baseDmg: 78, expReward: 110, goldReward: 55 },
  blizzard_sprite:  { name: "Blizzard Sprite",  baseHp: 500, baseDmg: 70, expReward: 80,  goldReward: 38 },
  // Frozen extras
  frost_troll:        { name: "Frost Troll",        baseHp: 780, baseDmg: 60, expReward: 85,  goldReward: 40 },
  avalanche_wraith:   { name: "Avalanche Wraith",   baseHp: 600, baseDmg: 74, expReward: 92,  goldReward: 44 },
  ice_basilisk:       { name: "Ice Basilisk",        baseHp: 900, baseDmg: 65, expReward: 98,  goldReward: 48 },
  polar_bear_spirit:  { name: "Polar Bear Spirit",  baseHp: 1000,baseDmg: 62, expReward: 105, goldReward: 52 },
  crystal_golem:      { name: "Crystal Golem",      baseHp: 1100,baseDmg: 58, expReward: 108, goldReward: 54 },
  // Frozen Elites & Boss
  frost_colossus:   { name: "⚡ Frost Colossus",  baseHp: 8000,  baseDmg: 160, expReward: 1200, goldReward: 600, isElite: true },
  blizzard_titan:   { name: "⚡ Blizzard Titan",   baseHp: 10000, baseDmg: 190, expReward: 1400, goldReward: 700, isElite: true },
  frost_dragon:     { name: "Frost Dragon",        baseHp: 5000,  baseDmg: 125, expReward: 1000, goldReward: 500, isBoss: true  },

  // Shadow (lv 45-70)
  shadow_wraith:    { name: "Shadow Wraith",   baseHp: 1200, baseDmg: 90,  expReward: 150, goldReward: 70  },
  demon_knight:     { name: "Demon Knight",    baseHp: 1500, baseDmg: 105,  expReward: 200, goldReward: 90  },
  void_walker:      { name: "Void Walker",     baseHp: 1350, baseDmg: 115,  expReward: 180, goldReward: 85  },
  soul_harvester:   { name: "Soul Harvester",  baseHp: 1400, baseDmg: 108,  expReward: 190, goldReward: 88  },
  nightmare_hound:  { name: "Nightmare Hound", baseHp: 1250, baseDmg: 120,  expReward: 185, goldReward: 82  },
  cursed_revenant:  { name: "Cursed Revenant", baseHp: 1600, baseDmg: 100,  expReward: 205, goldReward: 95  },
  dark_sorcerer:    { name: "Dark Sorcerer",   baseHp: 1150, baseDmg: 135,  expReward: 210, goldReward: 100 },
  abyssal_fiend:    { name: "Abyssal Fiend",   baseHp: 1700, baseDmg: 105,  expReward: 220, goldReward: 105 },
  // Shadow extras
  blood_shade:      { name: "Blood Shade",      baseHp: 1300, baseDmg: 115, expReward: 195, goldReward: 90  },
  necrotic_golem:   { name: "Necrotic Golem",   baseHp: 1700, baseDmg: 100, expReward: 210, goldReward: 98  },
  void_assassin:    { name: "Void Assassin",    baseHp: 1200, baseDmg: 130, expReward: 215, goldReward: 105 },
  rift_stalker:     { name: "Rift Stalker",     baseHp: 1450, baseDmg: 122, expReward: 220, goldReward: 108 },
  shadow_dragon:    { name: "Shadow Dragon",    baseHp: 1900, baseDmg: 110, expReward: 230, goldReward: 112 },
  // Shadow Elites & Boss
  void_titan:       { name: "⚡ Void Titan",     baseHp: 18000, baseDmg: 250, expReward: 3000,  goldReward: 1500, isElite: true },
  blood_colossus:   { name: "⚡ Blood Colossus", baseHp: 22000, baseDmg: 280, expReward: 3500,  goldReward: 1800, isElite: true },
  shadow_lord:      { name: "Shadow Lord",      baseHp: 12000, baseDmg: 180, expReward: 3000,  goldReward: 1500, isBoss: true  },

  // Celestial (lv 70-100)
  celestial_guardian: { name: "Celestial Guardian", baseHp: 2200, baseDmg: 150, expReward: 350,  goldReward: 150 },
  seraph_warrior:     { name: "Seraph Warrior",     baseHp: 2600, baseDmg: 175, expReward: 400,  goldReward: 180 },
  titan:              { name: "Titan",              baseHp: 3200, baseDmg: 195, expReward: 500,  goldReward: 250 },
  star_phantom:       { name: "Star Phantom",       baseHp: 2400, baseDmg: 185, expReward: 380,  goldReward: 170 },
  nova_knight:        { name: "Nova Knight",        baseHp: 2800, baseDmg: 205, expReward: 430,  goldReward: 200 },
  divine_construct:   { name: "Divine Construct",   baseHp: 3400, baseDmg: 180, expReward: 460,  goldReward: 210 },
  astral_wyrm:        { name: "Astral Wyrm",        baseHp: 3000, baseDmg: 215, expReward: 490,  goldReward: 230 },
  cosmic_sentinel:    { name: "Cosmic Sentinel",    baseHp: 3600, baseDmg: 190, expReward: 520,  goldReward: 240 },
  // Celestial extras
  light_golem:        { name: "Light Golem",         baseHp: 2500, baseDmg: 160, expReward: 370,  goldReward: 160 },
  empyrean_shade:     { name: "Empyrean Shade",      baseHp: 2700, baseDmg: 185, expReward: 410,  goldReward: 185 },
  starfire_drake:     { name: "Starfire Drake",      baseHp: 3100, baseDmg: 200, expReward: 460,  goldReward: 215 },
  void_seraph:        { name: "Void Seraph",          baseHp: 2900, baseDmg: 210, expReward: 480,  goldReward: 225 },
  genesis_elemental:  { name: "Genesis Elemental",   baseHp: 3800, baseDmg: 195, expReward: 510,  goldReward: 240 },
  // Mud Swamps (lv 20-30)
  swamp_lurker:     { name: "Swamp Lurker",     baseHp: 480,  baseDmg: 48, expReward: 55,  goldReward: 25 },
  bog_toad:         { name: "Bog Toad",         baseHp: 420,  baseDmg: 45, expReward: 50,  goldReward: 22 },
  mud_golem:        { name: "Mud Golem",        baseHp: 600,  baseDmg: 42, expReward: 58,  goldReward: 28 },
  marsh_hag:        { name: "Marsh Hag",        baseHp: 450,  baseDmg: 55, expReward: 62,  goldReward: 30 },
  leech_swarm:      { name: "Leech Swarm",      baseHp: 380,  baseDmg: 52, expReward: 48,  goldReward: 22 },
  rotting_treant:   { name: "Rotting Treant",   baseHp: 580,  baseDmg: 46, expReward: 56,  goldReward: 26 },
  mire_crawler:     { name: "Mire Crawler",     baseHp: 500,  baseDmg: 50, expReward: 54,  goldReward: 24 },
  toxic_spore:      { name: "Toxic Spore",      baseHp: 350,  baseDmg: 58, expReward: 52,  goldReward: 24 },
  swamp_hydra:      { name: "Swamp Hydra",      baseHp: 650,  baseDmg: 48, expReward: 65,  goldReward: 32 },
  sludge_beast:     { name: "Sludge Beast",     baseHp: 550,  baseDmg: 52, expReward: 60,  goldReward: 28 },
  quicksand_wraith: { name: "Quicksand Wraith", baseHp: 460,  baseDmg: 56, expReward: 58,  goldReward: 27 },
  fungal_horror:    { name: "Fungal Horror",    baseHp: 520,  baseDmg: 54, expReward: 62,  goldReward: 30 },
  // Mud Swamps Elites & Boss
  swamp_king:       { name: "⚡ Swamp King",     baseHp: 5500,  baseDmg: 140, expReward: 800,   goldReward: 400,  isElite: true },
  ancient_hydra:    { name: "⚡ Ancient Hydra",  baseHp: 6500,  baseDmg: 155, expReward: 950,   goldReward: 475,  isElite: true },
  bog_mother:       { name: "Bog Mother",       baseHp: 3500,  baseDmg: 100, expReward: 600,   goldReward: 300,  isBoss: true  },

  // Forgotten Cave (lv 30-40)
  cave_bat:          { name: "Cave Bat",          baseHp: 650,  baseDmg: 58, expReward: 72,  goldReward: 32 },
  stone_golem:       { name: "Stone Golem",       baseHp: 900,  baseDmg: 55, expReward: 82,  goldReward: 40 },
  crystal_spider:    { name: "Crystal Spider",    baseHp: 700,  baseDmg: 65, expReward: 78,  goldReward: 36 },
  deep_dweller:      { name: "Deep Dweller",      baseHp: 750,  baseDmg: 62, expReward: 80,  goldReward: 38 },
  blind_stalker:     { name: "Blind Stalker",     baseHp: 680,  baseDmg: 70, expReward: 85,  goldReward: 40 },
  gem_beetle:        { name: "Gem Beetle",        baseHp: 600,  baseDmg: 60, expReward: 70,  goldReward: 35 },
  cave_troll:        { name: "Cave Troll",        baseHp: 950,  baseDmg: 58, expReward: 88,  goldReward: 42 },
  stalactite_mimic:  { name: "Stalactite Mimic",  baseHp: 720,  baseDmg: 68, expReward: 82,  goldReward: 38 },
  tunnel_serpent:    { name: "Tunnel Serpent",    baseHp: 780,  baseDmg: 64, expReward: 78,  goldReward: 36 },
  echo_wraith:      { name: "Echo Wraith",       baseHp: 660,  baseDmg: 72, expReward: 84,  goldReward: 40 },
  mushroom_giant:   { name: "Mushroom Giant",    baseHp: 880,  baseDmg: 56, expReward: 80,  goldReward: 38 },
  ore_elemental:    { name: "Ore Elemental",     baseHp: 820,  baseDmg: 60, expReward: 86,  goldReward: 42 },
  // Forgotten Cave Elites & Boss
  crystal_guardian:  { name: "⚡ Crystal Guardian", baseHp: 7500,  baseDmg: 165, expReward: 1100, goldReward: 550, isElite: true },
  deep_horror:       { name: "⚡ Deep Horror",      baseHp: 9000,  baseDmg: 180, expReward: 1300, goldReward: 650, isElite: true },
  cave_dragon:       { name: "Cave Dragon",        baseHp: 4800,  baseDmg: 120, expReward: 900,  goldReward: 450, isBoss: true  },

  // Dark Seas (lv 40-50)
  drowned_sailor:   { name: "Drowned Sailor",   baseHp: 1000, baseDmg: 78,  expReward: 120, goldReward: 55 },
  sea_serpent:      { name: "Sea Serpent",       baseHp: 1200, baseDmg: 85,  expReward: 135, goldReward: 62 },
  ghost_pirate:     { name: "Ghost Pirate",     baseHp: 1050, baseDmg: 90,  expReward: 130, goldReward: 60 },
  reef_golem:       { name: "Reef Golem",        baseHp: 1400, baseDmg: 75,  expReward: 140, goldReward: 65 },
  abyssal_squid:    { name: "Abyssal Squid",    baseHp: 1150, baseDmg: 88,  expReward: 132, goldReward: 60 },
  siren:            { name: "Siren",             baseHp: 950,  baseDmg: 95,  expReward: 138, goldReward: 64 },
  barnacle_fiend:   { name: "Barnacle Fiend",   baseHp: 1100, baseDmg: 82,  expReward: 125, goldReward: 58 },
  tide_elemental:   { name: "Tide Elemental",   baseHp: 1300, baseDmg: 80,  expReward: 142, goldReward: 66 },
  shark_spirit:     { name: "Shark Spirit",     baseHp: 1250, baseDmg: 92,  expReward: 145, goldReward: 68 },
  coral_wraith:     { name: "Coral Wraith",     baseHp: 1050, baseDmg: 86,  expReward: 128, goldReward: 58 },
  deep_angler:      { name: "Deep Angler",      baseHp: 1180, baseDmg: 90,  expReward: 136, goldReward: 62 },
  phantom_kraken:   { name: "Phantom Kraken",   baseHp: 1500, baseDmg: 84,  expReward: 150, goldReward: 70 },
  // Dark Seas Elites & Boss
  leviathan:        { name: "⚡ Leviathan",      baseHp: 14000, baseDmg: 220, expReward: 2200, goldReward: 1100, isElite: true },
  ghost_captain:    { name: "⚡ Ghost Captain",  baseHp: 16000, baseDmg: 240, expReward: 2500, goldReward: 1250, isElite: true },
  kraken_lord:      { name: "Kraken Lord",      baseHp: 9000,  baseDmg: 155, expReward: 1800, goldReward: 900,  isBoss: true  },

  // Volcano's Path (lv 60-70)
  lava_golem:       { name: "Lava Golem",       baseHp: 1800, baseDmg: 115, expReward: 200, goldReward: 92  },
  fire_imp:         { name: "Fire Imp",         baseHp: 1400, baseDmg: 125, expReward: 185, goldReward: 85  },
  magma_serpent:    { name: "Magma Serpent",    baseHp: 1650, baseDmg: 120, expReward: 210, goldReward: 98  },
  volcanic_drake:   { name: "Volcanic Drake",   baseHp: 1900, baseDmg: 118, expReward: 225, goldReward: 105 },
  ember_elemental:  { name: "Ember Elemental",  baseHp: 1550, baseDmg: 128, expReward: 215, goldReward: 100 },
  infernal_hound:   { name: "Infernal Hound",   baseHp: 1500, baseDmg: 130, expReward: 195, goldReward: 90  },
  ash_wraith:       { name: "Ash Wraith",       baseHp: 1450, baseDmg: 132, expReward: 205, goldReward: 95  },
  obsidian_knight:  { name: "Obsidian Knight",  baseHp: 2000, baseDmg: 112, expReward: 230, goldReward: 108 },
  flame_djinn:      { name: "Flame Djinn",      baseHp: 1600, baseDmg: 138, expReward: 220, goldReward: 102 },
  molten_spider:    { name: "Molten Spider",    baseHp: 1350, baseDmg: 125, expReward: 190, goldReward: 88  },
  pyroclast_titan:  { name: "Pyroclast Titan",  baseHp: 2100, baseDmg: 110, expReward: 235, goldReward: 110 },
  cinder_shade:     { name: "Cinder Shade",     baseHp: 1500, baseDmg: 135, expReward: 208, goldReward: 96  },
  // Volcano's Path Elites & Boss
  magma_lord:       { name: "⚡ Magma Lord",     baseHp: 20000, baseDmg: 260, expReward: 3200, goldReward: 1600, isElite: true },
  infernal_dragon:  { name: "⚡ Infernal Dragon", baseHp: 24000, baseDmg: 290, expReward: 3800, goldReward: 1900, isElite: true },
  volcano_guardian: { name: "Volcano Guardian", baseHp: 14000, baseDmg: 195, expReward: 2800, goldReward: 1400, isBoss: true  },

  // Crystal Lands (lv 70-80)
  crystal_sentinel:  { name: "Crystal Sentinel",  baseHp: 2200, baseDmg: 150, expReward: 350, goldReward: 150 },
  prism_golem:       { name: "Prism Golem",        baseHp: 2600, baseDmg: 145, expReward: 380, goldReward: 170 },
  gem_wyrm:          { name: "Gem Wyrm",            baseHp: 2800, baseDmg: 160, expReward: 400, goldReward: 180 },
  refraction_spirit: { name: "Refraction Spirit",  baseHp: 2100, baseDmg: 170, expReward: 370, goldReward: 165 },
  shard_elemental:   { name: "Shard Elemental",    baseHp: 2400, baseDmg: 155, expReward: 360, goldReward: 160 },
  diamond_spider:    { name: "Diamond Spider",     baseHp: 2300, baseDmg: 165, expReward: 375, goldReward: 168 },
  amethyst_knight:   { name: "Amethyst Knight",    baseHp: 2700, baseDmg: 158, expReward: 395, goldReward: 178 },
  quartz_phantom:    { name: "Quartz Phantom",     baseHp: 2150, baseDmg: 175, expReward: 385, goldReward: 172 },
  opal_shade:        { name: "Opal Shade",          baseHp: 2350, baseDmg: 168, expReward: 378, goldReward: 170 },
  ruby_construct:    { name: "Ruby Construct",     baseHp: 2900, baseDmg: 152, expReward: 410, goldReward: 185 },
  sapphire_serpent:  { name: "Sapphire Serpent",   baseHp: 2500, baseDmg: 172, expReward: 390, goldReward: 175 },
  topaz_guardian:    { name: "Topaz Guardian",     baseHp: 3000, baseDmg: 148, expReward: 420, goldReward: 190 },
  // Crystal Lands Elites & Boss
  crystal_colossus:  { name: "⚡ Crystal Colossus",  baseHp: 35000, baseDmg: 340, expReward: 8000,  goldReward: 4000, isElite: true },
  prismatic_dragon:  { name: "⚡ Prismatic Dragon",  baseHp: 42000, baseDmg: 370, expReward: 9500,  goldReward: 4750, isElite: true },
  crystal_overlord:  { name: "Crystal Overlord",    baseHp: 25000, baseDmg: 250, expReward: 6500,  goldReward: 3250, isBoss: true  },

  // Celestial Spire (lv 80-90)
  celestial_guardian: { name: "Celestial Guardian", baseHp: 2200, baseDmg: 150, expReward: 350,  goldReward: 150 },
  seraph_warrior:     { name: "Seraph Warrior",     baseHp: 2600, baseDmg: 175, expReward: 400,  goldReward: 180 },
  titan:              { name: "Titan",              baseHp: 3200, baseDmg: 195, expReward: 500,  goldReward: 250 },
  star_phantom:       { name: "Star Phantom",       baseHp: 2400, baseDmg: 185, expReward: 380,  goldReward: 170 },
  nova_knight:        { name: "Nova Knight",        baseHp: 2800, baseDmg: 205, expReward: 430,  goldReward: 200 },
  divine_construct:   { name: "Divine Construct",   baseHp: 3400, baseDmg: 180, expReward: 460,  goldReward: 210 },
  astral_wyrm:        { name: "Astral Wyrm",        baseHp: 3000, baseDmg: 215, expReward: 490,  goldReward: 230 },
  cosmic_sentinel:    { name: "Cosmic Sentinel",    baseHp: 3600, baseDmg: 190, expReward: 520,  goldReward: 240 },
  light_golem:        { name: "Light Golem",         baseHp: 2500, baseDmg: 160, expReward: 370,  goldReward: 160 },
  empyrean_shade:     { name: "Empyrean Shade",      baseHp: 2700, baseDmg: 185, expReward: 410,  goldReward: 185 },
  starfire_drake:     { name: "Starfire Drake",      baseHp: 3100, baseDmg: 200, expReward: 460,  goldReward: 215 },
  void_seraph:        { name: "Void Seraph",          baseHp: 2900, baseDmg: 210, expReward: 480,  goldReward: 225 },
  genesis_elemental:  { name: "Genesis Elemental",   baseHp: 3800, baseDmg: 195, expReward: 510,  goldReward: 240 },
  // Celestial Spire Elites & Boss
  celestial_titan:  { name: "⚡ Celestial Titan",  baseHp: 45000, baseDmg: 380, expReward: 12000, goldReward: 6000, isElite: true },
  omega_seraph:     { name: "⚡ Omega Seraph",      baseHp: 55000, baseDmg: 420, expReward: 14000, goldReward: 7000, isElite: true },
  cosmic_overlord:  { name: "Cosmic Overlord",     baseHp: 32000, baseDmg: 280, expReward: 10000, goldReward: 5000, isBoss: true  },

  // Tamma's Castle (lv 90-100)
  castle_knight:     { name: "Castle Knight",     baseHp: 4000, baseDmg: 230, expReward: 600,   goldReward: 280 },
  dark_paladin:      { name: "Dark Paladin",      baseHp: 4500, baseDmg: 250, expReward: 650,   goldReward: 300 },
  throne_guardian:   { name: "Throne Guardian",   baseHp: 5000, baseDmg: 240, expReward: 700,   goldReward: 320 },
  cursed_duke:       { name: "Cursed Duke",       baseHp: 4200, baseDmg: 260, expReward: 680,   goldReward: 310 },
  royal_revenant:    { name: "Royal Revenant",    baseHp: 4400, baseDmg: 255, expReward: 660,   goldReward: 305 },
  shadow_vizier:     { name: "Shadow Vizier",     baseHp: 3800, baseDmg: 280, expReward: 720,   goldReward: 340 },
  doom_sentinel:     { name: "Doom Sentinel",     baseHp: 5200, baseDmg: 245, expReward: 740,   goldReward: 350 },
  fallen_champion:   { name: "Fallen Champion",   baseHp: 4800, baseDmg: 265, expReward: 730,   goldReward: 345 },
  void_prince:       { name: "Void Prince",       baseHp: 4600, baseDmg: 275, expReward: 750,   goldReward: 355 },
  death_bishop:      { name: "Death Bishop",      baseHp: 4100, baseDmg: 285, expReward: 710,   goldReward: 335 },
  chaos_warden:      { name: "Chaos Warden",      baseHp: 5400, baseDmg: 255, expReward: 760,   goldReward: 360 },
  nightmare_lord:    { name: "Nightmare Lord",    baseHp: 4700, baseDmg: 270, expReward: 740,   goldReward: 348 },
  // Tamma's Castle Elites & Boss
  arch_demon:        { name: "⚡ Arch Demon",      baseHp: 60000, baseDmg: 450, expReward: 16000, goldReward: 8000,  isElite: true },
  eternal_guardian:  { name: "⚡ Eternal Guardian", baseHp: 70000, baseDmg: 480, expReward: 18000, goldReward: 9000,  isElite: true },
  tamma_the_fallen:  { name: "Tamma the Fallen",  baseHp: 100000,baseDmg: 500, expReward: 25000, goldReward: 12500, isBoss: true  },
};

// ===== SHOP ITEMS =====
export const SHOP_ITEMS = [
  // Warrior weapons
  { name: "Iron Sword",       type: "weapon", subtype: "sword",   rarity: "common",   stats: { damage: 10, strength: 3 },                    buy_price: 100,  icon: "Sword",     class_restriction: ["warrior"] },
  { name: "Steel Axe",        type: "weapon", subtype: "axe",     rarity: "uncommon", stats: { damage: 28, strength: 7 },                    buy_price: 550,  icon: "Sword",     class_restriction: ["warrior"] },
  // Mage weapons
  { name: "Apprentice Staff", type: "weapon", subtype: "staff",   rarity: "common",   stats: { damage: 8, intelligence: 5 },                 buy_price: 100,  icon: "Sparkles",  class_restriction: ["mage"] },
  { name: "Arcane Wand",      type: "weapon", subtype: "wand",    rarity: "uncommon", stats: { damage: 20, intelligence: 10, mp_bonus: 15 }, buy_price: 550,  icon: "Sparkles",  class_restriction: ["mage"] },
  // Ranger weapons
  { name: "Short Bow",        type: "weapon", subtype: "bow",     rarity: "common",   stats: { damage: 9, dexterity: 4 },                    buy_price: 100,  icon: "Crosshair", class_restriction: ["ranger"] },
  { name: "Hunter's Bow",     type: "weapon", subtype: "bow",     rarity: "uncommon", stats: { damage: 22, dexterity: 8 },                   buy_price: 550,  icon: "Crosshair", class_restriction: ["ranger"] },
  // Rogue weapons
  { name: "Sharp Dagger",     type: "weapon", subtype: "dagger",  rarity: "common",   stats: { damage: 8, dexterity: 4, luck: 2 },           buy_price: 100,  icon: "Sword",     class_restriction: ["rogue"] },
  { name: "Twin Blades",      type: "weapon", subtype: "blade",   rarity: "uncommon", stats: { damage: 20, dexterity: 9, crit_chance: 3 },   buy_price: 550,  icon: "Sword",     class_restriction: ["rogue"] },
  // Universal armor
  { name: "Leather Armor",    type: "armor",  subtype: "light",   rarity: "common",   stats: { defense: 8, vitality: 3 },                    buy_price: 120,  icon: "Shield" },
  { name: "Chainmail",        type: "armor",  subtype: "medium",  rarity: "uncommon", stats: { defense: 20, vitality: 6 },                   buy_price: 600,  icon: "Shield" },
  // Consumables
  { name: "Health Potion",    type: "consumable", rarity: "common", stats: { hp_bonus: 50 },  buy_price: 25, icon: "Heart" },
  { name: "Mana Potion",      type: "consumable", rarity: "common", stats: { mp_bonus: 30 },  buy_price: 25, icon: "Droplets" },
  // Universal accessories
  { name: "Lucky Ring",       type: "ring",   rarity: "rare",     stats: { luck: 10 },                                                       buy_price: 1500, icon: "CircleDot" },
  { name: "Mage's Hood",      type: "helmet", rarity: "uncommon", stats: { intelligence: 8, mp_bonus: 20 },                                  buy_price: 400,  icon: "Crown" },
  { name: "Speed Boots",      type: "boots",  rarity: "uncommon", stats: { dexterity: 7 },                                                   buy_price: 450,  icon: "Footprints" },
  { name: "Dragon Amulet",    type: "amulet", rarity: "epic",     stats: { strength: 12, intelligence: 12, vitality: 8 },                   buy_price: 5000, icon: "Gem" },
];

// ===== LOOT TABLES (legacy - kept for reference, replaced by ZONE_LOOT) =====
// DO NOT USE - use generateLoot() instead
const _LEGACY_LOOT_TABLE = {
  common: {
    chance: 0.14,
    items: [
      // Forest (lv1-10)
      ["Rusty Dagger", "weapon", 1],
      ["Worn Shortbow", "weapon", 1],
      ["Torn Cloak", "armor", 1],
      ["Wooden Shield", "armor", 1],
      ["Cracked Ring", "ring", 1],
      ["Old Boots", "boots", 1],
      ["Frayed Helmet", "helmet", 1],
      ["Hemp Amulet", "amulet", 1],
      // Desert (lv10+)
      ["Bone Club", "weapon", 10],
      ["Sand Wrap Armor", "armor", 10],
      ["Copper Ring", "ring", 10],
      ["Traveler's Boots", "boots", 10],
      ["Desert Wrap", "helmet", 10],
      // Frozen (lv25+)
      ["Frost Spear", "weapon", 25],
      ["Padded Coat", "armor", 25],
      ["Tin Circlet", "ring", 25],
      ["Fur Boots", "boots", 25],
      ["Wool Cap", "helmet", 25],
      // Shadow (lv45+)
      ["Cracked Obsidian Dagger", "weapon", 45],
      ["Tattered Shadow Robe", "armor", 45],
      ["Dim Ring", "ring", 45],
      ["Shadowwalker Sandals", "boots", 45],
      // Celestial (lv70+)
      ["Fractured Starblade", "weapon", 70],
      ["Pale Celestial Wrap", "armor", 70],
      ["Faint Amulet of Stars", "amulet", 70],
    ]
  },
  uncommon: {
    chance: 0.07,
    items: [
      // Forest
      ["Iron Sword", "weapon", 1],
      ["Hunter's Bow", "weapon", 1],
      ["Reinforced Cloak", "armor", 1],
      ["Silver Ring", "ring", 1],
      ["Leather Boots", "boots", 1],
      ["Iron Helmet", "helmet", 1],
      ["Jade Amulet", "amulet", 1],
      // Desert
      ["Scimitar", "weapon", 10],
      ["Scorpion Staff", "weapon", 10],
      ["Bandit's Chainmail", "armor", 10],
      ["Amber Ring", "ring", 10],
      ["Sand Dancer Boots", "boots", 10],
      ["Dune Helm", "helmet", 10],
      ["Desert Fox Amulet", "amulet", 10],
      // Frozen
      ["Ice Pick", "weapon", 25],
      ["Frost Wand", "weapon", 25],
      ["Bear Hide Armor", "armor", 25],
      ["Sapphire Ring", "ring", 25],
      ["Snowtreader Boots", "boots", 25],
      ["Yeti Skull Helm", "helmet", 25],
      ["Frozen Amulet", "amulet", 25],
      // Shadow
      ["Shadow Blade", "weapon", 45],
      ["Void Wand", "weapon", 45],
      ["Darkweave Armor", "armor", 45],
      ["Obsidian Ring", "ring", 45],
      ["Phantom Boots", "boots", 45],
      ["Shroud Helm", "helmet", 45],
      ["Soul Charm", "amulet", 45],
      // Celestial
      ["Starforged Sword", "weapon", 70],
      ["Celestial Longbow", "weapon", 70],
      ["Astral Robe", "armor", 70],
      ["Nebula Ring", "ring", 70],
      ["Skywalker Boots", "boots", 70],
      ["Halo Helm", "helmet", 70],
      ["Comet Amulet", "amulet", 70],
    ]
  },
  rare: {
    chance: 0.03,
    items: [
      // Forest
      ["Elven Blade", "weapon", 1],
      ["Mystic Staff", "weapon", 1],
      ["Shadow Cloak", "armor", 1],
      ["Emerald Ring", "ring", 1],
      ["Swift Boots", "boots", 1],
      ["War Helm", "helmet", 1],
      ["Forest Spirit Amulet", "amulet", 1],
      // Desert
      ["Flame Sword", "weapon", 10],
      ["Sun Staff", "weapon", 10],
      ["Sunscale Armor", "armor", 10],
      ["Topaz Ring", "ring", 10],
      ["Dunerunner Boots", "boots", 10],
      ["Pharaoh's Crown", "helmet", 10],
      ["Scarab Amulet", "amulet", 10],
      // Frozen
      ["Crystal Staff", "weapon", 25],
      ["Glacial Axe", "weapon", 25],
      ["Permafrost Armor", "armor", 25],
      ["Frost Ring", "ring", 25],
      ["Icestep Greaves", "boots", 25],
      ["Dragon Ice Helm", "helmet", 25],
      ["Blizzard Amulet", "amulet", 25],
      // Shadow
      ["Nightmare Blade", "weapon", 45],
      ["Hex Scepter", "weapon", 45],
      ["Voidweave Armor", "armor", 45],
      ["Shadow Ring", "ring", 45],
      ["Duskstrider Boots", "boots", 45],
      ["Horned Shadow Helm", "helmet", 45],
      ["Rift Amulet", "amulet", 45],
      // Celestial
      ["Nova Sword", "weapon", 70],
      ["Pulsar Staff", "weapon", 70],
      ["Stardust Armor", "armor", 70],
      ["Quasar Ring", "ring", 70],
      ["Aurora Boots", "boots", 70],
      ["Starlight Crown", "helmet", 70],
      ["Zodiac Amulet", "amulet", 70],
    ]
  },
  epic: {
    chance: 0.008,
    items: [
      // Forest
      ["Serpent Fang", "weapon", 1],
      ["Arcane Rod", "weapon", 1],
      ["Druidic Bark Armor", "armor", 1],
      ["Ring of Growth", "ring", 1],
      ["Thornstep Boots", "boots", 1],
      ["Antler Crown", "helmet", 1],
      ["Nature's Amulet", "amulet", 1],
      // Desert
      ["Dragon Fang", "weapon", 10],
      ["Sunfire Scimitar", "weapon", 10],
      ["Sandstorm Platemail", "armor", 10],
      ["Ring of the Sun", "ring", 10],
      ["Miragewalker Boots", "boots", 10],
      ["Warlord's Helm", "helmet", 10],
      ["Phoenix Amulet", "amulet", 10],
      // Frozen
      ["Arcane Scepter", "weapon", 25],
      ["Frostbite Axe", "weapon", 25],
      ["Glacier Plate", "armor", 25],
      ["Diamond Ring", "ring", 25],
      ["Frostwalker Boots", "boots", 25],
      ["Crown of Thorns", "helmet", 25],
      ["Avalanche Amulet", "amulet", 25],
      // Shadow
      ["Soul Reaper", "weapon", 45],
      ["Void Blade", "weapon", 45],
      ["Soulshred Armor", "armor", 45],
      ["Ring of Void", "ring", 45],
      ["Shadowstep Boots", "boots", 45],
      ["Lich Crown", "helmet", 45],
      ["Amulet of Despair", "amulet", 45],
      // Celestial
      ["Godslayer", "weapon", 70],
      ["Celestial Scepter", "weapon", 70],
      ["Divine Plate", "armor", 70],
      ["Ring of Stars", "ring", 70],
      ["Voidwalker Boots", "boots", 70],
      ["Titan Helm", "helmet", 70],
      ["Supernova Amulet", "amulet", 70],
    ]
  },
  legendary: {
    chance: 0.002,
    items: [
      // Forest / early
      ["Excalibur", "weapon", 1],
      ["Arcanist's Tome", "weapon", 1],
      ["Aegis of Light", "armor", 1],
      ["Ring of Eternity", "ring", 1],
      ["Boots of Hermes", "boots", 1],
      ["Crown of Gods", "helmet", 1],
      ["Amulet of the Ancients", "amulet", 1],
      // Desert / mid
      ["Sunblade of Ra", "weapon", 10],
      ["Staff of the Oasis", "weapon", 10],
      ["Pharaoh's Immortal Plate", "armor", 10],
      ["Eye of Ra", "amulet", 10],
      ["Sandstorm Greaves", "boots", 10],
      // Frozen / mid
      ["Staff of Eternity", "weapon", 25],
      ["Frostfire Greatsword", "weapon", 25],
      ["Glacial Fortress Armor", "armor", 25],
      ["Ring of the North", "ring", 25],
      ["Blizzard Crown", "helmet", 25],
      ["Permafrost Amulet", "amulet", 25],
      // Shadow / high
      ["Shadowmourne", "weapon", 45],
      ["Oblivion Staff", "weapon", 45],
      ["Armor of the Void", "armor", 45],
      ["Ring of Oblivion", "ring", 45],
      ["Wraith Crown", "helmet", 45],
      ["Amulet of the Lich King", "amulet", 45],
      // Celestial / endgame
      ["Cosmic Blade", "weapon", 70],
      ["Genesis Staff", "weapon", 70],
      ["Celestial Godplate", "armor", 70],
      ["Ring of the Cosmos", "ring", 70],
      ["Starwalker Boots", "boots", 70],
      ["Halo of Divinity", "helmet", 70],
      ["Amulet of Creation", "amulet", 70],
    ]
  }
};

// ===== RARITY CONFIG (8 tiers) =====
export const RARITY_CONFIG = {
  common:    { color: "text-gray-400",   bg: "bg-gray-500/20",    border: "border-gray-500/30",    label: "Common",    order: 0 },
  uncommon:  { color: "text-green-400",  bg: "bg-green-500/20",   border: "border-green-500/30",   label: "Uncommon",  order: 1 },
  rare:      { color: "text-blue-400",   bg: "bg-blue-500/20",    border: "border-blue-500/30",    label: "Rare",      order: 2 },
  epic:      { color: "text-purple-400", bg: "bg-purple-500/20",  border: "border-purple-500/30",  label: "Epic",      order: 3 },
  legendary: { color: "text-orange-400", bg: "bg-orange-500/20",  border: "border-orange-500/30",  label: "Legendary", order: 4 },
  mythic:    { color: "text-red-400",    bg: "bg-red-500/20",     border: "border-red-500/30",     label: "Mythic",    order: 5 },
  set:       { color: "text-cyan-300",   bg: "bg-cyan-500/20",    border: "border-cyan-400/60",    label: "⚔️ Set",   order: 6, animated: true },
  shiny:     { color: "text-yellow-300", bg: "bg-yellow-400/20",  border: "border-yellow-400/40",  label: "✨ Shiny",  order: 7, animated: true },
};

// ===== EQUIPMENT SYSTEM RE-EXPORTS =====
export {
  calculateTotalStats,
  canEquipItem,
  EQUIPMENT_SLOTS,
  SLOT_LABELS,
  CLASS_WEAPON_SUBTYPES,
  CLASS_ARMOR_WEIGHT,
  CLASS_HELMET_WEIGHT,
  ARMOR_WEIGHT_LABELS,
  SUBTYPE_CLASS_RESTRICTIONS,
  WEAPON_SUBTYPE_BY_CLASS,
  TYPE_STAT_POOLS,
  RARITY_STAT_MULTIPLIERS,
  RARITY_SELL_PRICES,
} from "./equipmentSystem.js";

// ===== STAT SYSTEM RE-EXPORTS =====
export { calculateFinalStats, rollDamage, mitigateDamage, VIT_TO_HP, INT_TO_MP } from "./statSystem.js";
import {
  generateItemStats as _generateItemStats,
  RARITY_SELL_PRICES as _SELL_PRICES,
  TYPE_STAT_POOLS as _TYPE_STAT_POOLS,
} from "./equipmentSystem.js";
import { ZONE_SET_DROPS, generateSetItemStats, ITEM_NAME_TO_SET, ITEM_SETS } from "./setSystem.js";

// ===== ZONE LOOT CONFIG =====
// Weights sum to ~100. Set items and Shiny are ultra-rare at all tiers.
export const ZONE_LOOT = {
  verdant_forest:  { levelRange: [1, 10],   itemLevelRange: [1, 12],   weights: { common: 66, uncommon: 24, rare: 7,  epic: 2.5, legendary: 0.4,  mythic: 0.06, set: 0.02,  shiny: 0.02 } },
  scorched_desert: { levelRange: [10, 25],  itemLevelRange: [11, 28],  weights: { common: 61, uncommon: 26, rare: 9,  epic: 3.5, legendary: 0.4,  mythic: 0.06, set: 0.02,  shiny: 0.02 } },
  frozen_peaks:    { levelRange: [25, 45],  itemLevelRange: [27, 48],  weights: { common: 56, uncommon: 28, rare: 12, epic: 3.5, legendary: 0.4,  mythic: 0.07, set: 0.02,  shiny: 0.01 } },
  shadow_realm:    { levelRange: [45, 70],  itemLevelRange: [47, 75],  weights: { common: 52, uncommon: 29, rare: 14, epic: 4.5, legendary: 0.4,  mythic: 0.08, set: 0.02,  shiny: 0.02 } },
  celestial_spire: { levelRange: [70, 100], itemLevelRange: [72, 105], weights: { common: 48, uncommon: 30, rare: 17, epic: 4.5, legendary: 0.4,  mythic: 0.08, set: 0.01,  shiny: 0.01 } },
};

// Boss loot: shifts weights toward rare+ for guaranteed quality drops
const BOSS_WEIGHT_BONUS = { common: -25, uncommon: -12, rare: 15, epic: 15, legendary: 10, mythic: 5, set: 5, shiny: 1 };

// Item name pools per zone, type, and subtype
// Weapons keyed by subtype for class-specific loot; armor keyed by weight
const ITEM_NAMES = {
  verdant_forest: {
    weapon: {
      sword:   ["Rusty Shortsword","Iron Sword","Elven Blade","Verdant Edge","Excalibur Jr.","Thornblade","Forest Sentinel","Mossvine Cutter","Oakwood Edge","Growthblade","Warden's Sword","Spiritwood Saber","Leafsteel Blade","Verdant Cleaver","Grove Guardian"],
      axe:     ["Stone Hatchet","Iron Axe","Woodcutter's Axe","Forest Cleaver","Thornwood Axe","Bark Splitter","Grovebreaker","Timber Wolf Axe","Pinewood Chopper"],
      mace:    ["Wooden Club","Iron Mace","Mossy Flail","Grove Hammer","Stump Crusher","Bark Mallet","Root Basher","Thorn Mace","Elder Branch Mace"],
      staff:   ["Gnarled Branch","Mystic Staff","Arcane Rod","Arcanist's Tome","Nature Staff","Druid's Focus","Seedling Staff","Vine Coil Staff","Forest Oracle's Rod","Bloom Staff"],
      wand:    ["Twig Wand","Vine Wand","Bark Wand","Petal Wand","Leaf Focus","Moss Wand","Fernwhisper"],
      bow:     ["Worn Shortbow","Hunter's Bow","Elven Longbow","Thornbow","Greenwood Recurve","Dryad's Bow","Canopy Shortbow","Bramble Bow","Willow Longbow","Swift Hunter"],
      crossbow:["Makeshift Crossbow","Ranger Crossbow","Thornshot Crossbow","Forestguard Repeater","Branch Crossbow"],
      dagger:  ["Rusty Dagger","Bone Knife","Serpent Fang","Forest Shiv","Thornprick","Moss Shard","Nettle Blade","Briar Dagger","Bark Dagger","Grove Stiletto"],
      blade:   ["Jagged Blade","Broken Shortsword","Leaf Blade","Split Fang","Thorn Kris","Vine Cutter","Undergrowth Blade"],
    },
    armor:  {
      heavy:  ["Iron Chestplate","Forest Platemail","Guardsman's Plate","Thornskin Mail","Barkplate Armor","Mossvine Plate","Forest Sentinel Plate","Warden's Cuirass","Ironwood Mail"],
      medium: ["Reinforced Cloak","Forestweave Tunic","Scout's Jerkin","Hunter's Vest","Thornweave Coat","Ranger's Leathers","Dryad's Guard","Trailblazer's Coat","Sylvan Mail"],
      light:  ["Torn Cloak","Druidic Bark Armor","Mossy Robe","Aegis of Light","Nature's Vestment","Leafweave Robe","Grove Mantle","Bloom Wrap","Druid's Shroud"],
    },
    helmet: {
      plate_helm:  ["Iron Helmet","War Helm","Bark Helm","Thornwood Cap","Greenleaf Helm","Forest Sentinel Helm","Iron Cap","Warden's Helm","Oaken Greathelm"],
      leather_helm:["Ranger's Hood","Antler Crown","Forest Cowl","Scout's Cap","Trailblazer Hood","Dryad's Circlet","Wildhunter Cap","Leatherbark Cap"],
      cloth_helm:  ["Frayed Helmet","Leaf Circlet","Vine Wreath","Dryad's Diadem","Moss Cap","Grove Veil","Mystic Hood","Druid's Crown","Nature's Circlet"],
    },
    gloves: ["Tattered Gloves","Leather Gauntlets","Iron Grips","Mossy Handwraps","Thorngrip Gloves","Bark Gauntlets","Scout's Wraps","Dryad's Mitts","Forestweave Gloves","Warden's Grips"],
    boots:  ["Old Boots","Leather Boots","Swift Boots","Thornstep Boots","Forest Treads","Mosswalk Sandals","Dryad's Slippers","Pathfinder Boots","Root-step Greaves","Undergrowth Treads"],
    ring:   ["Cracked Ring","Silver Ring","Emerald Ring","Ring of Growth","Vine Ring","Leaf Band","Forest Spirit Ring","Thornweave Band","Bark Circle","Moss Ring","Nature's Seal"],
    amulet: ["Hemp Amulet","Jade Amulet","Forest Spirit Amulet","Nature's Amulet","Leaf Pendant","Acorn Charm","Dryad's Locket","Grove Heart","Seedling Talisman","Verdant Soul"],
  },
  scorched_desert: {
    weapon: {
      sword:   ["Scimitar","Flame Sword","Dragon Fang","Sunfire Scimitar","Sunblade of Ra","Desert Fang","Searing Edge","Dune Cutter","Tomb Sword","Heatwave Saber","Sandstorm Blade","Pharaoh's Khopesh","Oasis Sword","Burnished Blade","Desert Warden"],
      axe:     ["Bone Axe","Sand Cleaver","Dune Splitter","Sunfire Hatchet","Tomb Raider's Axe","Scorpion Axe","Heat Cleaver","Blazing Axe","Dune Breaker"],
      mace:    ["Bone Club","Desert Flail","Sandstone Hammer","Sunscorch Mace","Tomb Basher","Ember Mace","Scorpion Flail","Sun Hammer","Dune Crusher"],
      staff:   ["Scorpion Staff","Sun Staff","Staff of the Oasis","Sandfire Scepter","Pharaoh's Rod","Sunscorch Staff","Heat Conduit","Tomb Oracle","Ember Staff","Mirage Staff"],
      wand:    ["Desert Wand","Sun Wand","Amber Wand","Heatwave Focus","Sandfire Wand","Searing Wand","Oasis Focus","Solaris Rod"],
      bow:     ["Desert Longbow","Sandstorm Bow","Hunter's Recurve","Scorpion Bow","Dune Recurve","Heatwave Longbow","Tomb Hunter","Sun Stalker","Blazing Bow","Mirage Recurve"],
      crossbow:["Sand Crossbow","Bandit Crossbow","Scorpion Repeater","Sunfire Crossbow","Dune Ballista","Tomb Shooter"],
      dagger:  ["Curved Knife","Sand Fang","Scorpion Stinger","Viper Blade","Sun Stiletto","Heat Shard","Dune Fang","Tomb Dagger","Ember Dagger","Oasis Shiv"],
      blade:   ["Bandit's Blade","Desert Kris","Heat Blade","Sandstorm Cutter","Tomb Kris","Dune Edge","Blazing Blade"],
    },
    armor:  {
      heavy:  ["Sunscale Platemail","Sandstorm Platemail","Pharaoh's Immortal Plate","Scorched Iron Plate","Dune Knight's Armor","Heatforged Mail","Tomb Guardian Plate","Sunward Cuirass","Blazeguard Plate"],
      medium: ["Bandit's Chainmail","Dune Guard Vest","Sandweave Coat","Scorpion Scale Mail","Desert Raider's Vest","Heat-Treated Leather","Dune Scout Coat","Oasis Vest","Amber Chain"],
      light:  ["Sand Wrap Armor","Heatweave Robe","Desert Wraps","Pharaoh's Linen","Sun Vestment","Dune Silk Robe","Oasis Mantle","Sandstorm Shroud","Mirage Robes"],
    },
    helmet: {
      plate_helm:  ["Dune Helm","Pharaoh's Crown","Warlord's Helm","Scarab Visage","Sun Helm","Blazeguard Helm","Sandstone Greathelm","Tomb Guardian Helm"],
      leather_helm:["Desert Wrap","Oasis Hood","Scorpion Crown","Heat Cap","Dune Circlet","Sand Tracker Hood","Desert Scout Cap","Sunrunner's Cowl"],
      cloth_helm:  ["Tomb Mask","Desert Cowl","Heatwave Veil","Mirage Hood","Sandweave Circlet","Oasis Veil","Sun Mystic Crown","Pharaoh's Wraps"],
    },
    gloves: ["Sand Gauntlets","Scorpion Grips","Warlord's Gloves","Dune Handwraps","Sunfire Mitts","Tomb Grips","Heatforged Gauntlets","Desert Scout's Gloves","Oasis Wraps","Blazing Grips"],
    boots:  ["Traveler's Boots","Sand Dancer Boots","Dunerunner Boots","Miragewalker Boots","Heatstep Sandals","Tomb Treads","Sunward Boots","Oasis Sandals","Dune Sprint Boots","Scorpion Treads"],
    ring:   ["Copper Ring","Amber Ring","Topaz Ring","Ring of the Sun","Oasis Band","Scorpion Band","Pharaoh's Seal","Sunfire Ring","Desert Heart","Tomb Band","Ember Ring"],
    amulet: ["Desert Fox Amulet","Scarab Amulet","Phoenix Amulet","Eye of Ra","Sun Pendant","Tomb Talisman","Scorpion Charm","Dune Heart","Oasis Locket","Solar Crest","Pharaoh's Pendant"],
  },
  frozen_peaks: {
    weapon: {
      sword:   ["Frostfire Greatsword","Icefang Blade","Glacial Sword","Permafrost Edge","Tundra Saber","Frozen Warden","Cryoblade","Blizzard Cutter","Glacier Edge","Winter's Bite","Snowpeak Sword","Frostguard Blade","Iceforged Longsword","Coldheart Saber","Tundra Sentinel"],
      axe:     ["Glacial Axe","Frostbite Axe","Ice Splitter","Yeti's Cleaver","Blizzard Hatchet","Frozen Chopper","Tundra Axe","Icecrack Cleaver","Snowpeak Axe","Frostborn Axe"],
      mace:    ["Frost Hammer","Ice Club","Glacial Mace","Blizzard Mallet","Tundra Basher","Permafrost Mace","Icecap Hammer","Frozen Flail","Snowcrush"],
      staff:   ["Frost Wand-Staff","Crystal Staff","Arcane Scepter","Staff of Eternity","Blizzard Staff","Permafrost Conduit","Tundra Oracle","Glacial Focus","Ice Witch's Rod","Cryomancer Staff","Snowstorm Staff"],
      wand:    ["Ice Wand","Crystal Wand","Blizzard Focus","Frost Focus","Tundra Wand","Snowshard Wand","Cryovein Wand","Glacial Rod"],
      bow:     ["Frost Bow","Ice Longbow","Snowstorm Bow","Glacial Recurve","Blizzard Bow","Tundra Longbow","Permafrost Bow","Yeti Hunter","Snowpeak Recurve","Froststring Bow"],
      crossbow:["Glacial Crossbow","Ice Hunter","Blizzard Repeater","Tundra Ballista","Frostshot Crossbow","Snowpeak Repeater"],
      dagger:  ["Ice Shard Dagger","Frost Shiv","Icicle Blade","Blizzard Dagger","Frostfang","Glacial Stiletto","Tundra Shiv","Snowpeak Blade","Cryoshard Dagger","Frozen Fang"],
      blade:   ["Frozen Kris","Blizzard Blade","Frostbite Knife","Iceweave Kris","Tundra Cutter","Glacial Edge","Snowpeak Blade"],
    },
    armor:  {
      heavy:  ["Permafrost Armor","Glacier Plate","Glacial Fortress Armor","Iceguard Plate","Blizzard Knight's Mail","Frostforged Plate","Tundra Sentinel Armor","Ice Warden Mail","Snowpeak Cuirass","Frozen Titan's Plate"],
      medium: ["Bear Hide Armor","Frostweave Coat","Snowhunter's Vest","Blizzard Scout Mail","Tundra Ranger Coat","Glacial Chain Vest","Ice Tracker's Garb","Permafrost Leather","Yeti Fur Coat"],
      light:  ["Padded Coat","Frostweave Robe","Blizzard Robes","Glacial Silk Vestment","Tundra Mystic Robes","Ice Witch's Wrap","Snowflake Mantle","Cryomancer's Coat","Frostbind Robe"],
    },
    helmet: {
      plate_helm:  ["Yeti Skull Helm","Dragon Ice Helm","Frostforged Helm","Tundra War Helm","Glacial Visage","Frostmane Helm","Iceforged Greathelm","Permafrost Helm"],
      leather_helm:["Snowpeak Hood","Blizzard Crown","Blizzard Cowl","Tundra Scout Cap","Frosthunter Hood","Iceleather Cap","Snowtracker Crown","Yeti Hide Cap"],
      cloth_helm:  ["Wool Cap","Icecrystal Crown","Cryomancer's Crown","Permafrost Cap","Frostweave Circlet","Blizzard Veil","Tundra Mystic Hood","Glacial Veil"],
    },
    gloves: ["Fur Mitts","Ice Gauntlets","Frost Grips","Yeti Handwraps","Glacial Gloves","Blizzard Mitts","Tundra Gauntlets","Frostweave Wraps","Snowpeak Grips","Icecap Gloves","Permafrost Mitts"],
    boots:  ["Fur Boots","Snowtreader Boots","Icestep Greaves","Frostwalker Boots","Glacial Treads","Blizzard Boots","Tundra Greaves","Permafrost Sandals","Snowpeak Treads","Icewalker Boots","Frostbound Greaves"],
    ring:   ["Tin Circlet","Sapphire Ring","Frost Ring","Diamond Ring","Blizzard Band","Glacial Seal","Tundra Loop","Frostweave Band","Ice Crystal Ring","Snowpeak Ring","Permafrost Band"],
    amulet: ["Frozen Amulet","Blizzard Amulet","Avalanche Amulet","Permafrost Amulet","Icicle Pendant","Tundra Heart","Glacial Locket","Frostborn Charm","Yeti Talisman","Snowflake Pendant","Ice Drake's Tooth"],
  },
  shadow_realm: {
    weapon: {
      sword:   ["Nightmare Blade","Void Blade","Shadowmourne","Dreadedge","Shadow Edge","Soul Slicer","Doomforged Sword","Oblivion's Edge","Wraith Cutter","Cursed Greatsword","Darksteel Blade","Soulreaver Sword","Voidfire Saber","Shade's Edge","Phantom Saber"],
      axe:     ["Void Cleaver","Dread Axe","Soul Splitter","Nightmare Hatchet","Cursed Axe","Wraith Cleaver","Obliteration Axe","Soulfire Axe","Shadowreap Axe","Voidsteel Chopper"],
      mace:    ["Nightmare Flail","Doom Mace","Wraith Hammer","Soul Crusher","Shadow Basher","Voidsteel Mace","Cursed Flail","Dread Mallet","Obliteration Hammer"],
      staff:   ["Void Wand","Hex Scepter","Oblivion Staff","Void Reaper","Soul Conduit","Nightmare Focus","Dread Oracle","Wraith Staff","Lich's Scepter","Shadowflame Staff","Cursed Rod","Voidweave Staff"],
      wand:    ["Shadow Wand","Void Focus","Curse Wand","Nightmare Rod","Soul Wand","Dread Focus","Wraith Wand","Oblivion Wand","Hexfire Wand"],
      bow:     ["Shadow Bow","Void Longbow","Nightmare Recurve","Cursed Hunter","Wraith Bow","Soul Stalker","Dread Recurve","Oblivion Bow","Soulfire Longbow","Phantasm Bow"],
      crossbow:["Dread Crossbow","Shadow Hunter","Void Repeater","Nightmare Ballista","Cursed Crossbow","Soul Shooter","Wraith Repeater"],
      dagger:  ["Cracked Obsidian Dagger","Shadow Blade","Soul Reaper","Void Shiv","Nightmare Stiletto","Cursed Fang","Wraith Dagger","Dread Shiv","Obsidian Blade","Soulsteal Shiv","Phantom Dagger"],
      blade:   ["Cursed Blade","Shadowstep Kris","Rift Knife","Void Kris","Nightmare Cutter","Wraith Edge","Dread Blade","Soulfire Kris"],
    },
    armor:  {
      heavy:  ["Soulshred Armor","Armor of the Void","Dreadweave Plate","Shadowforged Mail","Nightmare Plate","Cursed Sentinel Armor","Voidsteel Cuirass","Wraith Knight's Mail","Oblivion Plate","Lich Guardian Armor"],
      medium: ["Darkweave Armor","Voidweave Vest","Shadow Scout Coat","Nightmare Leather","Cursed Chain Vest","Dread Ranger Mail","Soul Scout Garb","Wraith Chain Coat","Obsidian Vest"],
      light:  ["Tattered Shadow Robe","Darkweave Robe","Shadowstitch Coat","Nightmare Silk","Cursed Vestment","Void Mystic Wrap","Wraith Mantle","Soul Witch's Robe","Oblivion Shroud"],
    },
    helmet: {
      plate_helm:  ["Horned Shadow Helm","Deathmask","Soulfire Helm","Shadow War Helm","Voidsteel Greathelm","Dread Warlord Helm","Oblivion Mask","Cursed Knight Helm"],
      leather_helm:["Shroud Helm","Void Hood","Cursed Cowl","Nightmare Visage","Dread Circlet","Shadow Scout Hood","Wraith Tracker Cap","Soul Stalker Cap"],
      cloth_helm:  ["Lich Crown","Wraith Crown","Soul Crown","Oblivion Veil","Shadowweave Circlet","Nightmare Hood","Cursed Veil","Void Mystic Crown"],
    },
    gloves: ["Shadow Grips","Void Gauntlets","Lich Handwraps","Dread Gloves","Soulshred Grips","Nightmare Mitts","Cursed Gauntlets","Wraith Grips","Obsidian Gloves","Void Silk Wraps"],
    boots:  ["Shadowwalker Sandals","Phantom Boots","Duskstrider Boots","Shadowstep Boots","Wraith Treads","Nightmare Greaves","Void Sandals","Cursed Boots","Soul Treads","Dread Stalker Boots","Oblivion Greaves"],
    ring:   ["Dim Ring","Obsidian Ring","Shadow Ring","Ring of Void","Dread Band","Cursed Seal","Soul Loop","Nightmare Band","Wraith Ring","Void Signet","Oblivion Ring"],
    amulet: ["Soul Charm","Rift Amulet","Amulet of Despair","Amulet of the Lich King","Void Pendant","Nightmare Locket","Shadow Heart","Wraith Talisman","Cursed Pendant","Oblivion Eye","Dread Core"],
  },
  celestial_spire: {
    weapon: {
      sword:   ["Starforged Sword","Nova Sword","Godslayer","Cosmic Blade","Solarburst Edge","Divinity's Edge","Primordial Sword","Astral Avenger","Heaven's Cutter","Seraph Blade","Constellation Sword","Galaxy Edge","Quantum Saber","Empyrean Blade","Stellar Avenger"],
      axe:     ["Starfire Axe","Celestial Cleaver","Nova Splitter","Divine Hatchet","Cosmic Chopper","Astral Axe","Quasar Axe","Empyrean Cleaver","Star Forge Axe","Nebula Axe"],
      mace:    ["Divine Hammer","Cosmic Mace","Star Flail","Nova Basher","Astral Mallet","Celestial Crusher","Quasar Flail","Heaven's Hammer","Empyrean Mace"],
      staff:   ["Pulsar Staff","Celestial Scepter","Genesis Staff","Astral Focus","Nova Oracle","Cosmic Conduit","Empyrean Rod","Stellar Scepter","Heaven's Staff","Divine Codex","Quasar Staff","Star Gate Rod"],
      wand:    ["Star Wand","Nova Wand","Cosmic Focus","Divine Rod","Astral Wand","Celestial Focus","Empyrean Wand","Quasar Focus","Genesis Wand","Singularity Rod"],
      bow:     ["Celestial Longbow","Starborn Bow","Nova Recurve","Cosmic Hunter","Divine Bow","Astral Recurve","Empyrean Bow","Pulsar Longbow","Heaven's Aim","Constellation Bow","Quasar Recurve"],
      crossbow:["Astral Crossbow","Star Hunter","Celestial Repeater","Nova Ballista","Divine Crossbow","Cosmic Repeater","Empyrean Shooter","Quasar Crossbow"],
      dagger:  ["Starlight Dagger","Nova Fang","Astral Shiv","Celestial Stiletto","Divine Blade","Cosmic Fang","Empyrean Shard","Pulsar Dagger","Heaven's Edge","Star Shard","Quasar Dagger"],
      blade:   ["Cosmic Kris","Starblade","Nebula Knife","Celestial Cutter","Nova Kris","Astral Edge","Empyrean Kris","Quasar Blade","Heaven's Kris"],
    },
    armor:  {
      heavy:  ["Divine Plate","Celestial Godplate","Starfire Plate","Cosmic Sentinel Mail","Empyrean Cuirass","Nova Knight's Plate","Astral Titan Armor","Heaven's Aegis","Quasar Plate","Stellar Fortress Mail","Seraph's Guard"],
      medium: ["Stardust Armor","Astral Guard Coat","Nova Scout Vest","Celestial Chain Mail","Cosmic Ranger Vest","Empyrean Leather","Heaven's Tracker Garb","Stellar Scout Coat","Quasar Mail"],
      light:  ["Pale Celestial Wrap","Astral Robe","Nebula Vestments","Nova Silk Robe","Cosmic Mystic Wrap","Empyrean Shroud","Heaven's Vestment","Divine Mantle","Stellar Silk Robes","Starweave Robe"],
    },
    helmet: {
      plate_helm:  ["Titan Helm","Halo of Divinity","Celestial Visor","Cosmic War Helm","Heaven's Helm","Seraph's Helm","Starforged Greathelm","Divine Warlord Helm"],
      leather_helm:["Halo Helm","Nebula Helm","Empyrean Cowl","Astral Diadem","Nova Crown","Startracker Hood","Cosmic Scout Cap","Stellar Ranger Helm"],
      cloth_helm:  ["Starlight Crown","Divinity Crown","Quasar Crown","Stellar Circlet","Empyrean Veil","Celestial Mystic Hood","Heaven's Circlet","Astral Veil"],
    },
    gloves: ["Celestial Grips","Nova Gauntlets","Divine Handwraps","Astral Gloves","Star Mitts","Cosmic Gauntlets","Empyrean Grips","Heaven's Touch","Stellar Mitts","Quasar Gloves","Seraph's Gauntlets","Nova Silk Wraps"],
    boots:  ["Skywalker Boots","Aurora Boots","Voidwalker Boots","Starwalker Boots","Nebula Treads","Celestial Greaves","Nova Sprint Boots","Cosmic Sandals","Empyrean Treads","Heaven's Stride","Astral Greaves","Stellar Boots","Quasar Treads"],
    ring:   ["Nebula Ring","Quasar Ring","Ring of Stars","Ring of the Cosmos","Singularity Band","Celestial Signet","Nova Loop","Divine Band","Astral Seal","Empyrean Ring","Heaven's Ring","Stellar Band","Cosmic Signet"],
    amulet: ["Comet Amulet","Zodiac Amulet","Supernova Amulet","Amulet of Creation","Astral Pendant","Celestial Heart","Nova Locket","Cosmic Talisman","Divine Eye","Empyrean Soul","Heaven's Crest","Stellar Charm","Quasar Pendant","Genesis Core"],
  },
};

function weightedRarityRoll(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of entries) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return entries[0][0];
}

function getZoneForLevel(level) {
  for (const [key, zone] of Object.entries(ZONE_LOOT)) {
    if (level >= zone.levelRange[0] && level <= zone.levelRange[1]) return key;
  }
  return "celestial_spire";
}

// Class -> weapon subtypes for smart loot
const CLASS_WEAPON_SUBTYPES_LOCAL = {
  warrior: ["sword", "axe", "mace"],
  mage:    ["staff", "wand"],
  ranger:  ["bow", "crossbow"],
  rogue:   ["dagger", "blade"],
};

// Class -> armor weight for smart loot
const CLASS_ARMOR_WEIGHT_LOCAL = {
  warrior: "heavy",
  mage:    "light",
  ranger:  "medium",
  rogue:   "light",
};

const CLASS_HELMET_WEIGHT_LOCAL = {
  warrior: "plate_helm",
  mage:    "cloth_helm",
  ranger:  "leather_helm",
  rogue:   "cloth_helm",
};

export function generateLoot(enemyLevel, luck, isBoss = false, regionKey = null, characterClass = null) {
  const zone = regionKey ? ZONE_LOOT[regionKey] : ZONE_LOOT[getZoneForLevel(enemyLevel)];
  if (!zone) return null;

  // Drop chance: base 3%, bosses 35%, luck adds small bonus.
  const dropChance = isBoss ? 0.35 : Math.min(0.10, 0.03 + luck * 0.0005);
  if (Math.random() > dropChance) return null;

  // Build rarity weights, bosses skew rarer
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

  // Item level: roll within zone range
  const [iLvlMin, iLvlMax] = zone.itemLevelRange;
  const itemLevel = isBoss
    ? Math.floor(iLvlMax * 0.85 + Math.random() * iLvlMax * 0.15)
    : Math.floor(iLvlMin + Math.random() * (iLvlMax - iLvlMin));
  const levelReq = Math.max(1, itemLevel - 2);

  const zoneKey = regionKey || getZoneForLevel(enemyLevel);
  const zoneNames = ITEM_NAMES[zoneKey] || ITEM_NAMES.verdant_forest;
  const allTypes = ["weapon", "armor", "helmet", "gloves", "boots", "ring", "amulet"];

  // Smart loot: 65% chance to bias toward character's class if class provided
  const useSmartLoot = characterClass && Math.random() < 0.65;
  let type, subtype, name;

  if (useSmartLoot && allTypes.includes("weapon") && Math.random() < 0.4) {
    // Drop a weapon for the character's class
    type = "weapon";
    const subtypes = CLASS_WEAPON_SUBTYPES_LOCAL[characterClass] || ["sword"];
    subtype = subtypes[Math.floor(Math.random() * subtypes.length)];
    const namePool = zoneNames.weapon?.[subtype] || ["Unknown Weapon"];
    name = namePool[Math.floor(Math.random() * namePool.length)];
  } else if (useSmartLoot && Math.random() < 0.35) {
    // Drop armor appropriate for the class's armor weight
    type = "armor";
    subtype = CLASS_ARMOR_WEIGHT_LOCAL[characterClass] || "light";
    const namePool = zoneNames.armor?.[subtype] || zoneNames.armor?.light || ["Unknown Armor"];
    name = namePool[Math.floor(Math.random() * namePool.length)];
  } else {
    type = allTypes[Math.floor(Math.random() * allTypes.length)];
    if (type === "weapon") {
      const subtypes = characterClass ? (CLASS_WEAPON_SUBTYPES_LOCAL[characterClass] || ["sword"]) : ["sword","axe","staff","wand","bow","dagger"];
      subtype = subtypes[Math.floor(Math.random() * subtypes.length)];
      const namePool = zoneNames.weapon?.[subtype] || ["Unknown Weapon"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else if (type === "armor") {
      const weight = characterClass ? (CLASS_ARMOR_WEIGHT_LOCAL[characterClass] || "light") : "light";
      subtype = weight;
      const namePool = zoneNames.armor?.[weight] || ["Unknown Armor"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else if (type === "helmet") {
      const helmWeight = characterClass ? (CLASS_HELMET_WEIGHT_LOCAL[characterClass] || "cloth_helm") : "cloth_helm";
      subtype = helmWeight;
      const helmNames = zoneNames.helmet;
      const namePool = (helmNames && typeof helmNames === 'object' && !Array.isArray(helmNames))
        ? (helmNames[helmWeight] || helmNames.cloth_helm || ["Unknown Helmet"])
        : (Array.isArray(helmNames) ? helmNames : ["Unknown Helmet"]);
      name = namePool[Math.floor(Math.random() * namePool.length)];
    } else {
      subtype = null;
      const namePool = Array.isArray(zoneNames[type]) ? zoneNames[type] : ["Unknown Item"];
      name = namePool[Math.floor(Math.random() * namePool.length)];
    }
  }

  // ── SET ITEM DROP (very rare — weighted by rarity roll) ──────────────
  // Set items only drop if rarity roll is "set" (handled by weight system above)
  if (rarity === "set") {
    const zoneSetList = ZONE_SET_DROPS[zoneKey] || [];
    // Filter by character class (include class=null pieces)
    const eligible = zoneSetList.filter(p => !p.class || !characterClass || p.class === characterClass);
    if (eligible.length > 0) {
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      const setDef = ITEM_SETS[pick.setKey];
      if (setDef) {
        const { stats: setStats, itemLevel: sItemLevel, levelReq: sLevelReq } = generateSetItemStats(pick.setKey, pick.slot, zoneKey);
        const sellPrice = Math.floor((_SELL_PRICES.legendary || 600) * (1 + sItemLevel * 0.15));
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
          set_name: setDef.name,
          set_key: pick.setKey,
          class_restriction: pick.class ? [pick.class] : undefined,
        };
      }
    }
  }

  const stats = _generateItemStats(type, rarity, itemLevel);
  const sellPrice = Math.floor((_SELL_PRICES[rarity] || 10) * (1 + itemLevel * 0.08));

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

// ===== COMBAT FORMULAS =====
// Delegates to statSystem.js — class-aware, balanced scaling
export { rollDamage as calculateDamage } from "./statSystem.js";

export function calculateExpToLevel(level) {
  // Steeper curve: base growth 1.18 per level + quadratic scaling at higher levels
  const base = 100 * Math.pow(1.18, level - 1);
  const quadratic = level > 10 ? Math.pow(level - 10, 2) * 15 : 0;
  return Math.floor(base + quadratic);
}

// ===== IDLE CALCULATION =====
export function calculateIdleRewards(character, hoursOffline) {
  const maxHours = 12;
  const effectiveHours = Math.min(hoursOffline, maxHours);
  const region = REGIONS[character.current_region];
  if (!region) return { exp: 0, gold: 0, kills: 0 };
  const avgEnemy = region.enemies.map(e => ENEMIES[e]).filter(Boolean);
  if (avgEnemy.length === 0) return { exp: 0, gold: 0, kills: 0 };
  const avgExp = avgEnemy.reduce((s, e) => s + e.expReward, 0) / avgEnemy.length;
  const avgGold = avgEnemy.reduce((s, e) => s + e.goldReward, 0) / avgEnemy.length;
  const killsPerHour = 30 + character.level * 2;
  const totalKills = Math.floor(killsPerHour * effectiveHours);
  return {
    exp: Math.floor(totalKills * avgExp * 0.5),
    gold: Math.floor(totalKills * avgGold * 0.5),
    kills: totalKills
  };
}

// ===== DAILY QUESTS =====
export function generateDailyQuests(characterLevel) {
  const quests = [
    { title: "Monster Hunter", description: "Defeat 20 enemies", objective_type: "kill", target_count: 20, rewards: { exp: 100 * characterLevel, gold: 50 * characterLevel } },
    { title: "Gold Collector", description: "Earn 500 gold", objective_type: "collect", target_count: 500, rewards: { exp: 80 * characterLevel, gold: 30 * characterLevel, gems: 2 } },
    { title: "Explorer", description: "Complete 5 battles", objective_type: "kill", target_count: 5, rewards: { exp: 50 * characterLevel, gold: 20 * characterLevel, gems: 1 } },
  ];
  return quests.map(q => ({ ...q, type: "daily", status: "active", current_count: 0 }));
}

// ===== TOWER OF TRIALS =====
export const TOWER_CONFIG = {
  MAX_FLOOR: 1000,
  MAX_ENTRIES: 3,
  ENTRY_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  MULTI_ENEMY_FLOOR: 200, // floor 200+ spawns multiple enemies
  ENTRY_GEM_COST: 1000, // gems to buy an extra entry
};

// ── SEASON PASS CONFIG ─────────────────────────────────────────────────
export const SEASON_PASS_CONFIG = {
  season: 1,
  seasonName: "Season 1: Dawn of Trials",
  maxTier: 50,
  xpPerTier: 1000,
  premiumCost: 2000,
};

// Tower enemy name pools by floor tier
const TOWER_ENEMY_TIERS = [
  { maxFloor: 50, names: ["Tower Rat", "Stone Imp", "Dust Golem", "Trial Shade", "Rusted Guardian"], element: null },
  { maxFloor: 100, names: ["Flame Sprite", "Inferno Hound", "Lava Crawler", "Ember Knight", "Fire Wraith"], element: "fire" },
  { maxFloor: 200, names: ["Frost Sentinel", "Ice Phantom", "Glacial Horror", "Crystal Fiend", "Frozen Abomination"], element: "ice" },
  { maxFloor: 350, names: ["Void Stalker", "Shadow Beast", "Dark Reaper", "Abyssal Crawler", "Nightmare Golem"], element: "blood" },
  { maxFloor: 500, names: ["Storm Herald", "Thunder Titan", "Lightning Wraith", "Voltaic Golem", "Storm Djinn"], element: "lightning" },
  { maxFloor: 700, names: ["Plague Horror", "Toxic Behemoth", "Venom Drake", "Corrosion Elemental", "Blight Warden"], element: "poison" },
  { maxFloor: 900, names: ["Sandstorm Colossus", "Desert Phantom", "Dune Overlord", "Mirage Assassin", "Tomb Emperor"], element: "sand" },
  { maxFloor: 1000, names: ["Celestial Aberration", "Divine Construct", "Genesis Sentinel", "Astral Devourer", "Omega Wraith"], element: null },
];

// Boss names every 10th floor
const TOWER_BOSS_NAMES = [
  "Guardian of the First Gate", "Warden of Flames", "Keeper of Frost", "Shadow Arbiter",
  "Stormcaller Vex", "Plaguebringer Mord", "Sand Pharaoh Khet", "Void Archon",
  "Celestial Judge", "Titan of the Spire", "Dread Champion", "Infernal Overseer",
  "Glacial Monarch", "Eclipse Wraith", "Tempest King", "Rot Sovereign",
  "Dune Tyrant", "Star Devourer", "Omega Sentinel", "The Watcher",
];

// Every 100th floor - special boss
const TOWER_CENTENNIAL_BOSSES = {
  100: "The Iron Colossus",
  200: "Abyssal Warlord",
  300: "Frost Emperor Glacius",
  400: "Void Empress Nyx",
  500: "Storm God Tempestus",
  600: "Plague Lord Morthos",
  700: "Sand King Anubarak",
  800: "Celestial Dragon Aethon",
  900: "The Omega Sentinel",
  1000: "Tammapac, The Final Trial",
};

export function getTowerEnemyTier(floor) {
  return TOWER_ENEMY_TIERS.find(t => floor <= t.maxFloor) || TOWER_ENEMY_TIERS[TOWER_ENEMY_TIERS.length - 1];
}

export function generateTowerFloorData(floor) {
  const isBoss = floor % 10 === 0;
  const isCentennial = floor % 100 === 0;
  const tier = getTowerEnemyTier(floor);
  const multiEnemy = floor >= TOWER_CONFIG.MULTI_ENEMY_FLOOR && !isBoss;

  // Scaling formulas
  const baseHp = 200 + floor * 50 + Math.pow(floor, 1.4) * 2;
  const baseDmg = 10 + floor * 3 + Math.pow(floor, 1.2) * 0.5;
  const baseArmor = Math.floor(floor * 0.5 + Math.pow(floor, 0.8));

  if (isCentennial) {
    const bossName = TOWER_CENTENNIAL_BOSSES[floor] || `Tower Boss Floor ${floor}`;
    return {
      type: "centennial_boss",
      enemies: [{
        name: bossName,
        hp: Math.floor(baseHp * 8),
        maxHp: Math.floor(baseHp * 8),
        dmg: Math.floor(baseDmg * 3),
        armor: Math.floor(baseArmor * 2.5),
        element: tier.element,
        isBoss: true,
      }],
      floor,
    };
  }

  if (isBoss) {
    const bossIdx = Math.floor((floor / 10 - 1) % TOWER_BOSS_NAMES.length);
    return {
      type: "boss",
      enemies: [{
        name: TOWER_BOSS_NAMES[bossIdx],
        hp: Math.floor(baseHp * 4),
        maxHp: Math.floor(baseHp * 4),
        dmg: Math.floor(baseDmg * 2),
        armor: Math.floor(baseArmor * 1.5),
        element: tier.element,
        isBoss: true,
      }],
      floor,
    };
  }

  // Regular enemies
  const enemyCount = multiEnemy ? Math.min(4, 2 + Math.floor((floor - 200) / 150)) : 1;
  const enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const nameIdx = (floor + i) % tier.names.length;
    const hpMult = multiEnemy ? 0.6 : 1.0;
    enemies.push({
      name: tier.names[nameIdx],
      hp: Math.floor(baseHp * hpMult),
      maxHp: Math.floor(baseHp * hpMult),
      dmg: Math.floor(baseDmg * (multiEnemy ? 0.7 : 1.0)),
      armor: Math.floor(baseArmor * (multiEnemy ? 0.5 : 1.0)),
      element: tier.element,
      isBoss: false,
    });
  }

  return { type: "normal", enemies, floor };
}

export function getTowerRewards(floor, isBoss) {
  const baseGold = 50 + floor * 10 + Math.pow(floor, 1.2) * 2;
  const baseExp = 30 + floor * 8 + Math.pow(floor, 1.15) * 1.5;
  const isCentennial = floor % 100 === 0;

  return {
    gold: Math.floor(baseGold * (isCentennial ? 5 : isBoss ? 2.5 : 1)),
    exp: Math.floor(baseExp * (isCentennial ? 5 : isBoss ? 2.5 : 1)),
    gems: isCentennial ? Math.floor(5 + floor / 100) : (isBoss ? Math.floor(1 + floor / 200) : 0),
    tammablocks: isCentennial ? Math.floor(2 + floor / 200) : (isBoss && floor >= 50 ? 1 : 0),
    towershards: isCentennial ? Math.floor(1 + floor / 300) : (isBoss && floor >= 100 ? 1 : 0),
    hasLoot: isBoss || Math.random() < 0.15,
    hasSpecialGear: isCentennial,
    hasProfileFrame: isCentennial,
  };
}