// Enemy sprite mapping — maps enemy keys to sprite paths
// Knight sprites: 64 variants in /sprites/enemies/knight/

const KNIGHT_SPRITE_COUNT = 64;

// Specific knight enemy -> sprite assignments (hand-picked for thematic fit)
const KNIGHT_ENEMY_MAP = {
  frozen_knight: 5,    // icy blue knight
  demon_knight: 33,    // dark fiery knight
  nova_knight: 49,     // bright celestial knight
};

// Enemies that should use knight sprites (armored humanoid types only)
const KNIGHT_TYPE_ENEMIES = new Set([
  "frozen_knight", "demon_knight", "nova_knight",
  "forest_guardian", "cursed_revenant", "celestial_guardian",
  "seraph_warrior", "divine_construct", "cosmic_sentinel",
  "tomb_guardian", "mummy_warrior",
]);

// Simple hash for consistent sprite assignment
function enemySpriteHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Tower/dungeon/portal enemies that mention "Knight" in their name
function isKnightByName(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes("knight") || lower.includes("guardian") || lower.includes("sentinel")
    || lower.includes("construct") || lower.includes("warrior");
}

/**
 * Returns the sprite path for an enemy, or null if no sprite exists.
 * @param {string} enemyKey - Enemy key (e.g. "frozen_knight")
 * @param {string} enemyName - Enemy display name (fallback for dynamic enemies)
 */
export function getEnemySprite(enemyKey, enemyName) {
  // Check specific assignments first
  if (enemyKey && KNIGHT_ENEMY_MAP[enemyKey]) {
    return `/sprites/enemies/knight/knight_${String(KNIGHT_ENEMY_MAP[enemyKey]).padStart(3, "0")}.png`;
  }

  // Check if this enemy type uses knight sprites
  if ((enemyKey && KNIGHT_TYPE_ENEMIES.has(enemyKey)) || isKnightByName(enemyName)) {
    const seed = enemyKey || enemyName || "";
    const idx = (enemySpriteHash(seed) % KNIGHT_SPRITE_COUNT) + 1;
    return `/sprites/enemies/knight/knight_${String(idx).padStart(3, "0")}.png`;
  }

  return null;
}
