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
      description: "You swing your weapon with disciplined force, striking the enemy for 130% weapon damage. A reliable blow that grows deadlier as your strength increases.",
      requires: null,
      synergy: "High STR increases damage significantly.",
    },
    {
      id: "w_shield_block", name: "Shield Block", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 3, damage: 0, element: null, buff: "defense",
      description: "You raise your shield and brace for impact, reducing all incoming damage by 25% for 2 turns. The tougher you are, the more punishment your shield absorbs.",
      requires: null,
      synergy: "High VIT amplifies the damage reduction bonus.",
    },
    {
      id: "w_power_strike", name: "Power Strike", tier: 1, levelReq: 5, cost: 2,
      mp: 32, cooldown: 3, damage: 1.8, element: "physical",
      description: "You channel all your might into a single devastating blow, crushing the enemy for 180% weapon damage. Raw strength makes this hit even harder.",
      requires: "w_basic_strike",
    },
    {
      id: "w_flame_slash", name: "Flame Slash", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.5, element: "fire",
      description: "Your blade ignites with searing flames as you slash through the enemy for 150% fire damage. The hotter your fire affinity burns, the deeper the wound.",
      requires: null,
      synergy: "Each % of fire_dmg adds to this skill's damage.",
    },

    // ── Tier 2 – Journeyman (Lv 10+) ────────────────────────────────────────
    {
      id: "w_shield_bash", name: "Shield Bash", tier: 2, levelReq: 10, cost: 2,
      mp: 42, cooldown: 4, damage: 1.5, element: "physical",
      description: "You slam your shield into the enemy's face for 150% damage, stunning them. Your strength and toughness both fuel this brutal impact.",
      requires: "w_shield_block",
    },
    {
      id: "w_war_cry", name: "War Cry", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You let out a thundering war cry that echoes across the battlefield, boosting your attack power by 30% for 3 turns. All your strikes hit harder while the adrenaline lasts.",
      requires: null,
      synergy: "Stack with Flame Slash or Power Strike for burst turns.",
    },
    {
      id: "w_rage", name: "Berserker Rage", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 5, damage: 2.2, element: "physical",
      description: "You enter a frenzied rage, ignoring all pain as you tear into the enemy for 220% damage. Defense means nothing when fury takes over.",
      requires: "w_power_strike",
    },
    {
      id: "w_blood_rage", name: "Blood Rage", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 4, damage: 1.7, element: "blood",
      description: "You slash with frenzied bloodlust for 170% blood damage, draining the enemy's life force. You heal for 5% of the damage dealt as their blood empowers you.",
      requires: "w_flame_slash",
      synergy: "blood_dmg % amplifies both the hit and the lifesteal.",
    },

    // ── Tier 3 – Expert (Lv 25+) ─────────────────────────────────────────────
    {
      id: "w_whirlwind", name: "Whirlwind", tier: 3, levelReq: 25, cost: 3,
      mp: 65, cooldown: 4, damage: 1.7, element: "physical",
      description: "You spin like a tornado of steel, slashing everything around you for 170% damage. The stronger you are, the more devastating each revolution becomes.",
      requires: "w_shield_bash",
    },
    {
      id: "w_taunt", name: "Taunt", tier: 3, levelReq: 28, cost: 3,
      mp: 45, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "You roar a challenge that forces the enemy to focus on you, reducing damage to your allies by 20% for 2 turns. Your resilience makes you an unmovable wall.",
      requires: "w_war_cry",
      synergy: "Combine with Bulwark Stance for extreme tanking.",
    },
    {
      id: "w_ground_slam", name: "Ground Slam", tier: 3, levelReq: 30, cost: 4,
      mp: 75, cooldown: 5, damage: 2.5, element: "physical",
      description: "You bring your weapon crashing into the earth, sending shockwaves that deal 250% damage and stun the enemy for 1 turn. The ground itself trembles.",
      requires: "w_rage",
    },
    {
      id: "w_thunder_strike", name: "Thunder Strike", tier: 3, levelReq: 32, cost: 4,
      mp: 70, cooldown: 5, damage: 2.0, element: "lightning",
      description: "Lightning surges through your blade as you strike for 200% lightning damage. The storm answers your call, and each blow crackles with electric fury.",
      requires: "w_blood_rage",
      synergy: "lightning_dmg % stacks multiplicatively with STR scaling.",
    },

    // ── Tier 4 – Master (Lv 45+) ─────────────────────────────────────────────
    {
      id: "w_bulwark", name: "Bulwark Stance", tier: 4, levelReq: 45, cost: 4,
      mp: 85, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "You plant your feet and become an immovable fortress, gaining 50% defense and regenerating 10% HP each turn for 3 turns. Nothing gets past your guard.",
      requires: "w_taunt",
      synergy: "VIT amplifies both the defense bonus and regen amount.",
    },
    {
      id: "w_avatar", name: "Avatar of War", tier: 4, levelReq: 50, cost: 5,
      mp: 110, cooldown: 6, damage: 3.0, element: "physical",
      description: "You channel the spirit of an ancient war god, striking for 300% damage while healing 20% of your health. Divine power flows through your veins.",
      requires: "w_ground_slam",
    },
    {
      id: "w_juggernaut", name: "Juggernaut", tier: 4, levelReq: 55, cost: 4,
      mp: 100, cooldown: 5, damage: 2.8, element: "physical",
      description: "You charge forward like an unstoppable force, crashing into the enemy for 280% damage and ignoring half their defenses. Nothing can slow you down.",
      requires: "w_whirlwind",
    },
    {
      id: "w_sand_veil", name: "Sand Veil", tier: 4, levelReq: 48, cost: 4,
      mp: 90, cooldown: 5, damage: 1.5, element: "sand",
      description: "You conjure a swirling vortex of sand for 150% sand damage. The sandstorm blinds your enemy, granting you 30% evasion for 2 turns as you vanish in the haze.",
      requires: "w_thunder_strike",
      synergy: "sand_dmg % increases the damage portion.",
    },

    // ── Tier 5 – Legendary (Lv 70+) ──────────────────────────────────────────
    {
      id: "w_titan_form", name: "Titan Form", tier: 5, levelReq: 70, cost: 5,
      mp: 140, cooldown: 6, damage: 0, element: null, buff: "attack",
      description: "Your body grows to titanic proportions as ancient power surges through you. Your HP doubles and all stats increase by 60% for 5 turns. You are unstoppable.",
      requires: "w_bulwark",
    },
    {
      id: "w_armageddon", name: "Armageddon Strike", tier: 5, levelReq: 75, cost: 6,
      mp: 160, cooldown: 6, damage: 5.0, element: "fire",
      description: "You bring down a cataclysmic strike of fire and steel for 500% fire damage. The battlefield erupts in flames as your blade carves through everything.",
      requires: "w_avatar",
      synergy: "fire_dmg % is FULLY applied on top of 500% base damage.",
    },
    {
      id: "w_eternal_guard", name: "Eternal Guardian", tier: 5, levelReq: 80, cost: 5,
      mp: 130, cooldown: 6, damage: 3.5, element: "physical", buff: "defense",
      description: "You become an immortal sentinel for 2 turns, shrugging off all damage. When struck, you retaliate with 350% damage. Nothing can fell you.",
      requires: "w_juggernaut",
    },

    // ── New Tier 2 fills ──
    {
      id: "w_cleave", name: "Cleave", tier: 2, levelReq: 11, cost: 2,
      mp: 40, cooldown: 3, damage: 1.6, element: "physical",
      description: "You swing your weapon in a wide arc, cleaving through all enemies for 160% damage. A brutal sweep that punishes anyone standing too close.",
      requires: "w_basic_strike",
    },
    {
      id: "w_iron_skin", name: "Iron Skin", tier: 2, levelReq: 13, cost: 2,
      mp: 35, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "Your skin hardens to the strength of iron, increasing defense by 35% and block chance by 15% for 3 turns. Blades bounce off your body.",
      requires: "w_shield_block",
    },

    // ── New Tier 3 fills ──
    {
      id: "w_execute", name: "Execute", tier: 3, levelReq: 26, cost: 3,
      mp: 60, cooldown: 4, damage: 2.0, element: "physical",
      description: "You deliver a merciless killing blow for 200% damage. If the enemy is below 30% HP, the damage doubles as you exploit their weakness.",
      requires: "w_rage",
    },
    {
      id: "w_earthquake", name: "Earthquake", tier: 3, levelReq: 33, cost: 4,
      mp: 80, cooldown: 5, damage: 2.2, element: "sand",
      description: "You slam the ground with such force that the earth itself shatters, dealing 220% sand damage and stunning the enemy for 1 turn.",
      requires: "w_ground_slam",
      synergy: "sand_dmg % amplifies. Pairs with Sand Veil for a sand warrior build.",
    },
    {
      id: "w_battle_shout", name: "Battle Shout", tier: 3, levelReq: 29, cost: 3,
      mp: 50, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You unleash a rallying battle shout that quickens your strikes, granting 20% attack speed and 15% critical hit chance for 3 turns.",
      requires: "w_war_cry",
    },

    // ── New Tier 4 fills ──
    {
      id: "w_blood_sacrifice", name: "Blood Sacrifice", tier: 4, levelReq: 52, cost: 4,
      mp: 95, cooldown: 5, damage: 3.2, element: "blood",
      description: "You sacrifice 15% of your own HP to fuel a devastating blood strike for 320% blood damage, draining 10% of the damage as health. Pain is power.",
      requires: "w_blood_rage",
      synergy: "blood_dmg % stack makes this self-sustaining at high values.",
    },
    {
      id: "w_tremor", name: "Tremor Slam", tier: 4, levelReq: 54, cost: 4,
      mp: 100, cooldown: 5, damage: 2.8, element: "physical",
      description: "You slam the ground with earth-shattering force for 280% damage, weakening the enemy's defenses. The tremors leave them vulnerable to follow-up attacks.",
      requires: "w_ground_slam",
    },

    // ── New Tier 5 fills ──
    {
      id: "w_inferno_blade", name: "Inferno Blade", tier: 5, levelReq: 72, cost: 5,
      mp: 145, cooldown: 6, damage: 4.5, element: "fire",
      description: "Your blade erupts into a raging inferno as you slash for 450% fire damage. The flames linger, burning the enemy for 5% of their HP each turn for 3 turns.",
      requires: "w_armageddon",
      synergy: "fire_dmg amplifies both the hit and the burn. Core fire warrior skill.",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "w_godslayer", name: "Godslayer", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 8.0, element: "physical",
      description: "You transcend mortal limits and unleash a strike of absolute destruction for 800% damage that ignores all defenses and immunities. Even gods fall before this blow.",
      requires: "w_armageddon",
      synergy: "Requires Armageddon Strike. The ultimate warrior finisher.",
    },
    {
      id: "w_warlord_aura", name: "Warlord's Aura", tier: 6, levelReq: 92, cost: 6,
      mp: 180, cooldown: 7, damage: 0, element: null, buff: "attack",
      description: "An aura of absolute dominance radiates from your body, boosting attack by 80%, crit chance by 30%, and granting 20% lifesteal for 4 turns. You are war incarnate.",
      requires: "w_titan_form",
    },
    {
      id: "w_ragnarok", name: "Ragnarok", tier: 6, levelReq: 95, cost: 8,
      mp: 250, cooldown: 8, damage: 10.0, element: "fire",
      description: "You call down the apocalypse itself — a cataclysmic explosion of fire and steel dealing 1000% damage. The world burns around you. Nothing survives.",
      requires: "w_eternal_guard",
      synergy: "fire_dmg % fully stacks. The highest single-target warrior skill.",
    },

    // ── New Ice skills ──
    {
      id: "w_frost_cleave", name: "Frost Cleave", tier: 1, levelReq: 6, cost: 2,
      mp: 40, cooldown: 3, damage: 1.4, element: "ice",
      description: "Your blade is coated in razor-sharp ice as you swing for 140% ice damage, slowing the enemy for 1 turn. The cold seeps into their bones.",
      requires: null,
      synergy: "ice_dmg % adds to each swing. Opens ice warrior path.",
    },
    {
      id: "w_glacial_shield", name: "Glacial Shield", tier: 2, levelReq: 13, cost: 2,
      mp: 55, cooldown: 4, damage: 0, element: "ice", buff: "defense",
      description: "A barrier of solid ice forms around you, boosting defense by 35% and reflecting 10% of damage taken as ice damage for 2 turns.",
      requires: "w_frost_cleave",
    },
    {
      id: "w_frozen_wrath", name: "Frozen Wrath", tier: 3, levelReq: 31, cost: 4,
      mp: 82, cooldown: 5, damage: 2.2, element: "ice",
      description: "You shatter the frozen air with a devastating strike for 220% ice damage, encasing the enemy in ice for 1 turn. They can't move, they can't fight.",
      requires: "w_glacial_shield",
      synergy: "ice_dmg % makes this both damage and CC. Pairs with Avalanche Strike.",
    },
    {
      id: "w_avalanche_strike", name: "Avalanche Strike", tier: 4, levelReq: 52, cost: 5,
      mp: 125, cooldown: 5, damage: 3.2, element: "ice",
      description: "You bring down the full force of a mountain avalanche for 320% ice damage, freezing the enemy solid for 2 turns. The cold is absolute.",
      requires: "w_frozen_wrath",
      synergy: "ice_dmg stacking makes this the premier ice warrior nuke.",
    },

    // ── New Poison skills ──
    {
      id: "w_venomous_edge", name: "Venomous Edge", tier: 1, levelReq: 5, cost: 2,
      mp: 38, cooldown: 3, damage: 1.2, element: "poison",
      description: "You coat your blade in deadly venom and slice for 120% poison damage. The toxin spreads through their veins, dealing damage over 3 turns.",
      requires: null,
      synergy: "poison_dmg % amplifies each DoT tick.",
    },
    {
      id: "w_toxic_slam", name: "Toxic Slam", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 1.6, element: "poison",
      description: "You slam your poison-infused weapon into the ground for 160% poison damage, releasing a toxic cloud that poisons everything nearby for 2 turns.",
      requires: "w_venomous_edge",
      synergy: "poison_dmg % boosts both hit and cloud. Pairs with Plague Strike.",
    },
    {
      id: "w_plague_strike", name: "Plague Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 5, damage: 2.2, element: "poison",
      description: "You strike with a plague-carrying blade for 220% poison damage. The infection spreads and stacks, dealing increasing poison damage over 4 turns.",
      requires: "w_toxic_slam",
      synergy: "poison_dmg makes DoT devastating. Stack with Venomous Edge for max poison.",
    },
    {
      id: "w_pandemic_cleave", name: "Pandemic Cleave", tier: 4, levelReq: 53, cost: 5,
      mp: 118, cooldown: 5, damage: 3.0, element: "poison",
      description: "You sweep your toxic blade in a lethal arc for 300% poison damage, reducing the enemy's healing by 30% for 3 turns. There is no cure.",
      requires: "w_plague_strike",
    },

    // ── New Arcane skills ──
    {
      id: "w_runic_blade", name: "Runic Blade", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 1.8, element: "arcane",
      description: "Ancient runes blaze along your weapon as you strike for 180% arcane damage, bypassing 20% of the enemy's magic resistance.",
      requires: null,
    },
    {
      id: "w_arcane_shatter", name: "Arcane Shatter", tier: 3, levelReq: 33, cost: 4,
      mp: 85, cooldown: 5, damage: 2.5, element: "arcane",
      description: "You channel raw arcane energy through your blade, shattering reality for 250% arcane damage and dispelling all enemy buffs.",
      requires: "w_runic_blade",
    },
    {
      id: "w_void_cleave", name: "Void Cleave", tier: 4, levelReq: 54, cost: 5,
      mp: 130, cooldown: 5, damage: 3.5, element: "arcane",
      description: "Your blade cuts through the fabric of space itself for 350% arcane damage, ignoring all defenses. Nothing can protect against the void.",
      requires: "w_arcane_shatter",
    },
    {
      id: "w_dimension_breaker", name: "Dimension Breaker", tier: 5, levelReq: 76, cost: 6,
      mp: 185, cooldown: 6, damage: 5.5, element: "arcane",
      description: "You shatter dimensional barriers with a single strike for 550% arcane damage. Reality itself cracks under the force of your blow.",
      requires: "w_void_cleave",
      synergy: "The arcane warrior's ultimate. Pairs with Void Cleave for burst combos.",
    },

    // ── New Lightning fills ──
    {
      id: "w_static_charge", name: "Static Charge", tier: 1, levelReq: 8, cost: 2,
      mp: 38, cooldown: 3, damage: 1.3, element: "lightning",
      description: "You charge your weapon with crackling electricity, striking for 130% lightning damage. Sparks arc between you and the enemy with each hit.",
      requires: null,
      synergy: "lightning_dmg % adds to each hit. Opens lightning warrior path.",
    },
    {
      id: "w_storm_shield", name: "Storm Shield", tier: 2, levelReq: 12, cost: 2,
      mp: 50, cooldown: 4, damage: 0, element: "lightning", buff: "defense",
      description: "A shield of crackling lightning surrounds you, boosting defense by 30% and shocking any attacker for lightning damage for 3 turns.",
      requires: "w_static_charge",
    },
    {
      id: "w_mjolnir_strike", name: "Mjolnir Strike", tier: 4, levelReq: 50, cost: 5,
      mp: 120, cooldown: 5, damage: 3.2, element: "lightning",
      description: "You bring down a hammer blow charged with the fury of a thunderstorm for 320% lightning damage. The impact shakes the heavens.",
      requires: "w_thunder_strike",
      synergy: "lightning_dmg fully stacks. The lightning warrior's core nuke.",
    },
    {
      id: "w_tempest_fury", name: "Tempest Fury", tier: 5, levelReq: 74, cost: 6,
      mp: 180, cooldown: 6, damage: 5.5, element: "lightning",
      description: "You become one with the storm, unleashing a flurry of lightning-charged strikes for 550% lightning damage. Thunder rolls with every swing.",
      requires: "w_mjolnir_strike",
      synergy: "lightning_dmg build's endgame skill. Devastating AoE.",
    },
    // ── Gap fills: fire T2, T3, T4 ──
    {
      id: "w_blazing_cleave", name: "Blazing Cleave", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 3, damage: 1.5, element: "fire",
      description: "Your weapon erupts in flames as you cleave through the enemy for 150% fire damage. The searing heat melts through their armor.",
      requires: null, synergy: "Burn damage increases with consecutive fire attacks.",
    },
    {
      id: "w_inferno_slam", name: "Inferno Slam", tier: 3, levelReq: 30, cost: 4,
      mp: 75, cooldown: 4, damage: 2.2, element: "fire",
      description: "You slam your burning weapon into the ground for 220% fire damage, creating a wave of fire that engulfs everything in its path.",
      requires: null, synergy: "Ground-based fire persists, dealing residual burn damage.",
    },
    {
      id: "w_magma_rend", name: "Magma Rend", tier: 4, levelReq: 50, cost: 5,
      mp: 110, cooldown: 5, damage: 3.0, element: "fire",
      description: "You tear through the enemy with a blade dripping molten lava for 300% fire damage. The ground beneath you glows red-hot.",
      requires: null, synergy: "Burning targets take amplified damage from physical skills.",
    },
    // ── Gap fills: ice T5, T6 ──
    {
      id: "w_permafrost_crush", name: "Permafrost Crush", tier: 5, levelReq: 74, cost: 6,
      mp: 155, cooldown: 6, damage: 4.5, element: "ice",
      description: "You deliver a bone-shattering blow of pure cold for 450% ice damage. The frost is so intense it freezes the air itself.",
      requires: "w_avalanche_strike", synergy: "Frozen enemies shatter for bonus physical damage.",
    },
    {
      id: "w_glacial_annihilation", name: "Glacial Annihilation", tier: 6, levelReq: 92, cost: 7,
      mp: 210, cooldown: 7, damage: 7.0, element: "ice",
      description: "You unleash the fury of an eternal winter for 700% ice damage. Everything around you is entombed in ice. Nothing moves.",
      requires: "w_permafrost_crush", synergy: "All ice effects gain extended duration while active.",
    },
    // ── Gap fills: lightning T6 ──
    {
      id: "w_thundergod_wrath", name: "Thundergod's Wrath", tier: 6, levelReq: 93, cost: 8,
      mp: 240, cooldown: 8, damage: 9.0, element: "lightning",
      description: "You channel the wrath of the thunder god for 900% lightning damage. The skies darken and lightning rains down upon your enemies.",
      requires: "w_tempest_fury", synergy: "Stunned enemies receive triple lightning damage.",
    },
    // ── Gap fills: poison T5, T6 ──
    {
      id: "w_blight_cleave", name: "Blight Cleave", tier: 5, levelReq: 72, cost: 5,
      mp: 140, cooldown: 5, damage: 4.0, element: "poison",
      description: "Your weapon drips with lethal toxins as you swing for 400% poison damage. The blight spreads through the enemy's body with every cut.",
      requires: "w_pandemic_cleave", synergy: "Poison duration doubled against enemies below 50% health.",
    },
    {
      id: "w_plague_lord", name: "Plague Lord's Ruin", tier: 6, levelReq: 91, cost: 7,
      mp: 195, cooldown: 7, damage: 6.5, element: "poison",
      description: "You become a vessel of pestilence, striking for 650% poison damage. Disease and decay radiate from your very presence.",
      requires: "w_blight_cleave", synergy: "All poison DOTs on the target stack with no cap.",
    },
    // ── Gap fills: blood T1, T3, T5, T6 ──
    {
      id: "w_crimson_edge", name: "Crimson Edge", tier: 1, levelReq: 6, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "blood",
      description: "Your blade weeps blood as you slash for 120% blood damage. The wound won't stop bleeding, sapping the enemy's life force.",
      requires: null, synergy: "Heals a small portion of damage dealt.",
    },
    {
      id: "w_sanguine_slam", name: "Sanguine Slam", tier: 3, levelReq: 32, cost: 4,
      mp: 78, cooldown: 4, damage: 2.3, element: "blood",
      description: "You slam the ground with a blood-soaked weapon for 229% blood damage. Crimson energy erupts from the impact, draining the enemy.",
      requires: null, synergy: "Damage scales with missing health.",
    },
    {
      id: "w_hemorrhage_strike", name: "Hemorrhage Strike", tier: 5, levelReq: 75, cost: 6,
      mp: 150, cooldown: 6, damage: 5.0, element: "blood",
      description: "You strike a vital artery for 500% blood damage, causing severe bleeding. The enemy grows weaker with every heartbeat.",
      requires: "w_blood_sacrifice", synergy: "Bleeding enemies lose defense over time.",
    },
    {
      id: "w_bloodstorm_tyrant", name: "Bloodstorm Tyrant", tier: 6, levelReq: 94, cost: 8,
      mp: 230, cooldown: 7, damage: 8.5, element: "blood",
      description: "You become a tyrant of blood, unleashing a crimson storm for 850% blood damage. The battlefield runs red as you drain everything alive.",
      requires: "w_hemorrhage_strike", synergy: "Full health restored if this skill kills the target.",
    },
    // ── Gap fills: sand T1, T2, T5, T6 ──
    {
      id: "w_dust_strike", name: "Dust Strike", tier: 1, levelReq: 7, cost: 2,
      mp: 28, cooldown: 2, damage: 1.1, element: "sand",
      description: "You kick up a cloud of sand as you strike for 110% sand damage. The grit blinds and disorients your opponent.",
      requires: null, synergy: "Blinded enemies have reduced accuracy.",
    },
    {
      id: "w_sandstone_bash", name: "Sandstone Bash", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 3, damage: 1.6, element: "sand",
      description: "Your fists become hard as sandstone as you bash the enemy for 160% sand damage. The desert's strength flows through you.",
      requires: null, synergy: "Sand skills slow enemy attack speed.",
    },
    {
      id: "w_dune_colossus", name: "Dune Colossus", tier: 5, levelReq: 76, cost: 6,
      mp: 160, cooldown: 6, damage: 4.8, element: "sand",
      description: "You rise as a colossus of living sand for 480% sand damage. The desert itself fights at your command.",
      requires: null, synergy: "Slowed enemies take bonus damage from all sources.",
    },
    {
      id: "w_tomb_warden", name: "Tomb Warden's Wrath", tier: 6, levelReq: 93, cost: 7,
      mp: 220, cooldown: 7, damage: 7.5, element: "sand",
      description: "You channel the ancient power of a tomb guardian for 750% sand damage. The sands of time obey your will.",
      requires: "w_dune_colossus", synergy: "Entombed enemies cannot dodge or block.",
    },
    // ── Gap fills: arcane T1, T6 ──
    {
      id: "w_mystic_strike", name: "Mystic Strike", tier: 1, levelReq: 8, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "arcane",
      description: "You infuse your weapon with raw magical energy for 130% arcane damage. The strike leaves reality slightly warped.",
      requires: null, synergy: "Arcane damage bypasses a portion of enemy defense.",
    },
    {
      id: "w_void_annihilator", name: "Void Annihilator", tier: 6, levelReq: 95, cost: 8,
      mp: 260, cooldown: 8, damage: 9.5, element: "arcane",
      description: "You tear a hole in existence itself for 950% arcane damage. The void consumes everything in its path. Nothing remains.",
      requires: "w_dimension_breaker", synergy: "Ignores all enemy resistances and immunities.",
    },

    // ── Support skills ──
    {
      id: "w_rallying_cry", name: "Rallying Cry", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.15,
      description: "You rally your allies with an inspiring war cry, boosting the party's attack and defense for 3 turns. Your courage is contagious.",
      requires: null, statScale: "strength",
    },
    {
      id: "w_fortress", name: "Fortress", tier: 3, levelReq: 28, cost: 3,
      mp: 60, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.25,
      description: "You become an impenetrable fortress, granting massive defense to yourself and nearby allies for 3 turns. No attack can breach your walls.",
      requires: "w_rallying_cry", statScale: "vitality",
    },
    {
      id: "w_berserker_fury", name: "Berserker Fury", tier: 3, levelReq: 30, cost: 3,
      mp: 55, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 35, crit_pct: 10 }, buffDuration: 3,
      description: "Primal fury surges through you, massively boosting your attack power and critical chance for 3 turns. You fight like a cornered beast.",
      requires: null, statScale: "strength",
    },
    {
      id: "w_iron_bastion", name: "Iron Bastion", tier: 4, levelReq: 48, cost: 4,
      mp: 80, cooldown: 6, damage: 0, element: null,
      buffEffect: { def_pct: 50, block_pct: 20 }, buffDuration: 3,
      description: "You plant your shield and become an iron bastion, absorbing damage for your allies and reflecting a portion back at attackers.",
      requires: "w_fortress",
    },
  ],

  mage: [
    // ── Tier 1 ──
    {
      id: "m_magic_bolt", name: "Magic Bolt", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 2, damage: 1.4, element: "arcane",
      description: "You hurl a bolt of pure arcane energy at the enemy for 140% damage. A fundamental spell that grows stronger with your intellect.",
      requires: null,
      synergy: "Every point of INT increases this skill's output.",
    },
    {
      id: "m_frost_armor", name: "Frost Armor", tier: 1, levelReq: 1, cost: 1,
      mp: 28, cooldown: 3, damage: 0, element: "ice", buff: "defense",
      description: "You cloak yourself in a shimmering layer of frost, gaining 25% defense for 3 turns. Attackers feel the biting cold when they strike you.",
      requires: null,
    },
    {
      id: "m_fireball", name: "Fireball", tier: 1, levelReq: 5, cost: 2,
      mp: 38, cooldown: 3, damage: 1.9, element: "fire",
      description: "You conjure a roaring fireball and launch it at the enemy for 190% fire damage. The explosion leaves scorched earth in its wake.",
      requires: "m_magic_bolt",
      synergy: "fire_dmg % amplifies all Fireball damage multiplicatively.",
    },
    {
      id: "m_poison_bolt", name: "Poison Bolt", tier: 1, levelReq: 6, cost: 2,
      mp: 30, cooldown: 3, damage: 1.2, element: "poison",
      description: "You fire a bolt of concentrated venom for 120% poison damage. The toxin festers in the wound, dealing damage over time.",
      requires: null,
      synergy: "poison_dmg % scales the DoT component over 3 turns.",
    },

    // ── Tier 2 ──
    {
      id: "m_ice_lance", name: "Ice Lance", tier: 2, levelReq: 10, cost: 2,
      mp: 48, cooldown: 3, damage: 1.6, element: "ice",
      description: "You form a lance of crystalline ice and hurl it for 160% ice damage. The piercing cold slows the enemy as frost spreads from the wound.",
      requires: "m_frost_armor",
      synergy: "ice_dmg % adds damage. Pairs well with Blizzard for freeze chains.",
    },
    {
      id: "m_mana_shield", name: "Mana Shield", tier: 2, levelReq: 12, cost: 2,
      mp: 55, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "You weave a barrier of pure mana around yourself, absorbing incoming damage using your magical reserves for 3 turns.",
      requires: null,
      synergy: "High INT = more MP = longer shield uptime.",
    },
    {
      id: "m_arcane_burst", name: "Arcane Burst", tier: 2, levelReq: 15, cost: 3,
      mp: 65, cooldown: 4, damage: 2.4, element: "arcane",
      description: "You release a burst of raw arcane power for 240% damage. The explosion warps the air around you in a dazzling display of magical force.",
      requires: "m_fireball",
    },
    {
      id: "m_lightning_bolt", name: "Lightning Bolt", tier: 2, levelReq: 13, cost: 2,
      mp: 45, cooldown: 3, damage: 1.8, element: "lightning",
      description: "You call down a searing bolt of lightning for 180% lightning damage. The thunderclap that follows shakes the ground.",
      requires: "m_poison_bolt",
      synergy: "lightning_dmg % stacks with INT scaling for strong burst.",
    },

    // ── Tier 3 ──
    {
      id: "m_blizzard", name: "Blizzard", tier: 3, levelReq: 25, cost: 3,
      mp: 85, cooldown: 5, damage: 2.0, element: "ice",
      description: "You summon a raging blizzard that engulfs the battlefield for 200% ice damage. Snow and ice tear through everything caught in the storm.",
      requires: "m_ice_lance",
      synergy: "ice_dmg synergizes: each % adds directly to blizzard AoE damage.",
    },
    {
      id: "m_flame_wall", name: "Flame Wall", tier: 3, levelReq: 28, cost: 3,
      mp: 80, cooldown: 5, damage: 2.2, element: "fire",
      description: "You raise a wall of roaring flames for 220% fire damage. The inferno creates an impassable barrier of scorching heat.",
      requires: "m_arcane_burst",
      synergy: "fire_dmg % compounds over both turns of the flame wall.",
    },
    {
      id: "m_time_warp", name: "Time Warp", tier: 3, levelReq: 28, cost: 3,
      mp: 80, cooldown: 6, damage: 0, element: null, buff: "attack",
      description: "You bend the fabric of time itself, gaining an extra turn and boosting your speed. The world slows around you while you move freely.",
      requires: "m_mana_shield",
    },
    {
      id: "m_meteor", name: "Meteor", tier: 3, levelReq: 30, cost: 4,
      mp: 95, cooldown: 5, damage: 3.0, element: "fire",
      description: "You pull a blazing meteor from the sky, crashing it into the enemy for 300% fire damage. The impact crater smolders long after the strike.",
      requires: "m_flame_wall",
      synergy: "fire_dmg build makes Meteor one of the highest damage skills.",
    },

    // ── Tier 4 ──
    {
      id: "m_black_hole", name: "Black Hole", tier: 4, levelReq: 45, cost: 4,
      mp: 120, cooldown: 5, damage: 3.5, element: "arcane",
      description: "You tear open a miniature black hole for 350% arcane damage. The gravitational pull crushes everything nearby as space collapses inward.",
      requires: "m_blizzard",
    },
    {
      id: "m_arcane_nova", name: "Arcane Nova", tier: 4, levelReq: 50, cost: 5,
      mp: 140, cooldown: 5, damage: 4.0, element: "arcane",
      description: "You detonate a nova of pure arcane energy for 400% damage. The shockwave ripples outward, warping reality in its wake.",
      requires: "m_meteor",
    },
    {
      id: "m_blood_pact", name: "Blood Pact", tier: 4, levelReq: 48, cost: 4,
      mp: 110, cooldown: 5, damage: 2.8, element: "blood",
      description: "You forge a dark blood pact, sacrificing HP to unleash 280% blood damage. The more you bleed, the more power you command.",
      requires: "m_time_warp",
      synergy: "blood_dmg % amplifies but the cost scales too. High risk/high reward.",
    },
    {
      id: "m_chrono_rift", name: "Chrono Rift", tier: 4, levelReq: 55, cost: 4,
      mp: 110, cooldown: 5, damage: 2.8, element: "arcane",
      description: "You rip open a rift in time, resetting your cooldowns and gaining enhanced casting speed for 3 turns. Time bends to your will.",
      requires: "m_time_warp",
    },
    {
      id: "m_ice_prison", name: "Ice Prison", tier: 4, levelReq: 52, cost: 4,
      mp: 125, cooldown: 5, damage: 2.5, element: "ice", buff: "defense",
      description: "You encase the enemy in an inescapable prison of ice for 250% ice damage. They're frozen solid, unable to act for 2 turns.",
      requires: "m_black_hole",
      synergy: "ice_dmg builds turn this into both offense and defense.",
    },

    // ── Tier 5 ──
    {
      id: "m_singularity", name: "Singularity", tier: 5, levelReq: 70, cost: 5,
      mp: 175, cooldown: 6, damage: 5.5, element: "arcane",
      description: "You collapse space into a devastating singularity for 550% arcane damage. The gravitational forces tear the enemy apart from within.",
      requires: "m_black_hole",
    },
    {
      id: "m_genesis", name: "Genesis", tier: 5, levelReq: 75, cost: 5,
      mp: 160, cooldown: 6, damage: 0, element: null, buff: "defense",
      description: "You channel the primordial force of creation itself for 0% damage, restoring your HP and empowering all abilities. Divine magic made manifest.",
      requires: "m_chrono_rift",
    },
    {
      id: "m_apocalypse", name: "Apocalypse", tier: 5, levelReq: 80, cost: 6,
      mp: 200, cooldown: 6, damage: 6.0, element: "fire",
      description: "You unleash magical armageddon for 600% damage. Fire, ice, and lightning rain from the sky in an apocalyptic display of ultimate power.",
      requires: "m_arcane_nova",
      synergy: "fire_dmg is the key amplifier. Max fire build here = highest DPS in game.",
    },

    // ── New Tier 2 fills ──
    {
      id: "m_arcane_shield", name: "Arcane Shield", tier: 2, levelReq: 11, cost: 2,
      mp: 40, cooldown: 4, damage: 0, element: "arcane", buff: "defense",
      description: "You conjure an arcane barrier that absorbs damage and reflects a portion of magic attacks back at the caster for 3 turns.",
      requires: "m_frost_armor",
    },
    {
      id: "m_chain_lightning", name: "Chain Lightning", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 2.0, element: "lightning",
      description: "You unleash a bolt of lightning that arcs between enemies for 200% lightning damage. The chain jumps from target to target in a storm of electricity.",
      requires: "m_lightning_bolt",
      synergy: "lightning_dmg % makes each chain hit harder than the last.",
    },

    // ── New Tier 3 fills ──
    {
      id: "m_poison_cloud", name: "Poison Cloud", tier: 3, levelReq: 27, cost: 3,
      mp: 70, cooldown: 5, damage: 1.5, element: "poison",
      description: "You conjure a choking cloud of toxic gas for 150% poison damage. The miasma lingers, poisoning everything that breathes it in.",
      requires: "m_poison_bolt",
      synergy: "poison_dmg % makes this the strongest sustained damage over time.",
    },
    {
      id: "m_frost_nova", name: "Frost Nova", tier: 3, levelReq: 29, cost: 3,
      mp: 75, cooldown: 5, damage: 1.8, element: "ice",
      description: "You detonate a nova of freezing energy for 180% ice damage. A ring of ice explodes outward, flash-freezing everything in range.",
      requires: "m_ice_lance",
    },
    {
      id: "m_mana_burn", name: "Mana Burn", tier: 3, levelReq: 31, cost: 3,
      mp: 60, cooldown: 4, damage: 2.0, element: "arcane",
      description: "You ignite the enemy's magical reserves for 200% damage, draining their mana. Their own power is turned against them.",
      requires: "m_mana_shield",
    },

    // ── New Tier 4 fills ──
    {
      id: "m_infernal_pact", name: "Infernal Pact", tier: 4, levelReq: 53, cost: 4,
      mp: 115, cooldown: 5, damage: 3.2, element: "fire",
      description: "You seal a pact with infernal forces for 320% fire damage. Demonic flames consume the enemy while dark energy fuels your next spells.",
      requires: "m_flame_wall",
      buff: "attack",
    },
    {
      id: "m_sandstorm", name: "Sandstorm", tier: 4, levelReq: 50, cost: 4,
      mp: 105, cooldown: 5, damage: 2.5, element: "sand",
      description: "You conjure a howling sandstorm for 250% sand damage. The swirling sands shred and blind everything caught in the maelstrom.",
      requires: "m_time_warp",
      synergy: "sand_dmg % opens an uncommon mage path. Combine with Time Warp for lockdown.",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "m_arcane_god", name: "Arcane Godform", tier: 6, levelReq: 90, cost: 7,
      mp: 220, cooldown: 7, damage: 0, element: "arcane", buff: "attack",
      description: "You ascend to the pinnacle of arcane mastery for 0% damage. Pure magical energy radiates from your being as you become a living conduit of power.",
      requires: "m_singularity",
    },
    {
      id: "m_supernova", name: "Supernova", tier: 6, levelReq: 93, cost: 8,
      mp: 280, cooldown: 8, damage: 12.0, element: "fire",
      description: "You detonate a supernova of pure energy for 1200% damage. The explosion is blinding, devastating, and utterly inescapable. Stars die with less fury.",
      requires: "m_apocalypse",
      synergy: "fire_dmg % FULLY stacks. With Infernal Pact active = game-ending damage.",
    },
    {
      id: "m_absolute_zero", name: "Absolute Zero", tier: 6, levelReq: 95, cost: 7,
      mp: 240, cooldown: 7, damage: 7.0, element: "ice",
      description: "You drop the temperature to absolute zero for 700% ice damage. All molecular motion ceases. Nothing can survive the complete absence of heat.",
      requires: "m_ice_prison",
      synergy: "ice_dmg build's ultimate payoff. Complete lockdown + massive damage.",
    },

    // ── New Blood skills ──
    {
      id: "m_blood_bolt", name: "Blood Bolt", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "blood",
      description: "You fire a bolt of crystallized blood for 130% blood damage. The sanguine projectile bursts on impact, draining the enemy's vitality.",
      requires: null,
      synergy: "blood_dmg % amplifies both the hit and the drain.",
    },
    {
      id: "m_hemomancy", name: "Hemomancy", tier: 3, levelReq: 32, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "blood",
      description: "You manipulate the enemy's own blood against them for 250% blood damage. Their veins revolt as crimson energy tears through their body.",
      requires: "m_blood_pact",
      synergy: "blood_dmg makes this self-sustaining. Core blood mage skill.",
    },
    {
      id: "m_crimson_storm", name: "Crimson Storm", tier: 5, levelReq: 73, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "blood",
      description: "You conjure a storm of blood rain for 500% blood damage. The crimson tempest drains life from everything it touches.",
      requires: "m_hemomancy",
      synergy: "blood_dmg build's ultimate payoff. Massive damage + massive healing.",
    },
    {
      id: "m_sanguine_ritual", name: "Sanguine Ritual", tier: 4, levelReq: 55, cost: 4,
      mp: 120, cooldown: 5, damage: 0, element: "blood", buff: "attack",
      description: "You perform an ancient blood ritual for 0% blood damage. Dark crimson sigils appear in the air, pulsing with stolen life force.",
      requires: "m_blood_pact",
    },

    // ── New Sand skills ──
    {
      id: "m_sand_barrier", name: "Sand Barrier", tier: 2, levelReq: 14, cost: 2,
      mp: 50, cooldown: 4, damage: 0, element: "sand", buff: "defense",
      description: "You raise a barrier of compressed sand that absorbs incoming attacks for 3 turns. The desert shields you from harm.",
      requires: null,
    },
    {
      id: "m_dust_devil", name: "Dust Devil", tier: 3, levelReq: 29, cost: 3,
      mp: 78, cooldown: 5, damage: 2.0, element: "sand",
      description: "You summon a raging dust devil for 200% sand damage. The spinning vortex of sand tears through the enemy and obscures their vision.",
      requires: "m_sand_barrier",
      synergy: "sand_dmg % adds to damage. Pairs with Sandstorm for sand mage build.",
    },
    {
      id: "m_desert_wrath", name: "Desert Wrath", tier: 5, levelReq: 77, cost: 6,
      mp: 180, cooldown: 6, damage: 5.0, element: "sand",
      description: "You call upon the fury of the desert for 500% sand damage. Scorching sand and wind scour the flesh from your enemies.",
      requires: "m_sandstorm",
      synergy: "sand_dmg build mage's endgame. Total enemy shutdown + damage.",
    },

    // ── New Lightning fills ──
    {
      id: "m_thunderstorm", name: "Thunderstorm", tier: 4, levelReq: 51, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "lightning",
      description: "You summon a violent thunderstorm for 350% lightning damage. Lightning bolts rain from the dark clouds, striking without mercy.",
      requires: "m_chain_lightning",
      synergy: "lightning_dmg % makes storms devastating. Pairs with Chain Lightning.",
    },
    {
      id: "m_ball_lightning", name: "Ball Lightning", tier: 5, levelReq: 75, cost: 6,
      mp: 170, cooldown: 6, damage: 4.5, element: "lightning",
      description: "You conjure a crackling sphere of ball lightning for 450% lightning damage. The orb bounces between enemies, electrocuting everything it touches.",
      requires: "m_thunderstorm",
    },

    // ── New Poison fills ──
    {
      id: "m_plague", name: "Plague", tier: 4, levelReq: 54, cost: 5,
      mp: 120, cooldown: 5, damage: 3.0, element: "poison",
      description: "You unleash a magical plague for 300% poison damage. The disease spreads rapidly, weakening and corrupting everything it infects.",
      requires: "m_poison_cloud",
      synergy: "poison_dmg % amplifies every tick. Devastating over long fights.",
    },
    {
      id: "m_miasma", name: "Miasma", tier: 5, levelReq: 74, cost: 6,
      mp: 172, cooldown: 6, damage: 4.5, element: "poison",
      description: "You release a noxious miasma for 450% poison damage. The toxic haze chokes and corrodes, eating away at the enemy from the inside.",
      requires: "m_plague",
      synergy: "poison_dmg build mage's endgame. Shuts down enemy regen completely.",
    },
    // ── Gap fills: fire T2 ──
    {
      id: "m_pyroclasm", name: "Pyroclasm", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 3, damage: 1.7, element: "fire",
      description: "You erupt the ground in volcanic fury for 170% fire damage. Molten lava bursts upward, consuming everything in a fiery cataclysm.",
      requires: null, synergy: "Burning enemies take increased fire spell damage.",
    },
    // ── Gap fills: ice T5 ──
    {
      id: "m_frozen_eternity", name: "Frozen Eternity", tier: 5, levelReq: 75, cost: 6,
      mp: 165, cooldown: 6, damage: 4.8, element: "ice",
      description: "You cast the enemy into an eternity of ice for 480% ice damage. Time itself freezes around them in an unbreakable prison of frost.",
      requires: "m_ice_prison", synergy: "Frozen enemies cannot regenerate health or mana.",
    },
    // ── Gap fills: lightning T1, T3, T6 ──
    {
      id: "m_spark_bolt", name: "Spark Bolt", tier: 1, levelReq: 7, cost: 2,
      mp: 32, cooldown: 2, damage: 1.3, element: "lightning",
      description: "You fire a crackling spark bolt for 130% lightning damage. The electrified projectile arcs through the air, seeking its target with precision.",
      requires: null, synergy: "Has a chance to chain to a second target.",
    },
    {
      id: "m_voltaic_surge", name: "Voltaic Surge", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 4, damage: 2.2, element: "lightning",
      description: "You channel a massive surge of voltage for 220% lightning damage. Electricity arcs from your fingertips in a devastating cascade.",
      requires: null, synergy: "Shocked enemies have reduced resistance to all elements.",
    },
    {
      id: "m_tempest_god", name: "Tempest Godform", tier: 6, levelReq: 94, cost: 8,
      mp: 235, cooldown: 8, damage: 8.0, element: "lightning",
      description: "You become the god of storms for 800% lightning damage. Thunder and lightning obey your command as the skies rage with your fury.",
      requires: "m_ball_lightning", synergy: "All attacks gain lightning damage while transformed.",
    },
    // ── Gap fills: poison T2, T6 ──
    {
      id: "m_toxic_nova", name: "Toxic Nova", tier: 2, levelReq: 13, cost: 2,
      mp: 48, cooldown: 3, damage: 1.4, element: "poison",
      description: "You detonate a nova of pure toxin for 140% poison damage. A wave of corrosive poison expands outward, dissolving everything it touches.",
      requires: null, synergy: "Poisoned enemies spread toxins to nearby allies.",
    },
    {
      id: "m_pandemic_ritual", name: "Pandemic Ritual", tier: 6, levelReq: 92, cost: 7,
      mp: 205, cooldown: 7, damage: 7.0, element: "poison",
      description: "You perform a forbidden ritual for 700% poison damage. Plague sigils burn into the ground as pestilence spreads to all nearby foes.",
      requires: "m_miasma", synergy: "Poison DOTs cannot be cleansed while ritual persists.",
    },
    // ── Gap fills: blood T2, T6 ──
    {
      id: "m_sanguine_lance", name: "Sanguine Lance", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 1.6, element: "blood",
      description: "You forge a lance of solidified blood and hurl it for 160% blood damage. The crimson spear pierces deep, draining life with each moment.",
      requires: null, synergy: "Leech effect restores mana proportional to blood damage.",
    },
    {
      id: "m_blood_god", name: "Blood God's Dominion", tier: 6, levelReq: 93, cost: 8,
      mp: 240, cooldown: 8, damage: 8.5, element: "blood",
      description: "You channel the power of the blood god for 850% blood damage. Crimson energy swirls around you as you command the very essence of life itself.",
      requires: "m_crimson_storm", synergy: "All damage dealt converts to healing at 50% rate.",
    },
    // ── Gap fills: sand T1, T6 ──
    {
      id: "m_sand_bolt", name: "Sand Bolt", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.1, element: "sand",
      description: "You fire a bolt of compressed sand for 110% sand damage. The abrasive projectile tears through the enemy like a desert wind.",
      requires: null, synergy: "Sand damage erodes enemy armor over time.",
    },
    {
      id: "m_tomb_pharaoh", name: "Tomb Pharaoh's Curse", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.5, element: "sand",
      description: "You invoke the power of an ancient pharaoh for 750% sand damage. The sands of the tomb rise to your command, burying your enemies alive.",
      requires: "m_desert_wrath", synergy: "Cursed enemies take increased damage from all sand skills.",
    },

    // ── Support skills (Mage has the most) ──
    {
      id: "m_healing_light", name: "Healing Light", tier: 1, levelReq: 3, cost: 1,
      mp: 30, cooldown: 4, damage: 0, element: null,
      special: "heal", healPct: 0.20,
      description: "You channel a warm, golden light that restores 20% of your HP. The divine radiance mends your wounds and soothes your pain.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_greater_heal", name: "Greater Heal", tier: 3, levelReq: 28, cost: 3,
      mp: 65, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.35,
      description: "You cast a powerful healing spell that restores 35% of your HP. A surge of life energy floods through your body, closing even deep wounds.",
      requires: "m_healing_light", statScale: "intelligence",
    },
    {
      id: "m_arcane_barrier", name: "Arcane Barrier", tier: 2, levelReq: 10, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null,
      special: "shield", shieldPct: 0.25,
      description: "You weave an intricate arcane barrier that absorbs massive damage for 3 turns. The magical shield shimmers with protective runes.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_prismatic_ward", name: "Prismatic Ward", tier: 4, levelReq: 50, cost: 4,
      mp: 85, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.45,
      description: "You conjure a prismatic ward of all elements, granting resistance to every damage type for 3 turns. A rainbow of protective magic surrounds you.",
      requires: "m_arcane_barrier", statScale: "intelligence",
    },
    {
      id: "m_mana_surge", name: "Mana Surge", tier: 2, levelReq: 12, cost: 2,
      mp: 15, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.30,
      description: "A surge of raw mana courses through you, restoring 20% of your MP and boosting spell power for 2 turns. Your magical reserves overflow.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_mana_font", name: "Mana Font", tier: 4, levelReq: 48, cost: 4,
      mp: 10, cooldown: 6, damage: 0, element: null,
      special: "mana", manaPct: 0.50,
      description: "You tap into a font of infinite mana, restoring 30% MP and reducing spell costs for 3 turns. Magic flows through you like a river.",
      requires: "m_mana_surge", statScale: "intelligence",
    },
    {
      id: "m_elemental_attunement", name: "Elemental Attunement", tier: 3, levelReq: 30, cost: 3,
      mp: 55, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 40, crit_pct: 15 }, buffDuration: 4,
      description: "You attune yourself to the elements, boosting all elemental damage by 25% for 3 turns. Fire, ice, and lightning answer your call with renewed vigor.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_arcane_empowerment", name: "Arcane Empowerment", tier: 5, levelReq: 72, cost: 5,
      mp: 100, cooldown: 7, damage: 0, element: null,
      buffEffect: { atk_pct: 60, crit_pct: 25, def_pct: 20 }, buffDuration: 4,
      description: "You flood your body with arcane energy, boosting all stats and spell damage for 4 turns. Raw magical power radiates from your very being.",
      requires: "m_elemental_attunement", statScale: "intelligence",
    },

  ],

  ranger: [
    // ── Tier 1 ──
    {
      id: "r_quick_shot", name: "Quick Shot", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.2, element: "physical",
      description: "You nock and release an arrow in the blink of an eye for 120% damage. Speed and precision are your greatest weapons.",
      requires: null,
    },
    {
      id: "r_dodge_roll", name: "Dodge Roll", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 3, damage: 0, element: null, buff: "defense",
      description: "You tuck into a swift dodge roll, increasing your evasion by 30% for 2 turns. Arrows and blades pass through empty air where you once stood.",
      requires: null,
      synergy: "High DEX characters benefit most since base evasion is already high.",
    },
    {
      id: "r_poison_shot", name: "Poison Shot", tier: 1, levelReq: 4, cost: 1,
      mp: 25, cooldown: 3, damage: 1.1, element: "poison",
      description: "You fire an arrow tipped with deadly venom for 110% poison damage. The toxin seeps into the wound, dealing damage over 3 turns.",
      requires: null,
      synergy: "poison_dmg % amplifies the DoT component each tick.",
    },
    {
      id: "r_fire_arrow", name: "Fire Arrow", tier: 1, levelReq: 6, cost: 2,
      mp: 32, cooldown: 3, damage: 1.4, element: "fire",
      description: "You loose a blazing arrow wreathed in flames for 140% fire damage. The shaft ignites on release, leaving a trail of embers.",
      requires: "r_quick_shot",
      synergy: "fire_dmg % adds directly to each arrow's damage.",
    },

    // ── Tier 2 ──
    {
      id: "r_triple_shot", name: "Triple Shot", tier: 2, levelReq: 10, cost: 2,
      mp: 38, cooldown: 3, damage: 1.6, element: "physical",
      description: "You fire three arrows in rapid succession for 160% damage each. Your fingers blur across the bowstring as arrows fill the air.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_frost_arrow", name: "Frost Arrow", tier: 2, levelReq: 11, cost: 2,
      mp: 42, cooldown: 4, damage: 1.5, element: "ice",
      description: "You release an arrow encased in ice for 150% ice damage. The frozen tip explodes on impact, spreading numbing cold through the target.",
      requires: "r_poison_shot",
      synergy: "ice_dmg builds open a slow/kite playstyle.",
    },
    {
      id: "r_multishot", name: "Multishot", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 2.2, element: "physical",
      description: "You unleash a volley of arrows in a wide spread for 220% damage. Every enemy in range takes a hit as arrows rain down.",
      requires: "r_triple_shot",
    },
    {
      id: "r_lightning_arrow", name: "Lightning Arrow", tier: 2, levelReq: 13, cost: 3,
      mp: 50, cooldown: 4, damage: 1.8, element: "lightning",
      description: "You fire a lightning-charged arrow that streaks across the sky for 180% lightning damage. The thunderous impact sends sparks flying.",
      requires: "r_fire_arrow",
      synergy: "lightning_dmg % makes chain attacks more powerful.",
    },

    // ── Tier 3 ──
    {
      id: "r_eagle_eye", name: "Eagle Eye", tier: 3, levelReq: 25, cost: 3,
      mp: 50, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You focus your vision with the precision of an eagle, boosting critical hit chance by 25% and accuracy for 3 turns. Nothing escapes your gaze.",
      requires: "r_frost_arrow",
      synergy: "High LUK + Eagle Eye = near-100% crit window.",
    },
    {
      id: "r_traps", name: "Lay Traps", tier: 3, levelReq: 28, cost: 3,
      mp: 60, cooldown: 5, damage: 1.8, element: "physical",
      description: "You scatter deadly traps across the battlefield for 180% damage. Enemies stumble into them, taking damage and becoming immobilized.",
      requires: "r_multishot",
    },
    {
      id: "r_sand_trap", name: "Sand Trap", tier: 3, levelReq: 27, cost: 3,
      mp: 58, cooldown: 5, damage: 1.6, element: "sand",
      description: "You set a cunning sand trap that erupts for 160% sand damage when triggered. The sand engulfs the enemy, slowing and blinding them.",
      requires: "r_lightning_arrow",
      synergy: "sand_dmg % amplifies this + the blind synergizes with evasion builds.",
    },
    {
      id: "r_arrow_rain", name: "Rain of Arrows", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 5, damage: 2.8, element: "physical",
      description: "You fire arrows high into the sky, raining them down for 280% damage. The barrage covers a wide area — there's nowhere to hide.",
      requires: "r_traps",
    },

    // ── Tier 4 ──
    {
      id: "r_hunters_mark", name: "Hunter's Mark", tier: 4, levelReq: 45, cost: 4,
      mp: 70, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You mark the target with a hunter's sigil, increasing all damage they take by 25% for 3 turns. The prey cannot escape the hunt.",
      requires: "r_eagle_eye",
    },
    {
      id: "r_blood_arrow", name: "Blood Arrow", tier: 4, levelReq: 47, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "blood",
      description: "You fire a crimson-tipped arrow for 250% blood damage. The arrow drinks the enemy's blood on impact, feeding you their life force.",
      requires: "r_sand_trap",
      synergy: "blood_dmg % stacks with the lifesteal component.",
    },
    {
      id: "r_volley", name: "Volley Barrage", tier: 4, levelReq: 50, cost: 5,
      mp: 115, cooldown: 5, damage: 3.8, element: "physical",
      description: "You fire a devastating volley of arrows for 380% damage. The sky darkens as countless shafts arc toward the enemy.",
      requires: "r_arrow_rain",
    },
    {
      id: "r_shadow_step", name: "Shadow Step", tier: 4, levelReq: 55, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "physical",
      description: "You vanish into the shadows and reappear behind the enemy for 250% damage. They never see the killing blow coming.",
      requires: "r_hunters_mark",
    },

    // ── Tier 5 ──
    {
      id: "r_death_arrow", name: "Death Arrow", tier: 5, levelReq: 70, cost: 5,
      mp: 150, cooldown: 6, damage: 5.0, element: "physical",
      description: "You loose the arrow of death itself for 500% damage. The black-feathered shaft flies true, carrying certain doom to its target.",
      requires: "r_hunters_mark",
    },
    {
      id: "r_storm_bow", name: "Storm Bow", tier: 5, levelReq: 75, cost: 6,
      mp: 170, cooldown: 6, damage: 4.5, element: "lightning",
      description: "You channel the power of a tempest through your bow for 450% lightning damage. Each arrow carries the fury of a thunderstorm.",
      requires: "r_volley",
      synergy: "lightning_dmg build here is the highest-damage ranger path.",
    },
    {
      id: "r_wrath_of_hunt", name: "Wrath of the Hunt", tier: 5, levelReq: 80, cost: 5,
      mp: 165, cooldown: 6, damage: 6.0, element: "physical",
      description: "You call upon the primal wrath of the hunt for 600% damage. Nature's fury manifests as a devastating rain of spectral arrows.",
      requires: "r_shadow_step",
    },

    // ── New Tier 2 fills ──
    {
      id: "r_nature_bond", name: "Nature's Bond", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "You forge a bond with nature, regenerating 15% HP over 3 turns. The forest's healing energy flows through your veins.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_explosive_arrow", name: "Explosive Arrow", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 4, damage: 2.0, element: "fire",
      description: "You fire an arrow packed with volatile compounds for 200% fire damage. The explosion on impact sends shrapnel in every direction.",
      requires: "r_fire_arrow",
      synergy: "fire_dmg % makes this a strong AoE option for fire ranger builds.",
    },

    // ── New Tier 3 fills ──
    {
      id: "r_wind_walk", name: "Wind Walk", tier: 3, levelReq: 26, cost: 3,
      mp: 55, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "You become one with the wind, boosting speed and evasion by 35% for 3 turns. You move like a breeze, untouchable and unseen.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_venom_rain", name: "Venom Rain", tier: 3, levelReq: 29, cost: 3,
      mp: 70, cooldown: 5, damage: 1.8, element: "poison",
      description: "You fire a volley of poison-tipped arrows for 180% poison damage. The toxic rain poisons everything it touches for 3 turns.",
      requires: "r_poison_shot",
      synergy: "poison_dmg % amplifies each tick. AoE poison build core skill.",
    },
    {
      id: "r_snipe", name: "Snipe", tier: 3, levelReq: 32, cost: 4,
      mp: 75, cooldown: 5, damage: 3.2, element: "physical",
      description: "You line up a perfect shot and fire for 320% damage with guaranteed critical hit. One shot, one kill. Patience rewarded.",
      requires: "r_triple_shot",
    },

    // ── New Tier 4 fills ──
    {
      id: "r_elemental_quiver", name: "Elemental Quiver", tier: 4, levelReq: 48, cost: 4,
      mp: 85, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You enchant your quiver with elemental energy, boosting all arrow damage by 30% for 4 turns. Every shot carries the power of the elements.",
      requires: "r_eagle_eye",
    },
    {
      id: "r_piercing_shot", name: "Piercing Shot", tier: 4, levelReq: 53, cost: 5,
      mp: 100, cooldown: 5, damage: 3.5, element: "physical",
      description: "You fire a shot with such force it punches through the enemy's defenses for 350% damage, ignoring 30% of their armor.",
      requires: "r_arrow_rain",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "r_spirit_of_the_wild", name: "Spirit of the Wild", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 0, element: null, buff: "attack",
      description: "You invoke the spirit of the wild, gaining 50% attack power and 25% crit chance for 4 turns. The primal beast within awakens.",
      requires: "r_wrath_of_hunt",
    },
    {
      id: "r_celestial_barrage", name: "Celestial Barrage", tier: 6, levelReq: 93, cost: 8,
      mp: 260, cooldown: 8, damage: 9.0, element: "lightning",
      description: "You unleash a barrage of starlight arrows for 900% damage. Each arrow glows with celestial energy as they rain down from the heavens.",
      requires: "r_storm_bow",
      synergy: "lightning_dmg build ranger's ultimate. Combine with Elemental Quiver.",
    },
    {
      id: "r_natures_wrath", name: "Nature's Wrath", tier: 6, levelReq: 95, cost: 7,
      mp: 220, cooldown: 7, damage: 7.5, element: "poison",
      description: "You channel nature's wrath through your bow for 750% poison damage. Thorns and vines erupt from the arrow, entangling the enemy.",
      requires: "r_death_arrow",
      synergy: "poison_dmg build ranger's endgame. Devastating sustained damage.",
    },

    // ── New Arcane skills ──
    {
      id: "r_arcane_arrow", name: "Arcane Arrow", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "arcane",
      description: "You fire an arrow infused with arcane energy for 130% arcane damage. The shaft phases through defenses, striking the enemy's essence.",
      requires: null,
      synergy: "Opens the mystic archer path. Pairs with Ethereal Volley.",
    },
    {
      id: "r_mystic_shot", name: "Mystic Shot", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 1.8, element: "arcane",
      description: "You loose a mystical arrow that bends through space for 180% arcane damage. The shot defies physics, curving to find its mark.",
      requires: "r_arcane_arrow",
    },
    {
      id: "r_ethereal_volley", name: "Ethereal Volley", tier: 3, levelReq: 31, cost: 4,
      mp: 82, cooldown: 5, damage: 2.5, element: "arcane",
      description: "You fire a volley of ethereal arrows for 250% arcane damage. The ghostly shafts pass through armor and strike the soul directly.",
      requires: "r_mystic_shot",
      synergy: "Core arcane ranger skill. Pairs with Astral Barrage for full arcane build.",
    },
    {
      id: "r_astral_barrage", name: "Astral Barrage", tier: 4, levelReq: 53, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "arcane",
      description: "You unleash a barrage of astral arrows for 350% arcane damage. Reality warps as each arrow tears through dimensional barriers.",
      requires: "r_ethereal_volley",
    },

    // ── New Ice skills ──
    {
      id: "r_frozen_shot", name: "Frozen Shot", tier: 3, levelReq: 28, cost: 3,
      mp: 72, cooldown: 5, damage: 2.0, element: "ice",
      description: "You fire an arrow of pure ice for 200% ice damage. The target's limbs go numb as frost spreads from the wound.",
      requires: "r_frost_arrow",
      synergy: "ice_dmg % adds. Pairs with Frost Arrow for ice kite build.",
    },
    {
      id: "r_glacial_rain", name: "Glacial Rain", tier: 4, levelReq: 51, cost: 5,
      mp: 115, cooldown: 5, damage: 3.0, element: "ice",
      description: "You rain frozen arrows from the sky for 300% ice damage. Ice crystals shatter on impact, covering the battlefield in frost.",
      requires: "r_frozen_shot",
    },
    {
      id: "r_absolute_winter", name: "Absolute Winter", tier: 5, levelReq: 74, cost: 6,
      mp: 170, cooldown: 6, damage: 5.0, element: "ice",
      description: "You call upon the heart of winter for 500% ice damage. A devastating blizzard of ice arrows freezes everything solid.",
      requires: "r_glacial_rain",
      synergy: "ice_dmg build ranger's endgame. Complete freeze + massive damage.",
    },

    // ── New Blood skills ──
    {
      id: "r_crimson_arrow", name: "Crimson Arrow", tier: 2, levelReq: 13, cost: 2,
      mp: 48, cooldown: 4, damage: 1.5, element: "blood",
      description: "You fire a blood-red arrow for 150% blood damage. The crimson shaft drinks deep, siphoning life force with each hit.",
      requires: null,
      synergy: "blood_dmg % amplifies DoT. Opens blood ranger path.",
    },
    {
      id: "r_hemorrhage_shot", name: "Hemorrhage Shot", tier: 3, levelReq: 29, cost: 3,
      mp: 75, cooldown: 5, damage: 2.2, element: "blood",
      description: "You strike a critical artery for 220% blood damage. The wound bleeds profusely, draining the enemy with each heartbeat.",
      requires: "r_crimson_arrow",
    },
    {
      id: "r_sanguine_barrage", name: "Sanguine Barrage", tier: 5, levelReq: 73, cost: 6,
      mp: 175, cooldown: 6, damage: 5.5, element: "blood",
      description: "You unleash a barrage of blood arrows for 550% blood damage. Each shaft feeds on the enemy's life, healing you in return.",
      requires: "r_blood_arrow",
      synergy: "blood_dmg build ranger's ultimate. Sustain + burst in one skill.",
    },

    // ── New Sand skills ──
    {
      id: "r_dust_devil_arrow", name: "Dust Devil Arrow", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 4, damage: 1.4, element: "sand",
      description: "You fire an arrow that conjures a dust devil for 140% sand damage. The spinning vortex engulfs the target, scouring them with sand.",
      requires: null,
    },
    {
      id: "r_sandstorm_volley", name: "Sandstorm Volley", tier: 4, levelReq: 49, cost: 4,
      mp: 108, cooldown: 5, damage: 2.8, element: "sand",
      description: "You fire a volley of sand-charged arrows for 280% sand damage. A miniature sandstorm erupts on impact, blinding and shredding.",
      requires: "r_sand_trap",
      synergy: "sand_dmg % stacks. Pairs with Sand Trap for full sand build.",
    },
    {
      id: "r_desert_judgment", name: "Desert Judgment", tier: 5, levelReq: 76, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "sand",
      description: "You deliver the judgment of the desert for 500% sand damage. Ancient desert spirits guide your arrows to punish the unworthy.",
      requires: "r_sandstorm_volley",
    },

    // ── New Fire fills ──
    {
      id: "r_inferno_rain", name: "Inferno Rain", tier: 3, levelReq: 30, cost: 4,
      mp: 80, cooldown: 5, damage: 2.5, element: "fire",
      description: "You rain fire arrows from the sky for 250% fire damage. The battlefield erupts in flames as each arrow ignites on impact.",
      requires: "r_explosive_arrow",
      synergy: "fire_dmg % amplifies both hit and burn. Core fire ranger skill.",
    },
    {
      id: "r_phoenix_arrow", name: "Phoenix Arrow", tier: 5, levelReq: 72, cost: 6,
      mp: 168, cooldown: 6, damage: 5.0, element: "fire",
      description: "You fire an arrow wreathed in phoenix fire for 500% fire damage. The mythical flames consume the enemy and cannot be extinguished.",
      requires: "r_inferno_rain",
    },

    // ── New Lightning fills ──
    {
      id: "r_thunderbolt_arrow", name: "Thunderbolt Arrow", tier: 4, levelReq: 52, cost: 5,
      mp: 118, cooldown: 5, damage: 3.2, element: "lightning",
      description: "You loose a thunderbolt arrow that cracks the sky for 320% lightning damage. The sonic boom alone staggers your enemy.",
      requires: "r_lightning_arrow",
      synergy: "lightning_dmg % makes chains devastating. Pairs with Storm Bow.",
    },
    // ── Gap fills: physical T6 ──
    {
      id: "r_apex_predator", name: "Apex Predator", tier: 6, levelReq: 92, cost: 7,
      mp: 220, cooldown: 7, damage: 8.0, element: "physical",
      description: "You become the apex predator of the battlefield for 800% damage. Your instincts sharpen, every shot finding vital points.",
      requires: null, synergy: "Critical hit rate doubled for the next attack.",
    },
    // ── Gap fills: fire T4, T6 ──
    {
      id: "r_blazing_volley", name: "Blazing Volley", tier: 4, levelReq: 50, cost: 5,
      mp: 105, cooldown: 5, damage: 3.0, element: "fire",
      description: "You unleash a volley of fire arrows for 300% fire damage. Each shaft trails flames, turning the sky into a cascade of fire.",
      requires: null, synergy: "Burning targets take bonus damage from subsequent arrows.",
    },
    {
      id: "r_phoenix_rain", name: "Phoenix Rain", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.0, element: "fire",
      description: "You rain phoenix-fire arrows from above for 700% fire damage. The immortal flames seek out enemies and burn eternally.",
      requires: "r_phoenix_arrow", synergy: "Enemies killed by fire have a chance to explode.",
    },
    // ── Gap fills: ice T1, T6 ──
    {
      id: "r_frost_tip", name: "Frost Tip", tier: 1, levelReq: 5, cost: 1,
      mp: 22, cooldown: 2, damage: 1.1, element: "ice",
      description: "You fire a frost-tipped arrow for 110% ice damage. The frozen point shatters on impact, sending ice shards into the wound.",
      requires: null, synergy: "Chilled enemies move and attack slower.",
    },
    {
      id: "r_arctic_oblivion", name: "Arctic Oblivion", tier: 6, levelReq: 93, cost: 8,
      mp: 225, cooldown: 7, damage: 8.0, element: "ice",
      description: "You call upon arctic oblivion for 800% ice damage. A frozen wasteland spreads from the impact, entombing enemies in ice.",
      requires: "r_absolute_winter", synergy: "Frozen enemies shatter for area damage.",
    },
    // ── Gap fills: lightning T1, T3 ──
    {
      id: "r_static_arrow", name: "Static Arrow", tier: 1, levelReq: 7, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "lightning",
      description: "You fire an electrically charged arrow for 120% lightning damage. Static arcs from the shaft, chaining to nearby enemies.",
      requires: null, synergy: "Shocked enemies have a chance to drop extra loot.",
    },
    {
      id: "r_storm_volley", name: "Storm Volley", tier: 3, levelReq: 28, cost: 3,
      mp: 68, cooldown: 4, damage: 2.0, element: "lightning",
      description: "You unleash a volley of storm arrows for 200% lightning damage. Thunder roars as each electrified arrow finds its mark.",
      requires: null, synergy: "Each arrow has independent stun chance.",
    },
    // ── Gap fills: poison T2, T4, T5 ──
    {
      id: "r_toxic_barb", name: "Toxic Barb", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 3, damage: 1.4, element: "poison",
      description: "You fire a barbed arrow dripping with toxin for 140% poison damage. The barbs lodge deep, steadily releasing poison.",
      requires: null, synergy: "Poison stacks with each consecutive hit.",
    },
    {
      id: "r_blight_arrow", name: "Blight Arrow", tier: 4, levelReq: 48, cost: 4,
      mp: 95, cooldown: 5, damage: 2.8, element: "poison",
      description: "You loose an arrow of pure blight for 280% poison damage. The corruption spreads from the wound, decaying flesh and spirit.",
      requires: null, synergy: "Blighted enemies take increasing damage over time.",
    },
    {
      id: "r_plague_rain", name: "Plague Rain", tier: 5, levelReq: 73, cost: 5,
      mp: 145, cooldown: 6, damage: 4.2, element: "poison",
      description: "You rain plague-carrying arrows for 420% poison damage. A pestilent cloud rises from each impact, infecting the battlefield.",
      requires: "r_blight_arrow", synergy: "Poison spreads to nearby enemies on target death.",
    },
    // ── Gap fills: blood T1, T6 ──
    {
      id: "r_bloodthorn_arrow", name: "Bloodthorn Arrow", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.2, element: "blood",
      description: "You fire a thorn-covered arrow that drinks blood for 120% blood damage. Living thorns burrow into the wound, siphoning life.",
      requires: null, synergy: "Leeches a small amount of health on hit.",
    },
    {
      id: "r_crimson_apocalypse", name: "Crimson Apocalypse", tier: 6, levelReq: 94, cost: 8,
      mp: 240, cooldown: 8, damage: 8.5, element: "blood",
      description: "You unleash a crimson apocalypse for 850% blood damage. A rain of blood arrows descends, draining the life from all enemies.",
      requires: "r_sanguine_barrage", synergy: "Each hit heals the ranger and increases blood damage.",
    },
    // ── Gap fills: sand T1, T6 ──
    {
      id: "r_desert_arrow", name: "Desert Arrow", tier: 1, levelReq: 5, cost: 1,
      mp: 25, cooldown: 2, damage: 1.0, element: "sand",
      description: "You fire a sand-infused arrow for 100% sand damage. The shaft dissolves on impact, releasing a burst of scouring sand.",
      requires: null, synergy: "Blinded enemies have reduced hit chance.",
    },
    {
      id: "r_sirocco_storm", name: "Sirocco Storm", tier: 6, levelReq: 92, cost: 7,
      mp: 215, cooldown: 7, damage: 7.5, element: "sand",
      description: "You summon the scorching sirocco wind for 750% sand damage. The hot desert wind carries arrows of sand that flay everything.",
      requires: "r_desert_judgment", synergy: "Sand-slowed enemies cannot evade attacks.",
    },
    // ── Gap fills: arcane T5, T6 ──
    {
      id: "r_cosmic_shot", name: "Cosmic Shot", tier: 5, levelReq: 75, cost: 6,
      mp: 155, cooldown: 6, damage: 4.5, element: "arcane",
      description: "You fire an arrow charged with cosmic energy for 450% arcane damage. The shot bends space-time, striking with reality-warping force.",
      requires: "r_astral_barrage", synergy: "Arcane arrows ignore a portion of enemy resistance.",
    },
    {
      id: "r_void_hunter", name: "Void Hunter's Barrage", tier: 6, levelReq: 93, cost: 8,
      mp: 250, cooldown: 8, damage: 9.0, element: "arcane",
      description: "You hunt through the void itself for 900% arcane damage. Your arrows phase between dimensions, impossible to dodge or deflect.",
      requires: "r_cosmic_shot", synergy: "Attacks from the void cannot be blocked or dodged.",
    },

    // ── Support skills ──
    {
      id: "r_natures_touch", name: "Nature's Touch", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.18,
      description: "The gentle touch of nature heals your wounds, restoring 20% HP over 3 turns. Leaves and flowers bloom around you as life energy flows in.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "r_focused_aim", name: "Focused Aim", tier: 3, levelReq: 28, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      buffEffect: { crit_pct: 25, atk_pct: 20 }, buffDuration: 3,
      description: "You enter a state of absolute focus, boosting accuracy and critical damage by 30% for 3 turns. Time slows as your aim becomes perfect.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "r_meditate", name: "Meditate", tier: 2, levelReq: 14, cost: 2,
      mp: 15, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.25,
      description: "You clear your mind in deep meditation, restoring 25% MP and boosting evasion by 20% for 2 turns. Inner peace sharpens your reflexes.",
      requires: null,
    },
    {
      id: "r_pack_leader", name: "Pack Leader", tier: 4, levelReq: 50, cost: 4,
      mp: 75, cooldown: 7, damage: 0, element: null,
      special: "group_heal", healPct: 0.15,
      buffEffect: { atk_pct: 15, crit_pct: 10 }, buffDuration: 3,
      description: "You rally your companions as pack leader, boosting the party's attack and speed for 3 turns. Your leadership inspires everyone to fight harder.",
      requires: "r_natures_touch",
    },

  ],

  rogue: [
    // ── Tier 1 ──
    {
      id: "ro_quick_slash", name: "Quick Slash", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.3, element: "physical",
      description: "You dart forward with blinding speed, slicing the enemy for 130% damage before they can react. In and out, like a shadow.",
      requires: null,
    },
    {
      id: "ro_smoke_bomb", name: "Smoke Bomb", tier: 1, levelReq: 1, cost: 1,
      mp: 25, cooldown: 3, damage: 0, element: null, buff: "defense",
      description: "You hurl a smoke bomb at your feet, vanishing in a cloud of acrid smoke. Your evasion soars by 40% for 2 turns as enemies swing at nothing.",
      requires: null,
    },
    {
      id: "ro_poison_blade", name: "Poison Blade", tier: 1, levelReq: 4, cost: 1,
      mp: 28, cooldown: 3, damage: 1.1, element: "poison",
      description: "You coat your blade in lethal venom and slash for 110% poison damage. The toxin works fast, burning through the enemy's veins.",
      requires: null,
      synergy: "poison_dmg % amplifies every DoT tick. Stack poison items for max DoT.",
    },
    {
      id: "ro_backstab", name: "Backstab", tier: 1, levelReq: 5, cost: 2,
      mp: 32, cooldown: 3, damage: 2.0, element: "physical",
      description: "You slip behind the enemy and drive your blade into their spine for 200% damage. The unseen strike deals devastating critical damage.",
      requires: "ro_quick_slash",
      synergy: "LUK amplifies crit multiplier. Best opener in any rotation.",
    },

    // ── Tier 2 ──
    {
      id: "ro_open_wounds", name: "Open Wounds", tier: 2, levelReq: 10, cost: 2,
      mp: 38, cooldown: 4, damage: 1.4, element: "blood",
      description: "You carve deep, bleeding gashes for 140% blood damage. The wounds refuse to close, steadily draining the enemy's strength.",
      requires: "ro_smoke_bomb",
      synergy: "blood_dmg % amplifies each DoT tick. Stacks with Open Wounds + Blood Frenzy.",
    },
    {
      id: "ro_pickpocket", name: "Pickpocket", tier: 2, levelReq: 12, cost: 2,
      mp: 28, cooldown: 4, damage: 1.0, element: "physical", special: "pickpocket",
      description: "You strike with sleight of hand for 100% damage, stealing the enemy's buffs and resources. What's theirs is now yours.",
      requires: null,
      synergy: "High LUK = more gold stolen per use.",
    },
    {
      id: "ro_frost_strike", name: "Frost Strike", tier: 2, levelReq: 11, cost: 2,
      mp: 38, cooldown: 3, damage: 1.5, element: "ice",
      description: "You strike with an ice-cold blade for 150% ice damage. The freezing edge numbs the wound, slowing the enemy's reactions.",
      requires: "ro_poison_blade",
      synergy: "ice_dmg % + slow enables safe followup turns.",
    },
    {
      id: "ro_lightning_step", name: "Lightning Step", tier: 2, levelReq: 14, cost: 3,
      mp: 45, cooldown: 4, damage: 1.6, element: "lightning",
      description: "You teleport in a flash of lightning and strike for 160% lightning damage. The enemy sees only a blur before the blade connects.",
      requires: "ro_backstab",
      synergy: "lightning_dmg % boosts damage. Good mobility opener.",
    },

    // ── Tier 3 ──
    {
      id: "ro_blade_dance", name: "Blade Dance", tier: 3, levelReq: 25, cost: 3,
      mp: 65, cooldown: 4, damage: 2.2, element: "physical",
      description: "You spin into a mesmerizing dance of flashing blades for 220% damage. Every step is lethal, every movement a killing stroke.",
      requires: "ro_open_wounds",
    },
    {
      id: "ro_garrote", name: "Garrote", tier: 3, levelReq: 28, cost: 3,
      mp: 62, cooldown: 5, damage: 1.8, element: "blood",
      description: "You wrap a wire around the enemy's throat for 180% damage. They choke and gasp, silenced and unable to cast spells for 2 turns.",
      requires: "ro_pickpocket",
      synergy: "blood_dmg % makes garrote a strong utility+damage combo.",
    },
    {
      id: "ro_sand_blind", name: "Sand Blind", tier: 3, levelReq: 27, cost: 3,
      mp: 55, cooldown: 5, damage: 1.2, element: "sand",
      description: "You fling a handful of sand into the enemy's eyes for 120% sand damage. Blinded and disoriented, they can't see your next attack coming.",
      requires: "ro_frost_strike",
      synergy: "sand_dmg % amplifies. Combined with evasion = near-untouchable turns.",
    },
    {
      id: "ro_shadow_strike", name: "Shadow Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 4, damage: 2.8, element: "physical",
      description: "You emerge from the shadows with a devastating strike for 280% damage. The enemy never sees the blade that cuts them down.",
      requires: "ro_lightning_step",
    },

    // ── Tier 4 ──
    {
      id: "ro_blood_frenzy", name: "Blood Frenzy", tier: 4, levelReq: 45, cost: 4,
      mp: 95, cooldown: 5, damage: 2.5, element: "blood",
      description: "You enter a blood-crazed frenzy, slashing wildly for 250% blood damage. Each cut feeds your hunger as you drain their life force.",
      requires: "ro_blade_dance",
      synergy: "blood_dmg % is fully applied per hit. Combine with Open Wounds DoT.",
    },
    {
      id: "ro_death_mark", name: "Death Mark", tier: 4, levelReq: 45, cost: 4,
      mp: 88, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You mark the enemy for death, increasing all damage they take by 30% for 3 turns. The condemned cannot escape their fate.",
      requires: "ro_garrote",
    },
    {
      id: "ro_assassinate", name: "Assassinate", tier: 4, levelReq: 50, cost: 5,
      mp: 120, cooldown: 5, damage: 4.0, element: "physical",
      description: "You execute a perfect assassination for 400% damage. One clean strike to the vital point — swift, silent, and lethal.",
      requires: "ro_shadow_strike",
    },
    {
      id: "ro_shadow_realm_entry", name: "Shadow Walk", tier: 4, levelReq: 55, cost: 4,
      mp: 105, cooldown: 5, damage: 0, element: null, buff: "defense",
      description: "You step into the shadow realm, becoming completely invisible for 3 turns. Your next attack from stealth deals double damage.",
      requires: "ro_sand_blind",
    },

    // ── Tier 5 ──
    {
      id: "ro_oblivion", name: "Oblivion Blade", tier: 5, levelReq: 70, cost: 5,
      mp: 165, cooldown: 6, damage: 5.5, element: "physical",
      description: "You erase the enemy from existence for 550% damage. A single perfect strike that unmakes everything it touches. There is only the void.",
      requires: "ro_blood_frenzy",
    },
    {
      id: "ro_phantom", name: "Phantom Rogue", tier: 5, levelReq: 75, cost: 5,
      mp: 155, cooldown: 6, damage: 0, element: null, buff: "defense",
      description: "You become a phantom, intangible and untouchable for 2 turns. You gain 50% evasion and your attacks ignore enemy defenses.",
      requires: "ro_shadow_realm_entry",
    },
    {
      id: "ro_reaper", name: "Soul Reaper", tier: 5, levelReq: 80, cost: 6,
      mp: 195, cooldown: 6, damage: 7.0, element: "blood",
      description: "You become the reaper of souls, striking for 700% damage. The scythe falls and the enemy's life is forfeit. Death claims what is owed.",
      requires: "ro_assassinate",
      synergy: "blood_dmg build makes this the single highest damage skill in the game.",
    },

    // ── New Tier 2 fills ──
    {
      id: "ro_dual_strike", name: "Dual Strike", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 3, damage: 1.8, element: "physical",
      description: "You attack with both blades simultaneously for 180% damage. The twin slashes catch the enemy in a deadly cross-cut.",
      requires: "ro_backstab",
    },
    {
      id: "ro_venomous_fan", name: "Venomous Fan", tier: 2, levelReq: 13, cost: 2,
      mp: 42, cooldown: 4, damage: 1.3, element: "poison",
      description: "You throw a fan of poisoned throwing knives for 130% poison damage. Each blade carries a different toxin — all of them lethal.",
      requires: "ro_poison_blade",
      synergy: "poison_dmg % amplifies. Pairs with Poison Blade for max DoT stacking.",
    },

    // ── New Tier 3 fills ──
    {
      id: "ro_shadowmeld", name: "Shadowmeld", tier: 3, levelReq: 27, cost: 3,
      mp: 55, cooldown: 4, damage: 0, element: null, buff: "defense",
      description: "You meld with the shadows, gaining 35% evasion and stealth for 3 turns. You're invisible to the naked eye, waiting for the perfect moment.",
      requires: "ro_smoke_bomb",
    },
    {
      id: "ro_cheap_shot", name: "Cheap Shot", tier: 3, levelReq: 29, cost: 3,
      mp: 50, cooldown: 4, damage: 2.0, element: "physical",
      description: "You strike a dirty blow to the enemy's weak point for 200% damage. No honor, only results. The stunned enemy can't retaliate.",
      requires: "ro_backstab",
    },
    {
      id: "ro_viper_strike", name: "Viper Strike", tier: 3, levelReq: 31, cost: 3,
      mp: 65, cooldown: 4, damage: 2.0, element: "poison",
      description: "You strike like a viper for 200% poison damage. The lightning-fast bite delivers a potent neurotoxin that paralyzes the victim.",
      requires: "ro_venomous_fan",
      synergy: "poison_dmg stacks. Speed buff enables devastating follow-ups.",
    },

    // ── New Tier 4 fills ──
    {
      id: "ro_mark_of_shadows", name: "Mark of Shadows", tier: 4, levelReq: 49, cost: 4,
      mp: 80, cooldown: 5, damage: 0, element: null, buff: "attack",
      description: "You place the mark of shadows on the enemy, making them vulnerable to all dark attacks. Damage from stealth is doubled for 3 turns.",
      requires: "ro_death_mark",
    },
    {
      id: "ro_executioner", name: "Executioner's Edge", tier: 4, levelReq: 56, cost: 5,
      mp: 110, cooldown: 5, damage: 3.5, element: "physical",
      description: "You deliver the executioner's final judgment for 350% damage. The blade falls with clinical precision — the sentence is death.",
      requires: "ro_assassinate",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "ro_void_dancer", name: "Void Dancer", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 0, element: null, buff: "attack",
      description: "You dance between dimensions for 3 turns, gaining 40% evasion and phasing through attacks. Your movements are hypnotic and impossible to track.",
      requires: "ro_phantom",
    },
    {
      id: "ro_deaths_embrace", name: "Death's Embrace", tier: 6, levelReq: 93, cost: 8,
      mp: 250, cooldown: 8, damage: 10.0, element: "blood",
      description: "You embrace the enemy in a grip of death for 1000% blood damage. The cold touch drains their warmth and life with each passing moment.",
      requires: "ro_reaper",
      synergy: "blood_dmg build's ultimate payoff. Highest single-hit in the game.",
    },
    {
      id: "ro_thousand_cuts", name: "Thousand Cuts", tier: 6, levelReq: 95, cost: 7,
      mp: 230, cooldown: 7, damage: 8.0, element: "physical",
      description: "You unleash a whirlwind of a thousand cuts for 800% damage. Each tiny slash bleeds, and together they are utterly devastating.",
      requires: "ro_oblivion",
    },

    // ── New Fire skills ──
    {
      id: "ro_flame_dagger", name: "Flame Dagger", tier: 1, levelReq: 6, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "fire",
      description: "You hurl a dagger wreathed in flames for 130% fire damage. The blade burns on impact, leaving a searing wound that won't stop smoking.",
      requires: null,
      synergy: "fire_dmg % adds to each throw. Opens fire rogue path.",
    },
    {
      id: "ro_ignition_strike", name: "Ignition Strike", tier: 2, levelReq: 13, cost: 3,
      mp: 48, cooldown: 4, damage: 1.6, element: "fire",
      description: "You ignite your blades and slash through the enemy for 160% fire damage. Sparks fly as steel meets flesh in a burst of fire.",
      requires: "ro_flame_dagger",
      synergy: "fire_dmg % boosts both hit and burn. Pairs with Infernal Dance.",
    },
    {
      id: "ro_infernal_dance", name: "Infernal Dance", tier: 3, levelReq: 29, cost: 4,
      mp: 72, cooldown: 5, damage: 2.2, element: "fire",
      description: "You dance through hellfire for 220% fire damage. Every step leaves a trail of flames, every spin a whirlwind of infernal destruction.",
      requires: "ro_ignition_strike",
      synergy: "fire_dmg stacks. Speed buff enables devastating follow-ups.",
    },
    {
      id: "ro_phoenix_slash", name: "Phoenix Slash", tier: 4, levelReq: 51, cost: 5,
      mp: 115, cooldown: 5, damage: 3.0, element: "fire",
      description: "You slash with a blade reborn in phoenix fire for 300% fire damage. The immortal flames consume the enemy and cannot be quenched.",
      requires: "ro_infernal_dance",
      synergy: "fire_dmg build rogue's core nuke. Fire + sustain combo.",
    },

    // ── New Arcane skills ──
    {
      id: "ro_void_strike", name: "Void Strike", tier: 1, levelReq: 7, cost: 2,
      mp: 38, cooldown: 3, damage: 1.2, element: "arcane",
      description: "You strike through the void for 120% arcane damage. Your blade phases between dimensions, bypassing all physical defenses.",
      requires: null,
    },
    {
      id: "ro_phase_shift", name: "Phase Shift", tier: 2, levelReq: 15, cost: 3,
      mp: 50, cooldown: 4, damage: 1.5, element: "arcane",
      description: "You phase-shift between realities for 2 turns, gaining 45% evasion. Attacks pass through your ghostly form as you exist between worlds.",
      requires: "ro_void_strike",
      synergy: "Opens the void rogue path. Pairs with Dimensional Slash.",
    },
    {
      id: "ro_dimensional_slash", name: "Dimensional Slash", tier: 3, levelReq: 31, cost: 4,
      mp: 78, cooldown: 5, damage: 2.5, element: "arcane",
      description: "You cut through dimensions for 250% arcane damage. The slash opens a rift in space, pulling the enemy into the void.",
      requires: "ro_phase_shift",
    },
    {
      id: "ro_reality_rend", name: "Reality Rend", tier: 4, levelReq: 53, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "arcane",
      description: "You tear a gash in the fabric of reality for 350% arcane damage. The wound in space-time deals devastating damage to everything nearby.",
      requires: "ro_dimensional_slash",
      synergy: "The arcane rogue's ultimate burst. Ignores all defenses.",
    },

    // ── New Ice fills ──
    {
      id: "ro_frozen_blade", name: "Frozen Blade", tier: 3, levelReq: 28, cost: 3,
      mp: 68, cooldown: 5, damage: 2.0, element: "ice",
      description: "You slash with a blade of pure ice for 200% ice damage. The frozen edge shatters on impact, embedding razor-sharp ice shards deep.",
      requires: "ro_frost_strike",
      synergy: "ice_dmg % adds. Pairs with Frost Strike for ice assassination build.",
    },
    {
      id: "ro_glacial_ambush", name: "Glacial Ambush", tier: 4, levelReq: 50, cost: 5,
      mp: 112, cooldown: 5, damage: 3.0, element: "ice",
      description: "You ambush from a frozen mist for 300% ice damage. The enemy's blood freezes in their veins as your icy blade finds its mark.",
      requires: "ro_frozen_blade",
    },
    {
      id: "ro_absolute_chill", name: "Absolute Chill", tier: 5, levelReq: 73, cost: 6,
      mp: 170, cooldown: 6, damage: 5.0, element: "ice",
      description: "You radiate absolute cold for 500% ice damage. The temperature drops to nothing — movement slows, breath freezes, life fades.",
      requires: "ro_glacial_ambush",
      synergy: "ice_dmg build rogue's endgame. Total lockdown + assassination damage.",
    },

    // ── New Lightning fills ──
    {
      id: "ro_thunder_strike", name: "Thunder Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 72, cooldown: 4, damage: 2.2, element: "lightning",
      description: "You strike with the speed of thunder for 220% lightning damage. The sonic crack arrives before the pain, and by then it's too late.",
      requires: "ro_lightning_step",
      synergy: "lightning_dmg % stacks. Speed buff enables rapid combos.",
    },
    {
      id: "ro_voltaic_rush", name: "Voltaic Rush", tier: 4, levelReq: 52, cost: 5,
      mp: 118, cooldown: 5, damage: 3.2, element: "lightning",
      description: "You rush forward in a surge of electricity for 320% lightning damage. Lightning trails behind you as you slash through the enemy.",
      requires: "ro_thunder_strike",
    },
    {
      id: "ro_storm_blade", name: "Storm Blade", tier: 5, levelReq: 74, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "lightning",
      description: "You channel a storm through your blade for 500% lightning damage. Each swing crackles with electricity, and sparks arc to nearby foes.",
      requires: "ro_voltaic_rush",
      synergy: "lightning_dmg build rogue's ultimate. Stun-lock + burst damage.",
    },

    // ── New Sand fills ──
    {
      id: "ro_dust_shroud", name: "Dust Shroud", tier: 3, levelReq: 26, cost: 3,
      mp: 60, cooldown: 5, damage: 1.5, element: "sand",
      description: "You cloak yourself in swirling sand and strike for 150% sand damage. They can't see you anymore, granting 40% evasion for 2 turns.",
      requires: "ro_sand_blind",
      synergy: "sand_dmg % adds. Pairs with Sand Blind for desert assassin build.",
    },
    {
      id: "ro_sandstorm_slash", name: "Sandstorm Slash", tier: 4, levelReq: 48, cost: 4,
      mp: 105, cooldown: 5, damage: 2.8, element: "sand",
      description: "You slash through a blinding sandstorm for 280% sand damage. The scouring winds amplify your blade, tearing flesh and spirit alike.",
      requires: "ro_dust_shroud",
    },
    {
      id: "ro_desert_phantom", name: "Desert Phantom", tier: 5, levelReq: 75, cost: 6,
      mp: 165, cooldown: 6, damage: 4.5, element: "sand",
      description: "You become a phantom of the desert for 450% sand damage. A mirage and a blade — the enemy can't tell which is real until it's too late.",
      requires: "ro_sandstorm_slash",
      synergy: "sand_dmg build rogue's endgame. Near-untouchable + strong damage.",
    },

    // ── New Poison fills ──
    {
      id: "ro_neurotoxin", name: "Neurotoxin", tier: 4, levelReq: 49, cost: 4,
      mp: 105, cooldown: 5, damage: 2.8, element: "poison",
      description: "You inject a potent neurotoxin for 280% poison damage. The victim's nervous system shuts down as paralysis creeps through their body.",
      requires: "ro_viper_strike",
      synergy: "poison_dmg % stacks with speed reduction. Devastating control.",
    },
    {
      id: "ro_plague_blade", name: "Plague Blade", tier: 5, levelReq: 72, cost: 6,
      mp: 168, cooldown: 6, damage: 4.5, element: "poison",
      description: "You slash with a plague-infected blade for 450% poison damage. The disease festers and spreads, weakening the enemy with every heartbeat.",
      requires: "ro_neurotoxin",
      synergy: "poison_dmg build rogue's endgame. Highest sustained DoT in the game.",
    },
    // ── Gap fills: fire T5, T6 ──
    {
      id: "ro_hellfire_dance", name: "Hellfire Dance", tier: 5, levelReq: 73, cost: 6,
      mp: 150, cooldown: 6, damage: 4.5, element: "fire",
      description: "You dance through hellfire for 450% fire damage. Each pirouette leaves a ring of demonic flame that incinerates anything nearby.",
      requires: "ro_phoenix_slash", synergy: "Burning enemies take critical hits more often.",
    },
    {
      id: "ro_inferno_reaper", name: "Inferno Reaper", tier: 6, levelReq: 92, cost: 7,
      mp: 210, cooldown: 7, damage: 7.5, element: "fire",
      description: "You reap through infernal flames for 750% fire damage. Fire and shadow merge as you become death wreathed in flame.",
      requires: "ro_hellfire_dance", synergy: "Ignited enemies cannot heal or use potions.",
    },
    // ── Gap fills: ice T1, T6 ──
    {
      id: "ro_frostbite_slash", name: "Frostbite Slash", tier: 1, levelReq: 5, cost: 1,
      mp: 22, cooldown: 2, damage: 1.1, element: "ice",
      description: "You slash with a blade of pure frostbite for 110% ice damage. The cold bites deep, numbing flesh and slowing the enemy to a crawl.",
      requires: null, synergy: "Frostbitten enemies have reduced attack speed.",
    },
    {
      id: "ro_glacial_executioner", name: "Glacial Executioner", tier: 6, levelReq: 93, cost: 8,
      mp: 225, cooldown: 7, damage: 8.0, element: "ice",
      description: "You execute with the precision of glacial ice for 800% ice damage. The frozen blade shatters inside the wound, ending them absolutely.",
      requires: "ro_absolute_chill", synergy: "Instantly kills frozen enemies below 15% health.",
    },
    // ── Gap fills: lightning T1, T6 ──
    {
      id: "ro_spark_dagger", name: "Spark Dagger", tier: 1, levelReq: 7, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "lightning",
      description: "You throw an electrically charged dagger for 120% lightning damage. The crackling blade shocks on impact, stunning the nervous system.",
      requires: null, synergy: "Shocked enemies flinch, interrupting their actions.",
    },
    {
      id: "ro_tempest_assassin", name: "Tempest Assassin", tier: 6, levelReq: 94, cost: 8,
      mp: 235, cooldown: 7, damage: 8.5, element: "lightning",
      description: "You assassinate with the fury of a tempest for 850% lightning damage. Thunder masks your approach, lightning guides your blade.",
      requires: "ro_storm_blade", synergy: "Each teleport strike increases the next hit's damage.",
    },
    // ── Gap fills: poison T6 ──
    {
      id: "ro_death_blossom", name: "Death Blossom", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.0, element: "poison",
      description: "You spin into a deadly blossom of blades for 700% poison damage. Poisoned petals of steel bloom around you, cutting everything they touch.",
      requires: "ro_plague_blade", synergy: "Poison damage becomes true damage against fully stacked targets.",
    },
    // ── Gap fills: blood T1 ──
    {
      id: "ro_blood_nick", name: "Blood Nick", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.2, element: "blood",
      description: "You nick a vital artery with surgical precision for 120% blood damage. A tiny cut that bleeds endlessly — death by a thousand drops.",
      requires: null, synergy: "Bleeding enemies leave blood trails that boost rogue damage.",
    },
    // ── Gap fills: sand T1, T2, T6 ──
    {
      id: "ro_sand_toss", name: "Sand Toss", tier: 1, levelReq: 5, cost: 1,
      mp: 20, cooldown: 2, damage: 1.0, element: "sand",
      description: "You toss a cloud of blinding sand for 100% sand damage. The grit stings their eyes as you prepare your real attack from the shadows.",
      requires: null, synergy: "Blinded targets cannot counter-attack.",
    },
    {
      id: "ro_dune_ambush", name: "Dune Ambush", tier: 2, levelReq: 12, cost: 2,
      mp: 42, cooldown: 3, damage: 1.5, element: "sand",
      description: "You burst from the sand dunes in a surprise ambush for 150% sand damage. They never saw it coming — you were part of the desert.",
      requires: null, synergy: "Ambush attacks always critically hit slowed targets.",
    },
    {
      id: "ro_tomb_wraith", name: "Tomb Wraith", tier: 6, levelReq: 92, cost: 7,
      mp: 205, cooldown: 7, damage: 7.0, element: "sand",
      description: "You manifest as a tomb wraith for 700% sand damage. The ancient spirit of the desert fills you with otherworldly power.",
      requires: "ro_desert_phantom", synergy: "Cannot be targeted while phasing between attacks.",
    },
    // ── Gap fills: arcane T5, T6 ──
    {
      id: "ro_astral_blade", name: "Astral Blade", tier: 5, levelReq: 74, cost: 6,
      mp: 155, cooldown: 6, damage: 4.8, element: "arcane",
      description: "You summon a blade from the astral plane for 480% arcane damage. The ethereal weapon cuts through both body and soul.",
      requires: "ro_reality_rend", synergy: "Arcane strikes weaken the target's resistance to all elements.",
    },
    {
      id: "ro_cosmic_erasure", name: "Cosmic Erasure", tier: 6, levelReq: 95, cost: 8,
      mp: 250, cooldown: 8, damage: 9.0, element: "arcane",
      description: "You erase the enemy from cosmic existence for 900% arcane damage. Reality rewrites itself as if they never existed.",
      requires: "ro_astral_blade", synergy: "Erased targets cannot resurrect or respawn.",
    },

    // ── Support skills ──
    {
      id: "ro_shadow_mend", name: "Shadow Mend", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.15,
      description: "The shadows themselves stitch your wounds closed, restoring 20% HP over 3 turns. Darkness heals what light cannot reach.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "ro_shadow_cloak", name: "Shadow Cloak", tier: 3, levelReq: 28, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.20,
      description: "You wrap yourself in a cloak of living shadow, gaining 30% evasion and stealth for 3 turns. Even the keenest eyes cannot find you.",
      requires: "ro_shadow_mend", statScale: "dexterity",
    },
    {
      id: "ro_adrenaline_rush", name: "Adrenaline Rush", tier: 3, levelReq: 30, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 30, crit_pct: 20, atk_speed: 15 }, buffDuration: 3,
      description: "Pure adrenaline floods your veins, boosting attack speed by 30% and critical chance by 20% for 3 turns. Time seems to slow around you.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "ro_siphon_energy", name: "Siphon Energy", tier: 2, levelReq: 14, cost: 2,
      mp: 10, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.25,
      description: "You siphon magical energy from the enemy, restoring 20% of your MP and weakening their next spell. Their loss is your gain.",
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