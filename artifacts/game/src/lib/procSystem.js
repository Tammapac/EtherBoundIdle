// ===== PROC EFFECT SYSTEM =====
// Handles on-hit effects, chance-based procs, and every-nth-attack triggers.
// Items, sets, and unique gear can all carry proc effects.

// ─────────────────────────────────────────────────────────────────────────────
// PROC TYPES
// ─────────────────────────────────────────────────────────────────────────────
// Each proc has: id, name, type, trigger, chance (0-1), element, damage/value,
//   icon, color, description
//
// trigger types:
//   "on_hit"       — rolls chance every attack
//   "every_n"      — fires every N attacks (guaranteed)
//   "on_crit"      — rolls chance only on critical hits
//   "on_kill"      — rolls chance when enemy is defeated
//   "on_hit_taken"  — rolls chance when player takes damage

export const PROC_TYPES = {
  // ── Elemental Burst Procs ────────────────────────────────────────────────
  lightning_bolt: {
    id: "lightning_bolt",
    name: "Thunder Strike",
    type: "damage",
    trigger: "on_hit",
    chance: 0.05,
    element: "lightning",
    damageMultiplier: 2.5,
    icon: "⚡",
    color: "text-yellow-300",
    description: "5% chance to strike with a bolt of thunder dealing 250% elemental damage",
  },
  fireball_burst: {
    id: "fireball_burst",
    name: "Inferno Burst",
    type: "damage",
    trigger: "on_hit",
    chance: 0.08,
    element: "fire",
    damageMultiplier: 2.0,
    icon: "🔥",
    color: "text-orange-400",
    description: "8% chance to unleash a fireball dealing 200% fire damage",
  },
  frost_nova: {
    id: "frost_nova",
    name: "Frost Nova",
    type: "damage",
    trigger: "on_hit",
    chance: 0.06,
    element: "ice",
    damageMultiplier: 1.8,
    icon: "❄️",
    color: "text-cyan-400",
    description: "6% chance to release a frost nova dealing 180% ice damage",
  },
  poison_cloud: {
    id: "poison_cloud",
    name: "Toxic Cloud",
    type: "dot",
    trigger: "on_hit",
    chance: 0.10,
    element: "poison",
    damageMultiplier: 0.5,
    duration: 3,
    icon: "☠️",
    color: "text-green-400",
    description: "10% chance to poison enemy for 50% damage over 3 turns",
  },
  blood_drain: {
    id: "blood_drain",
    name: "Blood Drain",
    type: "lifesteal_burst",
    trigger: "on_hit",
    chance: 0.07,
    element: "blood",
    damageMultiplier: 1.5,
    healPercent: 0.5,
    icon: "🩸",
    color: "text-red-500",
    description: "7% chance to drain blood: 150% damage + heal 50% of damage dealt",
  },
  sand_blast: {
    id: "sand_blast",
    name: "Sand Blast",
    type: "damage",
    trigger: "on_hit",
    chance: 0.09,
    element: "sand",
    damageMultiplier: 1.6,
    icon: "🌪️",
    color: "text-amber-400",
    description: "9% chance to blast with sand dealing 160% sand damage",
  },

  // ── Every-N-Attack Procs ─────────────────────────────────────────────────
  arcane_surge: {
    id: "arcane_surge",
    name: "Arcane Surge",
    type: "damage",
    trigger: "every_n",
    every: 3,
    element: "arcane",
    damageMultiplier: 1.5,
    icon: "✨",
    color: "text-purple-400",
    description: "Every 3rd attack deals 150% bonus arcane damage",
  },
  triple_strike: {
    id: "triple_strike",
    name: "Triple Strike",
    type: "extra_hits",
    trigger: "every_n",
    every: 5,
    extraHits: 2,
    icon: "⚔️",
    color: "text-gray-300",
    description: "Every 5th attack triggers 2 bonus attacks",
  },
  soul_harvest: {
    id: "soul_harvest",
    name: "Soul Harvest",
    type: "damage",
    trigger: "every_n",
    every: 4,
    element: "blood",
    damageMultiplier: 2.0,
    icon: "💀",
    color: "text-red-400",
    description: "Every 4th attack harvests souls for 200% blood damage",
  },

  // ── On-Crit Procs ───────────────────────────────────────────────────────
  thunder_god: {
    id: "thunder_god",
    name: "Wrath of Thunder",
    type: "damage",
    trigger: "on_crit",
    chance: 0.25,
    element: "lightning",
    damageMultiplier: 3.0,
    icon: "⛈️",
    color: "text-yellow-300",
    description: "25% chance on crit to call down divine thunder for 300% lightning damage",
  },
  frozen_shatter: {
    id: "frozen_shatter",
    name: "Frozen Shatter",
    type: "damage",
    trigger: "on_crit",
    chance: 0.20,
    element: "ice",
    damageMultiplier: 2.5,
    icon: "🧊",
    color: "text-cyan-300",
    description: "20% chance on crit to shatter ice for 250% ice damage",
  },
  execute: {
    id: "execute",
    name: "Execute",
    type: "damage_percent_hp",
    trigger: "on_crit",
    chance: 0.15,
    percentMaxHp: 0.08,
    icon: "🗡️",
    color: "text-red-500",
    description: "15% chance on crit to deal 8% of enemy max HP as bonus damage",
  },

  // ── On-Kill Procs ───────────────────────────────────────────────────────
  soul_reap: {
    id: "soul_reap",
    name: "Soul Reap",
    type: "heal",
    trigger: "on_kill",
    chance: 0.30,
    healPercent: 0.15,
    icon: "👻",
    color: "text-purple-300",
    description: "30% chance on kill to recover 15% max HP",
  },
  gold_rush: {
    id: "gold_rush",
    name: "Gold Rush",
    type: "bonus_gold",
    trigger: "on_kill",
    chance: 0.20,
    bonusPercent: 0.50,
    icon: "💰",
    color: "text-yellow-400",
    description: "20% chance on kill to gain 50% bonus gold",
  },
  exp_surge: {
    id: "exp_surge",
    name: "Knowledge Surge",
    type: "bonus_exp",
    trigger: "on_kill",
    chance: 0.15,
    bonusPercent: 0.30,
    icon: "📖",
    color: "text-blue-400",
    description: "15% chance on kill to gain 30% bonus EXP",
  },

  // ── Defensive Procs (on_hit_taken) ──────────────────────────────────────
  thorns: {
    id: "thorns",
    name: "Thorns",
    type: "reflect",
    trigger: "on_hit_taken",
    chance: 0.20,
    reflectPercent: 0.25,
    icon: "🌿",
    color: "text-green-400",
    description: "20% chance to reflect 25% of damage taken back to enemy",
  },
  divine_shield: {
    id: "divine_shield",
    name: "Divine Shield",
    type: "absorb",
    trigger: "on_hit_taken",
    chance: 0.10,
    absorbPercent: 0.50,
    icon: "🛡️",
    color: "text-yellow-300",
    description: "10% chance to absorb 50% of incoming damage",
  },
  counter_strike: {
    id: "counter_strike",
    name: "Counter Strike",
    type: "counter",
    trigger: "on_hit_taken",
    chance: 0.12,
    damageMultiplier: 1.5,
    icon: "↩️",
    color: "text-red-400",
    description: "12% chance to counter-attack for 150% damage when hit",
  },

  // ── Shiny Unique Effects ──────────────────────────────────────────────────
  // These only appear on shiny-rarity gear as guaranteed unique procs.

  // Weapon uniques
  elemental_amplifier: {
    id: "elemental_amplifier",
    name: "Elemental Amplifier",
    type: "passive",
    trigger: "passive",
    icon: "🌈",
    color: "text-pink-400",
    description: "Elemental skills deal 30% more damage",
  },
  cleave_strike: {
    id: "cleave_strike",
    name: "Cleave Strike",
    type: "aoe",
    trigger: "every_n",
    every: 3,
    damageMultiplier: 1.0,
    icon: "🌀",
    color: "text-orange-300",
    description: "Every 3rd hit damages ALL enemies",
  },
  executioner: {
    id: "executioner",
    name: "Executioner's Edge",
    type: "passive",
    trigger: "passive",
    icon: "⚰️",
    color: "text-red-500",
    description: "Deals 50% more damage to enemies below 30% HP",
  },
  berserker_fury: {
    id: "berserker_fury",
    name: "Berserker's Fury",
    type: "passive",
    trigger: "passive",
    icon: "🔥",
    color: "text-red-400",
    description: "Gain +2% ATK for each 10% HP missing",
  },

  // Armor uniques
  parry_master: {
    id: "parry_master",
    name: "Parry Master",
    type: "reflect",
    trigger: "on_hit_taken",
    chance: 0.15,
    reflectPercent: 2.5,
    icon: "🤺",
    color: "text-yellow-300",
    description: "15% chance to parry attacks, reflecting 250% damage",
  },
  undying_will: {
    id: "undying_will",
    name: "Undying Will",
    type: "passive",
    trigger: "passive",
    icon: "💫",
    color: "text-cyan-300",
    description: "Survive a killing blow once per fight with 20% HP",
  },
  fortification: {
    id: "fortification",
    name: "Fortification",
    type: "passive",
    trigger: "passive",
    icon: "🏰",
    color: "text-blue-300",
    description: "Take 20% less damage when above 80% HP",
  },

  // Helmet uniques
  wisdom_aura: {
    id: "wisdom_aura",
    name: "Wisdom Aura",
    type: "passive",
    trigger: "passive",
    icon: "📚",
    color: "text-blue-400",
    description: "+25% EXP from all sources",
  },
  third_eye: {
    id: "third_eye",
    name: "Third Eye",
    type: "passive",
    trigger: "passive",
    icon: "👁️",
    color: "text-purple-400",
    description: "+15% chance to find rare loot",
  },

  // Gloves uniques
  rapid_strikes: {
    id: "rapid_strikes",
    name: "Rapid Strikes",
    type: "extra_hits",
    trigger: "on_hit",
    chance: 0.20,
    extraHits: 1,
    icon: "👊",
    color: "text-orange-400",
    description: "20% chance for attacks to hit twice",
  },
  mana_siphon: {
    id: "mana_siphon",
    name: "Mana Siphon",
    type: "passive",
    trigger: "passive",
    icon: "💧",
    color: "text-blue-400",
    description: "Restore 5% MP on hit",
  },

  // Boots uniques
  phantom_step: {
    id: "phantom_step",
    name: "Phantom Step",
    type: "passive",
    trigger: "passive",
    icon: "👻",
    color: "text-indigo-300",
    description: "+20% Evasion for 3s after being hit",
  },
  gold_magnet: {
    id: "gold_magnet",
    name: "Gold Magnet",
    type: "passive",
    trigger: "passive",
    icon: "🧲",
    color: "text-yellow-400",
    description: "+30% gold from all sources",
  },

  // Ring uniques
  soul_collector: {
    id: "soul_collector",
    name: "Soul Collector",
    type: "heal",
    trigger: "on_kill",
    chance: 1.0,
    healPercent: 0.08,
    icon: "👤",
    color: "text-purple-300",
    description: "Killing an enemy heals 8% of max HP",
  },
  lucky_star: {
    id: "lucky_star",
    name: "Lucky Star",
    type: "passive",
    trigger: "passive",
    icon: "🌟",
    color: "text-yellow-300",
    description: "+10% to all drop rates",
  },

  // Amulet uniques
  life_link: {
    id: "life_link",
    name: "Life Link",
    type: "passive",
    trigger: "passive",
    icon: "💖",
    color: "text-pink-400",
    description: "5% of damage dealt heals HP",
  },
  elemental_shield: {
    id: "elemental_shield",
    name: "Elemental Shield",
    type: "passive",
    trigger: "passive",
    icon: "🔮",
    color: "text-cyan-400",
    description: "Reduce elemental damage taken by 25%",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROC POOLS — which procs can appear on which item types/rarities
// ─────────────────────────────────────────────────────────────────────────────
const OFFENSIVE_PROCS = [
  "lightning_bolt", "fireball_burst", "frost_nova", "poison_cloud",
  "blood_drain", "sand_blast", "arcane_surge", "triple_strike", "soul_harvest",
];
const CRIT_PROCS = ["thunder_god", "frozen_shatter", "execute"];
const KILL_PROCS = ["soul_reap", "gold_rush", "exp_surge"];
const DEFENSIVE_PROCS = ["thorns", "divine_shield", "counter_strike"];

export const PROC_POOLS = {
  weapon:  { pool: [...OFFENSIVE_PROCS, ...CRIT_PROCS], maxProcs: { epic: 1, legendary: 1, mythic: 2, shiny: 2 } },
  armor:   { pool: [...DEFENSIVE_PROCS, "soul_reap"], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
  helmet:  { pool: ["divine_shield", "exp_surge", "arcane_surge"], maxProcs: { legendary: 1, mythic: 1, shiny: 1 } },
  gloves:  { pool: [...OFFENSIVE_PROCS.slice(0, 6)], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
  boots:   { pool: ["thorns", "counter_strike", "gold_rush"], maxProcs: { legendary: 1, mythic: 1, shiny: 1 } },
  ring:    { pool: [...KILL_PROCS, "arcane_surge", "execute"], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
  amulet:  { pool: [...DEFENSIVE_PROCS, ...KILL_PROCS], maxProcs: { epic: 1, legendary: 1, mythic: 1, shiny: 2 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE PROCS FOR AN ITEM
// ─────────────────────────────────────────────────────────────────────────────
export function generateItemProcs(itemType, rarity, itemLevel = 1) {
  const config = PROC_POOLS[itemType];
  if (!config) return [];
  const maxProcs = config.maxProcs[rarity] || 0;
  if (maxProcs === 0) return [];

  // Higher item level = slightly higher chance of getting procs
  const procChance = Math.min(0.9, 0.3 + (itemLevel / 100) * 0.4);
  const procs = [];
  const pool = [...config.pool];

  for (let i = 0; i < maxProcs && pool.length > 0; i++) {
    if (Math.random() > procChance) continue;
    const idx = Math.floor(Math.random() * pool.length);
    const procId = pool.splice(idx, 1)[0];
    const baseDef = PROC_TYPES[procId];
    if (!baseDef) continue;

    // Scale proc values slightly with item level
    const levelScale = 1 + (itemLevel - 1) * 0.005;
    const proc = { id: procId };

    // Scale chance up slightly (capped)
    if (baseDef.chance) {
      proc.chance = Math.min(baseDef.chance * 1.5, parseFloat((baseDef.chance * levelScale).toFixed(3)));
    }
    // Scale damage multiplier
    if (baseDef.damageMultiplier) {
      proc.damageMultiplier = parseFloat((baseDef.damageMultiplier * levelScale).toFixed(2));
    }

    procs.push(proc);
  }

  return procs;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET FULL PROC DEFINITIONS from item's stored proc array
// ─────────────────────────────────────────────────────────────────────────────
export function getItemProcs(item) {
  const procData = item.proc_effects || item.extraData?.proc_effects || [];
  return procData.map(p => {
    const base = PROC_TYPES[p.id];
    if (!base) return null;
    return { ...base, ...p };
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECT ALL PROCS from equipped items
// ─────────────────────────────────────────────────────────────────────────────
export function collectEquippedProcs(equippedItems) {
  const allProcs = [];
  for (const item of equippedItems) {
    const procs = getItemProcs(item);
    for (const p of procs) {
      allProcs.push({ ...p, source: item.name });
    }
  }
  return allProcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROC COMBAT ENGINE
// Manages proc state (counters, cooldowns) during a combat session
// ─────────────────────────────────────────────────────────────────────────────
export class ProcEngine {
  constructor(equippedProcs, setProcs = []) {
    this.procs = [...equippedProcs, ...setProcs];
    this.attackCounter = 0;
    this.dotEffects = []; // active DoTs: { procId, element, dmgPerTurn, turnsLeft }
  }

  // Call on each player attack. Returns array of triggered proc results.
  onPlayerAttack(baseDamage, isCrit, enemyMaxHp, totalStats, characterClass) {
    this.attackCounter++;
    const results = [];

    for (const proc of this.procs) {
      let triggered = false;

      if (proc.trigger === "on_hit") {
        triggered = Math.random() < (proc.chance || 0);
      } else if (proc.trigger === "every_n") {
        triggered = this.attackCounter % (proc.every || 3) === 0;
      } else if (proc.trigger === "on_crit" && isCrit) {
        triggered = Math.random() < (proc.chance || 0);
      }

      if (!triggered) continue;

      const result = this._resolveProc(proc, baseDamage, enemyMaxHp, totalStats);
      if (result) results.push(result);
    }

    return results;
  }

  // Call when enemy is killed. Returns array of triggered proc results.
  onEnemyKill(baseDamage, goldReward, expReward) {
    const results = [];
    for (const proc of this.procs) {
      if (proc.trigger !== "on_kill") continue;
      if (Math.random() >= (proc.chance || 0)) continue;

      if (proc.type === "heal") {
        results.push({
          procId: proc.id,
          name: proc.name,
          icon: proc.icon,
          color: proc.color,
          type: "heal",
          healPercent: proc.healPercent || 0.15,
        });
      } else if (proc.type === "bonus_gold") {
        results.push({
          procId: proc.id,
          name: proc.name,
          icon: proc.icon,
          color: proc.color,
          type: "bonus_gold",
          bonusGold: Math.floor(goldReward * (proc.bonusPercent || 0.5)),
        });
      } else if (proc.type === "bonus_exp") {
        results.push({
          procId: proc.id,
          name: proc.name,
          icon: proc.icon,
          color: proc.color,
          type: "bonus_exp",
          bonusExp: Math.floor(expReward * (proc.bonusPercent || 0.3)),
        });
      }
    }
    return results;
  }

  // Call when player takes damage. Returns modified damage + proc results.
  onDamageTaken(rawDamage, baseDamage) {
    const results = [];
    let finalDamage = rawDamage;

    for (const proc of this.procs) {
      if (proc.trigger !== "on_hit_taken") continue;
      if (Math.random() >= (proc.chance || 0)) continue;

      if (proc.type === "reflect") {
        const reflected = Math.floor(rawDamage * (proc.reflectPercent || 0.25));
        results.push({
          procId: proc.id,
          name: proc.name,
          icon: proc.icon,
          color: proc.color,
          type: "reflect",
          damage: reflected,
        });
      } else if (proc.type === "absorb") {
        const absorbed = Math.floor(rawDamage * (proc.absorbPercent || 0.5));
        finalDamage = Math.max(1, rawDamage - absorbed);
        results.push({
          procId: proc.id,
          name: proc.name,
          icon: proc.icon,
          color: proc.color,
          type: "absorb",
          absorbed,
        });
      } else if (proc.type === "counter") {
        const counterDmg = Math.floor(baseDamage * (proc.damageMultiplier || 1.5));
        results.push({
          procId: proc.id,
          name: proc.name,
          icon: proc.icon,
          color: proc.color,
          type: "counter",
          damage: counterDmg,
        });
      }
    }

    return { finalDamage, results };
  }

  // Tick DoTs at start of enemy turn. Returns total DoT damage dealt.
  tickDoTs() {
    let totalDmg = 0;
    const ticks = [];
    const active = [];
    for (const dot of this.dotEffects) {
      totalDmg += dot.dmgPerTurn;
      ticks.push({ element: dot.element, dmg: dot.dmgPerTurn });
      dot.turnsLeft--;
      if (dot.turnsLeft > 0) active.push(dot);
    }
    this.dotEffects = active;
    return { totalDmg, ticks };
  }

  _resolveProc(proc, baseDamage, enemyMaxHp, totalStats) {
    const result = {
      procId: proc.id,
      name: proc.name,
      icon: proc.icon,
      color: proc.color,
      element: proc.element,
      source: proc.source || "",
    };

    switch (proc.type) {
      case "damage": {
        // Calculate elemental bonus if applicable
        let elemBonus = 1.0;
        if (proc.element && totalStats) {
          const elemKey = proc.element + "_dmg";
          elemBonus = 1 + ((totalStats[elemKey] || 0) / 100);
        }
        const dmg = Math.floor(baseDamage * (proc.damageMultiplier || 1.5) * elemBonus);
        return { ...result, type: "damage", damage: Math.max(1, dmg) };
      }
      case "dot": {
        const dmgPerTurn = Math.floor(baseDamage * (proc.damageMultiplier || 0.5));
        this.dotEffects.push({
          procId: proc.id,
          element: proc.element,
          dmgPerTurn: Math.max(1, dmgPerTurn),
          turnsLeft: proc.duration || 3,
        });
        return { ...result, type: "dot", dmgPerTurn: Math.max(1, dmgPerTurn), duration: proc.duration || 3 };
      }
      case "lifesteal_burst": {
        let elemBonus = 1.0;
        if (proc.element && totalStats) {
          const elemKey = proc.element + "_dmg";
          elemBonus = 1 + ((totalStats[elemKey] || 0) / 100);
        }
        const dmg = Math.floor(baseDamage * (proc.damageMultiplier || 1.5) * elemBonus);
        const heal = Math.floor(dmg * (proc.healPercent || 0.5));
        return { ...result, type: "lifesteal_burst", damage: Math.max(1, dmg), heal };
      }
      case "extra_hits": {
        return { ...result, type: "extra_hits", extraHits: proc.extraHits || 2 };
      }
      case "damage_percent_hp": {
        const dmg = Math.floor(enemyMaxHp * (proc.percentMaxHp || 0.08));
        return { ...result, type: "damage", damage: Math.max(1, dmg) };
      }
      default:
        return null;
    }
  }

  // Get currently active DoTs for UI display
  getActiveDots() {
    return this.dotEffects.map(dot => ({
      id: dot.procId,
      element: dot.element,
      dmgPerTurn: dot.dmgPerTurn,
      turnsLeft: dot.turnsLeft,
    }));
  }

  reset() {
    this.attackCounter = 0;
    this.dotEffects = [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SET PROC EFFECTS
// Special proc effects that activate from set bonuses
// ─────────────────────────────────────────────────────────────────────────────
export const SET_PROC_EFFECTS = {
  // Flamewarden 5pc: "Burn" — fires proc on every attack
  flamewarden_burn: {
    id: "flamewarden_burn",
    name: "Flamewarden's Fury",
    type: "damage",
    trigger: "on_hit",
    chance: 0.15,
    element: "fire",
    damageMultiplier: 2.0,
    icon: "🔥",
    color: "text-orange-400",
    description: "15% chance to ignite enemy with Flamewarden's fire for 200% fire damage",
  },
  // Thornblade 5pc: crits cause vine explosion
  thornblade_vines: {
    id: "thornblade_vines",
    name: "Thorn Eruption",
    type: "damage",
    trigger: "on_crit",
    chance: 0.30,
    element: "poison",
    damageMultiplier: 2.0,
    icon: "🌿",
    color: "text-green-400",
    description: "30% chance on crit to trigger a thorn eruption for 200% poison damage",
  },
  // Glacial Veil 5pc: frost shield procs
  glacialveil_freeze: {
    id: "glacialveil_freeze",
    name: "Glacial Barrier",
    type: "absorb",
    trigger: "on_hit_taken",
    chance: 0.20,
    absorbPercent: 0.40,
    icon: "❄️",
    color: "text-cyan-400",
    description: "20% chance when hit to freeze incoming damage, absorbing 40%",
  },
  // Void Reaper 5pc: death mark
  voidreaper_mark: {
    id: "voidreaper_mark",
    name: "Void Mark",
    type: "damage_percent_hp",
    trigger: "on_crit",
    chance: 0.20,
    percentMaxHp: 0.12,
    icon: "💀",
    color: "text-purple-400",
    description: "20% chance on crit to mark enemy, dealing 12% of their max HP",
  },
  // Cosmic Guardian 5pc: divine proc
  cosmic_radiance: {
    id: "cosmic_radiance",
    name: "Cosmic Radiance",
    type: "damage",
    trigger: "every_n",
    every: 3,
    element: "arcane",
    damageMultiplier: 3.0,
    icon: "✨",
    color: "text-yellow-300",
    description: "Every 3rd attack releases cosmic energy for 300% arcane damage",
  },
  // Shadowlord 5pc: soul cleave
  shadowlord_cleave: {
    id: "shadowlord_cleave",
    name: "Shadow Cleave",
    type: "damage",
    trigger: "on_hit",
    chance: 0.12,
    element: "blood",
    damageMultiplier: 2.5,
    icon: "🌑",
    color: "text-slate-400",
    description: "12% chance to cleave with shadow energy for 250% blood damage",
  },
  // Starborn Slayer 5pc
  starborn_nova: {
    id: "starborn_nova",
    name: "Starborn Nova",
    type: "damage",
    trigger: "on_crit",
    chance: 0.25,
    element: "fire",
    damageMultiplier: 4.0,
    icon: "⭐",
    color: "text-amber-300",
    description: "25% chance on crit to explode with stellar fire for 400% damage",
  },
  // Celestial Archmage 5pc
  genesis_wave: {
    id: "genesis_wave",
    name: "Genesis Wave",
    type: "damage",
    trigger: "every_n",
    every: 4,
    element: "arcane",
    damageMultiplier: 3.5,
    icon: "🌌",
    color: "text-blue-200",
    description: "Every 4th attack releases a genesis wave for 350% arcane damage",
  },
  // Void Assassin 5pc
  voidassassin_execute: {
    id: "voidassassin_execute",
    name: "Void Execution",
    type: "damage_percent_hp",
    trigger: "on_crit",
    chance: 0.30,
    percentMaxHp: 0.15,
    icon: "🗡️",
    color: "text-rose-400",
    description: "30% chance on crit to execute for 15% of enemy max HP",
  },
  // Nova Striker 5pc
  nova_barrage: {
    id: "nova_barrage",
    name: "Nova Barrage",
    type: "extra_hits",
    trigger: "every_n",
    every: 4,
    extraHits: 3,
    icon: "💫",
    color: "text-green-300",
    description: "Every 4th attack triggers 3 bonus attacks",
  },
};
