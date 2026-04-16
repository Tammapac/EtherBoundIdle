import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SKILL_ANIMATIONS } from "@/lib/skillData";

/**
 * AttackSprite — renders a pixel sprite for the current attack animation if a
 * PNG exists at /sprites/effects/attacks/{animKey}.png. If the file is missing
 * the sprite quietly falls back to the emoji glyph supplied by the parent.
 *
 * Two file layouts are supported:
 *   - Static single-frame PNG (default). Rendered via <img>.
 *   - Horizontal sprite strip listed in SHEET_CLASS below. Rendered as a
 *     background-image so CSS `steps()` animation can cycle through frames.
 *     Add the key here AND declare a matching `.eb-sprite-{key}` class with
 *     its keyframes in index.css.
 *
 * Drop sprites in /public/sprites/effects/attacks/ named after the animation
 * key (e.g. fireball.png, slash.png, nova.png) and they will replace the
 * emoji automatically.
 */
// Animation keys whose PNG is a horizontal sprite strip (not a single frame).
// The CSS class drives the per-frame animation; see index.css.
const SHEET_CLASS = {
  fireball: "eb-sprite-fireball",
};

function AttackSprite({ animKey, emoji }) {
  const [errored, setErrored] = useState(false);
  if (errored || !animKey) {
    return <span className="text-4xl">{emoji}</span>;
  }

  const sheetClass = SHEET_CLASS[animKey];
  if (sheetClass) {
    return (
      <>
        {/* Hidden preload — triggers fallback if the sheet is missing */}
        <img
          src={`/sprites/effects/attacks/${animKey}.png`}
          alt=""
          onError={() => setErrored(true)}
          style={{ display: "none" }}
        />
        <div aria-hidden className={sheetClass} />
      </>
    );
  }

  return (
    <img
      src={`/sprites/effects/attacks/${animKey}.png`}
      alt=""
      draggable={false}
      onError={() => setErrored(true)}
      style={{
        width: 64,
        height: 64,
        imageRendering: "pixelated",
        objectFit: "contain",
      }}
    />
  );
}

// Per-animation-type config: emoji + motion variants
const ANIM_CONFIG = {
  slash:       { emoji: "⚔️",  color: "text-red-400",    variants: { initial: { x: -30, opacity: 0, rotate: -45 }, animate: { x: 30, opacity: 1, rotate: 0 }, exit: { x: 60, opacity: 0, rotate: 45 } } },
  heavyslash:  { emoji: "🗡️",  color: "text-orange-400", variants: { initial: { x: -40, opacity: 0, scale: 0.5 }, animate: { x: 40, opacity: 1, scale: 1.4 }, exit: { x: 80, opacity: 0, scale: 0.5 } } },
  bash:        { emoji: "🛡️",  color: "text-blue-300",   variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 1.3, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  roar:        { emoji: "📣",  color: "text-yellow-400", variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.5, opacity: 1 }, exit: { scale: 2.5, opacity: 0 } } },
  berserker:   { emoji: "😤",  color: "text-red-500",    variants: { initial: { rotate: -90, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, exit: { rotate: 90, opacity: 0 } } },
  whirlwind:   { emoji: "🌀",  color: "text-cyan-400",   variants: { initial: { scale: 0, rotate: 0, opacity: 0 }, animate: { scale: 1.5, rotate: 720, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  taunt:       { emoji: "😈",  color: "text-orange-400", variants: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } } },
  slam:        { emoji: "💢",  color: "text-red-400",    variants: { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 40, opacity: 0 } } },
  shield:      { emoji: "🛡️",  color: "text-blue-400",   variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  divine:      { emoji: "✨",  color: "text-yellow-300", variants: { initial: { scale: 0, opacity: 0, rotate: 0 }, animate: { scale: 1.5, opacity: 1, rotate: 360 }, exit: { scale: 2, opacity: 0 } } },
  charge:      { emoji: "💨",  color: "text-gray-300",   variants: { initial: { x: -60, opacity: 0 }, animate: { x: 60, opacity: 1 }, exit: { x: 120, opacity: 0 } } },
  titan:       { emoji: "⚡",  color: "text-yellow-400", variants: { initial: { scale: 0, opacity: 0 }, animate: { scale: 2, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  explosion:   { emoji: "💥",  color: "text-orange-500", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 2, opacity: 1 }, exit: { scale: 3, opacity: 0 } } },
  projectile:  { emoji: "🔮",  color: "text-blue-400",   variants: { initial: { x: -40, opacity: 0, scale: 0.5 }, animate: { x: 40, opacity: 1, scale: 1 }, exit: { x: 80, opacity: 0, scale: 1.5 } } },
  frostshield: { emoji: "❄️",  color: "text-cyan-300",   variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  fireball:    { emoji: "🔥",  color: "text-orange-400", variants: { initial: { x: -40, opacity: 0 }, animate: { x: 50, opacity: 1 }, exit: { x: 100, opacity: 0 } } },
  icicle:      { emoji: "🧊",  color: "text-cyan-400",   variants: { initial: { x: -40, y: -10, opacity: 0 }, animate: { x: 40, y: 10, opacity: 1 }, exit: { x: 80, opacity: 0 } } },
  nova:        { emoji: "💫",  color: "text-purple-400", variants: { initial: { scale: 0, opacity: 0, rotate: 0 }, animate: { scale: 1.5, opacity: 1, rotate: 360 }, exit: { scale: 2.5, opacity: 0, rotate: 720 } } },
  blizzard:    { emoji: "🌨️",  color: "text-blue-200",   variants: { initial: { y: -30, opacity: 0 }, animate: { y: 10, opacity: 1 }, exit: { y: 40, opacity: 0 } } },
  timewarp:    { emoji: "⏰",  color: "text-purple-300", variants: { initial: { scale: 1.5, opacity: 0, rotate: 0 }, animate: { scale: 0.8, opacity: 1, rotate: 360 }, exit: { scale: 2, opacity: 0, rotate: 720 } } },
  meteor:      { emoji: "☄️",  color: "text-red-400",    variants: { initial: { x: -30, y: -50, opacity: 0, scale: 0.5 }, animate: { x: 30, y: 30, opacity: 1, scale: 1.5 }, exit: { x: 50, y: 60, opacity: 0 } } },
  blackhole:   { emoji: "🕳️",  color: "text-purple-500", variants: { initial: { scale: 2, opacity: 0 }, animate: { scale: 0.5, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  arrow:       { emoji: "🏹",  color: "text-green-400",  variants: { initial: { x: -50, opacity: 0 }, animate: { x: 50, opacity: 1 }, exit: { x: 100, opacity: 0 } } },
  dodge:       { emoji: "💨",  color: "text-green-300",  variants: { initial: { x: 0, opacity: 0 }, animate: { x: -30, opacity: 1 }, exit: { x: -60, opacity: 0 } } },
  multishot:   { emoji: "🎯",  color: "text-green-400",  variants: { initial: { x: -40, opacity: 0, scale: 0.5 }, animate: { x: 40, opacity: 1, scale: 1.2 }, exit: { x: 80, opacity: 0 } } },
  firearrow:   { emoji: "🔥",  color: "text-orange-400", variants: { initial: { x: -40, opacity: 0 }, animate: { x: 50, opacity: 1 }, exit: { x: 100, opacity: 0 } } },
  poison:      { emoji: "☠️",  color: "text-green-500",  variants: { initial: { y: -20, opacity: 0 }, animate: { y: 10, opacity: 1 }, exit: { y: 30, opacity: 0 } } },
  eagleeye:    { emoji: "👁️",  color: "text-yellow-400", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 1.3, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  trap:        { emoji: "⚙️",  color: "text-gray-400",   variants: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } } },
  arrowrain:   { emoji: "☔",  color: "text-blue-400",   variants: { initial: { y: -40, opacity: 0 }, animate: { y: 20, opacity: 1 }, exit: { y: 50, opacity: 0 } } },
  mark:        { emoji: "🎯",  color: "text-red-400",    variants: { initial: { scale: 2, opacity: 0 }, animate: { scale: 0.8, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  shadowstep:  { emoji: "🌑",  color: "text-purple-400", variants: { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1.3 }, exit: { opacity: 0, scale: 0 } } },
  deatharrow:  { emoji: "💀",  color: "text-gray-400",   variants: { initial: { x: -50, opacity: 0 }, animate: { x: 60, opacity: 1 }, exit: { x: 120, opacity: 0 } } },
  lightning:   { emoji: "⚡",  color: "text-yellow-300", variants: { initial: { y: -50, opacity: 0 }, animate: { y: 20, opacity: 1 }, exit: { y: 60, opacity: 0 } } },
  backstab:    { emoji: "🗡️",  color: "text-purple-400", variants: { initial: { scale: 0.3, rotate: -180, opacity: 0 }, animate: { scale: 1.3, rotate: 0, opacity: 1 }, exit: { scale: 0, rotate: 180, opacity: 0 } } },
  smoke:       { emoji: "💨",  color: "text-gray-400",   variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.5, opacity: 0.8 }, exit: { scale: 2.5, opacity: 0 } } },
  bleed:       { emoji: "🩸",  color: "text-red-500",    variants: { initial: { y: -20, opacity: 0 }, animate: { y: 10, opacity: 1 }, exit: { y: 30, opacity: 0 } } },
  pickpocket:  { emoji: "💰",  color: "text-yellow-400", variants: { initial: { y: 20, opacity: 0 }, animate: { y: -10, opacity: 1 }, exit: { y: -30, opacity: 0 } } },
  bleedance:   { emoji: "💃",  color: "text-pink-400",   variants: { initial: { x: -20, rotate: -180, opacity: 0 }, animate: { x: 20, rotate: 0, opacity: 1 }, exit: { x: 40, rotate: 180, opacity: 0 } } },
  garrote:     { emoji: "🪢",  color: "text-orange-400", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  reaper:      { emoji: "💀",  color: "text-red-600",    variants: { initial: { scale: 2, opacity: 0, rotate: -45 }, animate: { scale: 1, opacity: 1, rotate: 0 }, exit: { scale: 0, opacity: 0, rotate: 45 } } },
};

const CLASS_BASIC = {
  warrior: "slash",
  mage:    "projectile",
  ranger:  "arrow",
  rogue:   "slash",
};

export default function AttackVisual({ characterClass, isSkill, skillId, show, damage, isCrit }) {
  const animKey = skillId && SKILL_ANIMATIONS[skillId]
    ? SKILL_ANIMATIONS[skillId]
    : (isSkill ? "nova" : (CLASS_BASIC[characterClass] || "slash"));

  const config = ANIM_CONFIG[animKey] || ANIM_CONFIG.slash;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="inline-flex items-center justify-center"
            variants={config.variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <AttackSprite animKey={animKey} emoji={config.emoji} />
          </motion.span>

          {damage && (
            <motion.div
              className={`absolute top-2 right-4 font-orbitron font-bold text-lg ${
                isCrit ? "text-yellow-400 scale-125" : config.color
              }`}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -28, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {isCrit && "CRIT! "}{damage}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}