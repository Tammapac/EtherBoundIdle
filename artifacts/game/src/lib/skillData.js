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
  m_flame_wall: "flamewall",    m_time_warp: "timewarp",      m_meteor: "meteor",
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
      description: "You swing your weapon with disciplined force, striking the enemy for 130% weapon damage. The blow lands with practiced precision, exploiting weak points in their defense. Your raw strength makes every swing count — the stronger you are, the more devastating each hit becomes.",
      requires: null,
      synergy: "High STR increases damage significantly.",
    },
    {
      id: "w_shield_block", name: "Shield Block", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 3, damage: 0, element: null, buff: "defense",
      buffEffect: { def_pct: 25 }, buffDuration: 2,
      description: "You raise your shield and brace for impact, reducing all incoming damage by 25% for 2 turns. Your feet dig into the ground as you absorb blow after blow without flinching. The tougher you are, the more punishment your shield absorbs — a true wall of steel.",
      requires: null,
      synergy: "High VIT amplifies the damage reduction bonus.",
    },
    {
      id: "w_power_strike", name: "Power Strike", tier: 1, levelReq: 5, cost: 2,
      mp: 32, cooldown: 3, damage: 1.8, element: "physical",
      description: "You channel all your might into a single devastating blow, crushing the enemy for 180% weapon damage. Your muscles tense as you wind up, then release with explosive force that sends shockwaves through the battlefield. Raw strength fuels this punishing attack.",
      requires: "w_basic_strike",
    },
    {
      id: "w_flame_slash", name: "Flame Slash", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.5, element: "fire",
      description: "Your blade ignites with searing flames as you slash through the enemy for 150% fire damage. The heat is so intense that the air shimmers and crackles around your weapon. The hotter your fire affinity burns, the deeper and more agonizing the wound becomes.",
      requires: null,
      synergy: "Each % of fire_dmg adds to this skill's damage.",
    },

    // ── Tier 2 – Journeyman (Lv 10+) ────────────────────────────────────────
    {
      id: "w_shield_bash", name: "Shield Bash", tier: 2, levelReq: 10, cost: 2,
      mp: 42, cooldown: 4, damage: 1.5, element: "physical",
      description: "You slam your heavy shield directly into the enemy's face for 150% damage, stunning them senseless. The brutal impact echoes across the battlefield as they stagger backward, dazed and unable to retaliate. Both your strength and toughness fuel this devastating blow.",
      requires: "w_shield_block",
    },
    {
      id: "w_war_cry", name: "War Cry", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { atk_pct: 30 }, buffDuration: 3,
      description: "You let out a thundering war cry that echoes across the entire battlefield, boosting your attack power by 30% for 3 turns. Your voice carries the fury of a thousand warriors, sending fear into your enemies and courage into your allies. All your strikes hit significantly harder while the adrenaline lasts.",
      requires: null,
      synergy: "Stack with Flame Slash or Power Strike for burst turns.",
    },
    {
      id: "w_rage", name: "Berserker Rage", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 5, damage: 2.2, element: "physical",
      description: "You enter a frenzied rage, your vision turning red as fury takes over. You tear into the enemy for 220% damage, ignoring their defenses completely. Pain means nothing, fear means nothing — only the overwhelming urge to destroy everything in your path remains.",
      requires: "w_power_strike",
    },
    {
      id: "w_blood_rage", name: "Blood Rage", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 4, damage: 1.7, element: "blood",
      description: "You slash with frenzied bloodlust for 170% blood damage, your blade drinking the enemy's life force with every cut. Dark crimson energy swirls around your weapon as you heal for 5% of the damage dealt. The more blood magic you command, the stronger both the strike and the lifesteal become.",
      requires: "w_flame_slash",
      synergy: "blood_dmg % amplifies both the hit and the lifesteal.",
    },

    // ── Tier 3 – Expert (Lv 25+) ─────────────────────────────────────────────
    {
      id: "w_whirlwind", name: "Whirlwind", tier: 3, levelReq: 25, cost: 3,
      mp: 65, cooldown: 4, damage: 1.7, element: "physical",
      description: "You spin like a tornado of razor-sharp steel, slashing everything around you for 170% damage. Each revolution builds momentum, your blade cutting through armor and flesh alike. The stronger you are, the more devastating each revolution becomes — a relentless storm of destruction.",
      requires: "w_shield_bash",
    },
    {
      id: "w_taunt", name: "Taunt", tier: 3, levelReq: 28, cost: 3,
      mp: 45, cooldown: 5, damage: 0, element: null, buff: "defense",
      buffEffect: { def_pct: 20 }, buffDuration: 2,
      description: "You roar a challenge so fierce that the enemy has no choice but to focus entirely on you. Your allies take 20% less damage for 2 turns as you draw all aggression toward yourself. Your resilience makes you an unmovable wall — the enemy hits you, but you don't fall.",
      requires: "w_war_cry",
      synergy: "Combine with Bulwark Stance for extreme tanking.",
    },
    {
      id: "w_ground_slam", name: "Ground Slam", tier: 3, levelReq: 30, cost: 4,
      mp: 75, cooldown: 5, damage: 2.5, element: "physical",
      description: "You bring your weapon crashing into the earth with titanic force, sending devastating shockwaves that deal 250% damage and stun the enemy for 1 turn. The ground cracks and splinters beneath the impact, and dust billows outward as the tremor knocks your foe off their feet.",
      requires: "w_rage",
    },
    {
      id: "w_thunder_strike", name: "Thunder Strike", tier: 3, levelReq: 32, cost: 4,
      mp: 70, cooldown: 5, damage: 2.0, element: "lightning",
      description: "Lightning surges through your blade as you call down the fury of the storm, striking for 200% lightning damage. The air crackles with electricity as thunder booms on impact, sending arcs of energy cascading through the enemy's body. Each lightning strike grows more powerful with your affinity.",
      requires: "w_blood_rage",
      synergy: "lightning_dmg % stacks multiplicatively with STR scaling.",
    },

    // ── Tier 4 – Master (Lv 45+) ─────────────────────────────────────────────
    {
      id: "w_bulwark", name: "Bulwark Stance", tier: 4, levelReq: 45, cost: 4,
      mp: 85, cooldown: 5, damage: 0, element: null, buff: "defense",
      buffEffect: { def_pct: 50, hp_regen: 10 }, buffDuration: 3,
      description: "You plant your feet and become an immovable fortress, your body radiating an aura of absolute defense. You gain 50% defense and regenerate 10% HP each turn for 3 turns. Nothing gets past your guard — every attack bounces off your iron resolve as you heal steadily.",
      requires: "w_taunt",
      synergy: "VIT amplifies both the defense bonus and regen amount.",
    },
    {
      id: "w_avatar", name: "Avatar of War", tier: 4, levelReq: 50, cost: 5,
      mp: 110, cooldown: 6, damage: 3.0, element: "physical",
      description: "You channel the spirit of an ancient war god, divine power flowing through your veins as you strike for 300% damage. Golden light erupts from your weapon on impact while you heal 20% of your health. For a brief moment, you transcend mortality and fight with godlike strength.",
      requires: "w_ground_slam",
    },
    {
      id: "w_juggernaut", name: "Juggernaut", tier: 4, levelReq: 55, cost: 4,
      mp: 100, cooldown: 5, damage: 2.8, element: "physical",
      description: "You charge forward like an unstoppable juggernaut, building momentum with every step before crashing into the enemy for 280% damage. Your sheer mass and velocity ignore half their defenses — armor crumples, shields shatter. Nothing can slow you down once you start.",
      requires: "w_whirlwind",
    },
    {
      id: "w_sand_veil", name: "Sand Veil", tier: 4, levelReq: 48, cost: 4,
      mp: 90, cooldown: 5, damage: 1.5, element: "sand",
      description: "You conjure a swirling vortex of desert sand for 150% sand damage, the golden grains cutting like tiny razors. The sandstorm obscures your form, granting you 30% evasion for 2 turns as the enemy swings blindly at shadows. The desert is your ally now.",
      requires: "w_thunder_strike",
      synergy: "sand_dmg % increases the damage portion.",
    },

    // ── Tier 5 – Legendary (Lv 70+) ──────────────────────────────────────────
    {
      id: "w_titan_form", name: "Titan Form", tier: 5, levelReq: 70, cost: 5,
      mp: 140, cooldown: 6, damage: 0, element: null, buff: "attack",
      buffEffect: { hp_pct: 100, all_stats: 60 }, buffDuration: 5,
      description: "Your body grows to titanic proportions as ancient power surges through every fiber of your being. Your HP doubles and all stats increase by 60% for 5 turns. The ground trembles beneath your massive footsteps — you are unstoppable, towering over the battlefield like a living colossus.",
      requires: "w_bulwark",
    },
    {
      id: "w_armageddon", name: "Armageddon Strike", tier: 5, levelReq: 75, cost: 6,
      mp: 160, cooldown: 6, damage: 5.0, element: "fire",
      description: "You bring down a cataclysmic strike of fire and steel for 500% fire damage, the impact so devastating it tears the very earth apart. The battlefield erupts in a sea of flames as your blade carves through everything with apocalyptic force. This is the end of all things.",
      requires: "w_avatar",
      synergy: "fire_dmg % is FULLY applied on top of 500% base damage.",
    },
    {
      id: "w_eternal_guard", name: "Eternal Guardian", tier: 5, levelReq: 80, cost: 5,
      mp: 130, cooldown: 6, damage: 3.5, element: "physical", buff: "defense",
      buffEffect: { def_pct: 100 }, buffDuration: 2,
      description: "You become an immortal sentinel, shrugging off all damage for 2 turns as an ethereal shield surrounds your body. When struck, you retaliate with 350% damage — every attack against you becomes the enemy's undoing. You cannot be killed, and you punish every attempt.",
      requires: "w_juggernaut",
    },

    // ── New Tier 2 fills ──
    {
      id: "w_cleave", name: "Cleave", tier: 2, levelReq: 11, cost: 2,
      mp: 40, cooldown: 3, damage: 1.6, element: "physical",
      description: "You swing your weapon in a massive arc, cleaving through all enemies for 160% damage. The blade whistles through the air as it carves a deadly semicircle, punishing anyone foolish enough to stand within reach. A brutal sweep that clears the field.",
      requires: "w_basic_strike",
    },
    {
      id: "w_iron_skin", name: "Iron Skin", tier: 2, levelReq: 13, cost: 2,
      mp: 35, cooldown: 4, damage: 0, element: null, buff: "defense",
      buffEffect: { def_pct: 35, block_pct: 15 }, buffDuration: 3,
      description: "Your skin hardens to the strength of iron, turning your body into living armor. Defense increases by 35% and block chance by 15% for 3 turns. Blades bounce off your body, arrows shatter on impact — you are more metal than flesh.",
      requires: "w_shield_block",
    },

    // ── New Tier 3 fills ──
    {
      id: "w_execute", name: "Execute", tier: 3, levelReq: 26, cost: 3,
      mp: 60, cooldown: 4, damage: 2.0, element: "physical",
      description: "You deliver a merciless killing blow for 200% damage, your blade seeking the weakest point in the enemy's guard. If the enemy is below 30% HP, the damage doubles — you smell blood and strike with lethal finality. There is no mercy for the wounded.",
      requires: "w_rage",
    },
    {
      id: "w_earthquake", name: "Earthquake", tier: 3, levelReq: 33, cost: 4,
      mp: 80, cooldown: 5, damage: 2.2, element: "sand",
      description: "You slam the ground with such catastrophic force that the very earth shatters beneath you, dealing 220% sand damage and stunning the enemy for 1 turn. Fissures spread outward from the impact point as the ground heaves and buckles, swallowing everything in its path.",
      requires: "w_ground_slam",
      synergy: "sand_dmg % amplifies. Pairs with Sand Veil for a sand warrior build.",
    },
    {
      id: "w_battle_shout", name: "Battle Shout", tier: 3, levelReq: 29, cost: 3,
      mp: 50, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { atk_speed: 20, crit_pct: 15 }, buffDuration: 3,
      description: "You unleash a rallying battle shout that quickens your reflexes and sharpens your instincts. Your attack speed increases by 20% and critical hit chance by 15% for 3 turns. Every nerve fires faster, every swing finds its mark with deadly precision.",
      requires: "w_war_cry",
    },

    // ── New Tier 4 fills ──
    {
      id: "w_blood_sacrifice", name: "Blood Sacrifice", tier: 4, levelReq: 52, cost: 4,
      mp: 95, cooldown: 5, damage: 3.2, element: "blood",
      description: "You sacrifice 15% of your own HP, feeding your pain into a devastating blood strike for 320% blood damage. Crimson energy erupts from the wound as you channel your suffering into raw power, draining 10% of the damage back as health. Your pain becomes their destruction.",
      requires: "w_blood_rage",
      synergy: "blood_dmg % stack makes this self-sustaining at high values.",
    },
    {
      id: "w_tremor", name: "Tremor Slam", tier: 4, levelReq: 54, cost: 4,
      mp: 100, cooldown: 5, damage: 2.8, element: "physical",
      description: "You slam the ground with earth-shattering force for 280% damage, the impact sending tremors rippling outward in every direction. The enemy's defenses crack and weaken as the ground itself turns against them, leaving them vulnerable to everything that follows.",
      requires: "w_ground_slam",
    },

    // ── New Tier 5 fills ──
    {
      id: "w_inferno_blade", name: "Inferno Blade", tier: 5, levelReq: 72, cost: 5,
      mp: 145, cooldown: 6, damage: 4.5, element: "fire",
      description: "Your blade erupts into a raging inferno of white-hot flames as you slash for 450% fire damage. The fire is so intense it melts through armor, and the flames linger on the wound — burning the enemy for 5% of their HP each turn for 3 turns. There is no escaping the heat.",
      requires: "w_armageddon",
      synergy: "fire_dmg amplifies both the hit and the burn. Core fire warrior skill.",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "w_godslayer", name: "Godslayer", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 8.0, element: "physical",
      description: "You transcend mortal limits and channel the power to slay gods themselves, unleashing a strike of absolute destruction for 800% damage. The blow ignores all defenses, immunities, and magical protections — nothing in existence can withstand this attack. Even the divine tremble.",
      requires: "w_armageddon",
      synergy: "Requires Armageddon Strike. The ultimate warrior finisher.",
    },
    {
      id: "w_warlord_aura", name: "Warlord's Aura", tier: 6, levelReq: 92, cost: 6,
      mp: 180, cooldown: 7, damage: 0, element: null, buff: "attack",
      buffEffect: { atk_pct: 80, crit_pct: 30, lifesteal: 20 }, buffDuration: 4,
      description: "An aura of absolute dominance radiates from your body, your mere presence bending the battlefield to your will. Your attack surges by 80%, crit chance by 30%, and you gain 20% lifesteal for 4 turns. You are war incarnate — every blow heals you, every strike devastates.",
      requires: "w_titan_form",
    },
    {
      id: "w_ragnarok", name: "Ragnarok", tier: 6, levelReq: 95, cost: 8,
      mp: 250, cooldown: 8, damage: 10.0, element: "fire",
      description: "You call down Ragnarok — the end of the world itself. A cataclysmic explosion of fire and steel deals 1000% damage as the sky splits open and the earth crumbles. Everything burns, everything breaks, everything ends. This is the highest single-target warrior devastation possible.",
      requires: "w_eternal_guard",
      synergy: "fire_dmg % fully stacks. The highest single-target warrior skill.",
    },

    // ── New Ice skills ──
    {
      id: "w_frost_cleave", name: "Frost Cleave", tier: 1, levelReq: 6, cost: 2,
      mp: 40, cooldown: 3, damage: 1.4, element: "ice",
      description: "Your blade is coated in razor-sharp ice as you swing for 140% ice damage, the frozen edge biting deep into flesh and bone. The cold seeps into the enemy's body, slowing them for 1 turn as frost crystals spread from the wound. This opens the path of the ice warrior.",
      requires: null,
      synergy: "ice_dmg % adds to each swing. Opens ice warrior path.",
    },
    {
      id: "w_glacial_shield", name: "Glacial Shield", tier: 2, levelReq: 13, cost: 2,
      mp: 55, cooldown: 4, damage: 0, element: "ice", buff: "defense",
      buffEffect: { def_pct: 35, reflect: 10 }, buffDuration: 2,
      description: "A barrier of solid, crystalline ice forms around you, boosting defense by 35% and reflecting 10% of all damage taken as ice damage for 2 turns. Attackers flinch as the cold bites their hands with every strike, punishing them for daring to attack you.",
      requires: "w_frost_cleave",
    },
    {
      id: "w_frozen_wrath", name: "Frozen Wrath", tier: 3, levelReq: 31, cost: 4,
      mp: 82, cooldown: 5, damage: 2.2, element: "ice",
      description: "You shatter the frozen air with a devastating strike for 220% ice damage, the impact encasing the enemy in a prison of solid ice for 1 turn. They stand frozen mid-motion, unable to move, unable to fight, unable to even breathe. The cold is absolute.",
      requires: "w_glacial_shield",
      synergy: "ice_dmg % makes this both damage and CC. Pairs with Avalanche Strike.",
    },
    {
      id: "w_avalanche_strike", name: "Avalanche Strike", tier: 4, levelReq: 52, cost: 5,
      mp: 125, cooldown: 5, damage: 3.2, element: "ice",
      description: "You bring down the full force of a mountain avalanche for 320% ice damage, burying the enemy under tons of crushing ice. They're frozen solid for 2 turns, entombed in glacial ice so thick that no amount of strength can break free. Winter's ultimate judgment.",
      requires: "w_frozen_wrath",
      synergy: "ice_dmg stacking makes this the premier ice warrior nuke.",
    },

    // ── New Poison skills ──
    {
      id: "w_venomous_edge", name: "Venomous Edge", tier: 1, levelReq: 5, cost: 2,
      mp: 38, cooldown: 3, damage: 1.2, element: "poison",
      description: "You coat your blade in a deadly, iridescent venom and slice for 120% poison damage. The toxin immediately spreads through the enemy's bloodstream, dealing damage over 3 turns as the poison eats away at them from within. Each tick grows more agonizing than the last.",
      requires: null,
      synergy: "poison_dmg % amplifies each DoT tick.",
    },
    {
      id: "w_toxic_slam", name: "Toxic Slam", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 1.6, element: "poison",
      description: "You slam your poison-infused weapon into the ground for 160% poison damage, the impact releasing a billowing cloud of toxic gas that poisons everything nearby for 2 turns. The green miasma hangs in the air, choking and corroding anyone who dares to breathe.",
      requires: "w_venomous_edge",
      synergy: "poison_dmg % boosts both hit and cloud. Pairs with Plague Strike.",
    },
    {
      id: "w_plague_strike", name: "Plague Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 5, damage: 2.2, element: "poison",
      description: "You strike with a plague-carrying blade for 220% poison damage, unleashing an infection that spreads and stacks with terrifying speed. The poison deals increasing damage over 4 turns, each tick stronger than the last. Combined with other toxins, the damage becomes catastrophic.",
      requires: "w_toxic_slam",
      synergy: "poison_dmg makes DoT devastating. Stack with Venomous Edge for max poison.",
    },
    {
      id: "w_pandemic_cleave", name: "Pandemic Cleave", tier: 4, levelReq: 53, cost: 5,
      mp: 118, cooldown: 5, damage: 3.0, element: "poison",
      description: "You sweep your toxic blade in a lethal arc for 300% poison damage, releasing a wave of lethal toxin that reduces the enemy's healing by 30% for 3 turns. Their wounds refuse to close, potions fail, and healing magic fizzles. There is no antidote for this plague.",
      requires: "w_plague_strike",
    },

    // ── New Arcane skills ──
    {
      id: "w_runic_blade", name: "Runic Blade", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 1.8, element: "arcane",
      description: "Ancient runes blaze along your weapon in patterns older than civilization, empowering your strike for 180% arcane damage. The magical inscriptions bypass 20% of the enemy's magic resistance, cutting through wards and barriers as if they were paper.",
      requires: null,
    },
    {
      id: "w_arcane_shatter", name: "Arcane Shatter", tier: 3, levelReq: 33, cost: 4,
      mp: 85, cooldown: 5, damage: 2.5, element: "arcane",
      description: "You channel raw arcane energy through your blade until reality itself begins to crack, then release it for 250% arcane damage. The burst of magical force dispels all enemy buffs on impact, stripping away their protections and leaving them utterly exposed.",
      requires: "w_runic_blade",
    },
    {
      id: "w_void_cleave", name: "Void Cleave", tier: 4, levelReq: 54, cost: 5,
      mp: 130, cooldown: 5, damage: 3.5, element: "arcane",
      description: "Your blade cuts through the very fabric of space itself for 350% arcane damage, leaving a shimmering wound in reality where it passes. This strike ignores all defenses — physical, magical, and divine. Nothing can protect against the void between dimensions.",
      requires: "w_arcane_shatter",
    },
    {
      id: "w_dimension_breaker", name: "Dimension Breaker", tier: 5, levelReq: 76, cost: 6,
      mp: 185, cooldown: 6, damage: 5.5, element: "arcane",
      description: "You shatter the barriers between dimensions with a single earth-splitting strike for 550% arcane damage. Reality fractures around the impact point, creating cracks in space-time that tear the enemy apart at a molecular level. The laws of physics bow to your might.",
      requires: "w_void_cleave",
      synergy: "The arcane warrior's ultimate. Pairs with Void Cleave for burst combos.",
    },

    // ── New Lightning fills ──
    {
      id: "w_static_charge", name: "Static Charge", tier: 1, levelReq: 8, cost: 2,
      mp: 38, cooldown: 3, damage: 1.3, element: "lightning",
      description: "You charge your weapon with crackling electricity until sparks dance along the blade, then strike for 140% lightning damage. Static energy arcs between you and the enemy with each hit, the charge building stronger and stronger with every swing.",
      requires: null,
      synergy: "lightning_dmg % adds to each hit. Opens lightning warrior path.",
    },
    {
      id: "w_storm_shield", name: "Storm Shield", tier: 2, levelReq: 12, cost: 2,
      mp: 50, cooldown: 4, damage: 0, element: "lightning", buff: "defense",
      buffEffect: { def_pct: 30, shock_reflect: 1 }, buffDuration: 3,
      description: "A shield of crackling lightning forms around your body, arcing and sparking with violent energy. Your defense increases by 30% and any attacker is shocked by lightning damage for 3 turns. They learn quickly that touching you is a painful mistake.",
      requires: "w_static_charge",
    },
    {
      id: "w_mjolnir_strike", name: "Mjolnir Strike", tier: 4, levelReq: 50, cost: 5,
      mp: 120, cooldown: 5, damage: 3.2, element: "lightning",
      description: "You bring down a hammer blow charged with the fury of a divine thunderstorm for 350% lightning damage. The impact creates a crater as lightning explodes outward from the strike point, the thunderclap deafening everything nearby. The heavens themselves answer your call.",
      requires: "w_thunder_strike",
      synergy: "lightning_dmg fully stacks. The lightning warrior's core nuke.",
    },
    {
      id: "w_tempest_fury", name: "Tempest Fury", tier: 5, levelReq: 74, cost: 6,
      mp: 180, cooldown: 6, damage: 5.5, element: "lightning",
      description: "You become one with the raging tempest, unleashing a flurry of lightning-charged strikes for 500% lightning damage. Thunder rolls with every swing as electricity cascades from your body in blinding arcs. You are the storm, and the storm spares no one.",
      requires: "w_mjolnir_strike",
      synergy: "lightning_dmg build's endgame skill. Devastating AoE.",
    },
    // ── Gap fills: fire T2, T3, T4 ──
    {
      id: "w_blazing_cleave", name: "Blazing Cleave", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 3, damage: 1.5, element: "fire",
      description: "Your weapon erupts in roaring flames as you cleave through the enemy for 220% fire damage. The searing heat melts through their armor like butter, leaving glowing red-hot gashes in the metal. Sparks and embers shower the battlefield.",
      requires: null, synergy: "Burn damage increases with consecutive fire attacks.",
    },
    {
      id: "w_inferno_slam", name: "Inferno Slam", tier: 3, levelReq: 30, cost: 4,
      mp: 75, cooldown: 4, damage: 2.2, element: "fire",
      description: "You slam your burning weapon into the ground for 350% fire damage, the impact creating a wave of fire that sweeps outward in every direction. The ground itself catches fire, turning the battlefield into an inferno that engulfs everything in its scorching path.",
      requires: null, synergy: "Ground-based fire persists, dealing residual burn damage.",
    },
    {
      id: "w_magma_rend", name: "Magma Rend", tier: 4, levelReq: 50, cost: 5,
      mp: 110, cooldown: 5, damage: 3.0, element: "fire",
      description: "You tear through the enemy with a blade dripping molten lava for 500% fire damage. The ground beneath your feet glows red-hot as magma seeps from your weapon, leaving burning pools that continue to deal damage. Nothing survives the touch of liquid earth.",
      requires: null, synergy: "Burning targets take amplified damage from physical skills.",
    },
    // ── Gap fills: ice T5, T6 ──
    {
      id: "w_permafrost_crush", name: "Permafrost Crush", tier: 5, levelReq: 74, cost: 6,
      mp: 155, cooldown: 6, damage: 4.5, element: "ice",
      description: "You deliver a bone-shattering blow of pure concentrated cold for 450% ice damage. The frost is so intense it freezes the very air molecules around the impact, creating a zone of absolute cold that drains the warmth from everything nearby.",
      requires: "w_avalanche_strike", synergy: "Frozen enemies shatter for bonus physical damage.",
    },
    {
      id: "w_glacial_annihilation", name: "Glacial Annihilation", tier: 6, levelReq: 92, cost: 7,
      mp: 210, cooldown: 7, damage: 7.0, element: "ice",
      description: "You unleash the fury of an eternal, unending winter for 700% ice damage. Everything around you is entombed in walls of ice dozens of feet thick. The temperature drops so far that time itself seems to slow, and nothing — absolutely nothing — can move.",
      requires: "w_permafrost_crush", synergy: "All ice effects gain extended duration while active.",
    },
    // ── Gap fills: lightning T6 ──
    {
      id: "w_thundergod_wrath", name: "Thundergod's Wrath", tier: 6, levelReq: 93, cost: 8,
      mp: 240, cooldown: 8, damage: 9.0, element: "lightning",
      description: "You channel the wrath of the thunder god himself for 650% lightning damage. The skies darken to pitch black as a column of divine lightning descends from the heavens, striking with enough force to crack mountains. The very air ignites with electrical fury.",
      requires: "w_tempest_fury", synergy: "Stunned enemies receive triple lightning damage.",
    },
    // ── Gap fills: poison T5, T6 ──
    {
      id: "w_blight_cleave", name: "Blight Cleave", tier: 5, levelReq: 72, cost: 5,
      mp: 140, cooldown: 5, damage: 4.0, element: "poison",
      description: "Your weapon drips with lethal, bubbling toxins as you swing for 300% poison damage. The blight spreads through the enemy's body with horrifying speed, corroding flesh and bone alike. Every cut accelerates the decay, and there is no stopping its advance.",
      requires: "w_pandemic_cleave", synergy: "Poison duration doubled against enemies below 50% health.",
    },
    {
      id: "w_plague_lord", name: "Plague Lord's Ruin", tier: 6, levelReq: 91, cost: 7,
      mp: 195, cooldown: 7, damage: 6.5, element: "poison",
      description: "You become a vessel of pestilence itself, disease radiating from your very presence as you strike for 650% poison damage. The air around you turns green and toxic. Enemies who breathe it weaken, and those you touch directly are consumed by plague.",
      requires: "w_blight_cleave", synergy: "All poison DOTs on the target stack with no cap.",
    },
    // ── Gap fills: blood T1, T3, T5, T6 ──
    {
      id: "w_crimson_edge", name: "Crimson Edge", tier: 1, levelReq: 6, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "blood",
      description: "Your blade weeps dark crimson blood as you slash for 200% blood damage, opening a wound that absolutely refuses to stop bleeding. The enemy's life force drains with every heartbeat, pooling on the ground in an ever-growing crimson stain.",
      requires: null, synergy: "Heals a small portion of damage dealt.",
    },
    {
      id: "w_sanguine_slam", name: "Sanguine Slam", tier: 3, levelReq: 32, cost: 4,
      mp: 78, cooldown: 4, damage: 2.3, element: "blood",
      description: "You slam the ground with a blood-soaked weapon for 350% blood damage, crimson energy erupting from the impact in a fountain of dark power. The blood magic drains the enemy's vitality and feeds it back to you, sustaining you through battle.",
      requires: null, synergy: "Damage scales with missing health.",
    },
    {
      id: "w_hemorrhage_strike", name: "Hemorrhage Strike", tier: 5, levelReq: 75, cost: 6,
      mp: 150, cooldown: 6, damage: 5.0, element: "blood",
      description: "You strike a vital artery with surgical precision for 500% blood damage, causing severe, unstoppable hemorrhaging. The enemy grows weaker with every heartbeat as blood pours from the wound, their strength ebbing away with each desperate breath.",
      requires: "w_blood_sacrifice", synergy: "Bleeding enemies lose defense over time.",
    },
    {
      id: "w_bloodstorm_tyrant", name: "Bloodstorm Tyrant", tier: 6, levelReq: 94, cost: 8,
      mp: 230, cooldown: 7, damage: 8.5, element: "blood",
      description: "You become a tyrant of blood, unleashing a crimson storm of dark power for 800% blood damage. The battlefield runs red as you drain the life force from everything alive, healing yourself while your enemies wither. You feast on their suffering.",
      requires: "w_hemorrhage_strike", synergy: "Full health restored if this skill kills the target.",
    },
    // ── Gap fills: sand T1, T2, T5, T6 ──
    {
      id: "w_dust_strike", name: "Dust Strike", tier: 1, levelReq: 7, cost: 2,
      mp: 28, cooldown: 2, damage: 1.1, element: "sand",
      description: "You kick up a blinding cloud of sand as you strike for 110% sand damage, the grit stinging eyes and filling lungs. Your opponent stumbles, disoriented and coughing, unable to see your follow-up attacks coming. The desert fights dirty — so do you.",
      requires: null, synergy: "Blinded enemies have reduced accuracy.",
    },
    {
      id: "w_sandstone_bash", name: "Sandstone Bash", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 3, damage: 1.6, element: "sand",
      description: "Your fists harden to the density of ancient sandstone as you bash the enemy for 220% sand damage. The desert's timeless strength flows through your body, each blow carrying the weight of a thousand years of wind-carved stone.",
      requires: null, synergy: "Sand skills slow enemy attack speed.",
    },
    {
      id: "w_dune_colossus", name: "Dune Colossus", tier: 5, levelReq: 76, cost: 6,
      mp: 160, cooldown: 6, damage: 4.8, element: "sand",
      description: "You rise as a colossus of living sand for 480% sand damage, your body growing massive as the desert itself lends you its form. Sand swirls around you in a protective cyclone, and your enormous fists crush everything they touch. The dunes obey your command.",
      requires: null, synergy: "Slowed enemies take bonus damage from all sources.",
    },
    {
      id: "w_tomb_warden", name: "Tomb Warden's Wrath", tier: 6, levelReq: 93, cost: 7,
      mp: 220, cooldown: 7, damage: 7.5, element: "sand",
      description: "You channel the ancient power of a forgotten tomb guardian for 750% sand damage, the spirits of the desert dead empowering your strikes. The sands of time bend to your will, aging and eroding your enemies while granting you the strength of millennia.",
      requires: "w_dune_colossus", synergy: "Entombed enemies cannot dodge or block.",
    },
    // ── Gap fills: arcane T1, T6 ──
    {
      id: "w_mystic_strike", name: "Mystic Strike", tier: 1, levelReq: 8, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "arcane",
      description: "You infuse your weapon with raw, unstable magical energy for 130% arcane damage. The strike leaves reality slightly warped where it connects, a shimmering distortion that hints at the otherworldly power behind the blow. Magic flows where your blade cuts.",
      requires: null, synergy: "Arcane damage bypasses a portion of enemy defense.",
    },
    {
      id: "w_void_annihilator", name: "Void Annihilator", tier: 6, levelReq: 95, cost: 8,
      mp: 260, cooldown: 8, damage: 9.5, element: "arcane",
      description: "You tear a gaping hole in the fabric of existence itself for 950% arcane damage. The void beyond reality consumes everything in its path — matter, energy, even light itself is swallowed. Nothing remains where you strike. Absolute annihilation.",
      requires: "w_dimension_breaker", synergy: "Ignores all enemy resistances and immunities.",
    },

    // ── Support skills ──
    {
      id: "w_rallying_cry", name: "Rallying Cry", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.15,
      description: "You rally your allies with an inspiring war cry that echoes across the battlefield, boosting the entire party's attack and defense for 3 turns. Your courage is contagious — even the weakest warrior fights with renewed vigor when they hear your voice.",
      requires: null, statScale: "strength",
    },
    {
      id: "w_fortress", name: "Fortress", tier: 3, levelReq: 28, cost: 3,
      mp: 60, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.25,
      description: "You become an impenetrable fortress of living steel, planting yourself as an immovable bastion that grants massive defense to yourself and nearby allies for 3 turns. No attack can breach your walls, no force can move your position. You are the shield.",
      requires: "w_rallying_cry", statScale: "vitality",
    },
    {
      id: "w_berserker_fury", name: "Berserker Fury", tier: 3, levelReq: 30, cost: 3,
      mp: 55, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 35, crit_pct: 10 }, buffDuration: 3,
      description: "Primal fury surges through every fiber of your being, massively boosting your attack power and critical chance for 3 turns. You fight like a cornered beast — all restraint abandoned, all fear forgotten. Only the kill matters now.",
      requires: null, statScale: "strength",
    },
    {
      id: "w_iron_bastion", name: "Iron Bastion", tier: 4, levelReq: 48, cost: 4,
      mp: 80, cooldown: 6, damage: 0, element: null,
      buffEffect: { def_pct: 50, block_pct: 20 }, buffDuration: 3,
      description: "You plant your shield and become an iron bastion, absorbing damage meant for your allies and reflecting a portion of every hit back at the attacker. Your body becomes a wall of steel that punishes anyone foolish enough to swing at your companions.",
      requires: "w_fortress",
    },
  ],

  mage: [
    // ── Tier 1 ──
    {
      id: "m_magic_bolt", name: "Magic Bolt", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 2, damage: 1.4, element: "arcane",
      description: "You hurl a bolt of pure arcane energy at the enemy for 110% damage, the projectile crackling with raw magical force. A fundamental spell that every mage learns first, but one that grows deadlier with intellect — at high levels, even a basic bolt can shatter stone.",
      requires: null,
      synergy: "Every point of INT increases this skill's output.",
    },
    {
      id: "m_frost_armor", name: "Frost Armor", tier: 1, levelReq: 1, cost: 1,
      mp: 28, cooldown: 3, damage: 0, element: "ice", buff: "defense",
      buffEffect: { def_pct: 25 }, buffDuration: 3,
      description: "You cloak yourself in a shimmering layer of crystalline frost, gaining 25% defense for 3 turns. Ice crystals form a beautiful but deadly shell around your body, and attackers feel the biting cold pierce their hands when they strike you. A wise mage's first line of defense.",
      requires: null,
    },
    {
      id: "m_fireball", name: "Fireball", tier: 1, levelReq: 5, cost: 2,
      mp: 38, cooldown: 3, damage: 1.9, element: "fire",
      description: "You conjure a roaring sphere of concentrated fire and launch it at the enemy for 200% fire damage. The fireball streaks through the air trailing smoke and embers before detonating in a brilliant explosion that leaves scorched earth and smoldering ruins in its wake.",
      requires: "m_magic_bolt",
      synergy: "fire_dmg % amplifies all Fireball damage multiplicatively.",
    },
    {
      id: "m_poison_bolt", name: "Poison Bolt", tier: 1, levelReq: 6, cost: 2,
      mp: 30, cooldown: 3, damage: 1.2, element: "poison",
      description: "You fire a bolt of concentrated, bubbling venom for 120% poison damage. The toxic projectile bursts on impact, releasing a cloud of corrosive gas. The toxin festers deep in the wound, dealing relentless damage over time that worsens with each passing moment.",
      requires: null,
      synergy: "poison_dmg % scales the DoT component over 3 turns.",
    },

    // ── Tier 2 ──
    {
      id: "m_ice_lance", name: "Ice Lance", tier: 2, levelReq: 10, cost: 2,
      mp: 48, cooldown: 3, damage: 1.6, element: "ice",
      description: "You form a lance of crystalline ice from the moisture in the air and hurl it for 150% ice damage. The piercing cold penetrates deep, spreading frost through the enemy's body and slowing them as ice crystals form in their blood.",
      requires: "m_frost_armor",
      synergy: "ice_dmg % adds damage. Pairs well with Blizzard for freeze chains.",
    },
    {
      id: "m_mana_shield", name: "Mana Shield", tier: 2, levelReq: 12, cost: 2,
      mp: 55, cooldown: 4, damage: 0, element: null, buff: "defense",
      buffEffect: { mana_absorb: 1 }, buffDuration: 3,
      description: "You weave a barrier of pure mana around yourself, creating a shimmering blue dome that absorbs incoming damage using your magical reserves for 3 turns. As long as your mana holds, no physical or magical attack can reach your body.",
      requires: null,
      synergy: "High INT = more MP = longer shield uptime.",
    },
    {
      id: "m_arcane_burst", name: "Arcane Burst", tier: 2, levelReq: 15, cost: 3,
      mp: 65, cooldown: 4, damage: 2.4, element: "arcane",
      description: "You release a burst of raw arcane power for 200% damage, the explosion warping the very air around you in a dazzling display of magical force. The shockwave disrupts the enemy's magical defenses, leaving them exposed and reeling.",
      requires: "m_fireball",
    },
    {
      id: "m_lightning_bolt", name: "Lightning Bolt", tier: 2, levelReq: 13, cost: 2,
      mp: 45, cooldown: 3, damage: 1.8, element: "lightning",
      description: "You raise your hand and call down a searing bolt of lightning for 180% lightning damage. The white-hot arc bridges the gap between sky and earth in an instant, and the thunderclap that follows shakes the very ground beneath your feet.",
      requires: "m_poison_bolt",
      synergy: "lightning_dmg % stacks with INT scaling for strong burst.",
    },

    // ── Tier 3 ──
    {
      id: "m_blizzard", name: "Blizzard", tier: 3, levelReq: 25, cost: 3,
      mp: 85, cooldown: 5, damage: 2.0, element: "ice",
      description: "You summon a raging blizzard that engulfs the entire battlefield for 300% ice damage. Howling winds carry razor-sharp ice crystals that tear through everything caught in the storm, while temperatures plummet to bone-cracking levels. Even the bravest warrior shivers.",
      requires: "m_ice_lance",
      synergy: "ice_dmg synergizes: each % adds directly to blizzard AoE damage.",
    },
    {
      id: "m_flame_wall", name: "Flame Wall", tier: 3, levelReq: 28, cost: 3,
      mp: 80, cooldown: 5, damage: 2.2, element: "fire",
      description: "You raise a wall of roaring flames for 220% fire damage, the inferno stretching from floor to ceiling in an impassable barrier of scorching heat. Anyone foolish enough to approach is consumed by the blaze. The heat is so intense it warps the air itself.",
      requires: "m_arcane_burst",
      synergy: "fire_dmg % compounds over both turns of the flame wall.",
    },
    {
      id: "m_time_warp", name: "Time Warp", tier: 3, levelReq: 28, cost: 3,
      mp: 80, cooldown: 6, damage: 0, element: null, buff: "attack",
      buffEffect: { extra_turn: 1, atk_speed: 30 }, buffDuration: 1,
      description: "You bend the fabric of time itself around your body, gaining an extra turn and boosting your speed dramatically. The world slows to a crawl around you while you move freely — enemies freeze mid-swing, projectiles hang motionless in the air. Time is yours to command.",
      requires: "m_mana_shield",
    },
    {
      id: "m_meteor", name: "Meteor", tier: 3, levelReq: 30, cost: 4,
      mp: 95, cooldown: 5, damage: 3.0, element: "fire",
      description: "You reach into the heavens and pull a blazing meteor from the sky, crashing it into the enemy for 500% fire damage. The asteroid impacts with apocalyptic force, creating a smoking crater and sending shockwaves across the battlefield. Nothing survives the direct hit.",
      requires: "m_flame_wall",
      synergy: "fire_dmg build makes Meteor one of the highest damage skills.",
    },

    // ── Tier 4 ──
    {
      id: "m_black_hole", name: "Black Hole", tier: 4, levelReq: 45, cost: 4,
      mp: 120, cooldown: 5, damage: 3.5, element: "arcane",
      description: "You tear open a miniature black hole in the fabric of space for 350% arcane damage. The gravitational singularity pulls everything inward with unstoppable force — armor crumples, bones crack, and the very light bends as space collapses into nothingness.",
      requires: "m_blizzard",
    },
    {
      id: "m_arcane_nova", name: "Arcane Nova", tier: 4, levelReq: 50, cost: 5,
      mp: 140, cooldown: 5, damage: 4.0, element: "arcane",
      description: "You detonate a nova of pure arcane energy for 400% damage, the magical explosion expanding outward in a blinding ring of force. The shockwave ripples through the air, warping reality in its wake and leaving the enemy disoriented and their magical defenses shattered.",
      requires: "m_meteor",
    },
    {
      id: "m_blood_pact", name: "Blood Pact", tier: 4, levelReq: 48, cost: 4,
      mp: 110, cooldown: 5, damage: 2.8, element: "blood",
      description: "You forge a dark blood pact with ancient powers, sacrificing your own HP to unleash 240% blood damage. Dark crimson sigils appear in the air around you, pulsing with stolen life force. The more you bleed, the more power you command — pain is the currency of this terrible magic.",
      requires: "m_time_warp",
      synergy: "blood_dmg % amplifies but the cost scales too. High risk/high reward.",
    },
    {
      id: "m_chrono_rift", name: "Chrono Rift", tier: 4, levelReq: 55, cost: 4,
      mp: 110, cooldown: 5, damage: 2.8, element: "arcane",
      description: "You rip open a rift in the stream of time, resetting all your cooldowns and gaining enhanced casting speed for 3 turns. Past, present, and future blur together as you manipulate temporal energy. Time bends to your will — you can cast spells that should need minutes of recovery.",
      requires: "m_time_warp",
    },
    {
      id: "m_ice_prison", name: "Ice Prison", tier: 4, levelReq: 52, cost: 4,
      mp: 125, cooldown: 5, damage: 2.5, element: "ice", buff: "defense",
      buffEffect: { freeze: 2 }, buffDuration: 2,
      description: "You encase the enemy in an inescapable prison of solid ice for 300% ice damage, the frozen walls closing in from every direction. They're trapped, frozen solid, unable to act for 2 turns — entombed in a glacial coffin of your creation.",
      requires: "m_black_hole",
      synergy: "ice_dmg builds turn this into both offense and defense.",
    },

    // ── Tier 5 ──
    {
      id: "m_singularity", name: "Singularity", tier: 5, levelReq: 70, cost: 5,
      mp: 175, cooldown: 6, damage: 5.5, element: "arcane",
      description: "You collapse a region of space into a devastating singularity for 450% arcane damage. The gravitational forces tear the enemy apart from within as matter and energy spiral inward toward the crushing center. Not even light escapes this destruction.",
      requires: "m_black_hole",
    },
    {
      id: "m_genesis", name: "Genesis", tier: 5, levelReq: 75, cost: 5,
      mp: 160, cooldown: 6, damage: 0, element: null, buff: "defense",
      buffEffect: { hp_restore: 30, atk_pct: 40 }, buffDuration: 3,
      description: "You channel the primordial force of creation itself for 600% damage, tapping into the power that birthed the universe. Divine light explodes from your body, restoring your HP and empowering all your abilities. For one shining moment, you wield the power of gods.",
      requires: "m_chrono_rift",
    },
    {
      id: "m_apocalypse", name: "Apocalypse", tier: 5, levelReq: 80, cost: 6,
      mp: 200, cooldown: 6, damage: 6.0, element: "fire",
      description: "You unleash magical armageddon for 1000% damage — the ultimate expression of destructive magic. Fire, ice, and lightning rain from the sky simultaneously in an apocalyptic display of power that obliterates everything in sight. This is the end of all things.",
      requires: "m_arcane_nova",
      synergy: "fire_dmg is the key amplifier. Max fire build here = highest DPS in game.",
    },

    // ── New Tier 2 fills ──
    {
      id: "m_arcane_shield", name: "Arcane Shield", tier: 2, levelReq: 11, cost: 2,
      mp: 40, cooldown: 4, damage: 0, element: "arcane", buff: "defense",
      buffEffect: { def_pct: 40, reflect_magic: 1 }, buffDuration: 3,
      description: "You conjure an intricate arcane barrier woven from pure magical energy, absorbing massive damage and reflecting magical attacks back at the caster for 3 turns. The shield shimmers with protective runes that grow brighter with each attack it absorbs.",
      requires: "m_frost_armor",
    },
    {
      id: "m_chain_lightning", name: "Chain Lightning", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 2.0, element: "lightning",
      description: "You unleash a bolt of lightning that arcs between enemies for 260% lightning damage, the electrical chain jumping from target to target in a devastating cascade. Each arc is as powerful as the last, the storm of electricity sparing no one in its path.",
      requires: "m_lightning_bolt",
      synergy: "lightning_dmg % makes each chain hit harder than the last.",
    },

    // ── New Tier 3 fills ──
    {
      id: "m_poison_cloud", name: "Poison Cloud", tier: 3, levelReq: 27, cost: 3,
      mp: 70, cooldown: 5, damage: 1.5, element: "poison",
      description: "You conjure a choking cloud of toxic gas that hangs heavy in the air for 200% poison damage. The noxious miasma lingers far longer than natural, poisoning everything that breathes it in. The green fog corrodes armor and eats away at flesh with terrible efficiency.",
      requires: "m_poison_bolt",
      synergy: "poison_dmg % makes this the strongest sustained damage over time.",
    },
    {
      id: "m_frost_nova", name: "Frost Nova", tier: 3, levelReq: 29, cost: 3,
      mp: 75, cooldown: 5, damage: 1.8, element: "ice",
      description: "You detonate a nova of freezing energy for 300% ice damage, a ring of ice exploding outward from your body in every direction. The blast flash-freezes everything in range — water vapor crystallizes, enemies are encased in frost, and the air itself turns to ice.",
      requires: "m_ice_lance",
    },
    {
      id: "m_mana_burn", name: "Mana Burn", tier: 3, levelReq: 31, cost: 3,
      mp: 60, cooldown: 4, damage: 2.0, element: "arcane",
      description: "You ignite the enemy's own magical reserves for 200% damage, turning their mana into fire that burns them from the inside out. The more mana they possess, the more devastating the explosion. Their greatest strength becomes their undoing.",
      requires: "m_mana_shield",
    },

    // ── New Tier 4 fills ──
    {
      id: "m_infernal_pact", name: "Infernal Pact", tier: 4, levelReq: 53, cost: 4,
      mp: 115, cooldown: 5, damage: 3.2, element: "fire",
      description: "You seal a pact with infernal forces, dark flames erupting from your hands for 400% fire damage. Demonic fire — hotter and more malevolent than natural flame — consumes the enemy while dark energy courses through you, fueling your next spells with hellish power.",
      requires: "m_flame_wall",
      buff: "attack",
      buffEffect: { fire_dmg: 25, atk_pct: 20 }, buffDuration: 3,
    },
    {
      id: "m_sandstorm", name: "Sandstorm", tier: 4, levelReq: 50, cost: 4,
      mp: 105, cooldown: 5, damage: 2.5, element: "sand",
      description: "You conjure a howling sandstorm for 200% sand damage, the swirling golden maelstrom engulfing the battlefield in blinding, abrasive fury. Sand shreds exposed skin, fills lungs, and blinds eyes. The desert's wrath made manifest through your magical command.",
      requires: "m_time_warp",
      synergy: "sand_dmg % opens an uncommon mage path. Combine with Time Warp for lockdown.",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "m_arcane_god", name: "Arcane Godform", tier: 6, levelReq: 90, cost: 7,
      mp: 220, cooldown: 7, damage: 0, element: "arcane", buff: "attack",
      buffEffect: { atk_pct: 60, all_dmg: 30 }, buffDuration: 4,
      description: "You ascend to the pinnacle of arcane mastery for 700% damage, your body becoming a living conduit of pure magical energy. Your eyes glow with arcane light, your words reshape reality, and your gestures command forces beyond mortal comprehension. You are magic itself.",
      requires: "m_singularity",
    },
    {
      id: "m_supernova", name: "Supernova", tier: 6, levelReq: 93, cost: 8,
      mp: 280, cooldown: 8, damage: 12.0, element: "fire",
      description: "You detonate a supernova of pure concentrated energy for 800% damage, the explosion rivaling the death of a star. The blast is blinding, devastating, and utterly inescapable — a sphere of annihilation that expands outward with the force of collapsing suns.",
      requires: "m_apocalypse",
      synergy: "fire_dmg % FULLY stacks. With Infernal Pact active = game-ending damage.",
    },
    {
      id: "m_absolute_zero", name: "Absolute Zero", tier: 6, levelReq: 95, cost: 7,
      mp: 240, cooldown: 7, damage: 7.0, element: "ice",
      description: "You drop the temperature to absolute zero for 600% ice damage — the complete and total absence of all heat. Every molecule stops moving, every chemical reaction ceases. Life cannot exist at this temperature. Nothing survives the absolute end of warmth.",
      requires: "m_ice_prison",
      synergy: "ice_dmg build's ultimate payoff. Complete lockdown + massive damage.",
    },

    // ── New Blood skills ──
    {
      id: "m_blood_bolt", name: "Blood Bolt", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "blood",
      description: "You fire a bolt of crystallized blood for 140% blood damage, the sanguine projectile pulsing with dark life energy. It bursts on impact, releasing a spray of crimson magic that drains the enemy's vitality and sends tendrils of blood energy back to sustain you.",
      requires: null,
      synergy: "blood_dmg % amplifies both the hit and the drain.",
    },
    {
      id: "m_hemomancy", name: "Hemomancy", tier: 3, levelReq: 32, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "blood",
      description: "You manipulate the enemy's own blood against them for 280% blood damage, reaching into their body with dark magic to make their veins revolt. Their blood boils, coagulates, and tears through their body from the inside. Hemomancy — the darkest art.",
      requires: "m_blood_pact",
      synergy: "blood_dmg makes this self-sustaining. Core blood mage skill.",
    },
    {
      id: "m_crimson_storm", name: "Crimson Storm", tier: 5, levelReq: 73, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "blood",
      description: "You conjure a tempest of blood rain for 500% blood damage, the crimson drops burning like acid wherever they land. The storm drains life from everything it touches, feeding the dark clouds above in an endless cycle of sanguine destruction.",
      requires: "m_hemomancy",
      synergy: "blood_dmg build's ultimate payoff. Massive damage + massive healing.",
    },
    {
      id: "m_sanguine_ritual", name: "Sanguine Ritual", tier: 4, levelReq: 55, cost: 4,
      mp: 120, cooldown: 5, damage: 0, element: "blood", buff: "attack",
      buffEffect: { blood_dmg: 30, lifesteal: 15 }, buffDuration: 3,
      description: "You perform an ancient, forbidden blood ritual for 750% blood damage, drawing arcane circles in your own blood that pulse with terrible power. Dark crimson sigils float in the air, each one a command to destroy, each one feeding on stolen life force.",
      requires: "m_blood_pact",
    },

    // ── New Sand skills ──
    {
      id: "m_sand_barrier", name: "Sand Barrier", tier: 2, levelReq: 14, cost: 2,
      mp: 50, cooldown: 4, damage: 0, element: "sand", buff: "defense",
      buffEffect: { def_pct: 35 }, buffDuration: 3,
      description: "You raise a barrier of compressed desert sand that absorbs incoming attacks for 3 turns. Millions of sand grains interlock and harden into a wall stronger than stone, the desert's ancient protection shielding you from harm. The harder they hit, the harder it becomes.",
      requires: null,
    },
    {
      id: "m_dust_devil", name: "Dust Devil", tier: 3, levelReq: 29, cost: 3,
      mp: 78, cooldown: 5, damage: 2.0, element: "sand",
      description: "You summon a raging dust devil for 200% sand damage, the spinning vortex of sand and wind tearing through the enemy with abrasive fury. The whirlwind obscures their vision and shreds exposed skin, leaving them blind and bleeding.",
      requires: "m_sand_barrier",
      synergy: "sand_dmg % adds to damage. Pairs with Sandstorm for sand mage build.",
    },
    {
      id: "m_desert_wrath", name: "Desert Wrath", tier: 5, levelReq: 77, cost: 6,
      mp: 180, cooldown: 6, damage: 5.0, element: "sand",
      description: "You call upon the fury of the desert for 500% sand damage, conjuring a devastating sandstorm of biblical proportions. Scorching wind and razor-sharp sand scour the flesh from your enemies' bones as the full wrath of the wasteland is unleashed.",
      requires: "m_sandstorm",
      synergy: "sand_dmg build mage's endgame. Total enemy shutdown + damage.",
    },

    // ── New Lightning fills ──
    {
      id: "m_thunderstorm", name: "Thunderstorm", tier: 4, levelReq: 51, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "lightning",
      description: "You summon a violent thunderstorm for 380% lightning damage, dark clouds gathering overhead in seconds before unleashing their fury. Lightning bolts rain down in rapid succession, each strike more powerful than the last, turning the battlefield into a killing ground.",
      requires: "m_chain_lightning",
      synergy: "lightning_dmg % makes storms devastating. Pairs with Chain Lightning.",
    },
    {
      id: "m_ball_lightning", name: "Ball Lightning", tier: 5, levelReq: 75, cost: 6,
      mp: 170, cooldown: 6, damage: 4.5, element: "lightning",
      description: "You conjure a crackling sphere of ball lightning for 300% lightning damage, the unstable orb of electricity bouncing erratically between enemies. Each time it touches a target, it delivers a devastating shock before arcing to the next victim in a chain of destruction.",
      requires: "m_thunderstorm",
    },

    // ── New Poison fills ──
    {
      id: "m_plague", name: "Plague", tier: 4, levelReq: 54, cost: 5,
      mp: 120, cooldown: 5, damage: 3.0, element: "poison",
      description: "You unleash a magical plague for 350% poison damage, the disease spreading with supernatural speed as dark green energy seeps from your fingertips. The infection corrupts and weakens everything it touches, and no immune system can fight what magic has created.",
      requires: "m_poison_cloud",
      synergy: "poison_dmg % amplifies every tick. Devastating over long fights.",
    },
    {
      id: "m_miasma", name: "Miasma", tier: 5, levelReq: 74, cost: 6,
      mp: 172, cooldown: 6, damage: 4.5, element: "poison",
      description: "You release a noxious miasma for 450% poison damage, the toxic haze hanging in the air like a death sentence. The corrosive fog eats away at the enemy from the inside, dissolving organic matter and corroding metal alike with horrifying efficiency.",
      requires: "m_plague",
      synergy: "poison_dmg build mage's endgame. Shuts down enemy regen completely.",
    },
    // ── Gap fills: fire T2 ──
    {
      id: "m_pyroclasm", name: "Pyroclasm", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 3, damage: 1.7, element: "fire",
      description: "You erupt the ground in volcanic fury for 550% fire damage, the earth splitting open to release pillars of molten lava and superheated gas. The cataclysm consumes everything in a fiery apocalypse of magma and ash. The ground itself becomes your weapon.",
      requires: null, synergy: "Burning enemies take increased fire spell damage.",
    },
    // ── Gap fills: ice T5 ──
    {
      id: "m_frozen_eternity", name: "Frozen Eternity", tier: 5, levelReq: 75, cost: 6,
      mp: 165, cooldown: 6, damage: 4.8, element: "ice",
      description: "You cast the enemy into an eternity of ice for 750% ice damage, trapping them in a frozen moment that stretches on forever. Time itself freezes around them in an unbreakable prison of frost — they will remain suspended, conscious but immobile, until the ice thaws.",
      requires: "m_ice_prison", synergy: "Frozen enemies cannot regenerate health or mana.",
    },
    // ── Gap fills: lightning T1, T3, T6 ──
    {
      id: "m_spark_bolt", name: "Spark Bolt", tier: 1, levelReq: 7, cost: 2,
      mp: 32, cooldown: 2, damage: 1.3, element: "lightning",
      description: "You fire a crackling spark bolt for 120% lightning damage, the electrified projectile arcing through the air with blinding speed. It seeks its target with unerring precision, the static charge disrupting the enemy's nervous system on contact.",
      requires: null, synergy: "Has a chance to chain to a second target.",
    },
    {
      id: "m_voltaic_surge", name: "Voltaic Surge", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 4, damage: 2.2, element: "lightning",
      description: "You channel a massive surge of voltage for 300% lightning damage, electricity cascading from your fingertips in a devastating torrent of power. The enemy's body convulses as thousands of volts course through them, overwhelming every nerve.",
      requires: null, synergy: "Shocked enemies have reduced resistance to all elements.",
    },
    {
      id: "m_tempest_god", name: "Tempest Godform", tier: 6, levelReq: 94, cost: 8,
      mp: 235, cooldown: 8, damage: 8.0, element: "lightning",
      description: "You ascend to become the god of storms for 650% lightning damage, lightning wreathing your body as thunder obeys your every thought. The skies rage with your fury — a living tempest that strikes down everything with bolts of divine electricity.",
      requires: "m_ball_lightning", synergy: "All attacks gain lightning damage while transformed.",
    },
    // ── Gap fills: poison T2, T6 ──
    {
      id: "m_toxic_nova", name: "Toxic Nova", tier: 2, levelReq: 13, cost: 2,
      mp: 48, cooldown: 3, damage: 1.4, element: "poison",
      description: "You detonate a nova of pure concentrated toxin for 300% poison damage, a wave of corrosive poison expanding outward from your body. Everything it touches dissolves — armor, flesh, stone. The green wave of death spares nothing in its path.",
      requires: null, synergy: "Poisoned enemies spread toxins to nearby allies.",
    },
    {
      id: "m_pandemic_ritual", name: "Pandemic Ritual", tier: 6, levelReq: 92, cost: 7,
      mp: 205, cooldown: 7, damage: 7.0, element: "poison",
      description: "You perform a forbidden ritual of pestilence for 500% poison damage, burning plague sigils into the ground that release clouds of supernatural disease. The infection spreads to all nearby foes, growing more virulent with each victim it claims.",
      requires: "m_miasma", synergy: "Poison DOTs cannot be cleansed while ritual persists.",
    },
    // ── Gap fills: blood T2, T6 ──
    {
      id: "m_sanguine_lance", name: "Sanguine Lance", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 1.6, element: "blood",
      description: "You forge a lance of solidified blood from the air itself and hurl it for 200% blood damage. The crimson spear pierces deep, and living tendrils of blood energy burrow from the wound, draining life with each passing second.",
      requires: null, synergy: "Leech effect restores mana proportional to blood damage.",
    },
    {
      id: "m_blood_god", name: "Blood God's Dominion", tier: 6, levelReq: 93, cost: 8,
      mp: 240, cooldown: 8, damage: 8.5, element: "blood",
      description: "You channel the power of the blood god for 850% blood damage, your body becoming a conduit for the most ancient and terrible blood magic. Crimson energy swirls around you in a vortex of stolen life, and the very essence of life itself answers your dark command.",
      requires: "m_crimson_storm", synergy: "All damage dealt converts to healing at 50% rate.",
    },
    // ── Gap fills: sand T1, T6 ──
    {
      id: "m_sand_bolt", name: "Sand Bolt", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.1, element: "sand",
      description: "You fire a bolt of compressed, superheated sand for 120% sand damage. The abrasive projectile tears through the enemy on impact, releasing a burst of scouring particles that get into every gap in their armor and irritate every wound.",
      requires: null, synergy: "Sand damage erodes enemy armor over time.",
    },
    {
      id: "m_tomb_pharaoh", name: "Tomb Pharaoh's Curse", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.5, element: "sand",
      description: "You invoke the power of an ancient pharaoh for 800% sand damage, calling upon millennia of desert wisdom and the restless spirits of tomb guardians. The sands of the ancient world rise to your command, burying your enemies alive beneath a mountain of golden dust.",
      requires: "m_desert_wrath", synergy: "Cursed enemies take increased damage from all sand skills.",
    },

    // ── Support skills (Mage has the most) ──
    {
      id: "m_healing_light", name: "Healing Light", tier: 1, levelReq: 3, cost: 1,
      mp: 30, cooldown: 4, damage: 0, element: null,
      special: "heal", healPct: 0.20,
      description: "You channel a warm, golden light that flows through your body, restoring 20% of your HP as divine radiance mends your wounds. The gentle warmth soothes pain, knits torn flesh, and brings color back to your face. A beacon of hope in the darkness.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_greater_heal", name: "Greater Heal", tier: 3, levelReq: 28, cost: 3,
      mp: 65, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.35,
      description: "You cast a powerful healing spell that floods your body with life energy, restoring 35% of your HP. Even deep wounds close before your eyes as bones mend and blood replenishes. This is the power of true restoration — defying death itself.",
      requires: "m_healing_light", statScale: "intelligence",
    },
    {
      id: "m_arcane_barrier", name: "Arcane Barrier", tier: 2, levelReq: 10, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null,
      special: "shield", shieldPct: 0.25,
      description: "You weave an intricate arcane barrier from threads of pure magic, creating a shield that absorbs massive damage for 3 turns. Protective runes shimmer across its surface, growing brighter with each impact as the barrier converts destruction into magical energy.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_prismatic_ward", name: "Prismatic Ward", tier: 4, levelReq: 50, cost: 4,
      mp: 85, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.45,
      description: "You conjure a prismatic ward of all elements, a shimmering rainbow shield that grants resistance to every damage type for 3 turns. Fire, ice, lightning, poison — nothing can penetrate this wall of chromatic magic. The ultimate magical defense.",
      requires: "m_arcane_barrier", statScale: "intelligence",
    },
    {
      id: "m_mana_surge", name: "Mana Surge", tier: 2, levelReq: 12, cost: 2,
      mp: 15, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.30,
      description: "A surge of raw mana courses through your body like a river breaking through a dam, restoring 20% of your MP and boosting spell power for 2 turns. Your magical reserves overflow with crackling energy, and every spell you cast hits harder.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_mana_font", name: "Mana Font", tier: 4, levelReq: 48, cost: 4,
      mp: 10, cooldown: 6, damage: 0, element: null,
      special: "mana", manaPct: 0.50,
      description: "You tap into a font of infinite magical energy deep within the earth, restoring 30% MP and reducing all spell costs for 3 turns. Magic flows through you like an endless river — you can cast freely without worrying about exhaustion.",
      requires: "m_mana_surge", statScale: "intelligence",
    },
    {
      id: "m_elemental_attunement", name: "Elemental Attunement", tier: 3, levelReq: 30, cost: 3,
      mp: 55, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 40, crit_pct: 15 }, buffDuration: 4,
      description: "You attune your very soul to the primal elements, boosting all elemental damage by 25% for 3 turns. Fire burns hotter, ice freezes deeper, lightning strikes harder, and poison corrodes faster. Nature's forces answer your call with renewed, devastating vigor.",
      requires: null, statScale: "intelligence",
    },
    {
      id: "m_arcane_empowerment", name: "Arcane Empowerment", tier: 5, levelReq: 72, cost: 5,
      mp: 100, cooldown: 7, damage: 0, element: null,
      buffEffect: { atk_pct: 60, crit_pct: 25, def_pct: 20 }, buffDuration: 4,
      description: "You flood your body with pure arcane energy until you glow with otherworldly light, boosting all stats and spell damage for 4 turns. Raw magical power radiates from your very being — you are no longer merely a mage, but a force of nature.",
      requires: "m_elemental_attunement", statScale: "intelligence",
    },

  ],

  ranger: [
    // ── Tier 1 ──
    {
      id: "r_quick_shot", name: "Quick Shot", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.2, element: "physical",
      description: "You nock and release an arrow in the blink of an eye for 120% damage, the shaft leaving your bow before the enemy even sees you draw. Speed and precision are your greatest weapons — first to shoot, first to kill.",
      requires: null,
    },
    {
      id: "r_dodge_roll", name: "Dodge Roll", tier: 1, levelReq: 1, cost: 1,
      mp: 22, cooldown: 3, damage: 0, element: null, buff: "defense",
      buffEffect: { evasion: 30 }, buffDuration: 2,
      description: "You tuck into a swift dodge roll, your body flowing like water as attacks pass harmlessly through empty air. Your evasion increases by 30% for 2 turns. Arrows, blades, and spells all miss as you dance around danger with practiced grace.",
      requires: null,
      synergy: "High DEX characters benefit most since base evasion is already high.",
    },
    {
      id: "r_poison_shot", name: "Poison Shot", tier: 1, levelReq: 4, cost: 1,
      mp: 25, cooldown: 3, damage: 1.1, element: "poison",
      description: "You fire an arrow tipped with a deadly, fast-acting venom for 140% poison damage. The toxin is specially brewed to seep deep into the wound, dealing escalating damage over 3 turns as the poison spreads through the enemy's bloodstream.",
      requires: null,
      synergy: "poison_dmg % amplifies the DoT component each tick.",
    },
    {
      id: "r_fire_arrow", name: "Fire Arrow", tier: 1, levelReq: 6, cost: 2,
      mp: 32, cooldown: 3, damage: 1.4, element: "fire",
      description: "You loose a blazing arrow wreathed in hungry flames for 180% fire damage. The shaft ignites on release, trailing a line of embers across the sky before detonating on impact in a burst of fire that scorches everything nearby.",
      requires: "r_quick_shot",
      synergy: "fire_dmg % adds directly to each arrow's damage.",
    },

    // ── Tier 2 ──
    {
      id: "r_triple_shot", name: "Triple Shot", tier: 2, levelReq: 10, cost: 2,
      mp: 38, cooldown: 3, damage: 1.6, element: "physical",
      description: "You fire three arrows in rapid succession for 180% damage each, your fingers blurring across the bowstring with impossible speed. Before the first arrow lands, the second and third are already in the air. A triple punishment for a single target.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_frost_arrow", name: "Frost Arrow", tier: 2, levelReq: 11, cost: 2,
      mp: 42, cooldown: 4, damage: 1.5, element: "ice",
      description: "You release an arrow encased in crystalline ice for 160% ice damage. The frozen tip explodes on impact, spreading numbing cold through the target's body and slowing their movements as frost crystals form in their muscles.",
      requires: "r_poison_shot",
      synergy: "ice_dmg builds open a slow/kite playstyle.",
    },
    {
      id: "r_multishot", name: "Multishot", tier: 2, levelReq: 15, cost: 3,
      mp: 55, cooldown: 4, damage: 2.2, element: "physical",
      description: "You unleash a volley of arrows in a devastating wide spread for 220% damage, the sky darkening as dozens of shafts fill the air. Every enemy in range takes a punishing hit — there's nowhere to run, nowhere to hide from the rain of steel.",
      requires: "r_triple_shot",
    },
    {
      id: "r_lightning_arrow", name: "Lightning Arrow", tier: 2, levelReq: 13, cost: 3,
      mp: 50, cooldown: 4, damage: 1.8, element: "lightning",
      description: "You fire a lightning-charged arrow that streaks across the sky like a thunderbolt for 200% lightning damage. The electrified shaft impacts with a deafening crack, sending arcs of electricity cascading through the target's body.",
      requires: "r_fire_arrow",
      synergy: "lightning_dmg % makes chain attacks more powerful.",
    },

    // ── Tier 3 ──
    {
      id: "r_eagle_eye", name: "Eagle Eye", tier: 3, levelReq: 25, cost: 3,
      mp: 50, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { crit_pct: 25, accuracy: 20 }, buffDuration: 3,
      description: "You focus your vision with the supernatural precision of an eagle, the world sharpening into crystal clarity. Critical hit chance increases by 25% and accuracy is boosted for 3 turns. You can see the gaps in their armor, the pulse in their neck, every weakness.",
      requires: "r_frost_arrow",
      synergy: "High LUK + Eagle Eye = near-100% crit window.",
    },
    {
      id: "r_traps", name: "Lay Traps", tier: 3, levelReq: 28, cost: 3,
      mp: 60, cooldown: 5, damage: 1.8, element: "physical",
      description: "You scatter a network of deadly traps across the battlefield for 250% damage. Hidden beneath leaves and dust, they wait for unwary feet. The explosions of shrapnel and poison catch enemies mid-stride, immobilizing and wounding them.",
      requires: "r_multishot",
    },
    {
      id: "r_sand_trap", name: "Sand Trap", tier: 3, levelReq: 27, cost: 3,
      mp: 58, cooldown: 5, damage: 1.6, element: "sand",
      description: "You set a cunning sand trap that lies hidden beneath the surface for 200% sand damage when triggered. The trap erupts in a geyser of blinding sand, engulfing the enemy and slowing them as grit fills their eyes, mouth, and armor joints.",
      requires: "r_lightning_arrow",
      synergy: "sand_dmg % amplifies this + the blind synergizes with evasion builds.",
    },
    {
      id: "r_arrow_rain", name: "Rain of Arrows", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 5, damage: 2.8, element: "physical",
      description: "You fire arrows high into the sky in a graceful arc, raining them down for 350% damage across a wide area. The barrage falls like a deadly curtain — there is no cover, no shelter, nowhere to hide from the merciless rain of shafts.",
      requires: "r_traps",
    },

    // ── Tier 4 ──
    {
      id: "r_hunters_mark", name: "Hunter's Mark", tier: 4, levelReq: 45, cost: 4,
      mp: 70, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { enemy_dmg_taken: 25 }, buffDuration: 3,
      description: "You mark the target with a glowing hunter's sigil that only you can see, increasing all damage they take by 25% for 3 turns. The mark reveals every vulnerability, every weak point. The prey has been chosen — the hunt begins.",
      requires: "r_eagle_eye",
    },
    {
      id: "r_blood_arrow", name: "Blood Arrow", tier: 4, levelReq: 47, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "blood",
      description: "You fire a crimson-tipped arrow blessed with dark blood magic for 200% blood damage. The arrow drinks the enemy's blood on impact, crimson tendrils of energy flowing back along its path to feed you their stolen life force.",
      requires: "r_sand_trap",
      synergy: "blood_dmg % stacks with the lifesteal component.",
    },
    {
      id: "r_volley", name: "Volley Barrage", tier: 4, levelReq: 50, cost: 5,
      mp: 115, cooldown: 5, damage: 3.8, element: "physical",
      description: "You fire a devastating volley of arrows for 380% damage, each shaft precisely aimed at a vital point. The sky darkens as countless arrows arc toward the enemy in a beautiful but deadly parabola. A master archer's signature technique.",
      requires: "r_arrow_rain",
    },
    {
      id: "r_shadow_step", name: "Shadow Step", tier: 4, levelReq: 55, cost: 4,
      mp: 90, cooldown: 5, damage: 2.5, element: "physical",
      description: "You vanish into the shadows like smoke, reappearing behind the enemy for 250% damage with your blade at their throat. They spin around too late — the killing blow was delivered before they even registered your absence from the front.",
      requires: "r_hunters_mark",
    },

    // ── Tier 5 ──
    {
      id: "r_death_arrow", name: "Death Arrow", tier: 5, levelReq: 70, cost: 5,
      mp: 150, cooldown: 6, damage: 5.0, element: "physical",
      description: "You loose the arrow of death itself for 500% damage — a black-feathered shaft that seems to drink the light around it. The arrow flies with supernatural accuracy, carrying certain doom to its target. When the death arrow is loosed, nothing can save them.",
      requires: "r_hunters_mark",
    },
    {
      id: "r_storm_bow", name: "Storm Bow", tier: 5, levelReq: 75, cost: 6,
      mp: 170, cooldown: 6, damage: 4.5, element: "lightning",
      description: "You channel the power of a raging tempest through your bow for 350% lightning damage, each arrow carrying the fury of a thunderstorm. The bowstring crackles with electricity as you draw, and each shot lands with the force of a lightning strike.",
      requires: "r_volley",
      synergy: "lightning_dmg build here is the highest-damage ranger path.",
    },
    {
      id: "r_wrath_of_hunt", name: "Wrath of the Hunt", tier: 5, levelReq: 80, cost: 5,
      mp: 165, cooldown: 6, damage: 6.0, element: "physical",
      description: "You call upon the primal wrath of the hunt for 800% damage, nature's fury manifesting as a devastating rain of spectral arrows. The spirits of every hunter who ever lived guide your aim as arrows of pure light descend from the sky in judgment.",
      requires: "r_shadow_step",
    },

    // ── New Tier 2 fills ──
    {
      id: "r_nature_bond", name: "Nature's Bond", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 4, damage: 0, element: null, buff: "defense",
      buffEffect: { hp_regen: 15 }, buffDuration: 3,
      description: "You forge a deep bond with the living forest around you, drawing on nature's healing energy to regenerate 15% HP over 3 turns. Roots and vines gently wrap around your wounds, leaves glow with warm green light, and the pain slowly fades.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_explosive_arrow", name: "Explosive Arrow", tier: 2, levelReq: 14, cost: 3,
      mp: 48, cooldown: 4, damage: 2.0, element: "fire",
      description: "You fire an arrow packed with volatile alchemical compounds for 280% fire damage. The arrowhead is a tiny bomb — on impact it detonates with devastating force, sending shrapnel and fire in every direction. A ranger's answer to heavy armor.",
      requires: "r_fire_arrow",
      synergy: "fire_dmg % makes this a strong AoE option for fire ranger builds.",
    },

    // ── New Tier 3 fills ──
    {
      id: "r_wind_walk", name: "Wind Walk", tier: 3, levelReq: 26, cost: 3,
      mp: 55, cooldown: 5, damage: 0, element: null, buff: "defense",
      buffEffect: { evasion: 35, atk_speed: 20 }, buffDuration: 3,
      description: "You become one with the wind, your body growing lighter as invisible currents lift your steps. Speed and evasion increase by 35% for 3 turns. You move like a breeze through the battlefield, untouchable and almost invisible.",
      requires: "r_dodge_roll",
    },
    {
      id: "r_venom_rain", name: "Venom Rain", tier: 3, levelReq: 29, cost: 3,
      mp: 70, cooldown: 5, damage: 1.8, element: "poison",
      description: "You fire a volley of poison-tipped arrows high into the sky for 280% poison damage. The toxic rain descends mercilessly, each arrow delivering its deadly payload. The poison seeps into every wound for 3 turns, a death sentence from above.",
      requires: "r_poison_shot",
      synergy: "poison_dmg % amplifies each tick. AoE poison build core skill.",
    },
    {
      id: "r_snipe", name: "Snipe", tier: 3, levelReq: 32, cost: 4,
      mp: 75, cooldown: 5, damage: 3.2, element: "physical",
      description: "You line up a perfect shot, steadying your breath and stilling your heartbeat before releasing for 400% damage with a guaranteed critical hit. One shot, one kill. This is the patient hunter's ultimate reward — absolute lethality.",
      requires: "r_triple_shot",
    },

    // ── New Tier 4 fills ──
    {
      id: "r_elemental_quiver", name: "Elemental Quiver", tier: 4, levelReq: 48, cost: 4,
      mp: 85, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { all_dmg: 30 }, buffDuration: 4,
      description: "You enchant your quiver with swirling elemental energy, every arrow now crackling with magical power. All arrow damage increases by 30% for 4 turns. Fire, ice, and lightning dance along each shaft, eager to be unleashed.",
      requires: "r_eagle_eye",
    },
    {
      id: "r_piercing_shot", name: "Piercing Shot", tier: 4, levelReq: 53, cost: 5,
      mp: 100, cooldown: 5, damage: 3.5, element: "physical",
      description: "You fire a shot with such tremendous force that it punches clean through the enemy's defenses for 350% damage, ignoring 30% of their armor. The arrow doesn't stop at the surface — it drives through shield, plate, and bone.",
      requires: "r_arrow_rain",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "r_spirit_of_the_wild", name: "Spirit of the Wild", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 0, element: null, buff: "attack",
      buffEffect: { atk_pct: 50, crit_pct: 25 }, buffDuration: 4,
      description: "You invoke the ancient spirit of the wild, and the primal beast within you awakens with a roar. Your attack power surges by 50% and critical chance by 25% for 4 turns. Your eyes glow with feral intensity as instinct sharpens every sense.",
      requires: "r_wrath_of_hunt",
    },
    {
      id: "r_celestial_barrage", name: "Celestial Barrage", tier: 6, levelReq: 93, cost: 8,
      mp: 260, cooldown: 8, damage: 9.0, element: "lightning",
      description: "You unleash a barrage of starlight arrows for 500% damage, each glowing shaft pulling its energy from the stars above. The arrows rain down in streams of silver light, celestial energy punishing the enemy with the cold fury of the cosmos.",
      requires: "r_storm_bow",
      synergy: "lightning_dmg build ranger's ultimate. Combine with Elemental Quiver.",
    },
    {
      id: "r_natures_wrath", name: "Nature's Wrath", tier: 6, levelReq: 95, cost: 7,
      mp: 220, cooldown: 7, damage: 7.5, element: "poison",
      description: "You channel nature's wrath through your bow for 400% poison damage, the arrow sprouting thorns and vines on impact. Living plants erupt from the wound, entangling and poisoning the enemy as nature herself punishes their existence.",
      requires: "r_death_arrow",
      synergy: "poison_dmg build ranger's endgame. Devastating sustained damage.",
    },

    // ── New Arcane skills ──
    {
      id: "r_arcane_arrow", name: "Arcane Arrow", tier: 1, levelReq: 7, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "arcane",
      description: "You fire an arrow infused with shimmering arcane energy for 130% arcane damage. The shaft phases through physical defenses as if they don't exist, striking the enemy's magical essence directly. No armor can protect against this otherworldly projectile.",
      requires: null,
      synergy: "Opens the mystic archer path. Pairs with Ethereal Volley.",
    },
    {
      id: "r_mystic_shot", name: "Mystic Shot", tier: 2, levelReq: 14, cost: 3,
      mp: 52, cooldown: 4, damage: 1.8, element: "arcane",
      description: "You loose a mystical arrow that bends and curves through the air for 200% arcane damage, defying the laws of physics to find its mark. The shot travels through impossible angles, phasing through walls and barriers to reach the target.",
      requires: "r_arcane_arrow",
    },
    {
      id: "r_ethereal_volley", name: "Ethereal Volley", tier: 3, levelReq: 31, cost: 4,
      mp: 82, cooldown: 5, damage: 2.5, element: "arcane",
      description: "You fire a volley of ghostly, ethereal arrows for 320% arcane damage. The spectral shafts pass through physical armor like it isn't there, striking the soul directly. No shield can block what exists between dimensions.",
      requires: "r_mystic_shot",
      synergy: "Core arcane ranger skill. Pairs with Astral Barrage for full arcane build.",
    },
    {
      id: "r_astral_barrage", name: "Astral Barrage", tier: 4, levelReq: 53, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "arcane",
      description: "You unleash a barrage of astral arrows for 500% arcane damage, each shaft tearing through the barriers between worlds. Reality warps and shimmers around the impact zone as dimensional energy rips the enemy apart at a fundamental level.",
      requires: "r_ethereal_volley",
    },

    // ── New Ice skills ──
    {
      id: "r_frozen_shot", name: "Frozen Shot", tier: 3, levelReq: 28, cost: 3,
      mp: 72, cooldown: 5, damage: 2.0, element: "ice",
      description: "You fire an arrow of pure, crystalline ice for 200% ice damage. The frozen projectile shatters on impact, driving razor-sharp ice shards deep into the wound. The target's limbs go numb as frost spreads rapidly from the point of entry.",
      requires: "r_frost_arrow",
      synergy: "ice_dmg % adds. Pairs with Frost Arrow for ice kite build.",
    },
    {
      id: "r_glacial_rain", name: "Glacial Rain", tier: 4, levelReq: 51, cost: 5,
      mp: 115, cooldown: 5, damage: 3.0, element: "ice",
      description: "You rain frozen arrows from the winter sky for 350% ice damage, each shaft encased in glacial ice that shatters into a thousand frozen fragments on impact. The battlefield becomes a frozen wasteland as ice covers everything in a deadly white shroud.",
      requires: "r_frozen_shot",
    },
    {
      id: "r_absolute_winter", name: "Absolute Winter", tier: 5, levelReq: 74, cost: 6,
      mp: 170, cooldown: 6, damage: 5.0, element: "ice",
      description: "You call upon the very heart of winter for 500% ice damage, unleashing a devastating blizzard of ice arrows that freezes everything solid. The cold is so absolute that the air itself crystallizes, trapping enemies in tombs of unbreakable frost.",
      requires: "r_glacial_rain",
      synergy: "ice_dmg build ranger's endgame. Complete freeze + massive damage.",
    },

    // ── New Blood skills ──
    {
      id: "r_crimson_arrow", name: "Crimson Arrow", tier: 2, levelReq: 13, cost: 2,
      mp: 48, cooldown: 4, damage: 1.5, element: "blood",
      description: "You fire a blood-red arrow pulsing with dark sanguine magic for 150% blood damage. The crimson shaft drinks deep on impact, siphoning life force through the shaft and back to you. Each hit sustains the hunter while weakening the prey.",
      requires: null,
      synergy: "blood_dmg % amplifies DoT. Opens blood ranger path.",
    },
    {
      id: "r_hemorrhage_shot", name: "Hemorrhage Shot", tier: 3, levelReq: 29, cost: 3,
      mp: 75, cooldown: 5, damage: 2.2, element: "blood",
      description: "You strike a critical artery with inhuman accuracy for 220% blood damage, the arrow puncturing the exact spot where blood flows fastest. The wound bleeds profusely and cannot be staunched, draining the enemy with every frantic heartbeat.",
      requires: "r_crimson_arrow",
    },
    {
      id: "r_sanguine_barrage", name: "Sanguine Barrage", tier: 5, levelReq: 73, cost: 6,
      mp: 175, cooldown: 6, damage: 5.5, element: "blood",
      description: "You unleash a barrage of blood-magic arrows for 450% blood damage, each shaft feeding on the enemy's life force. The crimson volley heals you with every hit, the stolen vitality flowing back as warm, sustaining energy.",
      requires: "r_blood_arrow",
      synergy: "blood_dmg build ranger's ultimate. Sustain + burst in one skill.",
    },

    // ── New Sand skills ──
    {
      id: "r_dust_devil_arrow", name: "Dust Devil Arrow", tier: 2, levelReq: 12, cost: 2,
      mp: 45, cooldown: 4, damage: 1.4, element: "sand",
      description: "You fire an arrow that conjures a howling dust devil on impact for 150% sand damage. The spinning vortex of sand and wind engulfs the target, scouring their body with abrasive particles and blinding them completely.",
      requires: null,
    },
    {
      id: "r_sandstorm_volley", name: "Sandstorm Volley", tier: 4, levelReq: 49, cost: 4,
      mp: 108, cooldown: 5, damage: 2.8, element: "sand",
      description: "You fire a volley of sand-charged arrows for 300% sand damage, each shaft erupting into a miniature sandstorm on impact. The combined storms merge into a blinding, shredding maelstrom that tears through armor and flesh alike.",
      requires: "r_sand_trap",
      synergy: "sand_dmg % stacks. Pairs with Sand Trap for full sand build.",
    },
    {
      id: "r_desert_judgment", name: "Desert Judgment", tier: 5, levelReq: 76, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "sand",
      description: "You deliver the judgment of the ancient desert for 500% sand damage, spirit arrows guided by the hands of long-dead pharaohs. The sands rise and the winds howl as desert spirits punish the unworthy with ruthless, sandy vengeance.",
      requires: "r_sandstorm_volley",
    },

    // ── New Fire fills ──
    {
      id: "r_inferno_rain", name: "Inferno Rain", tier: 3, levelReq: 30, cost: 4,
      mp: 80, cooldown: 5, damage: 2.5, element: "fire",
      description: "You rain fire arrows from the sky for 450% fire damage, each shaft igniting on its downward arc and striking the earth in a shower of flames. The battlefield erupts into an inferno as fire pools and spreads with every burning impact.",
      requires: "r_explosive_arrow",
      synergy: "fire_dmg % amplifies both hit and burn. Core fire ranger skill.",
    },
    {
      id: "r_phoenix_arrow", name: "Phoenix Arrow", tier: 5, levelReq: 72, cost: 6,
      mp: 168, cooldown: 6, damage: 5.0, element: "fire",
      description: "You fire an arrow wreathed in the mythical flames of a phoenix for 600% fire damage. The immortal fire consumes the enemy with relentless hunger — these flames cannot be extinguished, cannot be quenched. They burn until nothing remains.",
      requires: "r_inferno_rain",
    },

    // ── New Lightning fills ──
    {
      id: "r_thunderbolt_arrow", name: "Thunderbolt Arrow", tier: 4, levelReq: 52, cost: 5,
      mp: 118, cooldown: 5, damage: 3.2, element: "lightning",
      description: "You loose a thunderbolt arrow that cracks the sky open for 320% lightning damage. The shaft flies faster than sound, and the sonic boom alone staggers nearby enemies. On impact, electricity arcs outward in a devastating chain of lightning.",
      requires: "r_lightning_arrow",
      synergy: "lightning_dmg % makes chains devastating. Pairs with Storm Bow.",
    },
    // ── Gap fills: physical T6 ──
    {
      id: "r_apex_predator", name: "Apex Predator", tier: 6, levelReq: 92, cost: 7,
      mp: 220, cooldown: 7, damage: 8.0, element: "physical",
      description: "You become the apex predator of the battlefield for 700% damage, your every instinct sharpened to a razor's edge. Your eyes track movement invisible to others, your shots find vital points with mechanical precision. You are the top of the food chain.",
      requires: null, synergy: "Critical hit rate doubled for the next attack.",
    },
    // ── Gap fills: fire T4, T6 ──
    {
      id: "r_blazing_volley", name: "Blazing Volley", tier: 4, levelReq: 50, cost: 5,
      mp: 105, cooldown: 5, damage: 3.0, element: "fire",
      description: "You unleash a volley of fire arrows for 300% fire damage, each shaft trailing flames as they arc through the sky. The cascade of fire turns the air itself into a furnace, and the ground below becomes a carpet of smoldering embers.",
      requires: null, synergy: "Burning targets take bonus damage from subsequent arrows.",
    },
    {
      id: "r_phoenix_rain", name: "Phoenix Rain", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.0, element: "fire",
      description: "You rain phoenix-fire arrows from the heavens for 700% fire damage, each shaft carrying the immortal flames of rebirth. The divine fire seeks out enemies with a will of its own, burning eternally until every last foe has been consumed.",
      requires: "r_phoenix_arrow", synergy: "Enemies killed by fire have a chance to explode.",
    },
    // ── Gap fills: ice T1, T6 ──
    {
      id: "r_frost_tip", name: "Frost Tip", tier: 1, levelReq: 5, cost: 1,
      mp: 22, cooldown: 2, damage: 1.1, element: "ice",
      description: "You fire a frost-tipped arrow for 150% ice damage, the frozen point shattering on impact into dozens of razor-sharp ice fragments. The shards embed deep in the wound, continuing to freeze the enemy from the inside out.",
      requires: null, synergy: "Chilled enemies move and attack slower.",
    },
    {
      id: "r_arctic_oblivion", name: "Arctic Oblivion", tier: 6, levelReq: 93, cost: 8,
      mp: 225, cooldown: 7, damage: 8.0, element: "ice",
      description: "You call upon arctic oblivion for 550% ice damage, a frozen wasteland spreading from the arrow's impact point. Enemies are entombed in walls of ice so thick that sunlight cannot penetrate them. An arctic tomb from which there is no escape.",
      requires: "r_absolute_winter", synergy: "Frozen enemies shatter for area damage.",
    },
    // ── Gap fills: lightning T1, T3 ──
    {
      id: "r_static_arrow", name: "Static Arrow", tier: 1, levelReq: 7, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "lightning",
      description: "You fire an electrically charged arrow for 140% lightning damage, static sparks trailing behind the shaft as it flies. On impact, the charge arcs to nearby enemies, chaining the electrical damage to anyone standing too close.",
      requires: null, synergy: "Shocked enemies have a chance to drop extra loot.",
    },
    {
      id: "r_storm_volley", name: "Storm Volley", tier: 3, levelReq: 28, cost: 3,
      mp: 68, cooldown: 4, damage: 2.0, element: "lightning",
      description: "You unleash a volley of storm-charged arrows for 200% lightning damage, each shaft crackling with electrical energy. Thunder roars as every electrified arrow finds its mark, the combined voltage creating a devastating electrical storm.",
      requires: null, synergy: "Each arrow has independent stun chance.",
    },
    // ── Gap fills: poison T2, T4, T5 ──
    {
      id: "r_toxic_barb", name: "Toxic Barb", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 3, damage: 1.4, element: "poison",
      description: "You fire a barbed arrow dripping with slow-acting but lethal toxin for 140% poison damage. The barbs lodge deep in the flesh, impossible to remove without causing more damage, steadily releasing their poison payload over time.",
      requires: null, synergy: "Poison stacks with each consecutive hit.",
    },
    {
      id: "r_blight_arrow", name: "Blight Arrow", tier: 4, levelReq: 48, cost: 4,
      mp: 95, cooldown: 5, damage: 2.8, element: "poison",
      description: "You loose an arrow of pure blight for 250% poison damage, the shaft corrupted with dark nature magic. The corruption spreads rapidly from the wound, decaying flesh and spirit alike as the blight consumes everything it touches.",
      requires: null, synergy: "Blighted enemies take increasing damage over time.",
    },
    {
      id: "r_plague_rain", name: "Plague Rain", tier: 5, levelReq: 73, cost: 5,
      mp: 145, cooldown: 6, damage: 4.2, element: "poison",
      description: "You rain plague-carrying arrows across the battlefield for 450% poison damage. A pestilent cloud rises from each impact point, the infections merging into a suffocating fog of disease that spreads to everyone caught within it.",
      requires: "r_blight_arrow", synergy: "Poison spreads to nearby enemies on target death.",
    },
    // ── Gap fills: blood T1, T6 ──
    {
      id: "r_bloodthorn_arrow", name: "Bloodthorn Arrow", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.2, element: "blood",
      description: "You fire a thorn-covered arrow that drinks blood for 250% blood damage. On impact, living thorns burrow deeper into the wound, each thorn siphoning life force back to you through dark sympathetic magic. A parasitic arrow of terrible design.",
      requires: null, synergy: "Leeches a small amount of health on hit.",
    },
    {
      id: "r_crimson_apocalypse", name: "Crimson Apocalypse", tier: 6, levelReq: 94, cost: 8,
      mp: 240, cooldown: 8, damage: 8.5, element: "blood",
      description: "You unleash a crimson apocalypse for 750% blood damage, the sky turning red as an unholy rain of blood arrows descends upon the battlefield. Each arrow drains the life force from its victim, feeding an ever-growing storm of sanguine destruction.",
      requires: "r_sanguine_barrage", synergy: "Each hit heals the ranger and increases blood damage.",
    },
    // ── Gap fills: sand T1, T6 ──
    {
      id: "r_desert_arrow", name: "Desert Arrow", tier: 1, levelReq: 5, cost: 1,
      mp: 25, cooldown: 2, damage: 1.0, element: "sand",
      description: "You fire a sand-infused arrow for 100% sand damage, the shaft packed with compressed desert grit. On impact, the arrow dissolves into a burst of scouring sand that gets into every gap in the enemy's armor, irritating wounds and blinding eyes.",
      requires: null, synergy: "Blinded enemies have reduced hit chance.",
    },
    {
      id: "r_sirocco_storm", name: "Sirocco Storm", tier: 6, levelReq: 92, cost: 7,
      mp: 215, cooldown: 7, damage: 7.5, element: "sand",
      description: "You summon the scorching sirocco wind for 400% sand damage, the hot desert gale carrying arrows of hardened sand at blistering speed. The wind flays everything it touches, stripping paint from shields and skin from bones.",
      requires: "r_desert_judgment", synergy: "Sand-slowed enemies cannot evade attacks.",
    },
    // ── Gap fills: arcane T5, T6 ──
    {
      id: "r_cosmic_shot", name: "Cosmic Shot", tier: 5, levelReq: 75, cost: 6,
      mp: 155, cooldown: 6, damage: 4.5, element: "arcane",
      description: "You fire an arrow charged with the energy of distant stars for 200% arcane damage. The shot bends space-time on impact, creating a localized gravity anomaly that warps the enemy's body and disrupts their magical defenses.",
      requires: "r_astral_barrage", synergy: "Arcane arrows ignore a portion of enemy resistance.",
    },
    {
      id: "r_void_hunter", name: "Void Hunter's Barrage", tier: 6, levelReq: 93, cost: 8,
      mp: 250, cooldown: 8, damage: 9.0, element: "arcane",
      description: "You hunt through the void between dimensions for 500% arcane damage, your arrows phasing in and out of reality to strike from impossible angles. They cannot be dodged, cannot be blocked — the void delivers them with absolute certainty.",
      requires: "r_cosmic_shot", synergy: "Attacks from the void cannot be blocked or dodged.",
    },

    // ── Support skills ──
    {
      id: "r_natures_touch", name: "Nature's Touch", tier: 2, levelReq: 12, cost: 2,
      mp: 40, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.18,
      description: "The gentle touch of nature heals your wounds with maternal care, restoring 20% HP over 3 turns. Leaves and flowers bloom around you as warm green energy flows in, mending torn flesh and soothing aching bones. The forest protects its own.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "r_focused_aim", name: "Focused Aim", tier: 3, levelReq: 28, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      buffEffect: { crit_pct: 25, atk_pct: 20 }, buffDuration: 3,
      description: "You enter a state of absolute focus, the world narrowing to just you and your target. Accuracy and critical damage increase by 30% for 3 turns. Time seems to slow as your aim becomes mathematically perfect — every shot finds the vital point.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "r_meditate", name: "Meditate", tier: 2, levelReq: 14, cost: 2,
      mp: 15, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.25,
      description: "You clear your mind in deep meditation, finding inner peace amidst the chaos of battle. Your MP restores by 25% and evasion increases by 20% for 2 turns. With clarity comes agility — a calm mind makes the body faster.",
      requires: null,
    },
    {
      id: "r_pack_leader", name: "Pack Leader", tier: 4, levelReq: 50, cost: 4,
      mp: 75, cooldown: 7, damage: 0, element: null,
      special: "group_heal", healPct: 0.15,
      buffEffect: { atk_pct: 15, crit_pct: 10 }, buffDuration: 3,
      description: "You rally your companions as the pack leader, your commanding presence inspiring everyone to fight harder. The party's attack and speed increase for 3 turns. Under your leadership, even the weakest link becomes a formidable threat.",
      requires: "r_natures_touch",
    },

  ],

  rogue: [
    // ── Tier 1 ──
    {
      id: "ro_quick_slash", name: "Quick Slash", tier: 1, levelReq: 1, cost: 1,
      mp: 18, cooldown: 2, damage: 1.3, element: "physical",
      description: "You dart forward with blinding speed, your blade a silver blur as you slice the enemy for 110% damage before they can even register your approach. You're already back in the shadows before the blood starts flowing. In and out, like a phantom.",
      requires: null,
    },
    {
      id: "ro_smoke_bomb", name: "Smoke Bomb", tier: 1, levelReq: 1, cost: 1,
      mp: 25, cooldown: 3, damage: 0, element: null, buff: "defense",
      buffEffect: { evasion: 40 }, buffDuration: 2,
      description: "You hurl a smoke bomb at your feet, the device erupting in a thick cloud of acrid, choking smoke. You vanish completely as your evasion soars by 40% for 2 turns — enemies swing wildly at shadows and smoke, hitting nothing but empty air.",
      requires: null,
    },
    {
      id: "ro_poison_blade", name: "Poison Blade", tier: 1, levelReq: 4, cost: 1,
      mp: 28, cooldown: 3, damage: 1.1, element: "poison",
      description: "You coat your blade in a lethal, fast-acting venom that glistens in the light, then slash for 140% poison damage. The toxin works with terrifying speed, burning through the enemy's veins like liquid fire. Each heartbeat spreads it further.",
      requires: null,
      synergy: "poison_dmg % amplifies every DoT tick. Stack poison items for max DoT.",
    },
    {
      id: "ro_backstab", name: "Backstab", tier: 1, levelReq: 5, cost: 2,
      mp: 32, cooldown: 3, damage: 2.0, element: "physical",
      description: "You slip behind the enemy with cat-like silence and drive your blade deep into their spine for 200% damage. The unseen strike deals devastating critical damage — they never hear you coming, never feel the blade until it's already buried to the hilt.",
      requires: "ro_quick_slash",
      synergy: "LUK amplifies crit multiplier. Best opener in any rotation.",
    },

    // ── Tier 2 ──
    {
      id: "ro_open_wounds", name: "Open Wounds", tier: 2, levelReq: 10, cost: 2,
      mp: 38, cooldown: 4, damage: 1.4, element: "blood",
      description: "You carve deep, vicious gashes for 160% blood damage, each cut deliberately placed to prevent healing. The wounds refuse to close, steadily draining the enemy's strength as blood flows freely. A surgeon's precision applied to destruction.",
      requires: "ro_smoke_bomb",
      synergy: "blood_dmg % amplifies each DoT tick. Stacks with Open Wounds + Blood Frenzy.",
    },
    {
      id: "ro_pickpocket", name: "Pickpocket", tier: 2, levelReq: 12, cost: 2,
      mp: 28, cooldown: 4, damage: 1.0, element: "physical", special: "pickpocket",
      description: "You strike with the sleight of hand of a master thief for 100% damage, your nimble fingers stealing the enemy's buffs and resources in the same fluid motion. What was theirs is now yours — they won't even realize what they've lost until it's too late.",
      requires: null,
      synergy: "High LUK = more gold stolen per use.",
    },
    {
      id: "ro_frost_strike", name: "Frost Strike", tier: 2, levelReq: 11, cost: 2,
      mp: 38, cooldown: 3, damage: 1.5, element: "ice",
      description: "You strike with a blade coated in crystalline ice for 160% ice damage, the frozen edge so cold it burns on contact. The enemy's muscles seize and slow as frost spreads from the wound, numbing their body and dulling their reactions.",
      requires: "ro_poison_blade",
      synergy: "ice_dmg % + slow enables safe followup turns.",
    },
    {
      id: "ro_lightning_step", name: "Lightning Step", tier: 2, levelReq: 14, cost: 3,
      mp: 45, cooldown: 4, damage: 1.6, element: "lightning",
      description: "You teleport across the battlefield in a flash of crackling lightning, appearing behind the enemy for 200% lightning damage. All they see is a bright flash, then searing pain as your electrified blade connects. Speed is the rogue's greatest weapon.",
      requires: "ro_backstab",
      synergy: "lightning_dmg % boosts damage. Good mobility opener.",
    },

    // ── Tier 3 ──
    {
      id: "ro_blade_dance", name: "Blade Dance", tier: 3, levelReq: 25, cost: 3,
      mp: 65, cooldown: 4, damage: 2.2, element: "physical",
      description: "You spin into a mesmerizing, hypnotic dance of flashing blades for 220% damage. Every step is lethal, every pirouette a killing stroke. Your body becomes a whirlwind of steel and death that cuts through everything within reach.",
      requires: "ro_open_wounds",
    },
    {
      id: "ro_garrote", name: "Garrote", tier: 3, levelReq: 28, cost: 3,
      mp: 62, cooldown: 5, damage: 1.8, element: "blood",
      description: "You wrap a razor-thin wire around the enemy's throat for 250% damage, pulling it tight with merciless force. They choke and gasp, silenced and unable to cast spells for 2 turns. No incantation can escape lips that can't draw breath.",
      requires: "ro_pickpocket",
      synergy: "blood_dmg % makes garrote a strong utility+damage combo.",
    },
    {
      id: "ro_sand_blind", name: "Sand Blind", tier: 3, levelReq: 27, cost: 3,
      mp: 55, cooldown: 5, damage: 1.2, element: "sand",
      description: "You fling a handful of coarse sand directly into the enemy's eyes for 100% sand damage. Blinded and disoriented, they stumble and flail helplessly, unable to see your next attack coming. A dirty trick, but effectiveness beats honor.",
      requires: "ro_frost_strike",
      synergy: "sand_dmg % amplifies. Combined with evasion = near-untouchable turns.",
    },
    {
      id: "ro_shadow_strike", name: "Shadow Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 78, cooldown: 4, damage: 2.8, element: "physical",
      description: "You emerge from the shadows like a wraith, delivering a devastating strike for 300% damage before melting back into darkness. The enemy never sees the blade that cuts them down — only the spray of blood marks where you passed.",
      requires: "ro_lightning_step",
    },

    // ── Tier 4 ──
    {
      id: "ro_blood_frenzy", name: "Blood Frenzy", tier: 4, levelReq: 45, cost: 4,
      mp: 95, cooldown: 5, damage: 2.5, element: "blood",
      description: "You enter a blood-crazed frenzy, your eyes wild and your blades moving faster than thought for 250% blood damage. Each cut feeds your hunger for more — the more blood you draw, the faster you become. A terrifying spiral of violence.",
      requires: "ro_blade_dance",
      synergy: "blood_dmg % is fully applied per hit. Combine with Open Wounds DoT.",
    },
    {
      id: "ro_death_mark", name: "Death Mark", tier: 4, levelReq: 45, cost: 4,
      mp: 88, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { enemy_dmg_taken: 30 }, buffDuration: 3,
      description: "You mark the enemy for death with an invisible sigil that only the shadows can see, increasing all damage they take by 30% for 3 turns. The mark reveals every weakness, every opening. The condemned cannot escape their fate — death always collects.",
      requires: "ro_garrote",
    },
    {
      id: "ro_assassinate", name: "Assassinate", tier: 4, levelReq: 50, cost: 5,
      mp: 120, cooldown: 5, damage: 4.0, element: "physical",
      description: "You execute a flawless assassination for 400% damage — the culmination of years of training distilled into one perfect strike. A single, clean thrust to the vital point, delivered with surgical precision. Swift, silent, and absolutely lethal.",
      requires: "ro_shadow_strike",
    },
    {
      id: "ro_shadow_realm_entry", name: "Shadow Walk", tier: 4, levelReq: 55, cost: 4,
      mp: 105, cooldown: 5, damage: 0, element: null, buff: "defense",
      buffEffect: { stealth: 1, next_dmg: 100 }, buffDuration: 3,
      description: "You step through the veil into the shadow realm, your body becoming transparent as you exist between worlds for 3 turns. Completely invisible to mortal eyes, your next attack from stealth deals double damage. They cannot fight what they cannot see.",
      requires: "ro_sand_blind",
    },

    // ── Tier 5 ──
    {
      id: "ro_oblivion", name: "Oblivion Blade", tier: 5, levelReq: 70, cost: 5,
      mp: 165, cooldown: 6, damage: 5.5, element: "physical",
      description: "You erase the enemy from existence for 700% damage, delivering a single perfect strike that unmakes everything it touches. The wound doesn't bleed — it simply ceases to exist, as if the flesh was never there. There is only the void now.",
      requires: "ro_blood_frenzy",
    },
    {
      id: "ro_phantom", name: "Phantom Rogue", tier: 5, levelReq: 75, cost: 5,
      mp: 155, cooldown: 6, damage: 0, element: null, buff: "defense",
      buffEffect: { evasion: 50, ignore_def: 1 }, buffDuration: 2,
      description: "You become a phantom, your body flickering between solid and ethereal as you gain 50% evasion for 2 turns. Attacks pass through your ghostly form harmlessly, while your own strikes ignore enemy defenses. You are neither alive nor dead — just deadly.",
      requires: "ro_shadow_realm_entry",
    },
    {
      id: "ro_reaper", name: "Soul Reaper", tier: 5, levelReq: 80, cost: 6,
      mp: 195, cooldown: 6, damage: 7.0, element: "blood",
      description: "You become the reaper of souls, your blade transforming into a spectral scythe as you strike for 800% damage. The weapon harvests the enemy's very life force, their soul flickering as death's cold hand reaches through your blade. What is owed must be paid.",
      requires: "ro_assassinate",
      synergy: "blood_dmg build makes this the single highest damage skill in the game.",
    },

    // ── New Tier 2 fills ──
    {
      id: "ro_dual_strike", name: "Dual Strike", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 3, damage: 1.8, element: "physical",
      description: "You attack with both blades simultaneously in a devastating cross-cut for 180% damage, the twin slashes meeting in the middle of the enemy's body. The X-shaped wound is impossible to defend against — blocking one blade only opens you to the other.",
      requires: "ro_backstab",
    },
    {
      id: "ro_venomous_fan", name: "Venomous Fan", tier: 2, levelReq: 13, cost: 2,
      mp: 42, cooldown: 4, damage: 1.3, element: "poison",
      description: "You throw a fan of poisoned throwing knives for 180% poison damage, each blade coated in a different exotic toxin. The spread of projectiles is nearly impossible to dodge, and the cocktail of poisons creates a synergistic effect far worse than any single venom.",
      requires: "ro_poison_blade",
      synergy: "poison_dmg % amplifies. Pairs with Poison Blade for max DoT stacking.",
    },

    // ── New Tier 3 fills ──
    {
      id: "ro_shadowmeld", name: "Shadowmeld", tier: 3, levelReq: 27, cost: 3,
      mp: 55, cooldown: 4, damage: 0, element: null, buff: "defense",
      buffEffect: { evasion: 35, stealth: 1 }, buffDuration: 3,
      description: "You meld with the shadows until you become one with the darkness, gaining 35% evasion and stealth for 3 turns. Your body dissolves into the dark corners of the battlefield, invisible to the naked eye. You wait, patient as a spider, for the perfect moment to strike.",
      requires: "ro_smoke_bomb",
    },
    {
      id: "ro_cheap_shot", name: "Cheap Shot", tier: 3, levelReq: 29, cost: 3,
      mp: 50, cooldown: 4, damage: 2.0, element: "physical",
      description: "You strike a dirty, underhanded blow directly to the enemy's most vulnerable point for 150% damage. No honor, no rules — only results. The stunned enemy doubles over in agony, completely unable to retaliate while you prepare your next move.",
      requires: "ro_backstab",
    },
    {
      id: "ro_viper_strike", name: "Viper Strike", tier: 3, levelReq: 31, cost: 3,
      mp: 65, cooldown: 4, damage: 2.0, element: "poison",
      description: "You strike like a viper for 200% poison damage, the lightning-fast bite delivering a potent neurotoxin that spreads through the victim's nervous system. Their limbs go numb, their vision blurs, and paralysis creeps through their body with terrifying speed.",
      requires: "ro_venomous_fan",
      synergy: "poison_dmg stacks. Speed buff enables devastating follow-ups.",
    },

    // ── New Tier 4 fills ──
    {
      id: "ro_mark_of_shadows", name: "Mark of Shadows", tier: 4, levelReq: 49, cost: 4,
      mp: 80, cooldown: 5, damage: 0, element: null, buff: "attack",
      buffEffect: { stealth_dmg: 100 }, buffDuration: 3,
      description: "You place the ancient mark of shadows on the enemy, a dark sigil that glows with malevolent energy. All damage from stealth attacks is doubled for 3 turns, and the mark makes them visible to you even in complete darkness. Nowhere to hide, nowhere to run.",
      requires: "ro_death_mark",
    },
    {
      id: "ro_executioner", name: "Executioner's Edge", tier: 4, levelReq: 56, cost: 5,
      mp: 110, cooldown: 5, damage: 3.5, element: "physical",
      description: "You deliver the executioner's final judgment for 350% damage, your blade falling with the cold, clinical precision of a professional killer. The sentence is death — no appeal, no reprieve. The blade falls, and justice is served in crimson.",
      requires: "ro_assassinate",
    },

    // ── Tier 6 – Ascended (Lv 90+) ──────────────────────────────────────────
    {
      id: "ro_void_dancer", name: "Void Dancer", tier: 6, levelReq: 90, cost: 7,
      mp: 200, cooldown: 7, damage: 0, element: null, buff: "attack",
      buffEffect: { evasion: 40, phase: 1 }, buffDuration: 3,
      description: "You dance between the cracks in reality for 3 turns, phasing in and out of existence with each graceful step. Your evasion increases by 40% as attacks pass through your flickering form. Your movements are hypnotic, beautiful, and impossibly deadly.",
      requires: "ro_phantom",
    },
    {
      id: "ro_deaths_embrace", name: "Death's Embrace", tier: 6, levelReq: 93, cost: 8,
      mp: 250, cooldown: 8, damage: 10.0, element: "blood",
      description: "You embrace the enemy in a grip of death for 280% blood damage, your cold hands draining their warmth and life force with every second of contact. Dark energy flows from their body into yours, their vitality fading as your strength grows.",
      requires: "ro_reaper",
      synergy: "blood_dmg build's ultimate payoff. Highest single-hit in the game.",
    },
    {
      id: "ro_thousand_cuts", name: "Thousand Cuts", tier: 6, levelReq: 95, cost: 7,
      mp: 230, cooldown: 7, damage: 8.0, element: "physical",
      description: "You unleash a whirlwind of a thousand razor-thin cuts for 400% damage, each tiny slash barely visible but bleeding freely. Alone, each cut is nothing — but together, the accumulated blood loss is utterly devastating. Death by a thousand cuts is very real.",
      requires: "ro_oblivion",
    },

    // ── New Fire skills ──
    {
      id: "ro_flame_dagger", name: "Flame Dagger", tier: 1, levelReq: 6, cost: 2,
      mp: 35, cooldown: 3, damage: 1.3, element: "fire",
      description: "You hurl a dagger wreathed in hungry flames for 150% fire damage. The blade spins end over end, trailing fire and smoke through the air before embedding itself in the enemy. The searing wound won't stop smoking, burning deeper with each second.",
      requires: null,
      synergy: "fire_dmg % adds to each throw. Opens fire rogue path.",
    },
    {
      id: "ro_ignition_strike", name: "Ignition Strike", tier: 2, levelReq: 13, cost: 3,
      mp: 48, cooldown: 4, damage: 1.6, element: "fire",
      description: "You ignite your twin blades in roaring flames and slash through the enemy for 250% fire damage. Sparks shower the battlefield as blazing steel meets flesh in a spectacular burst of fire. The heat from your weapons warps the air itself.",
      requires: "ro_flame_dagger",
      synergy: "fire_dmg % boosts both hit and burn. Pairs with Infernal Dance.",
    },
    {
      id: "ro_infernal_dance", name: "Infernal Dance", tier: 3, levelReq: 29, cost: 4,
      mp: 72, cooldown: 5, damage: 2.2, element: "fire",
      description: "You dance through the fires of hell itself for 500% fire damage, each graceful step leaving a trail of demonic flame. Every spin becomes a whirlwind of infernal destruction, every leap a rain of fire. You are death dancing in flames.",
      requires: "ro_ignition_strike",
      synergy: "fire_dmg stacks. Speed buff enables devastating follow-ups.",
    },
    {
      id: "ro_phoenix_slash", name: "Phoenix Slash", tier: 4, levelReq: 51, cost: 5,
      mp: 115, cooldown: 5, damage: 3.0, element: "fire",
      description: "You slash with a blade reborn in the immortal fire of a phoenix for 750% fire damage. The mythical flames cling to the enemy with a hunger that cannot be satisfied — these fires burn beyond the physical, consuming body and soul alike.",
      requires: "ro_infernal_dance",
      synergy: "fire_dmg build rogue's core nuke. Fire + sustain combo.",
    },

    // ── New Arcane skills ──
    {
      id: "ro_void_strike", name: "Void Strike", tier: 1, levelReq: 7, cost: 2,
      mp: 38, cooldown: 3, damage: 1.2, element: "arcane",
      description: "You reach through the void between worlds and strike for 200% arcane damage, your blade phasing between dimensions to bypass all physical defenses. The enemy's armor means nothing when your attack exists in a different plane of reality entirely.",
      requires: null,
    },
    {
      id: "ro_phase_shift", name: "Phase Shift", tier: 2, levelReq: 15, cost: 3,
      mp: 50, cooldown: 4, damage: 1.5, element: "arcane",
      description: "You phase-shift between parallel realities for 2 turns, your body existing simultaneously in multiple dimensions. Your evasion soars by 45% as attacks pass through your ghostly, flickering form. You are everywhere and nowhere at once.",
      requires: "ro_void_strike",
      synergy: "Opens the void rogue path. Pairs with Dimensional Slash.",
    },
    {
      id: "ro_dimensional_slash", name: "Dimensional Slash", tier: 3, levelReq: 31, cost: 4,
      mp: 78, cooldown: 5, damage: 2.5, element: "arcane",
      description: "You cut through the fabric of dimensions for 250% arcane damage, your blade opening a rift in space that pulls the enemy toward the void. The wound in reality draws them in, dealing devastating damage as dimensional forces tear at their body.",
      requires: "ro_phase_shift",
    },
    {
      id: "ro_reality_rend", name: "Reality Rend", tier: 4, levelReq: 53, cost: 5,
      mp: 125, cooldown: 5, damage: 3.5, element: "arcane",
      description: "You tear a gash in the fabric of reality itself for 400% arcane damage. The wound in space-time doesn't heal — it grows, pulling in matter and energy as the void hungers for more. Everything near the rift is torn apart by dimensional forces.",
      requires: "ro_dimensional_slash",
      synergy: "The arcane rogue's ultimate burst. Ignores all defenses.",
    },

    // ── New Ice fills ──
    {
      id: "ro_frozen_blade", name: "Frozen Blade", tier: 3, levelReq: 28, cost: 3,
      mp: 68, cooldown: 5, damage: 2.0, element: "ice",
      description: "You slash with a blade forged from eternal ice for 180% ice damage. The frozen edge shatters on impact, embedding hundreds of razor-sharp ice shards deep in the wound. The cold spreads through the enemy's body like a creeping death.",
      requires: "ro_frost_strike",
      synergy: "ice_dmg % adds. Pairs with Frost Strike for ice assassination build.",
    },
    {
      id: "ro_glacial_ambush", name: "Glacial Ambush", tier: 4, levelReq: 50, cost: 5,
      mp: 112, cooldown: 5, damage: 3.0, element: "ice",
      description: "You ambush from within a frozen mist for 300% ice damage, emerging like a ghost from the white haze. The enemy's blood begins to freeze in their veins as your icy blade finds its mark, and a terrible cold seeps into their very bones.",
      requires: "ro_frozen_blade",
    },
    {
      id: "ro_absolute_chill", name: "Absolute Chill", tier: 5, levelReq: 73, cost: 6,
      mp: 170, cooldown: 6, damage: 5.0, element: "ice",
      description: "You radiate the absolute cold of the void for 500% ice damage, the temperature around you dropping to levels where life simply cannot exist. Movement slows to nothing, breath freezes in the air, and the enemy's body begins to shut down.",
      requires: "ro_glacial_ambush",
      synergy: "ice_dmg build rogue's endgame. Total lockdown + assassination damage.",
    },

    // ── New Lightning fills ──
    {
      id: "ro_thunder_strike", name: "Thunder Strike", tier: 3, levelReq: 30, cost: 4,
      mp: 72, cooldown: 4, damage: 2.2, element: "lightning",
      description: "You strike with the speed and fury of a thunderbolt for 200% lightning damage. The sonic crack of your blade breaking the sound barrier arrives before the pain — and by the time the enemy realizes what happened, you've already vanished.",
      requires: "ro_lightning_step",
      synergy: "lightning_dmg % stacks. Speed buff enables rapid combos.",
    },
    {
      id: "ro_voltaic_rush", name: "Voltaic Rush", tier: 4, levelReq: 52, cost: 5,
      mp: 118, cooldown: 5, damage: 3.2, element: "lightning",
      description: "You rush forward in a blinding surge of electricity for 300% lightning damage, your body crackling with voltage as you close the distance in a flash. Lightning trails behind you like a comet's tail, and your electrified blade cuts through everything.",
      requires: "ro_thunder_strike",
    },
    {
      id: "ro_storm_blade", name: "Storm Blade", tier: 5, levelReq: 74, cost: 6,
      mp: 175, cooldown: 6, damage: 5.0, element: "lightning",
      description: "You channel a raging storm through your blade for 400% lightning damage, electricity cascading from the weapon with every swing. Sparks arc to nearby foes, the air smells of ozone, and thunder rumbles ominously with each devastating slash.",
      requires: "ro_voltaic_rush",
      synergy: "lightning_dmg build rogue's ultimate. Stun-lock + burst damage.",
    },

    // ── New Sand fills ──
    {
      id: "ro_dust_shroud", name: "Dust Shroud", tier: 3, levelReq: 26, cost: 3,
      mp: 60, cooldown: 5, damage: 1.5, element: "sand",
      description: "You cloak yourself in a swirling shroud of desert sand and strike for 150% sand damage. The golden cloud obscures your form completely — the enemy can't see you anymore, granting you 40% evasion for 2 turns as you vanish into the sandstorm.",
      requires: "ro_sand_blind",
      synergy: "sand_dmg % adds. Pairs with Sand Blind for desert assassin build.",
    },
    {
      id: "ro_sandstorm_slash", name: "Sandstorm Slash", tier: 4, levelReq: 48, cost: 4,
      mp: 105, cooldown: 5, damage: 2.8, element: "sand",
      description: "You slash through a blinding sandstorm of your own creation for 350% sand damage. The scouring winds amplify your blade's cutting power tenfold, while the enemy stumbles blind and choking through the abrasive gale. Sand and steel — a lethal combination.",
      requires: "ro_dust_shroud",
    },
    {
      id: "ro_desert_phantom", name: "Desert Phantom", tier: 5, levelReq: 75, cost: 6,
      mp: 165, cooldown: 6, damage: 4.5, element: "sand",
      description: "You become a phantom of the desert for 500% sand damage, your body dissolving into a mirage that shimmers in the heat. The enemy can't tell which is real — the figure to the left, the shadow to the right — until a very real blade finds their heart.",
      requires: "ro_sandstorm_slash",
      synergy: "sand_dmg build rogue's endgame. Near-untouchable + strong damage.",
    },

    // ── New Poison fills ──
    {
      id: "ro_neurotoxin", name: "Neurotoxin", tier: 4, levelReq: 49, cost: 4,
      mp: 105, cooldown: 5, damage: 2.8, element: "poison",
      description: "You inject a potent, laboratory-grade neurotoxin for 200% poison damage. The synthetic venom is far more lethal than anything found in nature — the victim's nervous system shuts down systematically as paralysis creeps from the wound to the brain.",
      requires: "ro_viper_strike",
      synergy: "poison_dmg % stacks with speed reduction. Devastating control.",
    },
    {
      id: "ro_plague_blade", name: "Plague Blade", tier: 5, levelReq: 72, cost: 6,
      mp: 168, cooldown: 6, damage: 4.5, element: "poison",
      description: "You slash with a blade infected with an ancient plague for 350% poison damage. The disease festers in the wound with supernatural speed, the infection spreading through the enemy's body and weakening them more with every labored, painful heartbeat.",
      requires: "ro_neurotoxin",
      synergy: "poison_dmg build rogue's endgame. Highest sustained DoT in the game.",
    },
    // ── Gap fills: fire T5, T6 ──
    {
      id: "ro_hellfire_dance", name: "Hellfire Dance", tier: 5, levelReq: 73, cost: 6,
      mp: 150, cooldown: 6, damage: 4.5, element: "fire",
      description: "You dance through hellfire for 600% fire damage, each pirouette leaving a blazing ring of demonic flame. The infernal choreography is mesmerizing — beautiful and terrifying in equal measure. Everything within reach is incinerated by your fiery performance.",
      requires: "ro_phoenix_slash", synergy: "Burning enemies take critical hits more often.",
    },
    {
      id: "ro_inferno_reaper", name: "Inferno Reaper", tier: 6, levelReq: 92, cost: 7,
      mp: 210, cooldown: 7, damage: 7.5, element: "fire",
      description: "You reap through a maelstrom of infernal flames for 750% fire damage, fire and shadow merging as you become death itself wreathed in hellfire. The flames obey your blade, following each slash like a loyal hound. You are the harvester of burning souls.",
      requires: "ro_hellfire_dance", synergy: "Ignited enemies cannot heal or use potions.",
    },
    // ── Gap fills: ice T1, T6 ──
    {
      id: "ro_frostbite_slash", name: "Frostbite Slash", tier: 1, levelReq: 5, cost: 1,
      mp: 22, cooldown: 2, damage: 1.1, element: "ice",
      description: "You slash with a blade of pure, concentrated frostbite for 300% ice damage. The supernatural cold bites deeper than any natural frost, numbing flesh instantly and slowing the enemy to a crawl as their body begins to shut down from hypothermia.",
      requires: null, synergy: "Frostbitten enemies have reduced attack speed.",
    },
    {
      id: "ro_glacial_executioner", name: "Glacial Executioner", tier: 6, levelReq: 93, cost: 8,
      mp: 225, cooldown: 7, damage: 8.0, element: "ice",
      description: "You execute with the cold, merciless precision of glacial ice for 500% ice damage. Your frozen blade shatters inside the wound, releasing a burst of absolute zero that freezes the enemy from the inside out. A death so cold it's almost beautiful.",
      requires: "ro_absolute_chill", synergy: "Instantly kills frozen enemies below 15% health.",
    },
    // ── Gap fills: lightning T1, T6 ──
    {
      id: "ro_spark_dagger", name: "Spark Dagger", tier: 1, levelReq: 7, cost: 2,
      mp: 30, cooldown: 2, damage: 1.2, element: "lightning",
      description: "You throw an electrically supercharged dagger for 200% lightning damage. The crackling blade shocks on impact, the voltage overloading the enemy's nervous system in an instant. They convulse and stagger, their muscles spasming uncontrollably.",
      requires: null, synergy: "Shocked enemies flinch, interrupting their actions.",
    },
    {
      id: "ro_tempest_assassin", name: "Tempest Assassin", tier: 6, levelReq: 94, cost: 8,
      mp: 235, cooldown: 7, damage: 8.5, element: "lightning",
      description: "You assassinate with the devastating fury of a tempest for 400% lightning damage. Thunder masks your silent approach, and lightning illuminates your blade for just a split second before impact. By the time they hear the thunder, they're already falling.",
      requires: "ro_storm_blade", synergy: "Each teleport strike increases the next hit's damage.",
    },
    // ── Gap fills: poison T6 ──
    {
      id: "ro_death_blossom", name: "Death Blossom", tier: 6, levelReq: 91, cost: 7,
      mp: 200, cooldown: 7, damage: 7.0, element: "poison",
      description: "You spin into a deadly blossom of blades for 250% poison damage, poisoned steel petals blooming around you in a beautiful spiral of death. Each blade carries a unique toxin, and together they create a bouquet of agony that cuts everything it touches.",
      requires: "ro_plague_blade", synergy: "Poison damage becomes true damage against fully stacked targets.",
    },
    // ── Gap fills: blood T1 ──
    {
      id: "ro_blood_nick", name: "Blood Nick", tier: 1, levelReq: 6, cost: 2,
      mp: 28, cooldown: 2, damage: 1.2, element: "blood",
      description: "You nick a vital artery with surgical precision for 180% blood damage — a tiny, almost invisible cut that bleeds endlessly. The wound is so small the enemy barely feels it, but the steady flow of blood saps their strength. Death by a thousand drops.",
      requires: null, synergy: "Bleeding enemies leave blood trails that boost rogue damage.",
    },
    // ── Gap fills: sand T1, T2, T6 ──
    {
      id: "ro_sand_toss", name: "Sand Toss", tier: 1, levelReq: 5, cost: 1,
      mp: 20, cooldown: 2, damage: 1.0, element: "sand",
      description: "You toss a cloud of blinding, coarse sand for 100% sand damage, the grit stinging their eyes and filling their mouth. While they stumble and cough, you prepare your real attack from the shadows. It's not elegant, but it's devastatingly effective.",
      requires: null, synergy: "Blinded targets cannot counter-attack.",
    },
    {
      id: "ro_dune_ambush", name: "Dune Ambush", tier: 2, levelReq: 12, cost: 2,
      mp: 42, cooldown: 3, damage: 1.5, element: "sand",
      description: "You burst from beneath the sand dunes in a devastating surprise ambush for 250% sand damage. One moment there's nothing but peaceful desert, the next a blade erupts from the sand into the enemy's body. They never saw it coming — you were part of the desert.",
      requires: null, synergy: "Ambush attacks always critically hit slowed targets.",
    },
    {
      id: "ro_tomb_wraith", name: "Tomb Wraith", tier: 6, levelReq: 92, cost: 7,
      mp: 205, cooldown: 7, damage: 7.0, element: "sand",
      description: "You manifest as an ancient tomb wraith for 700% sand damage, the spirit of a long-dead desert assassin possessing your body. Your eyes glow with amber light as the knowledge of centuries of killing fills your mind. The dead remember how to fight.",
      requires: "ro_desert_phantom", synergy: "Cannot be targeted while phasing between attacks.",
    },
    // ── Gap fills: arcane T5, T6 ──
    {
      id: "ro_astral_blade", name: "Astral Blade", tier: 5, levelReq: 74, cost: 6,
      mp: 155, cooldown: 6, damage: 4.8, element: "arcane",
      description: "You summon a blade from the astral plane for 480% arcane damage, the ethereal weapon shimmering with otherworldly energy. It cuts through both body and soul simultaneously, leaving wounds that exist in multiple dimensions. There is no healing from this.",
      requires: "ro_reality_rend", synergy: "Arcane strikes weaken the target's resistance to all elements.",
    },
    {
      id: "ro_cosmic_erasure", name: "Cosmic Erasure", tier: 6, levelReq: 95, cost: 8,
      mp: 250, cooldown: 8, damage: 9.0, element: "arcane",
      description: "You erase the enemy from cosmic existence itself for 900% arcane damage, your blade rewriting the fundamental laws of reality around the target. The universe forgets they ever existed — matter, energy, even memory is unmade. Total erasure.",
      requires: "ro_astral_blade", synergy: "Erased targets cannot resurrect or respawn.",
    },

    // ── Support skills ──
    {
      id: "ro_shadow_mend", name: "Shadow Mend", tier: 2, levelReq: 12, cost: 2,
      mp: 35, cooldown: 5, damage: 0, element: null,
      special: "heal", healPct: 0.15,
      description: "The shadows themselves reach out with gentle, dark tendrils to stitch your wounds closed, restoring 20% HP over 3 turns. What light cannot heal, darkness can mend. The shadows cradle your broken body, knitting flesh and soothing pain in their cool embrace.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "ro_shadow_cloak", name: "Shadow Cloak", tier: 3, levelReq: 28, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      special: "shield", shieldPct: 0.20,
      description: "You wrap yourself in a cloak of living shadow, the darkness clinging to your body like a second skin. Your evasion increases by 30% and you gain stealth for 3 turns. Even the keenest eyes cannot find you — you are one with the dark.",
      requires: "ro_shadow_mend", statScale: "dexterity",
    },
    {
      id: "ro_adrenaline_rush", name: "Adrenaline Rush", tier: 3, levelReq: 30, cost: 3,
      mp: 50, cooldown: 6, damage: 0, element: null,
      buffEffect: { atk_pct: 30, crit_pct: 20, atk_speed: 15 }, buffDuration: 3,
      description: "Pure adrenaline floods your veins like liquid lightning, your heart pounding as time seems to slow around you. Attack speed increases by 30% and critical chance by 20% for 3 turns. Everything moves in slow motion except you — faster, sharper, deadlier.",
      requires: null, statScale: "dexterity",
    },
    {
      id: "ro_siphon_energy", name: "Siphon Energy", tier: 2, levelReq: 14, cost: 2,
      mp: 10, cooldown: 5, damage: 0, element: null,
      special: "mana", manaPct: 0.25,
      description: "You siphon magical energy from the enemy through invisible threads of dark magic, draining 20% of your MP from their reserves and weakening their next spell. They feel their power fading as it flows into you — their loss, your gain.",
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