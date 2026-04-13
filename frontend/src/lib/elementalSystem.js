// ===== ELEMENTAL WEAKNESS / RESISTANCE SYSTEM =====
// Enemies have elemental affinities: weaknesses take more damage, resistances take less.
// Neutral elements deal normal damage.

// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLIERS
// ─────────────────────────────────────────────────────────────────────────────
export const WEAKNESS_MULT = 1.50;  // 50% bonus damage
export const RESIST_MULT   = 0.50;  // 50% less damage
export const NEUTRAL_MULT  = 1.00;

// ─────────────────────────────────────────────────────────────────────────────
// ELEMENT INTERACTIONS (rock-paper-scissors style + extras)
// Key = attacker element, Value = array of elements it's strong against
// ─────────────────────────────────────────────────────────────────────────────
export const ELEMENT_STRENGTHS = {
  fire:      ["ice", "poison"],        // fire melts ice, burns poison
  ice:       ["lightning", "sand"],     // ice grounds lightning, freezes sand
  lightning: ["fire", "blood"],         // lightning outpaces fire, shocks blood
  poison:    ["blood", "sand"],         // poison corrupts blood, wilts sand
  blood:     ["ice", "fire"],           // blood feeds on cold, extinguishes fire
  sand:      ["lightning", "blood"],    // sand insulates lightning, absorbs blood
  arcane:    [],                        // arcane is neutral to all
  physical:  [],                        // physical is neutral to all
};

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY ELEMENTAL PROFILES
// Each enemy has: weakness (takes extra dmg), resistance (takes less dmg)
// Multiple weaknesses/resistances possible for bosses
// ─────────────────────────────────────────────────────────────────────────────
export const ENEMY_ELEMENTS = {
  // ── Verdant Forest ──────────────────────────────────────────────────────
  forest_wolf:     { weakness: ["fire"],      resistance: [],          affinity: "physical" },
  goblin_scout:    { weakness: ["fire"],      resistance: ["poison"],  affinity: "physical" },
  giant_spider:    { weakness: ["fire"],      resistance: ["poison"],  affinity: "poison" },
  wild_boar:       { weakness: ["ice"],       resistance: [],          affinity: "physical" },
  moss_golem:      { weakness: ["fire"],      resistance: ["poison"],  affinity: "poison" },
  vine_serpent:    { weakness: ["ice", "fire"], resistance: ["poison"], affinity: "poison" },
  forest_bandit:   { weakness: ["lightning"], resistance: [],          affinity: "physical" },
  poison_frog:     { weakness: ["ice"],       resistance: ["poison"],  affinity: "poison" },
  bark_spider:     { weakness: ["fire"],      resistance: [],          affinity: "poison" },
  goblin_shaman:   { weakness: ["fire"],      resistance: ["arcane"],  affinity: "arcane" },
  treant_sprout:   { weakness: ["fire"],      resistance: ["poison"],  affinity: "physical" },
  thornback_boar:  { weakness: ["fire"],      resistance: ["poison"],  affinity: "physical" },
  ancient_treant:  { weakness: ["fire"],      resistance: ["poison", "physical"], affinity: "poison" },
  forest_troll:    { weakness: ["fire"],      resistance: ["physical"], affinity: "physical" },
  forest_guardian: { weakness: ["fire", "lightning"], resistance: ["poison"], affinity: "arcane" },

  // ── Scorched Desert ─────────────────────────────────────────────────────
  sand_scorpion:       { weakness: ["ice"],          resistance: ["fire", "sand"],  affinity: "poison" },
  desert_bandit:       { weakness: ["ice"],          resistance: ["sand"],          affinity: "physical" },
  sand_golem:          { weakness: ["ice", "lightning"], resistance: ["sand", "fire"], affinity: "sand" },
  fire_lizard:         { weakness: ["ice"],          resistance: ["fire"],          affinity: "fire" },
  cactus_wraith:       { weakness: ["fire"],         resistance: ["sand", "poison"], affinity: "poison" },
  dune_raider:         { weakness: ["ice"],          resistance: ["sand"],          affinity: "physical" },
  tomb_scarab:         { weakness: ["lightning"],     resistance: ["sand"],          affinity: "sand" },
  sandstorm_elemental: { weakness: ["ice"],          resistance: ["sand", "physical"], affinity: "sand" },
  desert_cobra:        { weakness: ["ice"],          resistance: ["poison"],        affinity: "poison" },
  mummy_warrior:       { weakness: ["fire"],         resistance: ["sand", "poison"], affinity: "sand" },
  sand_phantom:        { weakness: ["lightning"],     resistance: ["sand", "physical"], affinity: "sand" },
  flame_jackal:        { weakness: ["ice"],          resistance: ["fire"],          affinity: "fire" },
  tomb_guardian:       { weakness: ["lightning"],     resistance: ["sand", "physical"], affinity: "sand" },
  sand_titan:          { weakness: ["ice", "lightning"], resistance: ["sand", "fire", "physical"], affinity: "sand" },
  fire_colossus:       { weakness: ["ice"],          resistance: ["fire", "sand"],  affinity: "fire" },
  desert_wyrm:         { weakness: ["ice", "lightning"], resistance: ["fire", "sand"], affinity: "fire" },

  // ── Frozen Peaks ────────────────────────────────────────────────────────
  frost_wolf:       { weakness: ["fire"],        resistance: ["ice"],           affinity: "ice" },
  ice_elemental:    { weakness: ["fire", "lightning"], resistance: ["ice"],     affinity: "ice" },
  yeti:             { weakness: ["fire"],        resistance: ["ice"],           affinity: "ice" },
  glacial_golem:    { weakness: ["fire", "lightning"], resistance: ["ice", "physical"], affinity: "ice" },
  snow_harpy:       { weakness: ["fire", "lightning"], resistance: ["ice"],     affinity: "ice" },
  frozen_knight:    { weakness: ["fire"],        resistance: ["ice", "physical"], affinity: "ice" },
  ice_witch:        { weakness: ["fire"],        resistance: ["ice", "arcane"],  affinity: "ice" },
  blizzard_sprite:  { weakness: ["fire"],        resistance: ["ice"],           affinity: "ice" },
  frost_troll:      { weakness: ["fire"],        resistance: ["ice"],           affinity: "ice" },
  avalanche_wraith: { weakness: ["fire"],        resistance: ["ice", "physical"], affinity: "ice" },
  ice_basilisk:     { weakness: ["fire", "lightning"], resistance: ["ice"],     affinity: "ice" },
  polar_bear_spirit:{ weakness: ["fire"],        resistance: ["ice"],           affinity: "ice" },
  crystal_golem:    { weakness: ["fire", "lightning"], resistance: ["ice", "physical"], affinity: "ice" },
  frost_colossus:   { weakness: ["fire"],        resistance: ["ice", "physical"], affinity: "ice" },
  blizzard_titan:   { weakness: ["fire", "lightning"], resistance: ["ice", "physical"], affinity: "ice" },
  frost_dragon:     { weakness: ["fire", "lightning"], resistance: ["ice"],     affinity: "ice" },

  // ── Shadow Realm ────────────────────────────────────────────────────────
  shadow_wraith:    { weakness: ["lightning", "fire"], resistance: ["blood", "poison"], affinity: "blood" },
  demon_knight:     { weakness: ["ice"],         resistance: ["fire", "blood"],  affinity: "fire" },
  void_walker:      { weakness: ["lightning"],   resistance: ["blood", "arcane"], affinity: "arcane" },
  soul_harvester:   { weakness: ["fire", "lightning"], resistance: ["blood", "poison"], affinity: "blood" },
  nightmare_hound:  { weakness: ["ice"],         resistance: ["blood"],          affinity: "blood" },
  cursed_revenant:  { weakness: ["fire"],        resistance: ["blood", "poison"], affinity: "blood" },
  dark_sorcerer:    { weakness: ["lightning"],   resistance: ["arcane", "blood"], affinity: "arcane" },
  abyssal_fiend:    { weakness: ["ice", "lightning"], resistance: ["fire", "blood"], affinity: "fire" },
  blood_shade:      { weakness: ["fire", "lightning"], resistance: ["blood"],    affinity: "blood" },
  necrotic_golem:   { weakness: ["fire"],        resistance: ["poison", "blood", "physical"], affinity: "poison" },
  void_assassin:    { weakness: ["lightning"],   resistance: ["blood", "arcane"], affinity: "blood" },
  rift_stalker:     { weakness: ["ice"],         resistance: ["blood", "arcane"], affinity: "arcane" },
  shadow_dragon:    { weakness: ["lightning", "ice"], resistance: ["fire", "blood"], affinity: "blood" },
  void_titan:       { weakness: ["lightning"],   resistance: ["blood", "arcane", "physical"], affinity: "arcane" },
  blood_colossus:   { weakness: ["fire", "ice"], resistance: ["blood", "physical"], affinity: "blood" },
  shadow_lord:      { weakness: ["lightning", "ice"], resistance: ["blood", "fire", "arcane"], affinity: "blood" },

  // ── Celestial Spire ─────────────────────────────────────────────────────
  celestial_guardian: { weakness: ["blood", "poison"], resistance: ["arcane", "lightning"], affinity: "arcane" },
  seraph_warrior:     { weakness: ["blood"],     resistance: ["arcane", "fire"], affinity: "arcane" },
  titan:              { weakness: ["poison"],    resistance: ["physical", "arcane"], affinity: "physical" },
  star_phantom:       { weakness: ["blood", "poison"], resistance: ["arcane", "lightning"], affinity: "arcane" },
  nova_knight:        { weakness: ["ice", "poison"], resistance: ["fire", "arcane"], affinity: "fire" },
  divine_construct:   { weakness: ["lightning", "blood"], resistance: ["arcane", "physical"], affinity: "arcane" },
  astral_wyrm:        { weakness: ["ice", "poison"], resistance: ["fire", "arcane"], affinity: "fire" },
  cosmic_sentinel:    { weakness: ["blood"],     resistance: ["arcane", "lightning", "physical"], affinity: "arcane" },
  light_golem:        { weakness: ["blood", "poison"], resistance: ["arcane", "physical"], affinity: "arcane" },
  empyrean_shade:     { weakness: ["lightning", "fire"], resistance: ["arcane", "blood"], affinity: "arcane" },
  starfire_drake:     { weakness: ["ice"],       resistance: ["fire", "arcane"], affinity: "fire" },
  void_seraph:        { weakness: ["fire", "lightning"], resistance: ["arcane", "blood"], affinity: "arcane" },
  genesis_elemental:  { weakness: ["blood"],     resistance: ["arcane", "fire", "ice", "lightning"], affinity: "arcane" },
  celestial_titan:    { weakness: ["blood", "poison"], resistance: ["arcane", "physical", "fire"], affinity: "arcane" },
  omega_seraph:       { weakness: ["blood", "poison"], resistance: ["arcane", "lightning", "fire"], affinity: "arcane" },
  cosmic_overlord:    { weakness: ["blood", "poison"], resistance: ["arcane", "fire", "ice", "lightning"], affinity: "arcane" },
};

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATE ELEMENTAL MULTIPLIER
// ─────────────────────────────────────────────────────────────────────────────
export function getElementalMultiplier(attackElement, enemyKey) {
  if (!attackElement || attackElement === "physical") return NEUTRAL_MULT;

  const profile = ENEMY_ELEMENTS[enemyKey];
  if (!profile) return NEUTRAL_MULT;

  if (profile.weakness.includes(attackElement)) return WEAKNESS_MULT;
  if (profile.resistance.includes(attackElement)) return RESIST_MULT;
  return NEUTRAL_MULT;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ENEMY ELEMENT INFO (for display)
// ─────────────────────────────────────────────────────────────────────────────
export function getEnemyElementInfo(enemyKey) {
  return ENEMY_ELEMENTS[enemyKey] || { weakness: [], resistance: [], affinity: "physical" };
}

// ─────────────────────────────────────────────────────────────────────────────
// ELEMENT DISPLAY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const ELEMENT_DISPLAY = {
  fire:      { icon: "🔥", color: "text-orange-400", bg: "bg-orange-500/20", label: "Fire" },
  ice:       { icon: "❄️",  color: "text-cyan-400",   bg: "bg-cyan-500/20",   label: "Ice" },
  lightning: { icon: "⚡", color: "text-yellow-300", bg: "bg-yellow-500/20", label: "Lightning" },
  poison:    { icon: "☠️",  color: "text-green-400",  bg: "bg-green-500/20",  label: "Poison" },
  blood:     { icon: "🩸", color: "text-red-500",    bg: "bg-red-500/20",    label: "Blood" },
  sand:      { icon: "🌪️",  color: "text-amber-400",  bg: "bg-amber-500/20",  label: "Sand" },
  arcane:    { icon: "✨", color: "text-purple-400", bg: "bg-purple-500/20", label: "Arcane" },
  physical:  { icon: "⚔️",  color: "text-gray-300",   bg: "bg-gray-500/20",   label: "Physical" },
};
