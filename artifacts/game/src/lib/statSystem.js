// ===== UNIFIED MMORPG STAT SYSTEM =====
// Single source of truth for ALL stat calculations.
// DO NOT duplicate any formulas anywhere else.

// ─────────────────────────────────────────────────────────────────────────────
// BASE CLASS VALUES
// ─────────────────────────────────────────────────────────────────────────────
export const CLASS_BASE_HP = { warrior: 120, mage: 70, ranger: 90, rogue: 80 };
export const CLASS_BASE_MP = { warrior: 30,  mage: 80, ranger: 50, rogue: 50 };
export const HP_PER_LEVEL  = { warrior: 12,  mage: 6,  ranger: 8,  rogue: 7  };
export const MP_PER_LEVEL  = { warrior: 2,   mage: 8,  ranger: 4,  rogue: 4  };

// ─────────────────────────────────────────────────────────────────────────────
// SCALING CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
export const VIT_TO_HP       = 10;   // 1 VIT → +10 max HP
export const INT_TO_MP       = 4;    // 1 INT → +4 max MP

const VIT_TO_HP_REGEN   = 0.03;  // 1 VIT  → +0.03 HP/s   (at 50 VIT = +1.5 HP/s)
const INT_TO_MP_REGEN   = 0.03;  // 1 INT  → +0.03 MP/s   (at 50 INT = +1.5 MP/s)
const BASE_HP_REGEN     = 0.3;   // everyone starts with 0.3 HP/s
const BASE_MP_REGEN     = 0.3;   // everyone starts with 0.3 MP/s

const EVASION_DEX_RATE  = 0.06;  // 1 DEX → +0.06% evasion (50 DEX = 3%)
const EVASION_SOFT_CAP  = 18;    // diminishing returns after 18%
const EVASION_HARD_CAP  = 65;    // absolute max 65% (can't reach 100%)

const BLOCK_STR_RATE    = 0.02;  // 1 STR → +0.02% block
const BLOCK_VIT_RATE    = 0.02;  // 1 VIT → +0.02% block
const BLOCK_HARD_CAP    = 65;    // max 65% (can't reach 100%)
const BLOCK_DAMAGE_REDUCTION = 0.50; // blocking reduces damage by 50%

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK SPEED & CRIT DMG SCALING
// ─────────────────────────────────────────────────────────────────────────────
// attack_speed: base 1.0, DEX adds a small bonus, gear can push higher
// crit_dmg_pct: base 150% (1.5x), each point of crit_dmg_pct stat = +1%
export const BASE_ATTACK_SPEED    = 1.0;
export const DEX_ATTACK_SPEED     = 0.0015; // 50 DEX = +0.075 speed
export const ATTACK_SPEED_CAP     = 3.5;    // max 3.5x base speed
export const BASE_CRIT_DMG_PCT    = 115;    // 115% = 1.15x multiplier on crit
export const CRIT_DMG_LUK_RATE    = 0.10;   // 1 LUK → +0.10% crit dmg
export const CRIT_DMG_CAP         = 600;    // max 600%

// ─────────────────────────────────────────────────────────────────────────────
// DAMAGE SCALING
// ─────────────────────────────────────────────────────────────────────────────
export const CLASS_DAMAGE_SCALING = {
  warrior: { primary: "strength",     primaryMult: 1.3, secondary: "vitality",     secondaryMult: 0.0 },
  mage:    { primary: "intelligence", primaryMult: 1.4, secondary: "strength",     secondaryMult: 0.0 },
  ranger:  { primary: "dexterity",    primaryMult: 1.2, secondary: "strength",     secondaryMult: 0.12 },
  rogue:   { primary: "dexterity",    primaryMult: 1.2, secondary: "strength",     secondaryMult: 0.2 },
};

// ─────────────────────────────────────────────────────────────────────────────
// CRIT SCALING
// ─────────────────────────────────────────────────────────────────────────────
export const CRIT_BASE      = 1;
export const CRIT_DEX_RATE  = 0.03;
export const CRIT_LUK_RATE  = 0.05;
export const CRIT_SOFT_CAP  = 25;
export const CRIT_HARD_CAP  = 50;

function calcCritChance(dex, luck) {
  const raw = CRIT_BASE + dex * CRIT_DEX_RATE + luck * CRIT_LUK_RATE;
  if (raw <= CRIT_SOFT_CAP) return raw;
  const overflow = raw - CRIT_SOFT_CAP;
  return Math.min(CRIT_HARD_CAP, CRIT_SOFT_CAP + overflow * 0.4);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFENSE SCALING
// ─────────────────────────────────────────────────────────────────────────────
function calcDefenseReduction(defense) {
  return defense / (defense + 200); // 0..1 soft curve, slower scaling
}

// ─────────────────────────────────────────────────────────────────────────────
// EVASION SCALING  (diminishing returns above soft cap)
// ─────────────────────────────────────────────────────────────────────────────
function calcEvasion(dex, bonusEvasion = 0) {
  const raw = dex * EVASION_DEX_RATE + bonusEvasion;
  let evasion;
  if (raw <= EVASION_SOFT_CAP) {
    evasion = raw;
  } else {
    const overflow = raw - EVASION_SOFT_CAP;
    evasion = EVASION_SOFT_CAP + overflow * 0.3;
  }
  return Math.min(EVASION_HARD_CAP, evasion);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK SCALING
// ─────────────────────────────────────────────────────────────────────────────
function calcBlockChance(str, vit, bonusBlock = 0) {
  const raw = str * BLOCK_STR_RATE + vit * BLOCK_VIT_RATE + bonusBlock;
  return Math.min(BLOCK_HARD_CAP, raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// RUNE STAT MAPPING → base stat keys
// ─────────────────────────────────────────────────────────────────────────────
const RUNE_STAT_TO_BASE = {
  attack_pct:    "damage",        // converted: attack% → flat damage scaled later
  crit_chance:   "crit_chance",
  crit_dmg_pct:  "crit_dmg_pct",
  boss_dmg_pct:  "boss_dmg_pct",  // new derived stat
  attack_speed:  "attack_speed",
  lifesteal:     "lifesteal",
  defense_pct:   "defense",       // converted: def% → flat defense scaled later
  block_chance:  "block_chance",
  evasion:       "evasion",
  hp_flat:       "hp_bonus",
  mp_flat:       "mp_bonus",
  hp_regen:      "hp_regen",
  mp_regen:      "mp_regen",
  exp_pct:       "exp_gain_pct",
  gold_pct:      "gold_gain_pct",
  drop_chance:   "drop_chance",   // new derived stat
  fire_dmg:      "fire_dmg",
  ice_dmg:       "ice_dmg",
  lightning_dmg: "lightning_dmg",
  poison_dmg:    "poison_dmg",
  blood_dmg:     "blood_dmg",
  sand_dmg:      "sand_dmg",
};

export function calculateRuneBonus(equippedRunes = []) {
  const bonus = {};
  for (const rune of equippedRunes) {
    if (!rune || !(rune.itemId || rune.item_id)) continue; // only count runes socketed into equipment
    // Main stat (handle both camelCase and snake_case from API)
    const mainStat = rune.mainStat || rune.main_stat;
    const mainValue = rune.mainValue || rune.main_value || 0;
    const mainKey = RUNE_STAT_TO_BASE[mainStat];
    if (mainKey) bonus[mainKey] = (bonus[mainKey] || 0) + mainValue;
    // Sub-stats
    const subs = rune.subStats || rune.sub_stats || [];
    for (const sub of subs) {
      const subKey = RUNE_STAT_TO_BASE[sub.stat];
      if (subKey) bonus[subKey] = (bonus[subKey] || 0) + (sub.value || 0);
    }
  }
  return bonus;
}

/**
 * calculateFinalStats(character, equippedItems, extraSetStats?, equippedRunes?)
 *
 * Returns: { base, equipBonus, setBonus, runeBonus, total, derived }
 *
 * derived includes ALL combat-ready values:
 *   attackPower, rawDefense, damageReduction, maxHp, maxMp,
 *   critChance, lifesteal,
 *   hpRegen, mpRegen,
 *   evasion, blockChance, blockReduction,
 *   goldGainPct, expGainPct, bossDmgPct, dropChance
 */
export function calculateFinalStats(character, equippedItems = [], extraSetStats = null, equippedRunes = []) {
  const cls   = character.class || "warrior";
  const level = character.level || 1;

  // ── 1. Base Stats (stored on character, already include allocated points) ──
  const base = {
    strength:     character.strength     || 10,
    dexterity:    character.dexterity    || 10,
    intelligence: character.intelligence || 10,
    vitality:     character.vitality     || 10,
    luck:         character.luck         || 5,
    // direct combat mods (from items / bonuses)
    damage:       0,
    defense:      0,
    hp_bonus:     0,
    mp_bonus:     0,
    crit_chance:  0,
    lifesteal:    0,
    hp_regen:     0,
    mp_regen:     0,
    evasion:      0,
    block_chance: 0,
    gold_gain_pct: 0,
    exp_gain_pct:  0,
    attack_speed:  0,
    crit_dmg_pct:  0,
    // Elemental damage bonuses (%)
    fire_dmg:      0,
    ice_dmg:       0,
    lightning_dmg: 0,
    poison_dmg:    0,
    blood_dmg:     0,
    sand_dmg:      0,
    // Rune-added stats
    boss_dmg_pct:  0,
    drop_chance:   0,
  };

  // ── 2. Equipment Bonus ────────────────────────────────────────────────────
  const BONUS_KEYS = Object.keys(base);
  const equipBonus = Object.fromEntries(BONUS_KEYS.map(k => [k, 0]));
  for (const item of equippedItems) {
    if (!item.stats) continue;
    for (const [k, v] of Object.entries(item.stats)) {
      if (k in equipBonus) equipBonus[k] += v || 0;
    }
  }

  // ── 3. Set Bonus ──────────────────────────────────────────────────────────
  const setBonus = Object.fromEntries(BONUS_KEYS.map(k => [k, 0]));
  if (extraSetStats) {
    for (const [k, v] of Object.entries(extraSetStats)) {
      if (k in setBonus) setBonus[k] += v || 0;
    }
  }

  // ── 4. Rune Bonus ──────────────────────────────────────────────────────────
  const runeBonus = Object.fromEntries(BONUS_KEYS.map(k => [k, 0]));
  const runeBonusRaw = calculateRuneBonus(equippedRunes);
  for (const [k, v] of Object.entries(runeBonusRaw)) {
    if (k in runeBonus) runeBonus[k] += v || 0;
  }

  // ── 5. Total ──────────────────────────────────────────────────────────────
  const total = {};
  for (const k of BONUS_KEYS) {
    total[k] = base[k] + equipBonus[k] + setBonus[k] + runeBonus[k];
  }

  // ── 5. Derived Combat Values ──────────────────────────────────────────────
  const scaling   = CLASS_DAMAGE_SCALING[cls] || CLASS_DAMAGE_SCALING.warrior;
  const attackPower = Math.round(
    total[scaling.primary] * scaling.primaryMult +
    total[scaling.secondary] * scaling.secondaryMult +
    total.damage
  );

  // Magic Attack: separate stat for INT-scaling classes
  const magicAttack = Math.round(
    total.intelligence * 1.4 + total.damage * 0.3
  );

  const rawDefense      = total.vitality * 0.3 + total.defense;
  const damageReduction = calcDefenseReduction(rawDefense); // 0..1

  const classBaseHp    = CLASS_BASE_HP[cls] || 100;
  const classHpPerLevel = HP_PER_LEVEL[cls] || 8;
  const maxHp = Math.round(
    classBaseHp + (level - 1) * classHpPerLevel +
    total.vitality * VIT_TO_HP + total.hp_bonus
  );

  const classBaseMp    = CLASS_BASE_MP[cls] || 50;
  const classMpPerLevel = MP_PER_LEVEL[cls] || 4;
  const maxMp = Math.round(
    classBaseMp + (level - 1) * classMpPerLevel +
    total.intelligence * INT_TO_MP + total.mp_bonus
  );

  const critChance = parseFloat(
    calcCritChance(total.dexterity, total.luck + total.crit_chance).toFixed(1)
  );

  // HP Regen: base + VIT scaling + item/set bonus
  const hpRegen = parseFloat(
    (BASE_HP_REGEN + total.vitality * VIT_TO_HP_REGEN + total.hp_regen).toFixed(2)
  );

  // MP Regen: base + INT scaling + item/set bonus
  const mpRegen = parseFloat(
    (BASE_MP_REGEN + total.intelligence * INT_TO_MP_REGEN + total.mp_regen).toFixed(2)
  );

  // Evasion: DEX-based + bonus
  const evasion = parseFloat(
    calcEvasion(total.dexterity, total.evasion).toFixed(1)
  );

  // Block: STR+VIT base + equipment bonus
  const blockChance = parseFloat(
    calcBlockChance(total.strength, total.vitality, total.block_chance).toFixed(1)
  );

  // Gold/EXP gain: capped at +300% each (4× max)
  const goldGainPct = Math.min(300, total.gold_gain_pct);
  const expGainPct  = Math.min(300, total.exp_gain_pct);

  // Attack Speed: base + DEX scaling + gear bonus, capped
  const attackSpeed = parseFloat(
    Math.min(ATTACK_SPEED_CAP, BASE_ATTACK_SPEED + total.dexterity * DEX_ATTACK_SPEED + total.attack_speed).toFixed(2)
  );

  // Crit Damage: base 150% + LUK scaling + gear bonus, capped
  const critDmgPct = parseFloat(
    Math.min(CRIT_DMG_CAP, BASE_CRIT_DMG_PCT + total.luck * CRIT_DMG_LUK_RATE + total.crit_dmg_pct).toFixed(1)
  );

  // Elemental bonuses: character base (equipment/gems) + item stats
  const fireDmg      = Math.min(300, (character.fire_dmg      || 0) + total.fire_dmg);
  const iceDmg       = Math.min(300, (character.ice_dmg       || 0) + total.ice_dmg);
  const lightningDmg = Math.min(300, (character.lightning_dmg || 0) + total.lightning_dmg);
  const poisonDmg    = Math.min(300, (character.poison_dmg    || 0) + total.poison_dmg);
  const bloodDmg     = Math.min(300, (character.blood_dmg     || 0) + total.blood_dmg);
  const sandDmg      = Math.min(300, (character.sand_dmg      || 0) + total.sand_dmg);

  // Boss damage bonus: capped at 200%
  const bossDmgPct = Math.min(200, total.boss_dmg_pct);

  // Drop chance bonus: capped at 100%
  const dropChance = Math.min(100, total.drop_chance);

  const derived = {
    attackPower,
    magicAttack,
    rawDefense:      Math.round(rawDefense),
    damageReduction: parseFloat((damageReduction * 100).toFixed(1)),
    maxHp,
    maxMp,
    critChance,
    critDmgPct,
    lifesteal:       total.lifesteal,
    hpRegen,
    mpRegen,
    evasion,
    blockChance,
    blockReduction:  BLOCK_DAMAGE_REDUCTION * 100,
    goldGainPct,
    expGainPct,
    attackSpeed,
    bossDmgPct,
    dropChance,
    fireDmg,
    iceDmg,
    lightningDmg,
    poisonDmg,
    bloodDmg,
    sandDmg,
  };

  return { base, equipBonus, setBonus, runeBonus, total, derived };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAMAGE ROLL
// ─────────────────────────────────────────────────────────────────────────────
// Map element names to totalStats keys
const ELEMENT_STAT_MAP = {
  fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg",
  poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg",
};

export function rollDamage(totalStats, characterClass, skill = null, character = null) {
  const scaling = CLASS_DAMAGE_SCALING[characterClass] || CLASS_DAMAGE_SCALING.warrior;
  const baseDmg =
    totalStats[scaling.primary] * scaling.primaryMult +
    totalStats[scaling.secondary] * scaling.secondaryMult +
    (totalStats.damage || 0);

  const skillMult  = skill ? (skill.damage || 1.0) : 1.0;
  const critChance = calcCritChance(totalStats.dexterity, totalStats.luck) / 100;
  const isCrit     = Math.random() < critChance;
  const critDmgMult = isCrit ? ((BASE_CRIT_DMG_PCT + (totalStats.luck || 0) * CRIT_DMG_LUK_RATE + (totalStats.crit_dmg_pct || 0)) / 100) : 1.0;
  const variance   = 0.95 + Math.random() * 0.1;

  // Elemental bonus: if skill has an element, apply character's elemental % bonus
  let elementalMult = 1.0;
  if (skill?.element && ELEMENT_STAT_MAP[skill.element] && character) {
    const elemPct = (character[ELEMENT_STAT_MAP[skill.element]] || 0) + (totalStats[ELEMENT_STAT_MAP[skill.element]] || 0);
    elementalMult = 1 + elemPct / 100;
  }

  return {
    damage: Math.max(1, Math.round(baseDmg * skillMult * critDmgMult * variance * elementalMult)),
    isCrit,
    elementalMult,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INCOMING DAMAGE  (evasion → block → defense)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * calculateDamageTaken(rawEnemyDmg, derived, enemyLevel, playerLevel)
 *
 * Flow:
 *   1. Evasion check  → 0 damage
 *   2. Block check    → 60% damage reduction
 *   3. Defense formula → soft-curve mitigation
 *
 * Returns: { finalDamage, evaded, blocked }
 */
export function calculateDamageTaken(rawEnemyDmg, derived, enemyLevel = 1, playerLevel = 1) {
  const { evasion, blockChance, rawDefense } = derived;

  // 1. Evasion
  if (Math.random() * 100 < evasion) {
    return { finalDamage: 0, evaded: true, blocked: false };
  }

  // 2. Block
  let dmg = rawEnemyDmg;
  let blocked = false;
  if (Math.random() * 100 < blockChance) {
    dmg = Math.round(dmg * (1 - BLOCK_DAMAGE_REDUCTION));
    blocked = true;
  }

  // 3. Defense reduction
  const reduction = calcDefenseReduction(rawDefense);
  dmg = dmg * (1 - reduction);

  // 4. Level difference bonus mitigation
  const levelDiff = Math.max(0, playerLevel - enemyLevel);
  if (levelDiff > 5) {
    const bonusReduction = Math.min(0.2, levelDiff * 0.02);
    dmg *= (1 - bonusReduction);
  }

  // Minimum 10% of raw (prevents immortality)
  const minDamage = Math.ceil(rawEnemyDmg * 0.10);
  return {
    finalDamage: Math.max(minDamage, Math.round(dmg)),
    evaded: false,
    blocked,
  };
}

// Legacy alias — kept so existing call sites don't break
export function mitigateDamage(rawEnemyDmg, totalStats, enemyLevel = 1, playerLevel = 1) {
  const defense = totalStats.vitality * 0.3 + (totalStats.defense || 0);
  const derived = {
    evasion: 0,
    blockChance: 0,
    rawDefense: defense,
  };
  const { finalDamage } = calculateDamageTaken(rawEnemyDmg, derived, enemyLevel, playerLevel);
  return finalDamage;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPAT SHIM
// ─────────────────────────────────────────────────────────────────────────────
export function calculateTotalStats(character, equippedItems = [], extraSetStats = null) {
  const { base, equipBonus, setBonus, total } = calculateFinalStats(character, equippedItems, extraSetStats);
  return { base, bonus: equipBonus, setBonus, total };
}