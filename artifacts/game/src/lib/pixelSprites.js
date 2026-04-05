/**
 * Pixel Art Sprite System
 * Generates canvas-rendered pixel art sprites for characters, enemies, and pets.
 * Each sprite is a small grid (16x16 or 24x24) drawn with individual colored pixels.
 */

const spriteCache = {};

// Draw a sprite from a pixel map onto a canvas and return a data URL
function renderSprite(pixelMap, palette, size = 16, scale = 3) {
  const key = JSON.stringify({ pixelMap, palette, size, scale });
  if (spriteCache[key]) return spriteCache[key];

  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < size; y++) {
    const row = pixelMap[y];
    if (!row) continue;
    for (let x = 0; x < size; x++) {
      const ch = row[x];
      if (!ch || ch === "." || ch === " ") continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  const url = canvas.toDataURL("image/png");
  spriteCache[key] = url;
  return url;
}

// ─── PLAYER CLASS SPRITES (16x16) ──────────────────────────────────

const WARRIOR_MAP = [
  "......CCCC......",
  ".....CSSSSC.....",
  ".....SSSSSS.....",
  "....SSSEESS.....",
  "....SSSMMS.....",
  ".....SSSS.......",
  "......SS........",
  "....AABBAA......",
  "...AAABBBAAA....",
  "...AABBBBBAA....",
  "..SSAABBBAA.W...",
  "....AABBAA.WW...",
  ".....AABB.......",
  ".....LL.LL......",
  "....LLL.LLL.....",
  "....BB...BB.....",
];

const MAGE_MAP = [
  "......HHH.......",
  ".....HHHHH......",
  ".....HGGHH......",
  "......HHH.......",
  "....SSSEESS.....",
  "....SSSMMS.....",
  ".....SSSS.......",
  "......SS........",
  "....RRRRRR......",
  "...RRRRRRRR.....",
  "...RRRRRRRRR....",
  "....RRRRRRRR....",
  ".....RRRRR..W...",
  ".....LL.LL..WG..",
  "....LLL.LLL.W...",
  "....BB...BB.....",
];

const RANGER_MAP = [
  "......CCCC......",
  ".....CSSSSC.....",
  ".....SSSSSS.....",
  "....SSSEESS.....",
  "....SSSMMS.....",
  ".....SSSS.......",
  "......SS........",
  "....GGGGGG......",
  "...GGGGGGGGG....",
  "...GGGGGGGG.....",
  "....GGGGGG......",
  "W...GGGGGG......",
  "WW...GGGG.......",
  ".W..LL.LL.......",
  "....LLL.LLL.....",
  "....BB...BB.....",
];

const ROGUE_MAP = [
  "......DDDD......",
  ".....DSSSSD.....",
  ".....SSSSSS.....",
  "....SSSEESS.....",
  "....SSSMMS.....",
  ".....SSSS.......",
  "......SS........",
  "....DDDDDD......",
  "...DDDDDDDD.....",
  "...DDDDDDDDD...",
  "....DDDDDDDD...",
  ".....DDDDDDD...",
  "W....DDDDDD....",
  "WW..LL.LL......",
  ".W.LLL.LLL.....",
  "....BB...BB.....",
];

const CLASS_PALETTES = {
  warrior: { S: "#f0c8a0", E: "#2040a0", M: "#c07060", C: "#808080", A: "#4060c0", B: "#604830", L: "#4050a0", W: "#a0a0a0", H: "#c0c0c0", G: "#80c040" },
  mage: { S: "#f0c8a0", E: "#6030a0", M: "#c07060", R: "#6030a0", B: "#604830", L: "#5040a0", W: "#905020", G: "#ffcc00", H: "#3020a0" },
  ranger: { S: "#f0c8a0", E: "#305020", M: "#c07060", C: "#607040", G: "#305020", B: "#604830", L: "#405030", W: "#805020" },
  rogue: { S: "#f0c8a0", E: "#202020", M: "#c07060", D: "#303030", B: "#604830", L: "#303030", W: "#c0c0c0" },
};

const CLASS_MAPS = {
  warrior: WARRIOR_MAP,
  mage: MAGE_MAP,
  ranger: RANGER_MAP,
  rogue: ROGUE_MAP,
};

// ─── ENEMY SPRITES (16x16) ─────────────────────────────────────────

const ENEMY_SPRITES = {
  // Generic beast
  beast: {
    map: [
      "................",
      "....EE....EE....",
      "...EEEE..EEEE...",
      "...EBBEEEEBBE...",
      "..EEEEEEEEEEEE..",
      "..EEEEEEEEEEEE..",
      "..EEEEMMMMEEE...",
      "...EEEMMMMEEE...",
      "....EEEEEEEE....",
      "..BBEEEEEEEBB...",
      ".BBBBEEEEEBBBB..",
      ".BB.BBEEEEBB.BB.",
      "....BBEEEBB.....",
      ".....BBBBB......",
      "....BB...BB.....",
      "....BB...BB.....",
    ],
    palette: { E: "#884422", B: "#663311", M: "#cc4444" },
  },
  // Bat / flying creature
  bat: {
    map: [
      "................",
      "WW..........WW..",
      "WWW........WWW..",
      ".WWWW....WWWW...",
      "..WWWWWWWWWW....",
      "...WWBBBBWW.....",
      "...WBBEEBB......",
      "....BBRRBB......",
      "....BBBBBB......",
      ".....BBBB.......",
      "......BB........",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
    palette: { W: "#553355", B: "#332233", E: "#ff2222", R: "#cc3333" },
  },
  // Skeleton / undead
  skeleton: {
    map: [
      "......BBBB......",
      ".....BWWWWB.....",
      "....BWWWWWWB....",
      "....BWDWWDWB....",
      "....BWWWWWWB....",
      ".....BWMMWB.....",
      "......BWWB......",
      ".......BB.......",
      "....BWWWWWB.....",
      "...BWWWWWWWB....",
      "...BWWBWWWWB....",
      "....BWBWWB......",
      ".....BWWB.......",
      ".....BW.WB......",
      "....BW...WB.....",
      "....BB...BB.....",
    ],
    palette: { B: "#444444", W: "#e0e0d0", D: "#202020", M: "#303030" },
  },
  // Dragon / boss type
  dragon: {
    map: [
      "...HH.....HH...",
      "..HHH.....HHH..",
      "..HEEEHHHEEEH..",
      "...EEEEEEEE....",
      "..EEEEYEEEE....",
      "..EEEEEEEEEE...",
      ".EEEEEEEEEEE...",
      ".EEEEEEEEEEE...",
      "WWEEEEEEEEEEWW.",
      ".WWEEEEEEEWW...",
      "..WWEEEEEWW....",
      "...WWEEWW......",
      "....EEEE.......",
      "...EE..EE......",
      "..EE....EE.....",
      "..CC....CC.....",
    ],
    palette: { E: "#cc3333", H: "#aa2222", Y: "#ffcc00", W: "#dd4444", C: "#882222" },
  },
  // Slime / blob
  slime: {
    map: [
      "................",
      "................",
      "................",
      ".....GGGG.......",
      "....GGGGGG......",
      "...GGGWGGWG.....",
      "..GGGGGGGGGG....",
      "..GGGGGGGGGG....",
      ".GGGGGGGGGGGG...",
      ".GGGGGGGGGGGG...",
      ".GGGGGGGGGGGGG..",
      "GGGGGGGGGGGGGG..",
      "GGGGGGGGGGGGGGG.",
      ".GGGGGGGGGGGGG..",
      "..GGGGGGGGGGG...",
      "................",
    ],
    palette: { G: "#44aa44", W: "#ffffff" },
  },
  // Wraith / ghost
  wraith: {
    map: [
      "......PPPP......",
      ".....PPPPPP.....",
      "....PPPPPPPP....",
      "...PPWPPPWPPP...",
      "...PPEPPPEPP....",
      "...PPPPPPPPPP...",
      "....PPPPPPPP....",
      "....PPPPPPPP....",
      "...PPPPPPPPPP...",
      "..PPPPPPPPPPPP..",
      "..PPPPPPPPPPPP..",
      ".PPPPPPPPPPPPP..",
      ".PP.PPPPPP.PPP..",
      "PP...PPPP...PP..",
      "......PP........",
      "................",
    ],
    palette: { P: "#6644aa", W: "#ffffff", E: "#cc44ff" },
  },
  // Golem / earth elemental
  golem: {
    map: [
      "....GGGGGG......",
      "...GGGGGGGG.....",
      "...GGRGGRGGG....",
      "...GGGGGGGG.....",
      "...GGGMMGGG.....",
      "....GGGGGG......",
      ".....GGGG.......",
      "...GGGGGGGG.....",
      "..GGGGGGGGGGG...",
      ".GGGGGGGGGGGGG..",
      ".GGGGGGGGGGGG...",
      "..GGGGGGGGGGG...",
      "...GGGGGGGG.....",
      "...GGG.GGG......",
      "..GGGG.GGGG.....",
      "..GGG...GGG.....",
    ],
    palette: { G: "#887755", R: "#ff4422", M: "#665544" },
  },
};

// Map enemy element + type to a sprite template
function getEnemySprite(element, enemyName, isBoss, isElite) {
  const name = (enemyName || "").toLowerCase();

  // Boss always gets dragon
  if (isBoss) return "dragon";

  // Match by name keywords
  if (name.includes("bat") || name.includes("wraith") || name.includes("phantom")) return "bat";
  if (name.includes("skeleton") || name.includes("bone") || name.includes("undead")) return "skeleton";
  if (name.includes("slime") || name.includes("ooze") || name.includes("blob")) return "slime";
  if (name.includes("ghost") || name.includes("spirit") || name.includes("shade")) return "wraith";
  if (name.includes("golem") || name.includes("earth") || name.includes("rock") || name.includes("stone")) return "golem";
  if (name.includes("dragon") || name.includes("drake") || name.includes("wyrm")) return "dragon";

  // Element-based fallbacks
  const elementDefaults = {
    fire: "dragon",
    ice: "golem",
    lightning: "wraith",
    poison: "slime",
    blood: "bat",
    sand: "golem",
    neutral: "beast",
  };
  return elementDefaults[element] || "beast";
}

// Recolor a sprite palette based on element
function getElementPalette(spriteKey, element) {
  const base = { ...ENEMY_SPRITES[spriteKey]?.palette };
  if (!base) return {};

  const elementColors = {
    fire: { primary: "#dd4422", secondary: "#ff8844", accent: "#ffcc22" },
    ice: { primary: "#4488cc", secondary: "#88bbee", accent: "#ccddff" },
    lightning: { primary: "#ccaa22", secondary: "#ffdd44", accent: "#ffffff" },
    poison: { primary: "#44aa44", secondary: "#66cc44", accent: "#aaff44" },
    blood: { primary: "#aa2233", secondary: "#cc3344", accent: "#ff6666" },
    sand: { primary: "#aa8844", secondary: "#ccaa55", accent: "#eedd88" },
    neutral: { primary: "#888888", secondary: "#aaaaaa", accent: "#cccccc" },
  };

  const ec = elementColors[element] || elementColors.neutral;

  // Recolor the main body color(s) to match element
  const keys = Object.keys(base);
  if (keys.length >= 1) base[keys[0]] = ec.primary;
  if (keys.length >= 2) base[keys[1]] = ec.secondary;

  return base;
}

// ─── PUBLIC API ─────────────────────────────────────────────────────

// Use custom pixel art sprites from /sprites/ folder
const CLASS_SPRITE_URLS = {
  warrior: "/sprites/class_warrior.png",
  mage: "/sprites/class_mage.png",
  ranger: "/sprites/class_ranger.png",
  rogue: "/sprites/class_rogue.png",
};

export function getPlayerSprite(playerClass, scale = 3) {
  return CLASS_SPRITE_URLS[playerClass] || CLASS_SPRITE_URLS.warrior;
}

export function getEnemySpriteUrl(element, enemyName, isBoss, isElite, scale = 3) {
  const spriteKey = getEnemySprite(element, enemyName, isBoss, isElite);
  const sprite = ENEMY_SPRITES[spriteKey];
  if (!sprite) return null;

  const palette = getElementPalette(spriteKey, element);
  return renderSprite(sprite.map, palette, 16, scale);
}

// Dead sprite - grayscale skull
const SKULL_MAP = [
  "................",
  "......BBBB......",
  ".....BBBBBB.....",
  "....BBWWWWBB....",
  "...BBWWWWWWBB...",
  "...BWWDWWDWWB...",
  "...BWWDWWDWWB...",
  "...BBWWWWWWBB...",
  "....BBWNNWBB....",
  ".....BWWWWB.....",
  "......BMMB......",
  ".....BMMMB......",
  "......BBB.......",
  "................",
  "................",
  "................",
];
const SKULL_PALETTE = { B: "#444444", W: "#ccccbb", D: "#222222", M: "#333333", N: "#555555" };

export function getDeadSprite(scale = 3) {
  return renderSprite(SKULL_MAP, SKULL_PALETTE, 16, scale);
}
