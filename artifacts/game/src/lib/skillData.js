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
  // New warrior elemental
  w_frost_cleave: "icicle",    w_glacial_shield: "frostshield", w_frozen_wrath: "blizzard",
  w_avalanche_strike: "blizzard", w_venomous_edge: "poison", w_toxic_slam: "slam",
  w_plague_strike: "poison",   w_pandemic_cleave: "heavyslash", w_runic_blade: "nova",
  w_arcane_shatter: "nova",    w_void_cleave: "blackhole",  w_dimension_breaker: "blackhole",
  w_static_charge: "lightning", w_storm_shield: "shield",   w_mjolnir_strike: "lightning",
  w_tempest_fury: "lightning",
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
  // New mage elemental
  m_blood_bolt: "bleed",       m_hemomancy: "bleed",          m_crimson_storm: "bleed",
  m_sanguine_ritual: "bleed",  m_sand_barrier: "smoke",       m_dust_devil: "smoke",
  m_desert_wrath: "smoke",     m_thunderstorm: "lightning",   m_ball_lightning: "lightning",
  m_plague: "poison",          m_miasma: "poison",
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
  // New ranger elemental
  r_arcane_arrow: "arrow",     r_mystic_shot: "arrow",        r_ethereal_volley: "arrowrain",
  r_astral_barrage: "arrowrain", r_frozen_shot: "icicle",     r_glacial_rain: "arrowrain",
  r_absolute_winter: "blizzard", r_crimson_arrow: "bleed",    r_hemorrhage_shot: "bleed",
  r_sanguine_barrage: "arrowrain", r_dust_devil_arrow: "arrow", r_sandstorm_volley: "arrowrain",
  r_desert_judgment: "smoke",  r_inferno_rain: "arrowrain",   r_phoenix_arrow: "firearrow",
  r_thunderbolt_arrow: "lightning",
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
  // New rogue elemental
  ro_flame_dagger: "fireball", ro_ignition_strike: "fireball", ro_infernal_dance: "fireball",
  ro_phoenix_slash: "fireball", ro_void_strike: "blackhole",  ro_phase_shift: "smoke",
  ro_dimensional_slash: "blackhole", ro_reality_rend: "blackhole", ro_frozen_blade: "icicle",
  ro_glacial_ambush: "icicle", ro_absolute_chill: "blizzard", ro_thunder_strike: "lightning",
  ro_voltaic_rush: "lightning", ro_storm_blade: "lightning",  ro_dust_shroud: "smoke",
  ro_sandstorm_slash: "smoke", ro_desert_phantom: "smoke",   ro_neurotoxin: "poison",
  ro_plague_blade: "poison",
  // Gap fill animations
  w_blazing_cleave: "fireball",    w_inferno_slam: "fireball",     w_magma_rend: "fireball",
  w_permafrost_crush: "blizzard",  w_glacial_annihilation: "blizzard",
  w_thundergod_wrath: "lightning",
  w_blight_cleave: "poison",      w_plague_lord: "poison",
  w_crimson_edge: "bleed",        w_sanguine_slam: "bleed",       w_hemorrhage_strike: "bleed",
  w_bloodstorm_tyrant: "bleed",
  w_dust_strike: "smoke",         w_sandstone_bash: "smoke",      w_dune_colossus: "smoke",
  w_tomb_warden: "smoke",
  w_mystic_strike: "nova",        w_void_annihilator: "blackhole",
  m_pyroclasm: "fireball",         m_frozen_eternity: "blizzard",
  m_spark_bolt: "lightning",       m_voltaic_surge: "lightning",    m_tempest_god: "lightning",
  m_toxic_nova: "poison",          m_pandemic_ritual: "poison",
  m_sanguine_lance: "bleed",       m_blood_god: "bleed",
  m_sand_bolt: "smoke",            m_tomb_pharaoh: "smoke",
  r_apex_predator: "arrowrain",    r_blazing_volley: "firearrow",   r_phoenix_rain: "arrowrain",
  r_frost_tip: "icicle",           r_arctic_oblivion: "blizzard",
  r_static_arrow: "lightning",     r_storm_volley: "arrowrain",
  r_toxic_barb: "poison",          r_blight_arrow: "poison",        r_plague_rain: "arrowrain",
  r_bloodthorn_arrow: "bleed",     r_crimson_apocalypse: "arrowrain",
  r_desert_arrow: "arrow",         r_sirocco_storm: "smoke",
  r_cosmic_shot: "arrow",          r_void_hunter: "blackhole",
  ro_hellfire_dance: "fireball",   ro_inferno_reaper: "fireball",
  ro_frostbite_slash: "icicle",    ro_glacial_executioner: "blizzard",
  ro_spark_dagger: "lightning",    ro_tempest_assassin: "lightning",
  ro_death_blossom: "poison",
  ro_blood_nick: "bleed",
  ro_sand_toss: "smoke",           ro_dune_ambush: "smoke",         ro_tomb_wraith: "smoke",
  ro_astral_blade: "blackhole",    ro_cosmic_erasure: "blackhole",
  // Support skill animations
  w_rallying_cry: "roar",         w_fortress: "frostshield",       w_berserker_fury: "berserker",
  w_iron_bastion: "shield",
  m_healing_light: "divine",      m_greater_heal: "divine",        m_arcane_barrier: "frostshield",
  m_prismatic_ward: "frostshield",m_mana_surge: "nova",            m_mana_font: "nova",
  m_elemental_attunement: "nova", m_arcane_empowerment: "divine",
  r_natures_touch: "divine",      r_focused_aim: "eagleeye",       r_meditate: "dodge",
  r_pack_leader: "divine",
  ro_shadow_mend: "smoke",        ro_shadow_cloak: "smoke",        ro_adrenaline_rush: "berserker",
  ro_siphon_energy: "smoke",
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

    // ── New Ice skills ──
    {
      id: "w_frost_cleave", name: "Frost Cleave", tier: 1, levelReq: 6, cost: 2,
      mp: 40, cooldown: 3, damage: 1.4, element: "ice",
      description: "Ice-coated swing: 140% damage + slow enemy 1 turn. ice_dmg applies.",
      requires: null,
      synergy: "ice_dmg % adds to each swing. Opens ice warrior path.",
    },
    {
      id: "w_glacial_shield", name: "Glacial Shield", tier: 2, levelReq: 13, cost: 2,
      mp: 55, cooldown: 4, damage: 0, element: "ice", buff: "defense",
      description: "Ice barrier: +35% defense + reflect 10% damage as ice for 2 turns.",
      requires: "w_frost_cleave",
    },
    {
      id: "w_frozen_wrath", name: "Frozen Wrath", tier: 3, levelReq: 31, cost: 4,
      mp: 82, cooldown: 5, damage: 2.2, element: "ice",
      description: "Freeze and shatter: 220% ice damage + freeze 1 turn. ice_dmg fully applied.",
      requires: "w_glacial_shield",
      synergy: "ice_dmg % makes this both damage and CC. Pairs with Avalanche Strike.",
    },
    {
      id: "w_avalanche_strike", name: "Avalanche Strike", tier: 4, levelReq: 52, cost: 5,
      mp: 125, cooldown: 5, damage: 3.2, element: "ice",
      description: "Bring down the mountain: 320% ice damage + freeze 2 turns.",
      requires: "w_frozen_wrath",
      synergy: "ice_dmg stacking makes this the premier ice warrior nuke.",
    },

    // ── New Poison skills ──
    {
      id: "w_venomous_edge", name: "Venomous Edge", tier: 1, levelReq: 5, cost: 2,
      mp: 38, cooldown: 3, damage: 1.2, element: "poison",
      description: "Poisoned blade: 120% damage + poison DoT 3 turns. poison_dmg applies.",
      requires: null,
      synergy: "poison_dmg % amplifies each DoT tick.",
    },
    {
      id: "w_toxic_slam", name: "Toxic Slam", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 1.6, element: "poison",
      description: "Poison-infused ground slam: 160% damage + AoE poison cloud 2 turns.",
      requires: "w_venomous_edge",
      synergy: "poison_dmg % boosts both hit and cloud. Pairs with Plague Strike.",
    },
    {
      id: "w_plague_strike", name: "Plague Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 5, damage: 2.2, element: "poison",
      description: "Spreading plague: 220% poison damage + poison DoT 4 turns, stacks.",
      requires: "w_toxic_slam",
      synergy: "poison_dmg makes DoT devastating. Stack with Venomous Edge for max poison.",
    },
    {
      id: "w_pandemic_cleave", name: "Pandemic Cleave", tier: 4, levelReq: 53, cost: 5,
      mp: 118, cooldown: 5, damage: 3.0, element: "poison",
      description: "Lethal toxin sweep: 300% poison damage + -30% enemy healing for 3 turns.",
      requires: "w_plague_strike",
    },

    // ── New Arcane skills ──
    {
      id: "w_runic_blade", name: "Runic Blade", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 1.8, element: "arcane",
      description: "Rune-empowered strike: 180% arcane damage. Ignores 20% magic defense.",
      requires: null,
    },
    {
      id: "w_arcane_shatter", name: "Arcane Shatter", tier: 3, levelReq: 33, cost: 4,
      mp: 85, cooldown: 5, damage: 2.5, element: "arcane",
      description: "Shatter reality with your blade: 250% arcane damage + dispel enemy buffs.",
      requires: "w_runic_blade",
    },
    {
      id: "w_void_cleave", name: "Void Cleave", tier: 4, levelReq: 54, cost: 5,
      mp: 130, cooldown: 5, damage: 3.5, element: "arcane",
      description: "Slice through dimensions: 350% arcane damage, ignores all defenses.",
      requires: "w_arcane_shatter",
    },
    {
      id: "w_dimension_breaker", name: "Dimension Breaker", tier: 5, levelReq: 76, cost: 6,
      mp: 185, cooldown: 6, damage: 5.5, element: "arcane",
      description: "Break the fabric of space: 550% arcane damage + stun 2 turns.",
      requires: "w_void_cleave",
      synergy: "The arcane warrior's ultimate. Pairs with Void Cleave for burst combos.",
    },

    // ── New Lightning fills ──
    {
      id: "w_static_charge", name: "Static Charge", tier: 1, levelReq: 8, cost: 2,
      mp: 38, cooldown: 3, damage: 1.3, element: "lightning",
      description: "Electrified weapon: 130% lightning damage + 10% chance to stun.",
      requires: null,
      synergy: "lightning_dmg % adds to each hit. Opens lightning warrior path.",
    },
    {
      id: "w_storm_shield", name: "Storm Shield", tier: 2, levelReq: 12, cost: 2,
      mp: 50, cooldown: 4, damage: 0, element: "lightning", buff: "defense",
      description: "Lightning barrier: +30% defense + zap attackers for 15% ATK lightning damage.",
      requires: "w_static_charge",
    },
    {
      id: "w_mjolnir_strike", name: "Mjolnir Strike", tier: 4, levelReq: 50, cost: 5,
      mp: 120, cooldown: 5, damage: 3.2, element: "lightning",
      description: "Channel the thunder god: 320% lightning damage + stun 2 turns.",
      requires: "w_thunder_strike",
      synergy: "lightning_dmg fully stacks. The lightning warrior's core nuke.",
    },
    {
      id: "w_tempest_fury", name: "Tempest Fury", tier: 5, levelReq: 74, cost: 6,
      mp: 180, cooldown: 6, damage: 5.5, element: "lightning",
      description: "Become the storm: 550% lightning damage + chain to all enemies.",
      requires: "w_mjolnir_strike",
      synergy: "lightning_dmg build's endgame skill. Devastating AoE.",
    },
    // ── Gap fills: fire T2, T3, T4 ──
    {
      id: "w_blazing_cleave", name: "Blazing Cleave", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 3, damage: 1.5, element: "fire",
      description: "A sweeping blade wreathed in flame that scorches all in its arc.",
      requires: null, synergy: "Burn damage increases with consecutive fire attacks.",
    },
    {
      id: "w_inferno_slam", name: "Inferno Slam", tier: 3, levelReq: 30, cost: 4,
      mp: 75, cooldown: 4, damage: 2.2, element: "fire",
      description: "Drives a burning fist into the ground, erupting flame beneath the enemy.",
      requires: null, synergy: "Ground-based fire persists, dealing residual burn damage.",
    },
    {
      id: "w_magma_rend", name: "Magma Rend", tier: 4, levelReq: 50, cost: 5,
      mp: 110, cooldown: 5, damage: 3.0, element: "fire",
      description: "Tears open molten fissures with a devastating overhead strike.",
      requires: null, synergy: "Burning targets take amplified damage from physical skills.",
    },
    // ── Gap fills: ice T5, T6 ──
    {
      id: "w_permafrost_crush", name: "Permafrost Crush", tier: 5, levelReq: 74, cost: 6,
      mp: 155, cooldown: 6, damage: 4.5, element: "ice",
      description: "Encases the weapon in ancient ice and delivers a bone-shattering blow.",
      requires: "w_avalanche_strike", synergy: "Frozen enemies shatter for bonus physical damage.",
    },
    {
      id: "w_glacial_annihilation", name: "Glacial Annihilation", tier: 6, levelReq: 92, cost: 7,
      mp: 210, cooldown: 7, damage: 7.0, element: "ice",
      description: "Summons an arctic cataclysm that flash-freezes everything in range.",
      requires: "w_permafrost_crush", synergy: "All ice effects gain extended duration while active.",
    },
    // ── Gap fills: lightning T6 ──
    {
      id: "w_thundergod_wrath", name: "Thundergod's Wrath", tier: 6, levelReq: 93, cost: 8,
      mp: 240, cooldown: 8, damage: 9.0, element: "lightning",
      description: "Channels the fury of a storm god into a single cataclysmic strike.",
      requires: "w_tempest_fury", synergy: "Stunned enemies receive triple lightning damage.",
    },
    // ── Gap fills: poison T5, T6 ──
    {
      id: "w_blight_cleave", name: "Blight Cleave", tier: 5, levelReq: 72, cost: 5,
      mp: 140, cooldown: 5, damage: 4.0, element: "poison",
      description: "A toxic arc that leaves a festering wound on every target it touches.",
      requires: "w_pandemic_cleave", synergy: "Poison duration doubled against enemies below 50% health.",
    },
    {
      id: "w_plague_lord", name: "Plague Lord's Ruin", tier: 6, levelReq: 91, cost: 7,
      mp: 195, cooldown: 7, damage: 6.5, element: "poison",
      description: "Unleashes a pandemic wave that rots armor and flesh alike.",
      requires: "w_blight_cleave", synergy: "All poison DOTs on the target stack with no cap.",
    },
    // ── Gap fills: blood T1, T3, T5, T6 ──
    {
      id: "w_crimson_edge", name: "Crimson Edge", tier: 1, levelReq: 6, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "blood",
      description: "A blood-anointed blade that draws vital essence with each cut.",
      requires: null, synergy: "Heals a small portion of damage dealt.",
    },
    {
      id: "w_sanguine_slam", name: "Sanguine Slam", tier: 3, levelReq: 32, cost: 4,
      mp: 78, cooldown: 4, damage: 2.3, element: "blood",
      description: "Hammers the ground with blood-infused fury, leeching life from nearby foes.",
      requires: null, synergy: "Damage scales with missing health.",
    },
    {
      id: "w_hemorrhage_strike", name: "Hemorrhage Strike", tier: 5, levelReq: 75, cost: 6,
      mp: 150, cooldown: 6, damage: 5.0, element: "blood",
      description: "A devastating blow that ruptures blood vessels, causing massive hemorrhaging.",
      requires: "w_blood_sacrifice", synergy: "Bleeding enemies lose defense over time.",
    },
    {
      id: "w_bloodstorm_tyrant", name: "Bloodstorm Tyrant", tier: 6, levelReq: 94, cost: 8,
      mp: 230, cooldown: 7, damage: 8.5, element: "blood",
      description: "Becomes an avatar of carnage, draining life from all enemies in a crimson tempest.",
      requires: "w_hemorrhage_strike", synergy: "Full health restored if this skill kills the target.",
    },
    // ── Gap fills: sand T1, T2, T5, T6 ──
    {
      id: "w_dust_strike", name: "Dust Strike", tier: 1, levelReq: 7, cost: 2,
      mp: 28, cooldown: 2, damage: 1.1, element: "sand",
      description: "Kicks desert dust into the enemy's eyes before delivering a swift strike.",
      requires: null, synergy: "Blinded enemies have reduced accuracy.",
    },
    {
      id: "w_sandstone_bash", name: "Sandstone Bash", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 3, damage: 1.6, element: "sand",
      description: "Slams a fist hardened with compressed sand into the target.",
      requires: null, synergy: "Sand skills slow enemy attack speed.",
    },
    {
      id: "w_dune_colossus", name: "Dune Colossus", tier: 5, levelReq: 76, cost: 6,
      mp: 160, cooldown: 6, damage: 4.8, element: "sand",
      description: "Summons a towering sand construct that crashes down on the battlefield.",
      requires: null, synergy: "Slowed enemies take bonus damage from all sources.",
    },
    {
      id: "w_tomb_warden", name: "Tomb Warden's Wrath", tier: 6, levelReq: 93, cost: 7,
      mp: 220, cooldown: 7, damage: 7.5, element: "sand",
      description: "Invokes ancient desert spirits to entomb and crush enemies in living sand.",
      requires: "w_dune_colossus", synergy: "Entombed enemies cannot dodge or block.",
    },
    // ── Gap fills: arcane T1, T6 ──
    {
      id: "w_mystic_strike", name: "Mystic Strike", tier: 1, levelReq: 8, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "arcane",
      description: "Channels raw arcane energy through the blade for a reality-warping slash.",
      requires: null, synergy: "Arcane damage bypasses a portion of enemy defense.",
    },
    {
      id: "w_void_annihilator", name: "Void Annihilator", tier: 6, levelReq: 95, cost: 8,
      mp: 260, cooldown: 8, damage: 9.5, element: "arcane",
      description: "Tears a rift in the fabric of existence, consuming the target in pure void.",
      requires: "w_dimension_breaker", synergy: "Ignores all enemy resistances and immunities.",
    },

    // ── Support skills ──
    {
      id: "w_rallying_cry", name: "Rallying Cry", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.15,
      description: "Let out a mighty war cry that reinvigorates you, healing 15% max HP. STR increases heal amount.",
      requires: null, statScale: "strength",
    },
    {
      id: "w_fortress", name: "Fortress", tier: 3, levelReq: 28, cost: 3,
      mp: 60, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.25,
      description: "Channel your armor's power to create a shield worth 25% max HP. VIT scaling.",
      requires: "w_rallying_cry", statScale: "vitality",
    },
    {
      id: "w_berserker_fury", name: "Berserker Fury", tier: 3, levelReq: 30, cost: 3,
      mp: 55, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 35, crit_pct: 10 }, buffDuration: 3,
      description: "Enter a berserker rage: +35% ATK and +10% crit for 3 turns. STR amplifies effect.",
      requires: null, statScale: "strength",
    },
    {
      id: "w_iron_bastion", name: "Iron Bastion", tier: 4, levelReq: 48, cost: 4,
      mp: 80, cooldown: 6, damage: 0, element: null,
      buffEffect: { def_pct: 50, block_pct: 20 }, buffDuration: 3,
      description: "Become an immovable bastion: +50% DEF and +20% block for 3 turns.",
      requires: "w_fortress",
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

    // ── New Blood skills ──
    {
      id: "m_blood_bolt", name: "Blood Bolt", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "blood",
      description: "Crimson projectile: 130% blood damage + drain 5% HP. blood_dmg applies.",
      requires: null,
      synergy: "blood_dmg % amplifies both the hit and the drain.",
    },
    {
      id: "m_hemomancy", name: "Hemomancy", tier: 3, levelReq: 32, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "blood",
      description: "Blood magic: 250% blood damage + heal 15% of damage dealt.",
      requires: "m_blood_pact",
      synergy: "blood_dmg makes this self-sustaining. Core blood mage skill.",
    },
    {
      id: "m_crimson_storm", name: "Crimson Storm", tier: 5, levelReq: 73, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "blood",
      description: "Rain of blood: 500% blood damage + heal 20% of damage. blood_dmg FULLY stacks.",
      requires: "m_hemomancy",
      synergy: "blood_dmg build's ultimate payoff. Massive damage + massive healing.",
    },
    {
      id: "m_sanguine_ritual", name: "Sanguine Ritual", tier: 4, levelReq: 55, cost: 4,
      mp: 120, cooldown: 5, damage: 0, element: "blood", buff: "attack",
      description: "Blood ritual: sacrifice 10% HP to gain +50% all damage for 4 turns.",
      requires: "m_blood_pact",
    },

    // ── New Sand skills ──
    {
      id: "m_sand_barrier", name: "Sand Barrier", tier: 2, levelReq: 14, cost: 2,
      mp: 50, cooldown: 4, damage: 0, element: "sand", buff: "defense",
      description: "Whirling sand shield: +25% defense + blind attackers for 2 turns.",
      requires: null,
    },
    {
      id: "m_dust_devil", name: "Dust Devil", tier: 3, levelReq: 29, cost: 3,
      mp: 78, cooldown: 5, damage: 2.0, element: "sand",
      description: "Summon a dust devil: 200% sand damage + -25% enemy accuracy 2 turns.",
      requires: "m_sand_barrier",
      synergy: "sand_dmg % adds to damage. Pairs with Sandstorm for sand mage build.",
    },
    {
      id: "m_desert_wrath", name: "Desert Wrath", tier: 5, levelReq: 77, cost: 6,
      mp: 180, cooldown: 6, damage: 5.0, element: "sand",
      description: "Unleash the desert: 500% sand damage + blind 3 turns. sand_dmg FULLY applied.",
      requires: "m_sandstorm",
      synergy: "sand_dmg build mage's endgame. Total enemy shutdown + damage.",
    },

    // ── New Lightning fills ──
    {
      id: "m_thunderstorm", name: "Thunderstorm", tier: 4, levelReq: 51, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "lightning",
      description: "Call a thunderstorm: 350% lightning damage + stun 1 turn. lightning_dmg stacks.",
      requires: "m_chain_lightning",
      synergy: "lightning_dmg % makes storms devastating. Pairs with Chain Lightning.",
    },
    {
      id: "m_ball_lightning", name: "Ball Lightning", tier: 5, levelReq: 75, cost: 6,
      mp: 170, cooldown: 6, damage: 4.5, element: "lightning",
      description: "Conjure ball lightning: 450% damage + chains 3 times. lightning_dmg fully applied.",
      requires: "m_thunderstorm",
    },

    // ── New Poison fills ──
    {
      id: "m_plague", name: "Plague", tier: 4, levelReq: 54, cost: 5,
      mp: 120, cooldown: 5, damage: 3.0, element: "poison",
      description: "Unleash plague: 300% poison damage + DoT 5 turns (3% max HP/turn).",
      requires: "m_poison_cloud",
      synergy: "poison_dmg % amplifies every tick. Devastating over long fights.",
    },
    {
      id: "m_miasma", name: "Miasma", tier: 5, levelReq: 74, cost: 6,
      mp: 172, cooldown: 6, damage: 4.5, element: "poison",
      description: "Toxic miasma: 450% poison damage + -50% enemy healing for 4 turns.",
      requires: "m_plague",
      synergy: "poison_dmg build mage's endgame. Shuts down enemy regen completely.",
    },
    // ── Gap fills: fire T2 ──
    {
      id: "m_pyroclasm", name: "Pyroclasm", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 3, damage: 1.7, element: "fire",
      description: "Erupts a cone of superheated magma that engulfs nearby enemies.",
      requires: null, synergy: "Burning enemies take increased fire spell damage.",
    },
    // ── Gap fills: ice T5 ──
    {
      id: "m_frozen_eternity", name: "Frozen Eternity", tier: 5, levelReq: 75, cost: 6,
      mp: 165, cooldown: 6, damage: 4.8, element: "ice",
      description: "Encases the battlefield in an eternal frost that saps all warmth.",
      requires: "m_ice_prison", synergy: "Frozen enemies cannot regenerate health or mana.",
    },
    // ── Gap fills: lightning T1, T3, T6 ──
    {
      id: "m_spark_bolt", name: "Spark Bolt", tier: 1, levelReq: 7, cost: 2,
      mp: 32, cooldown: 2, damage: 1.3, element: "lightning",
      description: "Launches a crackling bolt of electricity that arcs toward the target.",
      requires: null, synergy: "Has a chance to chain to a second target.",
    },
    {
      id: "m_voltaic_surge", name: "Voltaic Surge", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 4, damage: 2.2, element: "lightning",
      description: "Discharges a massive electrical surge that overloads the target's defenses.",
      requires: null, synergy: "Shocked enemies have reduced resistance to all elements.",
    },
    {
      id: "m_tempest_god", name: "Tempest Godform", tier: 6, levelReq: 94, cost: 8,
      mp: 235, cooldown: 8, damage: 8.0, element: "lightning",
      description: "Transcends mortal form to become a living storm, raining lightning from above.",
      requires: "m_ball_lightning", synergy: "All attacks gain lightning damage while transformed.",
    },
    // ── Gap fills: poison T2, T6 ──
    {
      id: "m_toxic_nova", name: "Toxic Nova", tier: 2, levelReq: 13, cost: 2,
      mp: 48, cooldown: 3, damage: 1.4, element: "poison",
      description: "Releases a wave of concentrated toxins in all directions.",
      requires: null, synergy: "Poisoned enemies spread toxins to nearby allies.",
    },
    {
      id: "m_pandemic_ritual", name: "Pandemic Ritual", tier: 6, levelReq: 92, cost: 7,
      mp: 205, cooldown: 7, damage: 7.0, element: "poison",
      description: "Completes a forbidden ritual that unleashes an unstoppable plague.",
      requires: "m_miasma", synergy: "Poison DOTs cannot be cleansed while ritual persists.",
    },
    // ── Gap fills: blood T2, T6 ──
    {
      id: "m_sanguine_lance", name: "Sanguine Lance", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 1.6, element: "blood",
      description: "Conjures a lance of crystallized blood and hurls it with devastating force.",
      requires: null, synergy: "Leech effect restores mana proportional to blood damage.",
    },
    {
      id: "m_blood_god", name: "Blood God's Dominion", tier: 6, levelReq: 93, cost: 8,
      mp: 240, cooldown: 8, damage: 8.5, element: "blood",
      description: "Ascends to hemomantic godhood, controlling all vital fluids on the battlefield.",
      requires: "m_crimson_storm", synergy: "All damage dealt converts to healing at 50% rate.",
    },
    // ── Gap fills: sand T1, T6 ──
    {
      id: "m_sand_bolt", name: "Sand Bolt", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.1, element: "sand",
      description: "Fires a concentrated blast of razor-sharp sand particles.",
      requires: null, synergy: "Sand damage erodes enemy armor over time.",
    },
    {
      id: "m_tomb_pharaoh", name: "Tomb Pharaoh's Curse", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.5, element: "sand",
      description: "Invokes the dread curse of an ancient pharaoh, burying enemies in cursed sand.",
      requires: "m_desert_wrath", synergy: "Cursed enemies take increased damage from all sand skills.",
    },

    // ── Support skills (Mage has the most) ──
    {
      id: "m_healing_light", name: "Healing Light", tier: 1, levelReq: 3, cost: 1,
      mp: 30, cooldown: 4, damage: 0, element: null,
      special: "heal", healPct: 0.20,
      description: "Channel arcane energy to restore 20% max HP. INT increases healing power.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_greater_heal", name: "Greater Heal", tier: 3, levelReq: 28, cost: 3,
      mp: 65, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.35,
      description: "Powerful restoration spell: heal 35% max HP. INT greatly amplifies the heal.",
      requires: "m_healing_light", statScale: "intelligence",
    },
    {
      id: "m_arcane_barrier", name: "Arcane Barrier", tier: 2, levelReq: 10, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null,
      special: "shield", shieldPct: 0.25,
      description: "Conjure a magical barrier worth 25% max HP. INT increases shield strength.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_prismatic_ward", name: "Prismatic Ward", tier: 4, levelReq: 50, cost: 4,
      mp: 85, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.45,
      description: "Create a prismatic shield worth 45% max HP that reflects 10% damage.",
      requires: "m_arcane_barrier", statScale: "intelligence",
    },
    {
      id: "m_mana_surge", name: "Mana Surge", tier: 2, levelReq: 12, cost: 2,
      mp: 15, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.30,
      description: "Draw mana from the ether: restore 30% max MP. INT increases mana restored.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_mana_font", name: "Mana Font", tier: 4, levelReq: 48, cost: 4,
      mp: 10, cooldown: 6, damage: 0, element: null,
      special: "mana", manaPct: 0.50,
      description: "Open a font of pure mana: restore 50% max MP. The mage's lifeline.",
      requires: "m_mana_surge", statScale: "intelligence",
    },
    {
      id: "m_elemental_attunement", name: "Elemental Attunement", tier: 3, levelReq: 30, cost: 3,
      mp: 55, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 40, crit_pct: 15 }, buffDuration: 4,
      description: "Attune to the elements: +40% spell damage and +15% crit for 4 turns. INT amplifies.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_arcane_empowerment", name: "Arcane Empowerment", tier: 5, levelReq: 72, cost: 5,
      mp: 100, cooldown: 7, damage: 0, element: null,
      buffEffect: { atk_pct: 60, crit_pct: 25, def_pct: 20 }, buffDuration: 4,
      description: "Empower yourself with pure arcane force: +60% ATK, +25% crit, +20% DEF for 4 turns. Ultimate mage buff.",
      requires: "m_elemental_attunement", statScale: "intelligence",
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

    // ── New Arcane skills ──
    {
      id: "r_arcane_arrow", name: "Arcane Arrow", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "arcane",
      description: "Magic-infused arrow: 130% arcane damage, ignores 15% magic defense.",
      requires: null,
      synergy: "Opens the mystic archer path. Pairs with Ethereal Volley.",
    },
    {
      id: "r_mystic_shot", name: "Mystic Shot", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 1.8, element: "arcane",
      description: "Phase-shifting arrow: 180% arcane damage + passes through shields.",
      requires: "r_arcane_arrow",
    },
    {
      id: "r_ethereal_volley", name: "Ethereal Volley", tier: 3, levelReq: 31, cost: 4,
      mp: 82, cooldown: 5, damage: 2.5, element: "arcane",
      description: "Volley of spectral arrows: 250% arcane damage + dispel enemy buffs.",
      requires: "r_mystic_shot",
      synergy: "Core arcane ranger skill. Pairs with Astral Barrage for full arcane build.",
    },
    {
      id: "r_astral_barrage", name: "Astral Barrage", tier: 4, levelReq: 53, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "arcane",
      description: "Rain of starlight arrows: 350% arcane damage, ignores all defenses.",
      requires: "r_ethereal_volley",
    },

    // ── New Ice skills ──
    {
      id: "r_frozen_shot", name: "Frozen Shot", tier: 3, levelReq: 28, cost: 3,
      mp: 72, cooldown: 5, damage: 2.0, element: "ice",
      description: "Deep freeze arrow: 200% ice damage + freeze 1 turn. ice_dmg applies.",
      requires: "r_frost_arrow",
      synergy: "ice_dmg % adds. Pairs with Frost Arrow for ice kite build.",
    },
    {
      id: "r_glacial_rain", name: "Glacial Rain", tier: 4, levelReq: 51, cost: 5,
      mp: 115, cooldown: 5, damage: 3.0, element: "ice",
      description: "Rain of ice shards: 300% ice damage + freeze all enemies 1 turn.",
      requires: "r_frozen_shot",
    },
    {
      id: "r_absolute_winter", name: "Absolute Winter", tier: 5, levelReq: 74, cost: 6,
      mp: 170, cooldown: 6, damage: 5.0, element: "ice",
      description: "Eternal winter: 500% ice damage + freeze 3 turns. ice_dmg FULLY stacks.",
      requires: "r_glacial_rain",
      synergy: "ice_dmg build ranger's endgame. Complete freeze + massive damage.",
    },

    // ── New Blood skills ──
    {
      id: "r_crimson_arrow", name: "Crimson Arrow", tier: 2, levelReq: 13, cost: 2,
      mp: 48, cooldown: 4, damage: 1.5, element: "blood",
      description: "Blood-tipped arrow: 150% damage + bleed DoT 3 turns. blood_dmg applies.",
      requires: null,
      synergy: "blood_dmg % amplifies DoT. Opens blood ranger path.",
    },
    {
      id: "r_hemorrhage_shot", name: "Hemorrhage Shot", tier: 3, levelReq: 29, cost: 3,
      mp: 75, cooldown: 5, damage: 2.2, element: "blood",
      description: "Hemorrhaging arrow: 220% blood damage + heal 10% of damage dealt.",
      requires: "r_crimson_arrow",
    },
    {
      id: "r_sanguine_barrage", name: "Sanguine Barrage", tier: 5, levelReq: 73, cost: 6,
      mp: 175, cooldown: 6, damage: 5.5, element: "blood",
      description: "Blood-soaked volley: 550% blood damage + heal 15% of damage. blood_dmg fully applied.",
      requires: "r_blood_arrow",
      synergy: "blood_dmg build ranger's ultimate. Sustain + burst in one skill.",
    },

    // ── New Sand skills ──
    {
      id: "r_dust_devil_arrow", name: "Dust Devil Arrow", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 4, damage: 1.4, element: "sand",
      description: "Whirlwind arrow: 140% sand damage + -20% enemy accuracy. sand_dmg applies.",
      requires: null,
    },
    {
      id: "r_sandstorm_volley", name: "Sandstorm Volley", tier: 4, levelReq: 49, cost: 4,
      mp: 108, cooldown: 5, damage: 2.8, element: "sand",
      description: "Volley through sandstorm: 280% sand damage + blind 2 turns.",
      requires: "r_sand_trap",
      synergy: "sand_dmg % stacks. Pairs with Sand Trap for full sand build.",
    },
    {
      id: "r_desert_judgment", name: "Desert Judgment", tier: 5, levelReq: 76, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "sand",
      description: "Judgment of the sands: 500% sand damage + blind 3 turns. sand_dmg FULLY stacks.",
      requires: "r_sandstorm_volley",
    },

    // ── New Fire fills ──
    {
      id: "r_inferno_rain", name: "Inferno Rain", tier: 3, levelReq: 30, cost: 4,
      mp: 80, cooldown: 5, damage: 2.5, element: "fire",
      description: "Rain of burning arrows: 250% fire damage + burn DoT 3 turns.",
      requires: "r_explosive_arrow",
      synergy: "fire_dmg % amplifies both hit and burn. Core fire ranger skill.",
    },
    {
      id: "r_phoenix_arrow", name: "Phoenix Arrow", tier: 5, levelReq: 72, cost: 6,
      mp: 168, cooldown: 6, damage: 5.0, element: "fire",
      description: "Arrow of rebirth: 500% fire damage. If you die within 3 turns, revive at 30% HP.",
      requires: "r_inferno_rain",
    },

    // ── New Lightning fills ──
    {
      id: "r_thunderbolt_arrow", name: "Thunderbolt Arrow", tier: 4, levelReq: 52, cost: 5,
      mp: 118, cooldown: 5, damage: 3.2, element: "lightning",
      description: "Lightning bolt arrow: 320% damage + chain to 3 targets. lightning_dmg stacks.",
      requires: "r_lightning_arrow",
      synergy: "lightning_dmg % makes chains devastating. Pairs with Storm Bow.",
    },
    // ── Gap fills: physical T6 ──
    {
      id: "r_apex_predator", name: "Apex Predator", tier: 6, levelReq: 92, cost: 7,
      mp: 220, cooldown: 7, damage: 8.0, element: "physical",
      description: "Becomes the ultimate hunter, unleashing a devastating barrage of precision strikes.",
      requires: null, synergy: "Critical hit rate doubled for the next attack.",
    },
    // ── Gap fills: fire T4, T6 ──
    {
      id: "r_blazing_volley", name: "Blazing Volley", tier: 4, levelReq: 50, cost: 5,
      mp: 105, cooldown: 5, damage: 3.0, element: "fire",
      description: "Launches a fan of flame-tipped arrows that ignite on impact.",
      requires: null, synergy: "Burning targets take bonus damage from subsequent arrows.",
    },
    {
      id: "r_phoenix_rain", name: "Phoenix Rain", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.0, element: "fire",
      description: "Calls down a rain of phoenix feathers that erupt into a firestorm.",
      requires: "r_phoenix_arrow", synergy: "Enemies killed by fire have a chance to explode.",
    },
    // ── Gap fills: ice T1, T6 ──
    {
      id: "r_frost_tip", name: "Frost Tip", tier: 1, levelReq: 5, cost: 1,
      mp: 22, cooldown: 2, damage: 1.1, element: "ice",
      description: "Coats the arrowhead in frost, chilling the target on impact.",
      requires: null, synergy: "Chilled enemies move and attack slower.",
    },
    {
      id: "r_arctic_oblivion", name: "Arctic Oblivion", tier: 6, levelReq: 93, cost: 8,
      mp: 225, cooldown: 7, damage: 8.0, element: "ice",
      description: "Fires a single arrow that detonates into an arctic apocalypse on impact.",
      requires: "r_absolute_winter", synergy: "Frozen enemies shatter for area damage.",
    },
    // ── Gap fills: lightning T1, T3 ──
    {
      id: "r_static_arrow", name: "Static Arrow", tier: 1, levelReq: 7, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "lightning",
      description: "An arrow charged with static electricity that jolts the target.",
      requires: null, synergy: "Shocked enemies have a chance to drop extra loot.",
    },
    {
      id: "r_storm_volley", name: "Storm Volley", tier: 3, levelReq: 28, cost: 3,
      mp: 68, cooldown: 4, damage: 2.0, element: "lightning",
      description: "Fires a spread of lightning-charged arrows that rain down as thunderbolts.",
      requires: null, synergy: "Each arrow has independent stun chance.",
    },
    // ── Gap fills: poison T2, T4, T5 ──
    {
      id: "r_toxic_barb", name: "Toxic Barb", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 3, damage: 1.4, element: "poison",
      description: "Fires a barbed arrow coated in slow-acting venom.",
      requires: null, synergy: "Poison stacks with each consecutive hit.",
    },
    {
      id: "r_blight_arrow", name: "Blight Arrow", tier: 4, levelReq: 48, cost: 4,
      mp: 95, cooldown: 5, damage: 2.8, element: "poison",
      description: "A cursed arrow that spreads blight wherever it lands.",
      requires: null, synergy: "Blighted enemies take increasing damage over time.",
    },
    {
      id: "r_plague_rain", name: "Plague Rain", tier: 5, levelReq: 73, cost: 5,
      mp: 145, cooldown: 6, damage: 4.2, element: "poison",
      description: "Launches a volley of plague-tipped arrows that blanket the area in toxins.",
      requires: "r_blight_arrow", synergy: "Poison spreads to nearby enemies on target death.",
    },
    // ── Gap fills: blood T1, T6 ──
    {
      id: "r_bloodthorn_arrow", name: "Bloodthorn Arrow", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.2, element: "blood",
      description: "An arrow tipped with thorns that draw blood and sap vitality.",
      requires: null, synergy: "Leeches a small amount of health on hit.",
    },
    {
      id: "r_crimson_apocalypse", name: "Crimson Apocalypse", tier: 6, levelReq: 94, cost: 8,
      mp: 240, cooldown: 8, damage: 8.5, element: "blood",
      description: "Fires a blood-soaked arrow into the sky that returns as a crimson meteor shower.",
      requires: "r_sanguine_barrage", synergy: "Each hit heals the ranger and increases blood damage.",
    },
    // ── Gap fills: sand T1, T6 ──
    {
      id: "r_desert_arrow", name: "Desert Arrow", tier: 1, levelReq: 5, cost: 1,
      mp: 25, cooldown: 2, damage: 1.0, element: "sand",
      description: "An arrow infused with desert winds that blinds the target with sand.",
      requires: null, synergy: "Blinded enemies have reduced hit chance.",
    },
    {
      id: "r_sirocco_storm", name: "Sirocco Storm", tier: 6, levelReq: 92, cost: 7,
      mp: 215, cooldown: 7, damage: 7.5, element: "sand",
      description: "Summons a devastating desert storm that shreds enemies with razor sand.",
      requires: "r_desert_judgment", synergy: "Sand-slowed enemies cannot evade attacks.",
    },
    // ── Gap fills: arcane T5, T6 ──
    {
      id: "r_cosmic_shot", name: "Cosmic Shot", tier: 5, levelReq: 75, cost: 6,
      mp: 155, cooldown: 6, damage: 4.5, element: "arcane",
      description: "Fires an arrow infused with cosmic energy that pierces dimensional barriers.",
      requires: "r_astral_barrage", synergy: "Arcane arrows ignore a portion of enemy resistance.",
    },
    {
      id: "r_void_hunter", name: "Void Hunter's Barrage", tier: 6, levelReq: 93, cost: 8,
      mp: 250, cooldown: 8, damage: 9.0, element: "arcane",
      description: "Opens a void portal and fires arrows through it, striking from impossible angles.",
      requires: "r_cosmic_shot", synergy: "Attacks from the void cannot be blocked or dodged.",
    },

    // ── Support skills ──
    {
      id: "r_natures_touch", name: "Nature's Touch", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.18,
      description: "Call upon nature spirits to restore 18% max HP. DEX improves healing speed.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "r_focused_aim", name: "Focused Aim", tier: 3, levelReq: 28, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      buffEffect: { crit_pct: 25, atk_pct: 20 }, buffDuration: 3,
      description: "Sharpen your focus: +25% crit chance and +20% ATK for 3 turns. DEX amplifies.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "r_meditate", name: "Meditate", tier: 2, levelReq: 14, cost: 2,
      mp: 15, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.25,
      description: "Center yourself and recover 25% max MP. A ranger's way to sustain in long fights.",
      requires: null,
    },
    {
      id: "r_pack_leader", name: "Pack Leader", tier: 4, levelReq: 50, cost: 4,
      mp: 75, cooldown: 7, damage: 0, element: null,
      special: "group_heal", healPct: 0.15,
      buffEffect: { atk_pct: 15, crit_pct: 10 }, buffDuration: 3,
      description: "Rally your party: heal 15% HP and grant +15% ATK, +10% crit for 3 turns.",
      requires: "r_natures_touch",
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

    // ── New Fire skills ──
    {
      id: "ro_flame_dagger", name: "Flame Dagger", tier: 1, levelReq: 6, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "fire",
      description: "Blazing dagger throw: 130% fire damage + burn 2 turns. fire_dmg applies.",
      requires: null,
      synergy: "fire_dmg % adds to each throw. Opens fire rogue path.",
    },
    {
      id: "ro_ignition_strike", name: "Ignition Strike", tier: 2, levelReq: 13, cost: 3,
      mp: 48, cooldown: 4, damage: 1.6, element: "fire",
      description: "Explosive blade: 160% fire damage + AoE burn 2 turns.",
      requires: "ro_flame_dagger",
      synergy: "fire_dmg % boosts both hit and burn. Pairs with Infernal Dance.",
    },
    {
      id: "ro_infernal_dance", name: "Infernal Dance", tier: 3, levelReq: 29, cost: 4,
      mp: 72, cooldown: 5, damage: 2.2, element: "fire",
      description: "Dance of flames: 220% fire damage + 20% ATK speed for 2 turns.",
      requires: "ro_ignition_strike",
      synergy: "fire_dmg stacks. Speed buff enables devastating follow-ups.",
    },
    {
      id: "ro_phoenix_slash", name: "Phoenix Slash", tier: 4, levelReq: 51, cost: 5,
      mp: 115, cooldown: 5, damage: 3.0, element: "fire",
      description: "Phoenix-empowered slash: 300% fire damage + heal 10% HP.",
      requires: "ro_infernal_dance",
      synergy: "fire_dmg build rogue's core nuke. Fire + sustain combo.",
    },

    // ── New Arcane skills ──
    {
      id: "ro_void_strike", name: "Void Strike", tier: 1, levelReq: 7, cost: 2,
      mp: 38, cooldown: 3, damage: 1.2, element: "arcane",
      description: "Strike from the void: 120% arcane damage, ignores 20% defense.",
      requires: null,
    },
    {
      id: "ro_phase_shift", name: "Phase Shift", tier: 2, levelReq: 15, cost: 3,
      mp: 50, cooldown: 4, damage: 1.5, element: "arcane",
      description: "Phase through reality: 150% arcane damage + 30% evasion for 1 turn.",
      requires: "ro_void_strike",
      synergy: "Opens the void rogue path. Pairs with Dimensional Slash.",
    },
    {
      id: "ro_dimensional_slash", name: "Dimensional Slash", tier: 3, levelReq: 31, cost: 4,
      mp: 78, cooldown: 5, damage: 2.5, element: "arcane",
      description: "Cut through dimensions: 250% arcane damage + dispel enemy buffs.",
      requires: "ro_phase_shift",
    },
    {
      id: "ro_reality_rend", name: "Reality Rend", tier: 4, levelReq: 53, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "arcane",
      description: "Tear reality apart: 350% arcane damage + stun 2 turns.",
      requires: "ro_dimensional_slash",
      synergy: "The arcane rogue's ultimate burst. Ignores all defenses.",
    },

    // ── New Ice fills ──
    {
      id: "ro_frozen_blade", name: "Frozen Blade", tier: 3, levelReq: 28, cost: 3,
      mp: 68, cooldown: 5, damage: 2.0, element: "ice",
      description: "Ice-encased blade: 200% ice damage + freeze 1 turn. ice_dmg applies.",
      requires: "ro_frost_strike",
      synergy: "ice_dmg % adds. Pairs with Frost Strike for ice assassination build.",
    },
    {
      id: "ro_glacial_ambush", name: "Glacial Ambush", tier: 4, levelReq: 50, cost: 5,
      mp: 112, cooldown: 5, damage: 3.0, element: "ice",
      description: "Ambush from ice: 300% ice damage + freeze 2 turns + guaranteed crit.",
      requires: "ro_frozen_blade",
    },
    {
      id: "ro_absolute_chill", name: "Absolute Chill", tier: 5, levelReq: 73, cost: 6,
      mp: 170, cooldown: 6, damage: 5.0, element: "ice",
      description: "Absolute zero strike: 500% ice damage + freeze 3 turns. ice_dmg FULLY stacks.",
      requires: "ro_glacial_ambush",
      synergy: "ice_dmg build rogue's endgame. Total lockdown + assassination damage.",
    },

    // ── New Lightning fills ──
    {
      id: "ro_thunder_strike", name: "Thunder Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 72, cooldown: 4, damage: 2.2, element: "lightning",
      description: "Lightning-fast combo: 220% lightning damage + 15% ATK speed for 2 turns.",
      requires: "ro_lightning_step",
      synergy: "lightning_dmg % stacks. Speed buff enables rapid combos.",
    },
    {
      id: "ro_voltaic_rush", name: "Voltaic Rush", tier: 4, levelReq: 52, cost: 5,
      mp: 118, cooldown: 5, damage: 3.2, element: "lightning",
      description: "Electrical blade storm: 320% lightning damage + chain to 2 targets.",
      requires: "ro_thunder_strike",
    },
    {
      id: "ro_storm_blade", name: "Storm Blade", tier: 5, levelReq: 74, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "lightning",
      description: "Channel the storm into your blade: 500% lightning damage + stun 2 turns.",
      requires: "ro_voltaic_rush",
      synergy: "lightning_dmg build rogue's ultimate. Stun-lock + burst damage.",
    },

    // ── New Sand fills ──
    {
      id: "ro_dust_shroud", name: "Dust Shroud", tier: 3, levelReq: 26, cost: 3,
      mp: 60, cooldown: 5, damage: 1.5, element: "sand",
      description: "Cloak in sand: 150% sand damage + 40% evasion for 2 turns.",
      requires: "ro_sand_blind",
      synergy: "sand_dmg % adds. Pairs with Sand Blind for desert assassin build.",
    },
    {
      id: "ro_sandstorm_slash", name: "Sandstorm Slash", tier: 4, levelReq: 48, cost: 4,
      mp: 105, cooldown: 5, damage: 2.8, element: "sand",
      description: "Slash through sandstorm: 280% sand damage + blind 2 turns.",
      requires: "ro_dust_shroud",
    },
    {
      id: "ro_desert_phantom", name: "Desert Phantom", tier: 5, levelReq: 75, cost: 6,
      mp: 165, cooldown: 6, damage: 4.5, element: "sand",
      description: "Become one with the desert: 450% sand damage + 100% evasion for 2 turns.",
      requires: "ro_sandstorm_slash",
      synergy: "sand_dmg build rogue's endgame. Near-untouchable + strong damage.",
    },

    // ── New Poison fills ──
    {
      id: "ro_neurotoxin", name: "Neurotoxin", tier: 4, levelReq: 49, cost: 4,
      mp: 105, cooldown: 5, damage: 2.8, element: "poison",
      description: "Nerve poison: 280% poison damage + slow enemy 50% for 3 turns.",
      requires: "ro_viper_strike",
      synergy: "poison_dmg % stacks with speed reduction. Devastating control.",
    },
    {
      id: "ro_plague_blade", name: "Plague Blade", tier: 5, levelReq: 72, cost: 6,
      mp: 168, cooldown: 6, damage: 4.5, element: "poison",
      description: "Plague-infused blade: 450% poison damage + DoT 5 turns (4% max HP/turn).",
      requires: "ro_neurotoxin",
      synergy: "poison_dmg build rogue's endgame. Highest sustained DoT in the game.",
    },
    // ── Gap fills: fire T5, T6 ──
    {
      id: "ro_hellfire_dance", name: "Hellfire Dance", tier: 5, levelReq: 73, cost: 6,
      mp: 150, cooldown: 6, damage: 4.5, element: "fire",
      description: "A whirling dance of flame-wreathed daggers that incinerates everything nearby.",
      requires: "ro_phoenix_slash", synergy: "Burning enemies take critical hits more often.",
    },
    {
      id: "ro_inferno_reaper", name: "Inferno Reaper", tier: 6, levelReq: 92, cost: 7,
      mp: 210, cooldown: 7, damage: 7.5, element: "fire",
      description: "Emerges from shadow wreathed in hellfire, delivering a final inescapable strike.",
      requires: "ro_hellfire_dance", synergy: "Ignited enemies cannot heal or use potions.",
    },
    // ── Gap fills: ice T1, T6 ──
    {
      id: "ro_frostbite_slash", name: "Frostbite Slash", tier: 1, levelReq: 5, cost: 1,
      mp: 22, cooldown: 2, damage: 1.1, element: "ice",
      description: "A quick dagger slash that leaves frostbite on the wound.",
      requires: null, synergy: "Frostbitten enemies have reduced attack speed.",
    },
    {
      id: "ro_glacial_executioner", name: "Glacial Executioner", tier: 6, levelReq: 93, cost: 8,
      mp: 225, cooldown: 7, damage: 8.0, element: "ice",
      description: "Flash-freezes the target from within, then shatters them with a single precise strike.",
      requires: "ro_absolute_chill", synergy: "Instantly kills frozen enemies below 15% health.",
    },
    // ── Gap fills: lightning T1, T6 ──
    {
      id: "ro_spark_dagger", name: "Spark Dagger", tier: 1, levelReq: 7, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "lightning",
      description: "Hurls a dagger crackling with electrical energy at the target.",
      requires: null, synergy: "Shocked enemies flinch, interrupting their actions.",
    },
    {
      id: "ro_tempest_assassin", name: "Tempest Assassin", tier: 6, levelReq: 94, cost: 8,
      mp: 235, cooldown: 7, damage: 8.5, element: "lightning",
      description: "Becomes one with the storm, teleporting between targets with lethal precision.",
      requires: "ro_storm_blade", synergy: "Each teleport strike increases the next hit's damage.",
    },
    // ── Gap fills: poison T6 ──
    {
      id: "ro_death_blossom", name: "Death Blossom", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.0, element: "poison",
      description: "Scatters a garden of lethal poison flowers that erupt in a toxic bloom.",
      requires: "ro_plague_blade", synergy: "Poison damage becomes true damage against fully stacked targets.",
    },
    // ── Gap fills: blood T1 ──
    {
      id: "ro_blood_nick", name: "Blood Nick", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.2, element: "blood",
      description: "A precise nick that opens a vein, causing the target to bleed slowly.",
      requires: null, synergy: "Bleeding enemies leave blood trails that boost rogue damage.",
    },
    // ── Gap fills: sand T1, T2, T6 ──
    {
      id: "ro_sand_toss", name: "Sand Toss", tier: 1, levelReq: 5, cost: 1,
      mp: 20, cooldown: 2, damage: 1.0, element: "sand",
      description: "Throws a handful of desert sand to blind and disorient the target.",
      requires: null, synergy: "Blinded targets cannot counter-attack.",
    },
    {
      id: "ro_dune_ambush", name: "Dune Ambush", tier: 2, levelReq: 12, cost: 2,
      mp: 42, cooldown: 3, damage: 1.5, element: "sand",
      description: "Bursts from beneath the sand to deliver a devastating surprise strike.",
      requires: null, synergy: "Ambush attacks always critically hit slowed targets.",
    },
    {
      id: "ro_tomb_wraith", name: "Tomb Wraith", tier: 6, levelReq: 92, cost: 7,
      mp: 205, cooldown: 7, damage: 7.0, element: "sand",
      description: "Becomes an undying desert wraith, phasing through sand to strike without warning.",
      requires: "ro_desert_phantom", synergy: "Cannot be targeted while phasing between attacks.",
    },
    // ── Gap fills: arcane T5, T6 ──
    {
      id: "ro_astral_blade", name: "Astral Blade", tier: 5, levelReq: 74, cost: 6,
      mp: 155, cooldown: 6, damage: 4.8, element: "arcane",
      description: "Manifests a blade of pure astral energy that cuts through all defenses.",
      requires: "ro_reality_rend", synergy: "Arcane strikes weaken the target's resistance to all elements.",
    },
    {
      id: "ro_cosmic_erasure", name: "Cosmic Erasure", tier: 6, levelReq: 95, cost: 8,
      mp: 250, cooldown: 8, damage: 9.0, element: "arcane",
      description: "Erases the target from existence by severing their connection to reality.",
      requires: "ro_astral_blade", synergy: "Erased targets cannot resurrect or respawn.",
    },

    // ── Support skills ──
    {
      id: "ro_shadow_mend", name: "Shadow Mend", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.15,
      description: "Mend your wounds using shadow magic, restoring 15% max HP. DEX scaling.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "ro_shadow_cloak", name: "Shadow Cloak", tier: 3, levelReq: 28, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.20,
      description: "Wrap yourself in shadows that absorb 20% max HP in damage. DEX improves shield.",
      requires: "ro_shadow_mend", statScale: "dexterity",
    },
    {
      id: "ro_adrenaline_rush", name: "Adrenaline Rush", tier: 3, levelReq: 30, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 30, crit_pct: 20, atk_speed: 15 }, buffDuration: 3,
      description: "Surge of adrenaline: +30% ATK, +20% crit, +15 speed for 3 turns.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "ro_siphon_energy", name: "Siphon Energy", tier: 2, levelReq: 14, cost: 2,
      mp: 10, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.25,
      description: "Siphon energy from the shadows, restoring 25% max MP.",
      requires: null,
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
    { id: "syn_w_frost_warrior", name: "Frost Warrior", description: "+15% Ice DMG, +10% DEF, +8% Evasion",
      requires: ["w_frost_cleave", "w_frozen_wrath"], bonuses: { ice_dmg: 15, defense_pct: 10, evasion: 8 }, icon: "❄️⚔️", buildType: "Ice Warrior" },
    { id: "syn_w_plague_lord", name: "Plague Lord", description: "+15% Poison DMG, +8% Lifesteal, +200 HP",
      requires: ["w_venomous_edge", "w_plague_strike"], bonuses: { poison_dmg: 15, lifesteal: 8, hp_flat: 200 }, icon: "☠️⚔️", buildType: "Poison Warrior" },
    { id: "syn_w_arcane_knight", name: "Arcane Knight", description: "+15% ATK, +100 MP, +10% Boss DMG",
      requires: ["w_runic_blade", "w_void_cleave"], bonuses: { attack_pct: 15, mp_flat: 100, boss_dmg_pct: 10 }, icon: "✨⚔️", buildType: "Arcane Warrior" },
    { id: "syn_w_thunder_god", name: "Thunder God", description: "+20% Lightning, +12% Crit, +10% Speed",
      requires: ["w_thunder_strike", "w_mjolnir_strike", "w_tempest_fury"], bonuses: { lightning_dmg: 20, crit_chance: 12, attack_speed: 10 }, icon: "⚡👑", buildType: "Lightning Warrior" },
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
    { id: "syn_m_hemomancer", name: "Hemomancer", description: "+20% Blood DMG, +12% Lifesteal, +300 HP",
      requires: ["m_blood_bolt", "m_hemomancy", "m_crimson_storm"], bonuses: { blood_dmg: 20, lifesteal: 12, hp_flat: 300 }, icon: "🩸🧙", buildType: "Blood Mage" },
    { id: "syn_m_sand_sorcerer", name: "Sand Sorcerer", description: "+15% Sand DMG, +10% Evasion, +8% Speed",
      requires: ["m_sandstorm", "m_desert_wrath"], bonuses: { sand_dmg: 15, evasion: 10, attack_speed: 8 }, icon: "🌪️🧙", buildType: "Sand Mage" },
    { id: "syn_m_storm_mage", name: "Storm Mage", description: "+20% Lightning, +10% Crit DMG, +8% Speed",
      requires: ["m_chain_lightning", "m_thunderstorm", "m_ball_lightning"], bonuses: { lightning_dmg: 20, crit_dmg_pct: 10, attack_speed: 8 }, icon: "⚡🧙", buildType: "Lightning Mage" },
    { id: "syn_m_plague_mage", name: "Plague Mage", description: "+20% Poison, +10% Lifesteal, +5% Drop",
      requires: ["m_poison_cloud", "m_plague", "m_miasma"], bonuses: { poison_dmg: 20, lifesteal: 10, drop_chance: 5 }, icon: "☠️🧙", buildType: "Plague Mage" },
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
    { id: "syn_r_mystic_archer", name: "Mystic Archer", description: "+15% ATK, +100 MP, +10% Boss DMG",
      requires: ["r_arcane_arrow", "r_ethereal_volley", "r_astral_barrage"], bonuses: { attack_pct: 15, mp_flat: 100, boss_dmg_pct: 10 }, icon: "✨🏹", buildType: "Arcane Ranger" },
    { id: "syn_r_frost_hunter", name: "Frost Hunter", description: "+20% Ice, +10% DEF, +10% Evasion",
      requires: ["r_frost_arrow", "r_frozen_shot", "r_absolute_winter"], bonuses: { ice_dmg: 20, defense_pct: 10, evasion: 10 }, icon: "❄️🏹", buildType: "Ice Ranger" },
    { id: "syn_r_blood_hunter", name: "Blood Hunter", description: "+15% Blood, +12% Lifesteal, +200 HP",
      requires: ["r_crimson_arrow", "r_blood_arrow", "r_sanguine_barrage"], bonuses: { blood_dmg: 15, lifesteal: 12, hp_flat: 200 }, icon: "🩸🏹", buildType: "Blood Ranger" },
    { id: "syn_r_desert_ranger", name: "Desert Ranger", description: "+15% Sand, +12% Evasion, +8% Speed",
      requires: ["r_sand_trap", "r_sandstorm_volley", "r_desert_judgment"], bonuses: { sand_dmg: 15, evasion: 12, attack_speed: 8 }, icon: "🌪️🏹", buildType: "Sand Ranger" },
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
    { id: "syn_ro_fire_dancer", name: "Fire Dancer", description: "+15% Fire, +10% Speed, +8% Crit",
      requires: ["ro_flame_dagger", "ro_infernal_dance", "ro_phoenix_slash"], bonuses: { fire_dmg: 15, attack_speed: 10, crit_chance: 8 }, icon: "🔥🗡️", buildType: "Fire Rogue" },
    { id: "syn_ro_void_assassin", name: "Void Assassin", description: "+15% ATK, +15% Boss DMG, +100 MP",
      requires: ["ro_void_strike", "ro_dimensional_slash", "ro_reality_rend"], bonuses: { attack_pct: 15, boss_dmg_pct: 15, mp_flat: 100 }, icon: "✨🗡️", buildType: "Arcane Rogue" },
    { id: "syn_ro_frost_assassin", name: "Frost Assassin", description: "+20% Ice, +10% Evasion, +10% Crit DMG",
      requires: ["ro_frost_strike", "ro_frozen_blade", "ro_absolute_chill"], bonuses: { ice_dmg: 20, evasion: 10, crit_dmg_pct: 10 }, icon: "❄️🗡️", buildType: "Ice Rogue" },
    { id: "syn_ro_storm_rogue", name: "Storm Rogue", description: "+20% Lightning, +12% Speed, +8% Crit",
      requires: ["ro_lightning_step", "ro_thunder_strike", "ro_storm_blade"], bonuses: { lightning_dmg: 20, attack_speed: 12, crit_chance: 8 }, icon: "⚡🗡️", buildType: "Lightning Rogue" },
    { id: "syn_ro_desert_assassin", name: "Desert Assassin", description: "+15% Sand, +15% Evasion, +8% Speed",
      requires: ["ro_sand_blind", "ro_dust_shroud", "ro_desert_phantom"], bonuses: { sand_dmg: 15, evasion: 15, attack_speed: 8 }, icon: "🌪️🗡️", buildType: "Sand Rogue" },
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