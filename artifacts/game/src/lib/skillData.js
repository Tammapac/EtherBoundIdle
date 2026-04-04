// ===== EXPANDED SKILL SYSTEM =====
// 6 tiers per class, ~30 skills per class with elemental synergies + synergy combos

export const SKILL_TIERS = {
  1: { label: "Apprentice", color: "text-gray-400",   border: "border-gray-500/30",   bg: "", levelReq: 1 },
  2: { label: "Journeyman", color: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/5", levelReq: 10 },
  3: { label: "Expert",     color: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-500/5", levelReq: 25 },
  4: { label: "Master",     color: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/5", levelReq: 45 },
  5: { label: "Legendary",  color: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-500/10", levelReq: 70 },
  6: { label: "Ascended",   color: "text-rose-400",   border: "border-rose-500/40",   bg: "bg-rose-500/10", levelReq: 90 },
};

// Elemental types for skills — display color + icon emoji
export const ELEMENT_CONFIG = {
  fire:      { color: "text-orange-400", icon: "🔥", label: "Fire",      stat: "fire_dmg" },
  ice:       { color: "text-cyan-400",   icon: "❄️",  label: "Ice",       stat: "ice_dmg" },
  lightning: { color: "text-yellow-300", icon: "⚡",  label: "Lightning", stat: "lightning_dmg" },
  poison:    { color: "text-green-400",  icon: "☠️",  label: "Poison",    stat: "poison_dmg" },
  blood:     { color: "text-red-500",    icon: "🩸",  label: "Blood",     stat: "blood_dmg" },
  sand:      { color: "text-amber-400",  icon: "🌪️",  label: "Sand",      stat: "sand_dmg" },
  arcane:    { color: "text-purple-400", icon: "✨",  label: "Arcane",    stat: null },
  physical:  { color: "text-gray-300",   icon: "⚔️",  label: "Physical",  stat: null },
};

// SKILL ANIMATIONS — used in AttackVisual
export const SKILL_ANIMATIONS = {
  // Warrior
  w_basic_strike: "slash",      w_shield_block: "shield",    w_power_strike: "heavyslash",
  w_flame_slash: "fireball",    w_ground_smash: "slam",      w_lightning_charge: "lightning",
  w_shield_bash: "bash",        w_war_cry: "roar",           w_rage: "berserker",
  w_blood_rage: "bleed",        w_whirlwind: "whirlwind",    w_taunt: "taunt",
  w_ground_slam: "slam",        w_thunder_strike: "lightning",w_bulwark: "shield",
  w_avatar: "divine",           w_juggernaut: "charge",      w_sand_veil: "smoke",
  w_titan_form: "titan",        w_armageddon: "explosion",   w_eternal_guard: "shield",
  w_cleave: "heavyslash",      w_iron_skin: "shield",       w_execute: "slash",
  w_earthquake: "slam",        w_battle_shout: "roar",      w_blood_sacrifice: "bleed",
  w_tremor: "slam",            w_inferno_blade: "fireball",  w_godslayer: "divine",
  w_warlord_aura: "berserker", w_ragnarok: "explosion",
  // Mage
  m_magic_bolt: "projectile",   m_frost_armor: "frostshield", m_fireball: "fireball",
  m_ice_lance: "icicle",        m_mana_shield: "shield",      m_poison_bolt: "poison",
  m_arcane_burst: "nova",       m_lightning_bolt: "lightning", m_blizzard: "blizzard",
  m_flame_wall: "fireball",     m_time_warp: "timewarp",      m_meteor: "meteor",
  m_sandstorm: "smoke",         m_blood_pact: "bleed",        m_black_hole: "blackhole",
  m_arcane_nova: "nova",        m_chrono_rift: "timewarp",    m_ice_prison: "frostshield",
  m_singularity: "blackhole",   m_genesis: "divine",          m_apocalypse: "explosion",
  m_arcane_shield: "frostshield", m_chain_lightning: "lightning", m_poison_cloud: "poison",
  m_frost_nova: "blizzard",    m_mana_burn: "nova",           m_infernal_pact: "fireball",
  m_sandstorm: "smoke",        m_arcane_god: "divine",        m_supernova: "explosion",
  m_absolute_zero: "blizzard",
  // Ranger
  r_quick_shot: "arrow",        r_dodge_roll: "dodge",        r_poison_shot: "poison",
  r_fire_arrow: "firearrow",    r_triple_shot: "multishot",   r_frost_arrow: "icicle",
  r_eagle_eye: "eagleeye",      r_lightning_arrow: "lightning",r_multishot: "multishot",
  r_sand_trap: "trap",          r_blood_arrow: "bleed",       r_traps: "trap",
  r_arrow_rain: "arrowrain",    r_hunters_mark: "mark",       r_volley: "arrowrain",
  r_shadow_step: "shadowstep",  r_storm_bow: "lightning",     r_death_arrow: "deatharrow",
  r_wrath_of_hunt: "explosion",
  r_nature_bond: "shield",     r_explosive_arrow: "firearrow", r_wind_walk: "dodge",
  r_venom_rain: "arrowrain",   r_snipe: "arrow",              r_elemental_quiver: "eagleeye",
  r_piercing_shot: "arrow",    r_spirit_of_the_wild: "divine", r_celestial_barrage: "arrowrain",
  r_natures_wrath: "poison",
  // Rogue
  ro_quick_slash: "slash",      ro_smoke_bomb: "smoke",       ro_backstab: "backstab",
  ro_poison_blade: "poison",    ro_open_wounds: "bleed",      ro_frost_strike: "icicle",
  ro_pickpocket: "pickpocket",  ro_lightning_step: "lightning",ro_blade_dance: "bleedance",
  ro_sand_blind: "smoke",       ro_garrote: "garrote",        ro_blood_frenzy: "bleed",
  ro_shadow_strike: "shadowstep",ro_death_mark: "mark",       ro_assassinate: "backstab",
  ro_shadow_realm_entry: "smoke",ro_oblivion: "explosion",    ro_phantom: "smoke",
  ro_reaper: "reaper",
  ro_dual_strike: "slash",     ro_venomous_fan: "poison",     ro_shadowmeld: "smoke",
  ro_cheap_shot: "backstab",   ro_viper_strike: "poison",     ro_mark_of_shadows: "mark",
  ro_executioner: "backstab",  ro_void_dancer: "smoke",       ro_deaths_embrace: "bleed",
  ro_thousand_cuts: "bleedance",
};

export const CLASS_SKILLS = {
  warrior: [
    // ── Tier 1 – Apprentice (Lv 1+) ─────────────────────────────────────────
    {
      id: "w_basic_strike", name: "Basic Strike", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.3, element: "physical",
      description: "A strong basic attack dealing 130% weapon damage. STR scales this skill.",
      requires: null,
      synergy: "High STR increases damage significantly.",
    },
    {
      id: "w_shield_block", name: "Shield Block", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 3, damage: 0, element: null, buff: "defense",
      description: "Reduce incoming damage by 25% for 2 turns. VIT increases shield efficiency.",
      requires: null,
      synergy: "High VIT amplifies the damage reduction bonus.",
    },
    {
      id: "w_power_strike", name: "Power Strike", tier: 1, levelReq: 5, cost: 2,
      mp: 32, cooldown: 3, damage: 1.8, element: "physical",
      description: "A powerful melee blow dealing 180% weapon damage. Scales with STR.",
      requires: "w_basic_strike",
    },
    {
      id: "w_flame_slash", name: "Flame Slash", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.5, element: "fire",
      description: "Imbue your weapon with fire: 150% damage + 🔥 Fire bonus applies.",
      requires: null,
      synergy: "Each % of fire_dmg adds to this skill's damage.",
    },

    // ── Tier 2 – Journeyman (Lv 10+) ────────────────────────────────────────
    {
      id: "w_shield_bash", name: "Shield Bash", tier: 2, levelReq: 10, cost: 2,
      mp: 42, cooldown: 4, damage: 1.5, element: "physical",
      description: "Slam shield for 150% damage + stun. STR + VIT scale damage.",
      requires: "w_shield_block",
    },
    {
      id: "w_war_cry", name: "War Cry", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "Rally cry: +30% ATK for 3 turns. Empowers all physical skills in the window.",
      requires: null,
      synergy: "Stack with Flame Slash or Power Strike for burst turns.",
    },
    {
      id: "w_rage", name: "Berserker Rage", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 5, damage: 2.2, element: "physical",
      description: "Enter rage: 220% damage, ignoring defense. STR primary scaling.",
      requires: "w_power_strike",
    },
    {
      id: "w_blood_rage", name: "Blood Rage", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 4, damage: 1.7, element: "blood",
      description: "Slash with frenzied blood: 170% damage + 🩸 Blood bonus. Heal for 5% of damage dealt.",
      requires: "w_flame_slash",
      synergy: "blood_dmg % amplifies both the hit and the lifesteal.",
    },

    // ── Tier 3 – Expert (Lv 25+) ─────────────────────────────────────────────
    {
      id: "w_whirlwind", name: "Whirlwind", tier: 3, levelReq: 25, cost: 3,
      mp: 65, cooldown: 4, damage: 1.7, element: "physical",
      description: "Spin attack: 170% damage. High STR unlocks additional hit variance.",
      requires: "w_shield_bash",
    },
    {
      id: "w_taunt", name: "Taunt", tier: 3, levelReq: 28, cost: 3,
      mp: 45, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "Force enemy focus; reduce damage taken 20% for party. VIT amplifies.",
      requires: "w_war_cry",
      synergy: "Combine with Bulwark Stance for extreme tanking.",
    },
    {
      id: "w_ground_slam", name: "Ground Slam", tier: 3, levelReq: 30, cost: 4,
      mp: 75, cooldown: 5, damage: 2.5, element: "physical",
      description: "Slam ground: 250% damage + stun 1 turn. STR primary.",
      requires: "w_rage",
    },
    {
      id: "w_thunder_strike", name: "Thunder Strike", tier: 3, levelReq: 32, cost: 4,
      mp: 70, cooldown: 5, damage: 2.0, element: "lightning",
      description: "Call lightning through your blade: 200% damage + ⚡ Lightning bonus applies.",
      requires: "w_blood_rage",
      synergy: "lightning_dmg % stacks multiplicatively with STR scaling.",
    },

    // ── Tier 4 – Master (Lv 45+) ─────────────────────────────────────────────
    {
      id: "w_bulwark", name: "Bulwark Stance", tier: 4, levelReq: 45, cost: 4,
      mp: 85, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "+50% defense + 10% HP regen for 3 turns. Best paired with high VIT.",
      requires: "w_taunt",
      synergy: "VIT amplifies both the defense bonus and regen amount.",
    },
    {
      id: "w_avatar", name: "Avatar of War", tier: 4, levelReq: 50, cost: 5,
      mp: 110, cooldown: 6, damage: 3.0, element: "physical",
      description: "Channel war spirit: 300% damage and heal 20% HP.",
      requires: "w_ground_slam",
    },
    {
      id: "w_juggernaut", name: "Juggernaut", tier: 4, levelReq: 55, cost: 4,
      mp: 100, cooldown: 5, damage: 2.8, element: "physical",
      description: "Unstoppable charge: 280% damage, ignores 50% defense.",
      requires: "w_whirlwind",
    },
    {
      id: "w_sand_veil", name: "Sand Veil", tier: 4, levelReq: 48, cost: 4,
      mp: 90, cooldown: 5, damage: 1.5, element: "sand",
      description: "Conjure a sand vortex: 150% damage + 30% evasion for 2 turns + 🌪️ Sand bonus.",
      requires: "w_thunder_strike",
      synergy: "sand_dmg % increases the damage portion.",
    },

    // ── Tier 5 – Legendary (Lv 70+) ──────────────────────────────────────────
    {
      id: "w_titan_form", name: "Titan Form", tier: 5, levelReq: 70, cost: 5,
      mp: 140, cooldown: 6, damage: 0, element: null, buff: "attack",
      description: "Transform: +100% HP and +60% all stats for 5 turns.",
      requires: "w_bulwark",
    },
    {
      id: "w_armageddon", name: "Armageddon Strike", tier: 5, levelReq: 75, cost: 6,
      mp: 160, cooldown: 6, damage: 5.0, element: "fire",
      description: "Legendary strike of fire and steel: 500% damage + max 🔥 Fire bonus.",
      requires: "w_avatar",
      synergy: "fire_dmg % is FULLY applied on top of 500% base damage.",
    },
    {
      id: "w_eternal_guard", name: "Eternal Guardian", tier: 5, levelReq: 80, cost: 5,
      mp: 130, cooldown: 6, damage: 3.5, element: "physical", buff: "defense",
      description: "Become immortal for 2 turns; deal 350% damage on retaliation.",
      requires: "w_juggernaut",
    },

    // ── New Tier 2 fills ──
    {
      id: "w_cleave", name: "Cleave", tier: 2, levelReq: 11, cost: 2,
      mp: 40, cooldown: 3, damage: 1.6, element: "physical",
      description: "Wide swing: 160% damage to all enemies. STR scaling.",
      requires: "w_basic_strike",
    },
    {
      id: "w_iron_skin", name: "Iron Skin", tier: 2, levelReq: 13, cost: 2,
      mp: 35, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "Harden skin: +35% defense and +15% block for 3 turns.",
      requires: "w_shield_block",
    },

    // ── New Tier 3 fills ──
    {
      id: "w_execute", name: "Execute", tier: 3, levelReq: 26, cost: 3,
      mp: 60, cooldown: 4, damage: 2.0, element: "physical",
      description: "Execute strike: 200% damage, doubled if enemy HP < 30%.",
      requires: "w_rage",
    },
    {
      id: "w_earthquake", name: "Earthquake", tier: 3, levelReq: 33, cost: 4,
      mp: 80, cooldown: 5, damage: 2.2, element: "sand",
      description: "Shatter the ground: 220% sand damage + stun 1 turn. sand_dmg applies.",
      requires: "w_ground_slam",
      synergy: "sand_dmg % amplifies. Pairs with Sand Veil for a sand warrior build.",
    },
    {
      id: "w_battle_shout", name: "Battle Shout", tier: 3, levelReq: 29, cost: 3,
      mp: 50, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "+20% ATK speed + 15% crit chance for 3 turns.",
      requires: "w_war_cry",
    },

    // ── New Tier 4 fills ──
    {
      id: "w_blood_sacrifice", name: "Blood Sacrifice", tier: 4, levelReq: 52, cost: 4,
      mp: 95, cooldown: 5, damage: 3.2, element: "blood",
      description: "Sacrifice 15% HP: 320% blood damage + lifesteal 10%. blood_dmg applies.",
      requires: "w_blood_rage",
      synergy: "blood_dmg % stack makes this self-sustaining at high values.",
    },
    {
      id: "w_tremor", name: "Tremor Slam", tier: 4, levelReq: 54, cost: 4,
      mp: 100, cooldown: 5, damage: 2.8, element: "physical",
      description: "Ground-shaking slam: 280% damage + defense reduction on enemy.",
      requires: "w_ground_slam",
    },

    // ── New Tier 5 fills ──
    {
      id: "w_inferno_blade", name: "Inferno Blade", tier: 5, levelReq: 72, cost: 5,
      mp: 145, cooldown: 6, damage: 4.5, element: "fire",
      description: "Ignite blade: 450% fire damage + burn 5% enemy HP/turn for 3 turns.",
      requires: "w_armageddon",
      synergy: "fire_dmg amplifies both the hit and the burn. Core fire warrior skill.",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "w_godslayer", name: "Godslayer", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 8.0, element: "physical",
      description: "Transcend mortality: 800% damage that ignores all defenses and immunities.",
      requires: "w_armageddon",
      synergy: "Requires Armageddon Strike. The ultimate warrior finisher.",
    },
    {
      id: "w_warlord_aura", name: "Warlord's Aura", tier: 6, levelReq: 92, cost: 6,
      mp: 180, cooldown: 7, damage: 0, element: null, buff: "attack",
      description: "Aura of dominance: +80% ATK, +30% crit, +20% lifesteal for 4 turns.",
      requires: "w_titan_form",
    },
    {
      id: "w_ragnarok", name: "Ragnarok", tier: 6, levelReq: 95, cost: 8,
      mp: 250, cooldown: 8, damage: 10.0, element: "fire",
      description: "Call down Ragnarok: 1000% fire+physical damage. Legendary devastation.",
      requires: "w_eternal_guard",
      synergy: "fire_dmg % fully stacks. The highest single-target warrior skill.",
    },
  ],

  mage: [
    // ── Tier 1 ──
    {
      id: "m_magic_bolt", name: "Magic Bolt", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 2, damage: 1.4, element: "arcane",
      description: "Arcane bolt: 140% magic damage. INT is primary scaling stat.",
      requires: null,
      synergy: "Every point of INT increases this skill's output.",
    },
    {
      id: "m_frost_armor", name: "Frost Armor", tier: 1, levelReq: 1, cost: 1,
      mp: 28, cooldown: 3, damage: 0, element: "ice", buff: "defense",
      description: "Ice shell: +20% defense for 3 turns. 🧊 Ice bonus improves duration feel.",
      requires: null,
    },
    {
      id: "m_fireball", name: "Fireball", tier: 1, levelReq: 5, cost: 2,
      mp: 38, cooldown: 3, damage: 1.9, element: "fire",
      description: "Hurl a fireball: 190% fire damage. 🔥 fire_dmg % adds to this.",
      requires: "m_magic_bolt",
      synergy: "fire_dmg % amplifies all Fireball damage multiplicatively.",
    },
    {
      id: "m_poison_bolt", name: "Poison Bolt", tier: 1, levelReq: 6, cost: 2,
      mp: 30, cooldown: 3, damage: 1.2, element: "poison",
      description: "Venomous projectile: 120% damage + ☠️ Poison bonus applies.",
      requires: null,
      synergy: "poison_dmg % scales the DoT component over 3 turns.",
    },

    // ── Tier 2 ──
    {
      id: "m_ice_lance", name: "Ice Lance", tier: 2, levelReq: 10, cost: 2,
      mp: 48, cooldown: 3, damage: 1.6, element: "ice",
      description: "Piercing ice shard: 160% damage + slows enemy. ice_dmg % bonus applies.",
      requires: "m_frost_armor",
      synergy: "ice_dmg % adds damage. Pairs well with Blizzard for freeze chains.",
    },
    {
      id: "m_mana_shield", name: "Mana Shield", tier: 2, levelReq: 12, cost: 2,
      mp: 55, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "Convert 50% incoming damage to MP loss instead. INT expands the shield.",
      requires: null,
      synergy: "High INT = more MP = longer shield uptime.",
    },
    {
      id: "m_arcane_burst", name: "Arcane Burst", tier: 2, levelReq: 15, cost: 3,
      mp: 65, cooldown: 4, damage: 2.4, element: "arcane",
      description: "Explosive burst: 240% magic damage. Scales heavily with INT.",
      requires: "m_fireball",
    },
    {
      id: "m_lightning_bolt", name: "Lightning Bolt", tier: 2, levelReq: 13, cost: 2,
      mp: 45, cooldown: 3, damage: 1.8, element: "lightning",
      description: "Crackling bolt: 180% lightning damage. ⚡ lightning_dmg % applies.",
      requires: "m_poison_bolt",
      synergy: "lightning_dmg % stacks with INT scaling for strong burst.",
    },

    // ── Tier 3 ──
    {
      id: "m_blizzard", name: "Blizzard", tier: 3, levelReq: 25, cost: 3,
      mp: 85, cooldown: 5, damage: 2.0, element: "ice",
      description: "Summon blizzard: 200% damage + freeze 1 turn. ice_dmg % is FULLY applied.",
      requires: "m_ice_lance",
      synergy: "ice_dmg synergizes: each % adds directly to blizzard AoE damage.",
    },
    {
      id: "m_flame_wall", name: "Flame Wall", tier: 3, levelReq: 28, cost: 3,
      mp: 80, cooldown: 5, damage: 2.2, element: "fire",
      description: "Conjure a wall of flames: 220% fire damage each turn for 2 turns.",
      requires: "m_arcane_burst",
      synergy: "fire_dmg % compounds over both turns of the flame wall.",
    },
    {
      id: "m_time_warp", name: "Time Warp", tier: 3, levelReq: 28, cost: 3,
      mp: 80, cooldown: 6, damage: 0, element: null, buff: "attack",
      description: "Bend time: reset all cooldowns + gain an extra action.",
      requires: "m_mana_shield",
    },
    {
      id: "m_meteor", name: "Meteor", tier: 3, levelReq: 30, cost: 4,
      mp: 95, cooldown: 5, damage: 3.0, element: "fire",
      description: "Call down a meteor: 300% fire damage. fire_dmg % amplifies this fully.",
      requires: "m_flame_wall",
      synergy: "fire_dmg build makes Meteor one of the highest damage skills.",
    },

    // ── Tier 4 ──
    {
      id: "m_black_hole", name: "Black Hole", tier: 4, levelReq: 45, cost: 4,
      mp: 120, cooldown: 5, damage: 3.5, element: "arcane",
      description: "Collapse space: 350% damage + stun 2 turns. Pure INT + arcane scaling.",
      requires: "m_blizzard",
    },
    {
      id: "m_arcane_nova", name: "Arcane Nova", tier: 4, levelReq: 50, cost: 5,
      mp: 140, cooldown: 5, damage: 4.0, element: "arcane",
      description: "Massive arcane explosion: 400% magic damage. INT scaling squared at this tier.",
      requires: "m_meteor",
    },
    {
      id: "m_blood_pact", name: "Blood Pact", tier: 4, levelReq: 48, cost: 4,
      mp: 110, cooldown: 5, damage: 2.8, element: "blood",
      description: "Sacrifice HP for power: 280% blood damage + 15% HP loss. 🩸 blood_dmg applies.",
      requires: "m_time_warp",
      synergy: "blood_dmg % amplifies but the cost scales too. High risk/high reward.",
    },
    {
      id: "m_chrono_rift", name: "Chrono Rift", tier: 4, levelReq: 55, cost: 4,
      mp: 110, cooldown: 5, damage: 2.8, element: "arcane",
      description: "Tear time: 280% damage + duplicate the hit after 1 turn.",
      requires: "m_time_warp",
    },
    {
      id: "m_ice_prison", name: "Ice Prison", tier: 4, levelReq: 52, cost: 4,
      mp: 125, cooldown: 5, damage: 2.5, element: "ice", buff: "defense",
      description: "Encase enemy in ice: 250% ice damage + immunity to attacks for 1 turn.",
      requires: "m_black_hole",
      synergy: "ice_dmg builds turn this into both offense and defense.",
    },

    // ── Tier 5 ──
    {
      id: "m_singularity", name: "Singularity", tier: 5, levelReq: 70, cost: 5,
      mp: 175, cooldown: 6, damage: 5.5, element: "arcane",
      description: "Collapse reality: 550% magic damage. Requires massive INT investment.",
      requires: "m_black_hole",
    },
    {
      id: "m_genesis", name: "Genesis", tier: 5, levelReq: 75, cost: 5,
      mp: 160, cooldown: 6, damage: 0, element: null, buff: "defense",
      description: "Reshape reality: fully restore all party HP and MP.",
      requires: "m_chrono_rift",
    },
    {
      id: "m_apocalypse", name: "Apocalypse", tier: 5, levelReq: 80, cost: 6,
      mp: 200, cooldown: 6, damage: 6.0, element: "fire",
      description: "Unleash the apocalypse: 600% fire+arcane damage. fire_dmg % fully stacks.",
      requires: "m_arcane_nova",
      synergy: "fire_dmg is the key amplifier. Max fire build here = highest DPS in game.",
    },

    // ── New Tier 2 fills ──
    {
      id: "m_arcane_shield", name: "Arcane Shield", tier: 2, levelReq: 11, cost: 2,
      mp: 40, cooldown: 4, damage: 0, element: "arcane", buff: "defense",
      description: "Arcane barrier: absorb damage equal to 40% of INT for 2 turns.",
      requires: "m_frost_armor",
    },
    {
      id: "m_chain_lightning", name: "Chain Lightning", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 2.0, element: "lightning",
      description: "Lightning chains through enemies: 200% damage. lightning_dmg amplifies each chain.",
      requires: "m_lightning_bolt",
      synergy: "lightning_dmg % makes each chain hit harder than the last.",
    },

    // ── New Tier 3 fills ──
    {
      id: "m_poison_cloud", name: "Poison Cloud", tier: 3, levelReq: 27, cost: 3,
      mp: 70, cooldown: 5, damage: 1.5, element: "poison",
      description: "Toxic cloud: 150% damage/turn for 4 turns. poison_dmg fully applies per tick.",
      requires: "m_poison_bolt",
      synergy: "poison_dmg % makes this the strongest sustained damage over time.",
    },
    {
      id: "m_frost_nova", name: "Frost Nova", tier: 3, levelReq: 29, cost: 3,
      mp: 75, cooldown: 5, damage: 1.8, element: "ice",
      description: "Explosion of frost: 180% ice damage + freeze all enemies 1 turn.",
      requires: "m_ice_lance",
    },
    {
      id: "m_mana_burn", name: "Mana Burn", tier: 3, levelReq: 31, cost: 3,
      mp: 60, cooldown: 4, damage: 2.0, element: "arcane",
      description: "Drain enemy mana: 200% arcane damage + restore 20% of your MP.",
      requires: "m_mana_shield",
    },

    // ── New Tier 4 fills ──
    {
      id: "m_infernal_pact", name: "Infernal Pact", tier: 4, levelReq: 53, cost: 4,
      mp: 115, cooldown: 5, damage: 3.2, element: "fire",
      description: "Demonic pact: +50% fire damage for 4 turns. All fire skills empowered.",
      requires: "m_flame_wall",
      buff: "attack",
    },
    {
      id: "m_sandstorm", name: "Sandstorm", tier: 4, levelReq: 50, cost: 4,
      mp: 105, cooldown: 5, damage: 2.5, element: "sand",
      description: "Conjure sandstorm: 250% sand damage + blind. sand_dmg applies.",
      requires: "m_time_warp",
      synergy: "sand_dmg % opens an uncommon mage path. Combine with Time Warp for lockdown.",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "m_arcane_god", name: "Arcane Godform", tier: 6, levelReq: 90, cost: 7,
      mp: 220, cooldown: 7, damage: 0, element: "arcane", buff: "attack",
      description: "Transcend: +100% magic damage, +50% all elemental, cooldowns halved for 5 turns.",
      requires: "m_singularity",
    },
    {
      id: "m_supernova", name: "Supernova", tier: 6, levelReq: 93, cost: 8,
      mp: 280, cooldown: 8, damage: 12.0, element: "fire",
      description: "Detonate a star: 1200% fire damage. The ultimate destructive spell.",
      requires: "m_apocalypse",
      synergy: "fire_dmg % FULLY stacks. With Infernal Pact active = game-ending damage.",
    },
    {
      id: "m_absolute_zero", name: "Absolute Zero", tier: 6, levelReq: 95, cost: 7,
      mp: 240, cooldown: 7, damage: 7.0, element: "ice",
      description: "Freeze reality: 700% ice damage + freeze 3 turns. ice_dmg fully applied.",
      requires: "m_ice_prison",
      synergy: "ice_dmg build's ultimate payoff. Complete lockdown + massive damage.",
    },
  ],

  ranger: [
    // ── Tier 1 ──
    {
      id: "r_quick_shot", name: "Quick Shot", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.2, element: "physical",
      description: "Rapid shot: 120% damage. DEX is the primary scaling stat.",
      requires: null,
    },
    {
      id: "r_dodge_roll", name: "Dodge Roll", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 3, damage: 0, element: null, buff: "defense",
      description: "+40% evasion for 2 turns. DEX amplifies base evasion further.",
      requires: null,
      synergy: "High DEX characters benefit most since base evasion is already high.",
    },
    {
      id: "r_poison_shot", name: "Poison Shot", tier: 1, levelReq: 4, cost: 1,
      mp: 25, cooldown: 3, damage: 1.1, element: "poison",
      description: "Envenomed arrow: 110% damage + ☠️ Poison DoT for 3 turns. poison_dmg applies.",
      requires: null,
      synergy: "poison_dmg % amplifies the DoT component each tick.",
    },
    {
      id: "r_fire_arrow", name: "Fire Arrow", tier: 1, levelReq: 6, cost: 2,
      mp: 32, cooldown: 3, damage: 1.4, element: "fire",
      description: "Flaming arrow: 140% damage + 🔥 Fire bonus from fire_dmg %.",
      requires: "r_quick_shot",
      synergy: "fire_dmg % adds directly to each arrow's damage.",
    },

    // ── Tier 2 ──
    {
      id: "r_triple_shot", name: "Triple Shot", tier: 2, levelReq: 10, cost: 2,
      mp: 38, cooldown: 3, damage: 1.6, element: "physical",
      description: "Fire 3 arrows: 160% total damage. Each arrow benefits from DEX scaling.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_frost_arrow", name: "Frost Arrow", tier: 2, levelReq: 11, cost: 2,
      mp: 42, cooldown: 4, damage: 1.5, element: "ice",
      description: "Ice-tipped arrow: 150% damage + slows enemy. ❄️ ice_dmg % applies.",
      requires: "r_poison_shot",
      synergy: "ice_dmg builds open a slow/kite playstyle.",
    },
    {
      id: "r_multishot", name: "Multishot", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 2.2, element: "physical",
      description: "Unleash 5 arrows: 220% total damage. DEX is critical here.",
      requires: "r_triple_shot",
    },
    {
      id: "r_lightning_arrow", name: "Lightning Arrow", tier: 2, levelReq: 13, cost: 3,
      mp: 50, cooldown: 4, damage: 1.8, element: "lightning",
      description: "Electrically charged arrow: 180% damage + chain hits. ⚡ lightning_dmg applies.",
      requires: "r_fire_arrow",
      synergy: "lightning_dmg % makes chain attacks more powerful.",
    },

    // ── Tier 3 ──
    {
      id: "r_eagle_eye", name: "Eagle Eye", tier: 3, levelReq: 25, cost: 3,
      mp: 50, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "+50% crit chance + 30% crit damage for 3 turns. Stack with DEX/LUK.",
      requires: "r_frost_arrow",
      synergy: "High LUK + Eagle Eye = near-100% crit window.",
    },
    {
      id: "r_traps", name: "Lay Traps", tier: 3, levelReq: 28, cost: 3,
      mp: 60, cooldown: 5, damage: 1.8, element: "physical",
      description: "Set traps: 180% guaranteed-hit damage. Synergy with poison builds.",
      requires: "r_multishot",
    },
    {
      id: "r_sand_trap", name: "Sand Trap", tier: 3, levelReq: 27, cost: 3,
      mp: 58, cooldown: 5, damage: 1.6, element: "sand",
      description: "Bury enemy in sand: 160% damage + blind (-30% enemy accuracy). 🌪️ sand_dmg applies.",
      requires: "r_lightning_arrow",
      synergy: "sand_dmg % amplifies this + the blind synergizes with evasion builds.",
    },
    {
      id: "r_arrow_rain", name: "Rain of Arrows", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 5, damage: 2.8, element: "physical",
      description: "Volley dealing 280% damage to all enemies. DEX greatly scales this.",
      requires: "r_traps",
    },

    // ── Tier 4 ──
    {
      id: "r_hunters_mark", name: "Hunter's Mark", tier: 4, levelReq: 45, cost: 4,
      mp: 70, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "Mark target: +40% damage from all sources for 4 turns.",
      requires: "r_eagle_eye",
    },
    {
      id: "r_blood_arrow", name: "Blood Arrow", tier: 4, levelReq: 47, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "blood",
      description: "Arrow drenched in blood: 250% damage + heal 8% HP per hit. 🩸 blood_dmg applies.",
      requires: "r_sand_trap",
      synergy: "blood_dmg % stacks with the lifesteal component.",
    },
    {
      id: "r_volley", name: "Volley Barrage", tier: 4, levelReq: 50, cost: 5,
      mp: 115, cooldown: 5, damage: 3.8, element: "physical",
      description: "Overwhelming barrage: 380% damage with guaranteed crits.",
      requires: "r_arrow_rain",
    },
    {
      id: "r_shadow_step", name: "Shadow Step", tier: 4, levelReq: 55, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "physical",
      description: "Vanish and reappear: 250% stealth damage. DEX-based.",
      requires: "r_hunters_mark",
    },

    // ── Tier 5 ──
    {
      id: "r_death_arrow", name: "Death Arrow", tier: 5, levelReq: 70, cost: 5,
      mp: 150, cooldown: 6, damage: 5.0, element: "physical",
      description: "Legendary shot piercing all defenses: 500% damage.",
      requires: "r_hunters_mark",
    },
    {
      id: "r_storm_bow", name: "Storm Bow", tier: 5, levelReq: 75, cost: 6,
      mp: 170, cooldown: 6, damage: 4.5, element: "lightning",
      description: "Channel lightning into bow: 450% damage + stun. ⚡ lightning_dmg FULLY stacks.",
      requires: "r_volley",
      synergy: "lightning_dmg build here is the highest-damage ranger path.",
    },
    {
      id: "r_wrath_of_hunt", name: "Wrath of the Hunt", tier: 5, levelReq: 80, cost: 5,
      mp: 165, cooldown: 6, damage: 6.0, element: "physical",
      description: "Invoke the hunt spirit: 600% damage, guaranteed crit. All DEX builds peak here.",
      requires: "r_shadow_step",
    },

    // ── New Tier 2 fills ──
    {
      id: "r_nature_bond", name: "Nature's Bond", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "Nature heals: restore 15% HP + MP over 3 turns.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_explosive_arrow", name: "Explosive Arrow", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 4, damage: 2.0, element: "fire",
      description: "Exploding arrowhead: 200% fire AoE damage. fire_dmg applies.",
      requires: "r_fire_arrow",
      synergy: "fire_dmg % makes this a strong AoE option for fire ranger builds.",
    },

    // ── New Tier 3 fills ──
    {
      id: "r_wind_walk", name: "Wind Walk", tier: 3, levelReq: 26, cost: 3,
      mp: 55, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "+60% evasion + 30% ATK speed for 2 turns. Ultimate kite move.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_venom_rain", name: "Venom Rain", tier: 3, levelReq: 29, cost: 3,
      mp: 70, cooldown: 5, damage: 1.8, element: "poison",
      description: "Rain of poisoned arrows: 180% damage + poison DoT 4 turns.",
      requires: "r_poison_shot",
      synergy: "poison_dmg % amplifies each tick. AoE poison build core skill.",
    },
    {
      id: "r_snipe", name: "Snipe", tier: 3, levelReq: 32, cost: 4,
      mp: 75, cooldown: 5, damage: 3.2, element: "physical",
      description: "Perfect shot: 320% damage, guaranteed crit, ignores 30% defense.",
      requires: "r_triple_shot",
    },

    // ── New Tier 4 fills ──
    {
      id: "r_elemental_quiver", name: "Elemental Quiver", tier: 4, levelReq: 48, cost: 4,
      mp: 85, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "+25% to ALL elemental damage for 4 turns. Empowers any elemental arrow.",
      requires: "r_eagle_eye",
    },
    {
      id: "r_piercing_shot", name: "Piercing Shot", tier: 4, levelReq: 53, cost: 5,
      mp: 100, cooldown: 5, damage: 3.5, element: "physical",
      description: "Arrow pierces through: 350% damage, ignores 60% defense.",
      requires: "r_arrow_rain",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "r_spirit_of_the_wild", name: "Spirit of the Wild", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 0, element: null, buff: "attack",
      description: "Channel nature: +100% DEX, +50% crit, all arrows gain elemental for 5 turns.",
      requires: "r_wrath_of_hunt",
    },
    {
      id: "r_celestial_barrage", name: "Celestial Barrage", tier: 6, levelReq: 93, cost: 8,
      mp: 260, cooldown: 8, damage: 9.0, element: "lightning",
      description: "Rain of celestial arrows: 900% lightning damage. lightning_dmg FULLY stacks.",
      requires: "r_storm_bow",
      synergy: "lightning_dmg build ranger's ultimate. Combine with Elemental Quiver.",
    },
    {
      id: "r_natures_wrath", name: "Nature's Wrath", tier: 6, levelReq: 95, cost: 7,
      mp: 220, cooldown: 7, damage: 7.5, element: "poison",
      description: "Unleash nature's fury: 750% poison damage + 10% max HP DoT for 5 turns.",
      requires: "r_death_arrow",
      synergy: "poison_dmg build ranger's endgame. Devastating sustained damage.",
    },
  ],

  rogue: [
    // ── Tier 1 ──
    {
      id: "ro_quick_slash", name: "Quick Slash", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.3, element: "physical",
      description: "Fast slash: 130% damage. DEX and LUK scale this.",
      requires: null,
    },
    {
      id: "ro_smoke_bomb", name: "Smoke Bomb", tier: 1, levelReq: 1, cost: 1,
      mp: 25, cooldown: 3, damage: 0, element: null, buff: "defense",
      description: "+50% evasion for 2 turns. Pairs with dodge/evasion builds.",
      requires: null,
    },
    {
      id: "ro_poison_blade", name: "Poison Blade", tier: 1, levelReq: 4, cost: 1,
      mp: 28, cooldown: 3, damage: 1.1, element: "poison",
      description: "Envenomed strike: 110% damage + ☠️ Poison DoT 4 turns. poison_dmg applies.",
      requires: null,
      synergy: "poison_dmg % amplifies every DoT tick. Stack poison items for max DoT.",
    },
    {
      id: "ro_backstab", name: "Backstab", tier: 1, levelReq: 5, cost: 2,
      mp: 32, cooldown: 3, damage: 2.0, element: "physical",
      description: "Strike from shadows: 200% damage + guaranteed crit.",
      requires: "ro_quick_slash",
      synergy: "LUK amplifies crit multiplier. Best opener in any rotation.",
    },

    // ── Tier 2 ──
    {
      id: "ro_open_wounds", name: "Open Wounds", tier: 2, levelReq: 10, cost: 2,
      mp: 38, cooldown: 4, damage: 1.4, element: "blood",
      description: "Deep slash: 140% damage + 🩸 blood DoT 3 turns (5% HP/turn). blood_dmg applies.",
      requires: "ro_smoke_bomb",
      synergy: "blood_dmg % amplifies each DoT tick. Stacks with Open Wounds + Blood Frenzy.",
    },
    {
      id: "ro_pickpocket", name: "Pickpocket", tier: 2, levelReq: 12, cost: 2,
      mp: 28, cooldown: 4, damage: 1.0, element: "physical", special: "pickpocket",
      description: "Steal 100-500 gold + 100% damage hit. LUK increases gold stolen.",
      requires: null,
      synergy: "High LUK = more gold stolen per use.",
    },
    {
      id: "ro_frost_strike", name: "Frost Strike", tier: 2, levelReq: 11, cost: 2,
      mp: 38, cooldown: 3, damage: 1.5, element: "ice",
      description: "Chilling blade hit: 150% damage + slows enemy. ❄️ ice_dmg applies.",
      requires: "ro_poison_blade",
      synergy: "ice_dmg % + slow enables safe followup turns.",
    },
    {
      id: "ro_lightning_step", name: "Lightning Step", tier: 2, levelReq: 14, cost: 3,
      mp: 45, cooldown: 4, damage: 1.6, element: "lightning",
      description: "Blur across battlefield: 160% lightning damage + +20% evasion for 1 turn.",
      requires: "ro_backstab",
      synergy: "lightning_dmg % boosts damage. Good mobility opener.",
    },

    // ── Tier 3 ──
    {
      id: "ro_blade_dance", name: "Blade Dance", tier: 3, levelReq: 25, cost: 3,
      mp: 65, cooldown: 4, damage: 2.2, element: "physical",
      description: "Graceful combo: 220% damage with 3 rapid hits. Each hit can crit.",
      requires: "ro_open_wounds",
    },
    {
      id: "ro_garrote", name: "Garrote", tier: 3, levelReq: 28, cost: 3,
      mp: 62, cooldown: 5, damage: 1.8, element: "blood",
      description: "Strangle: 180% blood damage + silences for 2 turns. blood_dmg applies.",
      requires: "ro_pickpocket",
      synergy: "blood_dmg % makes garrote a strong utility+damage combo.",
    },
    {
      id: "ro_sand_blind", name: "Sand Blind", tier: 3, levelReq: 27, cost: 3,
      mp: 55, cooldown: 5, damage: 1.2, element: "sand",
      description: "Throw sand in eyes: 120% damage + -40% enemy accuracy for 2 turns. 🌪️ sand_dmg applies.",
      requires: "ro_frost_strike",
      synergy: "sand_dmg % amplifies. Combined with evasion = near-untouchable turns.",
    },
    {
      id: "ro_shadow_strike", name: "Shadow Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 4, damage: 2.8, element: "physical",
      description: "Step through shadows: 280% damage, ignores 40% defense.",
      requires: "ro_lightning_step",
    },

    // ── Tier 4 ──
    {
      id: "ro_blood_frenzy", name: "Blood Frenzy", tier: 4, levelReq: 45, cost: 4,
      mp: 95, cooldown: 5, damage: 2.5, element: "blood",
      description: "Enter frenzy: 250% blood damage + heal 10% HP per hit for 2 turns.",
      requires: "ro_blade_dance",
      synergy: "blood_dmg % is fully applied per hit. Combine with Open Wounds DoT.",
    },
    {
      id: "ro_death_mark", name: "Death Mark", tier: 4, levelReq: 45, cost: 4,
      mp: 88, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "Mark for death: +60% damage from all sources for 4 turns.",
      requires: "ro_garrote",
    },
    {
      id: "ro_assassinate", name: "Assassinate", tier: 4, levelReq: 50, cost: 5,
      mp: 120, cooldown: 5, damage: 4.0, element: "physical",
      description: "Execute sequence: 400% damage. Instant kill if target HP < 20%.",
      requires: "ro_shadow_strike",
    },
    {
      id: "ro_shadow_realm_entry", name: "Shadow Walk", tier: 4, levelReq: 55, cost: 4,
      mp: 105, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "Enter shadow realm: untouchable 2 turns; next attack deals 300% damage.",
      requires: "ro_sand_blind",
    },

    // ── Tier 5 ──
    {
      id: "ro_oblivion", name: "Oblivion Blade", tier: 5, levelReq: 70, cost: 5,
      mp: 165, cooldown: 6, damage: 5.5, element: "physical",
      description: "Blade of oblivion: 550% damage, ignores all defenses.",
      requires: "ro_blood_frenzy",
    },
    {
      id: "ro_phantom", name: "Phantom Rogue", tier: 5, levelReq: 75, cost: 5,
      mp: 155, cooldown: 6, damage: 0, element: null, buff: "defense",
      description: "Become phantom: evade all attacks 3 turns + heal 30% HP.",
      requires: "ro_shadow_realm_entry",
    },
    {
      id: "ro_reaper", name: "Soul Reaper", tier: 5, levelReq: 80, cost: 6,
      mp: 195, cooldown: 6, damage: 7.0, element: "blood",
      description: "Channel the reaper: 700% blood damage. Guaranteed kill if HP < 30%. blood_dmg FULLY stacks.",
      requires: "ro_assassinate",
      synergy: "blood_dmg build makes this the single highest damage skill in the game.",
    },

    // ── New Tier 2 fills ──
    {
      id: "ro_dual_strike", name: "Dual Strike", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 3, damage: 1.8, element: "physical",
      description: "Strike with both blades: 180% damage. Each hit can crit independently.",
      requires: "ro_backstab",
    },
    {
      id: "ro_venomous_fan", name: "Venomous Fan", tier: 2, levelReq: 13, cost: 2,
      mp: 42, cooldown: 4, damage: 1.3, element: "poison",
      description: "Throw poisoned daggers: 130% damage + AoE poison DoT 3 turns.",
      requires: "ro_poison_blade",
      synergy: "poison_dmg % amplifies. Pairs with Poison Blade for max DoT stacking.",
    },

    // ── New Tier 3 fills ──
    {
      id: "ro_shadowmeld", name: "Shadowmeld", tier: 3, levelReq: 27, cost: 3,
      mp: 55, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "Meld with shadows: 100% evasion for 1 turn + next attack crits.",
      requires: "ro_smoke_bomb",
    },
    {
      id: "ro_cheap_shot", name: "Cheap Shot", tier: 3, levelReq: 29, cost: 3,
      mp: 50, cooldown: 4, damage: 2.0, element: "physical",
      description: "Low blow: 200% damage + stun 1 turn. Guaranteed crit from stealth.",
      requires: "ro_backstab",
    },
    {
      id: "ro_viper_strike", name: "Viper Strike", tier: 3, levelReq: 31, cost: 3,
      mp: 65, cooldown: 4, damage: 2.0, element: "poison",
      description: "Serpent-speed strike: 200% poison damage + 50% ATK speed for 1 turn.",
      requires: "ro_venomous_fan",
      synergy: "poison_dmg stacks. Speed buff enables devastating follow-ups.",
    },

    // ── New Tier 4 fills ──
    {
      id: "ro_mark_of_shadows", name: "Mark of Shadows", tier: 4, levelReq: 49, cost: 4,
      mp: 80, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "Mark target: +40% crit damage + 20% lifesteal from all attacks for 4 turns.",
      requires: "ro_death_mark",
    },
    {
      id: "ro_executioner", name: "Executioner's Edge", tier: 4, levelReq: 56, cost: 5,
      mp: 110, cooldown: 5, damage: 3.5, element: "physical",
      description: "Execute strike: 350% damage. Instant kill if target HP < 25%.",
      requires: "ro_assassinate",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "ro_void_dancer", name: "Void Dancer", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 0, element: null, buff: "attack",
      description: "Enter the void: +100% evasion, +80% crit, +50% ATK speed for 4 turns.",
      requires: "ro_phantom",
    },
    {
      id: "ro_deaths_embrace", name: "Death's Embrace", tier: 6, levelReq: 93, cost: 8,
      mp: 250, cooldown: 8, damage: 10.0, element: "blood",
      description: "Become death itself: 1000% blood damage. Heal for 50% of damage dealt.",
      requires: "ro_reaper",
      synergy: "blood_dmg build's ultimate payoff. Highest single-hit in the game.",
    },
    {
      id: "ro_thousand_cuts", name: "Thousand Cuts", tier: 6, levelReq: 95, cost: 7,
      mp: 230, cooldown: 7, damage: 8.0, element: "physical",
      description: "Invisible blade storm: 800% damage, 10 hits each can crit. DEX scaling maximized.",
      requires: "ro_oblivion",
    },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// SKILL SYNERGY SYSTEM
// Learning specific combos of skills unlocks passive bonuses.
// Each synergy requires 2-3 skills. Bonuses are permanent while skills are known.
// ══════════════════════════════════════════════════════════════════════════════

export const SKILL_SYNERGIES = {
  warrior: [
    { id: "syn_w_bloodfire", name: "Bloodfire Fury", description: "+8% Fire DMG, +8% Blood DMG, +5% Lifesteal",
      requires: ["w_flame_slash", "w_blood_rage"], bonuses: { fire_dmg: 8, blood_dmg: 8, lifesteal: 5 }, icon: "🔥🩸", buildType: "Elemental Warrior" },
    { id: "syn_w_ironwall", name: "Iron Wall", description: "+20% Block, +15% DEF, +200 HP",
      requires: ["w_shield_block", "w_iron_skin", "w_bulwark"], bonuses: { block_chance: 20, defense_pct: 15, hp_flat: 200 }, icon: "🛡️🧱", buildType: "Tank" },
    { id: "syn_w_berserker_path", name: "Berserker's Path", description: "+15% ATK, +10% Crit, +8% ATK Speed",
      requires: ["w_rage", "w_battle_shout"], bonuses: { attack_pct: 15, crit_chance: 10, attack_speed: 8 }, icon: "⚔️💢", buildType: "Berserker" },
    { id: "syn_w_storm_warrior", name: "Storm Warrior", description: "+12% Lightning, +10% Sand, +10% Speed",
      requires: ["w_thunder_strike", "w_sand_veil"], bonuses: { lightning_dmg: 12, sand_dmg: 10, attack_speed: 10 }, icon: "⚡🌪️", buildType: "Storm" },
    { id: "syn_w_juggernaut_force", name: "Unstoppable Force", description: "+20% Boss DMG, +10% Crit DMG, +300 HP",
      requires: ["w_juggernaut", "w_avatar", "w_titan_form"], bonuses: { boss_dmg_pct: 20, crit_dmg_pct: 10, hp_flat: 300 }, icon: "💪👑", buildType: "Juggernaut" },
    { id: "syn_w_ragnarok_path", name: "Path of Ragnarok", description: "+25% Fire, +15% Boss DMG, +12% Crit DMG",
      requires: ["w_armageddon", "w_inferno_blade", "w_ragnarok"], bonuses: { fire_dmg: 25, boss_dmg_pct: 15, crit_dmg_pct: 12 }, icon: "🔥💀", buildType: "Fire Warrior" },
  ],
  mage: [
    { id: "syn_m_pyromancer", name: "Pyromancer", description: "+15% Fire, +8% Crit, +5% Boss DMG",
      requires: ["m_fireball", "m_flame_wall"], bonuses: { fire_dmg: 15, crit_chance: 8, boss_dmg_pct: 5 }, icon: "🔥🔥", buildType: "Fire Mage" },
    { id: "syn_m_cryomancer", name: "Cryomancer", description: "+15% Ice, +10% DEF, +8% Evasion",
      requires: ["m_frost_armor", "m_ice_lance", "m_blizzard"], bonuses: { ice_dmg: 15, defense_pct: 10, evasion: 8 }, icon: "❄️❄️", buildType: "Ice Mage" },
    { id: "syn_m_arcane_mastery", name: "Arcane Mastery", description: "+20% ATK, +100 MP, +5 MP Regen",
      requires: ["m_arcane_burst", "m_black_hole"], bonuses: { attack_pct: 20, mp_flat: 100, mp_regen: 5 }, icon: "✨🧠", buildType: "Arcane Mage" },
    { id: "syn_m_time_lord", name: "Temporal Lord", description: "+15% Speed, +12% Evasion, +10% EXP",
      requires: ["m_time_warp", "m_chrono_rift"], bonuses: { attack_speed: 15, evasion: 12, exp_pct: 10 }, icon: "⏰✨", buildType: "Chronomancer" },
    { id: "syn_m_blood_mage", name: "Blood Mage", description: "+12% Blood, +8% Lifesteal, +200 HP",
      requires: ["m_blood_pact", "m_poison_cloud"], bonuses: { blood_dmg: 12, lifesteal: 8, hp_flat: 200 }, icon: "🩸☠️", buildType: "Blood Mage" },
    { id: "syn_m_apocalypse_path", name: "Apocalypse Bringer", description: "+30% Fire, +20% Boss DMG, +15% Crit DMG",
      requires: ["m_meteor", "m_apocalypse", "m_supernova"], bonuses: { fire_dmg: 30, boss_dmg_pct: 20, crit_dmg_pct: 15 }, icon: "🔥💥", buildType: "Destruction Mage" },
  ],
  ranger: [
    { id: "syn_r_sharpshooter", name: "Sharpshooter", description: "+15% Crit, +12% Crit DMG, +8% Speed",
      requires: ["r_triple_shot", "r_eagle_eye"], bonuses: { crit_chance: 15, crit_dmg_pct: 12, attack_speed: 8 }, icon: "🎯🏹", buildType: "Sharpshooter" },
    { id: "syn_r_poison_master", name: "Poison Master", description: "+15% Poison, +5% Drop, +8% Gold",
      requires: ["r_poison_shot", "r_venom_rain"], bonuses: { poison_dmg: 15, drop_chance: 5, gold_pct: 8 }, icon: "☠️🏹", buildType: "Poison Ranger" },
    { id: "syn_r_elemental_archer", name: "Elemental Archer", description: "+10% Fire, +10% Ice, +10% Lightning",
      requires: ["r_fire_arrow", "r_frost_arrow", "r_lightning_arrow"], bonuses: { fire_dmg: 10, ice_dmg: 10, lightning_dmg: 10 }, icon: "🔥❄️⚡", buildType: "Elemental Ranger" },
    { id: "syn_r_wind_runner", name: "Wind Runner", description: "+20% Evasion, +15% Speed, +10% EXP",
      requires: ["r_dodge_roll", "r_wind_walk", "r_shadow_step"], bonuses: { evasion: 20, attack_speed: 15, exp_pct: 10 }, icon: "💨🏃", buildType: "Wind Runner" },
    { id: "syn_r_storm_archer", name: "Storm Archer", description: "+25% Lightning, +15% Boss, +10% Crit DMG",
      requires: ["r_lightning_arrow", "r_storm_bow", "r_celestial_barrage"], bonuses: { lightning_dmg: 25, boss_dmg_pct: 15, crit_dmg_pct: 10 }, icon: "⚡🌩️", buildType: "Storm Ranger" },
  ],
  rogue: [
    { id: "syn_ro_shadow_assassin", name: "Shadow Assassin", description: "+20% Crit DMG, +15% Boss, +10% Speed",
      requires: ["ro_backstab", "ro_shadow_strike"], bonuses: { crit_dmg_pct: 20, boss_dmg_pct: 15, attack_speed: 10 }, icon: "🗡️🌑", buildType: "Shadow Assassin" },
    { id: "syn_ro_blood_dancer", name: "Blood Dancer", description: "+15% Blood, +10% Lifesteal, +10% Evasion",
      requires: ["ro_open_wounds", "ro_blood_frenzy"], bonuses: { blood_dmg: 15, lifesteal: 10, evasion: 10 }, icon: "🩸💃", buildType: "Blood Rogue" },
    { id: "syn_ro_venom_master", name: "Venom Master", description: "+15% Poison, +8% Speed, +5% Drop",
      requires: ["ro_poison_blade", "ro_venomous_fan", "ro_viper_strike"], bonuses: { poison_dmg: 15, attack_speed: 8, drop_chance: 5 }, icon: "☠️🐍", buildType: "Poison Rogue" },
    { id: "syn_ro_phantom_thief", name: "Phantom Thief", description: "+15% Evasion, +12% Gold, +10% EXP",
      requires: ["ro_smoke_bomb", "ro_pickpocket", "ro_shadowmeld"], bonuses: { evasion: 15, gold_pct: 12, exp_pct: 10 }, icon: "👻💰", buildType: "Phantom Thief" },
    { id: "syn_ro_death_lord", name: "Death Lord", description: "+25% Blood, +20% Boss, +15% Lifesteal",
      requires: ["ro_blood_frenzy", "ro_reaper", "ro_deaths_embrace"], bonuses: { blood_dmg: 25, boss_dmg_pct: 20, lifesteal: 15 }, icon: "💀👑", buildType: "Death Lord" },
    { id: "syn_ro_blade_master", name: "Blade Master", description: "+15% ATK, +20% Crit, +12% Speed",
      requires: ["ro_blade_dance", "ro_dual_strike", "ro_assassinate"], bonuses: { attack_pct: 15, crit_chance: 20, attack_speed: 12 }, icon: "⚔️🌀", buildType: "Blade Master" },
  ],
};

// Helper to get active synergies for a character
// Synergies only activate when required skills are equipped in hotbar
export function getActiveSynergies(charClass, learnedSkills = [], equippedSkills = null) {
  const synergies = SKILL_SYNERGIES[charClass] || [];
  const learned = new Set(learnedSkills);
  // If equippedSkills provided, synergies require skills to be in hotbar
  const equipped = equippedSkills ? new Set(equippedSkills) : null;
  return synergies.filter(syn => {
    // All required skills must be learned
    if (!syn.requires.every(id => learned.has(id))) return false;
    // AND all required skills must be equipped/in hotbar
    if (equipped && !syn.requires.every(id => equipped.has(id))) return false;
    return true;
  });
}

// Element stacking bonuses: when N skills of the same element are equipped
export const ELEMENT_STACK_BONUSES = {
  fire:      { 2: { fire_dmg: 5 }, 3: { fire_dmg: 12, crit_chance: 3 }, 4: { fire_dmg: 20, crit_chance: 5, boss_dmg_pct: 5 } },
  ice:       { 2: { ice_dmg: 5 }, 3: { ice_dmg: 12, defense_pct: 5 }, 4: { ice_dmg: 20, defense_pct: 8, evasion: 3 } },
  lightning: { 2: { lightning_dmg: 5 }, 3: { lightning_dmg: 12, attack_speed: 3 }, 4: { lightning_dmg: 20, attack_speed: 6, crit_dmg_pct: 8 } },
  poison:    { 2: { poison_dmg: 5 }, 3: { poison_dmg: 12, lifesteal: 2 }, 4: { poison_dmg: 20, lifesteal: 5, drop_chance: 3 } },
  blood:     { 2: { blood_dmg: 5 }, 3: { blood_dmg: 12, lifesteal: 3 }, 4: { blood_dmg: 20, lifesteal: 6, hp_flat: 200 } },
  sand:      { 2: { sand_dmg: 5 }, 3: { sand_dmg: 12, evasion: 3 }, 4: { sand_dmg: 20, evasion: 6, attack_speed: 3 } },
};

// Get active element stacking bonuses from equipped skills
export function getElementStackBonuses(charClass, equippedSkills = []) {
  if (!equippedSkills || equippedSkills.length === 0) return { bonuses: {}, activeStacks: [] };
  const allSkills = CLASS_SKILLS[charClass] || [];
  const elementCounts = {};
  for (const skillId of equippedSkills) {
    const skill = allSkills.find(s => s.id === skillId);
    if (skill?.element) {
      elementCounts[skill.element] = (elementCounts[skill.element] || 0) + 1;
    }
  }
  const bonuses = {};
  const activeStacks = [];
  for (const [element, count] of Object.entries(elementCounts)) {
    const tiers = ELEMENT_STACK_BONUSES[element];
    if (!tiers) continue;
    // Apply highest qualifying tier
    const tier = count >= 4 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : 0;
    if (tier > 0 && tiers[tier]) {
      for (const [stat, val] of Object.entries(tiers[tier])) {
        bonuses[stat] = (bonuses[stat] || 0) + val;
      }
      activeStacks.push({ element, count, tier, bonuses: tiers[tier] });
    }
  }
  return { bonuses, activeStacks };
}

// Helper to get total synergy bonuses
// equippedSkills: array of skill IDs currently in hotbar
export function getSynergyBonuses(charClass, learnedSkills = [], equippedSkills = null) {
  const active = getActiveSynergies(charClass, learnedSkills, equippedSkills);
  const bonuses = {};
  for (const syn of active) {
    for (const [stat, val] of Object.entries(syn.bonuses)) {
      bonuses[stat] = (bonuses[stat] || 0) + val;
    }
  }
  return bonuses;
}