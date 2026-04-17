import React, { useState, useMemo } from "react";
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
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!animKey || errored) {
    return <span className="text-4xl">{emoji}</span>;
  }

  const sheetClass = SHEET_CLASS[animKey];

  return (
    <>
      {/* Preload image */}
      <img
        src={`/sprites/effects/attacks/${animKey}.png`}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ display: "none" }}
      />

      {/* Show sprite only when loaded */}
      {loaded && sheetClass ? (
        <div aria-hidden className={sheetClass} />
      ) : (
        <span className="text-4xl">{emoji}</span>
      )}
    </>
  );
}

// Per-animation-type config: emoji + motion variants
const ANIM_CONFIG = {
  slash:       { emoji: "⚔️",  color: "text-red-400",    rotate: 45,  scale: 1.3 },
  heavyslash:  { emoji: "🗡️",  color: "text-orange-400", rotate: 30,  scale: 1.5 },
  bash:        { emoji: "🛡️",  color: "text-blue-300",   rotate: 0,   scale: 1.4 },
  roar:        { emoji: "📣",  color: "text-yellow-400", rotate: 0,   scale: 1.5 },
  berserker:   { emoji: "😤",  color: "text-red-500",    rotate: 0,   scale: 1.4 },
  whirlwind:   { emoji: "🌀",  color: "text-cyan-400",   rotate: 720, scale: 1.5 },
  taunt:       { emoji: "😈",  color: "text-orange-400", rotate: 0,   scale: 1.2 },
  slam:        { emoji: "💢",  color: "text-red-400",    rotate: 0,   scale: 1.6 },
  shield:      { emoji: "🛡️",  color: "text-blue-400",   rotate: 0,   scale: 1.3 },
  divine:      { emoji: "✨",  color: "text-yellow-300", rotate: 360, scale: 1.5 },
  charge:      { emoji: "💨",  color: "text-gray-300",   rotate: 0,   scale: 1.2 },
  titan:       { emoji: "⚡",  color: "text-yellow-400", rotate: 0,   scale: 2.0 },
  explosion:   { emoji: "💥",  color: "text-orange-500", rotate: 0,   scale: 2.0 },
  projectile:  { emoji: "🔮",  color: "text-blue-400",   rotate: 0,   scale: 1.2 },
  frostshield: { emoji: "❄️",  color: "text-cyan-300",   rotate: 0,   scale: 1.3 },
  fireball:    { emoji: "🔥",  color: "text-orange-400", rotate: 0,   scale: 1.4 },
  icicle:      { emoji: "🧊",  color: "text-cyan-400",   rotate: 15,  scale: 1.2 },
  nova:        { emoji: "💫",  color: "text-purple-400", rotate: 360, scale: 1.5 },
  blizzard:    { emoji: "🌨️",  color: "text-blue-200",   rotate: 0,   scale: 1.4 },
  timewarp:    { emoji: "⏰",  color: "text-purple-300", rotate: 360, scale: 1.2 },
  meteor:      { emoji: "☄️",  color: "text-red-400",    rotate: -30, scale: 1.6 },
  blackhole:   { emoji: "🕳️",  color: "text-purple-500", rotate: 0,   scale: 1.5 },
  arrow:       { emoji: "🏹",  color: "text-green-400",  rotate: 0,   scale: 1.1 },
  dodge:       { emoji: "💨",  color: "text-green-300",  rotate: 0,   scale: 1.0 },
  multishot:   { emoji: "🎯",  color: "text-green-400",  rotate: 0,   scale: 1.3 },
  firearrow:   { emoji: "🔥",  color: "text-orange-400", rotate: 0,   scale: 1.2 },
  poison:      { emoji: "☠️",  color: "text-green-500",  rotate: 0,   scale: 1.3 },
  eagleeye:    { emoji: "👁️",  color: "text-yellow-400", rotate: 0,   scale: 1.3 },
  trap:        { emoji: "⚙️",  color: "text-gray-400",   rotate: 0,   scale: 1.2 },
  arrowrain:   { emoji: "☔",  color: "text-blue-400",   rotate: 0,   scale: 1.4 },
  mark:        { emoji: "🎯",  color: "text-red-400",    rotate: 0,   scale: 1.2 },
  shadowstep:  { emoji: "🌑",  color: "text-purple-400", rotate: 0,   scale: 1.3 },
  deatharrow:  { emoji: "💀",  color: "text-gray-400",   rotate: 0,   scale: 1.2 },
  lightning:   { emoji: "⚡",  color: "text-yellow-300", rotate: 0,   scale: 1.5 },
  backstab:    { emoji: "🗡️",  color: "text-purple-400", rotate: 180, scale: 1.3 },
  smoke:       { emoji: "💨",  color: "text-gray-400",   rotate: 0,   scale: 1.5 },
  bleed:       { emoji: "🩸",  color: "text-red-500",    rotate: 0,   scale: 1.2 },
  pickpocket:  { emoji: "💰",  color: "text-yellow-400", rotate: 0,   scale: 1.2 },
  bleedance:   { emoji: "💃",  color: "text-pink-400",   rotate: 0,   scale: 1.2 },
  garrote:     { emoji: "🪢",  color: "text-orange-400", rotate: 0,   scale: 1.2 },
  reaper:      { emoji: "💀",  color: "text-red-600",    rotate: -45, scale: 1.5 },
};

const CLASS_BASIC = {
  warrior: "slash",
  mage:    "projectile",
  ranger:  "arrow",
  rogue:   "slash",
};

/**
 * Computes the center of `elRef` relative to `containerRef`.
 * Returns { x, y } or null if refs aren't available.
 */
function getRelativeCenter(elRef, containerRef) {
  if (!elRef?.current || !containerRef?.current) return null;
  const el = elRef.current.getBoundingClientRect();
  const container = containerRef.current.getBoundingClientRect();
  return {
    x: el.left + el.width / 2 - container.left,
    y: el.top + el.height / 2 - container.top,
  };
}

export default function AttackVisual({
  characterClass, isSkill, skillId, show, seq = 0, damage, isCrit,
  arenaRef, playerRef, enemyRef,
}) {
  const animKey = skillId && SKILL_ANIMATIONS[skillId]
    ? SKILL_ANIMATIONS[skillId]
    : (isSkill ? "nova" : (CLASS_BASIC[characterClass] || "slash"));

  const config = ANIM_CONFIG[animKey] || ANIM_CONFIG.slash;

  // Compute projectile path on each new attack sequence
  const positions = useMemo(() => {
    if (!show) return null;
    const start = getRelativeCenter(playerRef, arenaRef);
    const end = getRelativeCenter(enemyRef, arenaRef);
    if (!start || !end) return null;
    return { start, end, dx: end.x - start.x, dy: end.y - start.y };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq, show]);

  // Fallback: render in-place if refs aren't available (e.g. on mobile stacked layout)
  if (!positions) {
    return (
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            key={`attack-${seq}`}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.span
              className="inline-flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: config.scale || 1.3, opacity: 1, rotate: config.rotate || 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <AttackSprite animKey={animKey} emoji={config.emoji} />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const { start, end, dx, dy } = positions;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={`attack-${seq}`}
          className="absolute pointer-events-none z-30"
          style={{ left: start.x, top: start.y, transform: "translate(-50%, -50%)" }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
          animate={{
            x: dx,
            y: dy,
            opacity: [0, 1, 1, 1],
            scale: [0.5, config.scale || 1.3, config.scale || 1.3, 0.3],
            rotate: config.rotate || 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
        >
          <motion.span
            className="inline-flex items-center justify-center drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            <AttackSprite animKey={animKey} emoji={config.emoji} />
          </motion.span>

          {/* Damage number appears at impact */}
          {damage && (
            <motion.div
              className={`absolute -top-6 left-1/2 -translate-x-1/2 font-orbitron font-bold text-lg whitespace-nowrap ${
                isCrit ? "text-yellow-400 scale-125" : config.color
              }`}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -28, opacity: [0, 0, 1, 0] }}
              transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.4, 0.5, 1] }}
            >
              {isCrit && "CRIT! "}{damage}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
