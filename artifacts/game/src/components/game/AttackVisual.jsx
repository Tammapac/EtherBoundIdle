import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SKILL_ANIMATIONS } from "@/lib/skillData";

// Sprite-sheet config: frames, source frame size, display size, ms per frame.
// Add an entry here for each skill that has a sprite strip PNG.
const SPRITE_SHEETS = {
  fireball: { frames: 7, srcW: 32, srcH: 32, displayW: 64, displayH: 64, frameDuration: 150 },
};

function AttackSprite({ animKey, emoji }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [frame, setFrame] = useState(0);

  const sheet = SPRITE_SHEETS[animKey];

  // JS-driven frame cycling — works in all browsers, no CSS steps() needed
  useEffect(() => {
    if (!loaded || !sheet) return;
    setFrame(0);
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % sheet.frames);
    }, sheet.frameDuration);
    return () => clearInterval(interval);
  }, [loaded, sheet]);

  if (!animKey || errored) {
    return <span className="text-4xl">{emoji}</span>;
  }

  return (
    <>
      <img
        src={`/sprites/effects/attacks/${animKey}.png`}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ display: "none" }}
      />
      {loaded && sheet ? (
        <div
          aria-hidden
          style={{
            width: sheet.displayW,
            height: sheet.displayH,
            backgroundImage: `url('/sprites/effects/attacks/${animKey}.png')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${sheet.frames * sheet.displayW}px ${sheet.displayH}px`,
            backgroundPositionX: -(frame * sheet.displayW),
            imageRendering: "pixelated",
          }}
        />
      ) : (
        <span className="text-4xl">{emoji}</span>
      )}
    </>
  );
}

// ── Animation categories ──
// "projectile" — flies from player to enemy
// "impact"     — plays on the enemy card (slash, explosion, etc.)
// "self"       — plays on the player card (buffs, shields, auras)

const ANIM_CONFIG = {
  // Projectiles — fly from player to enemy
  fireball:    { emoji: "🔥",  color: "text-orange-400", category: "projectile", rotate: 0,   scale: 1.4 },
  arrow:       { emoji: "🏹",  color: "text-green-400",  category: "projectile", rotate: 0,   scale: 1.2 },
  icicle:      { emoji: "🧊",  color: "text-cyan-400",   category: "projectile", rotate: 15,  scale: 1.2 },
  projectile:  { emoji: "🔮",  color: "text-blue-400",   category: "projectile", rotate: 0,   scale: 1.2 },
  firearrow:   { emoji: "🔥",  color: "text-orange-400", category: "projectile", rotate: 0,   scale: 1.2 },
  deatharrow:  { emoji: "💀",  color: "text-gray-400",   category: "projectile", rotate: 0,   scale: 1.2 },
  multishot:   { emoji: "🎯",  color: "text-green-400",  category: "projectile", rotate: 0,   scale: 1.3 },
  charge:      { emoji: "💨",  color: "text-gray-300",   category: "projectile", rotate: 0,   scale: 1.2 },
  meteor:      { emoji: "☄️",  color: "text-red-400",    category: "projectile", rotate: -30, scale: 1.6 },
  poison:      { emoji: "☠️",  color: "text-green-500",  category: "projectile", rotate: 0,   scale: 1.2 },

  // Impact — plays on the enemy
  slash:       { emoji: "⚔️",  color: "text-red-400",    category: "impact", variants: { initial: { x: -30, opacity: 0, rotate: -45 }, animate: { x: 30, opacity: 1, rotate: 0 }, exit: { x: 60, opacity: 0, rotate: 45 } } },
  heavyslash:  { emoji: "🗡️",  color: "text-orange-400", category: "impact", variants: { initial: { x: -40, opacity: 0, scale: 0.5 }, animate: { x: 40, opacity: 1, scale: 1.4 }, exit: { x: 80, opacity: 0, scale: 0.5 } } },
  bash:        { emoji: "🛡️",  color: "text-blue-300",   category: "impact", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 1.3, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  slam:        { emoji: "💢",  color: "text-red-400",    category: "impact", variants: { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 40, opacity: 0 } } },
  explosion:   { emoji: "💥",  color: "text-orange-500", category: "impact", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 2, opacity: 1 }, exit: { scale: 3, opacity: 0 } } },
  backstab:    { emoji: "🗡️",  color: "text-purple-400", category: "impact", variants: { initial: { scale: 0.3, rotate: -180, opacity: 0 }, animate: { scale: 1.3, rotate: 0, opacity: 1 }, exit: { scale: 0, rotate: 180, opacity: 0 } } },
  bleed:       { emoji: "🩸",  color: "text-red-500",    category: "impact", variants: { initial: { y: -20, opacity: 0 }, animate: { y: 10, opacity: 1 }, exit: { y: 30, opacity: 0 } } },
  garrote:     { emoji: "🪢",  color: "text-orange-400", category: "impact", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  lightning:   { emoji: "⚡",  color: "text-yellow-300", category: "impact", variants: { initial: { y: -50, opacity: 0 }, animate: { y: 20, opacity: 1 }, exit: { y: 60, opacity: 0 } } },
  reaper:      { emoji: "💀",  color: "text-red-600",    category: "impact", variants: { initial: { scale: 2, opacity: 0, rotate: -45 }, animate: { scale: 1, opacity: 1, rotate: 0 }, exit: { scale: 0, opacity: 0, rotate: 45 } } },
  bleedance:   { emoji: "💃",  color: "text-pink-400",   category: "impact", variants: { initial: { x: -20, rotate: -180, opacity: 0 }, animate: { x: 20, rotate: 0, opacity: 1 }, exit: { x: 40, rotate: 180, opacity: 0 } } },
  pickpocket:  { emoji: "💰",  color: "text-yellow-400", category: "impact", variants: { initial: { y: 20, opacity: 0 }, animate: { y: -10, opacity: 1 }, exit: { y: -30, opacity: 0 } } },
  mark:        { emoji: "🎯",  color: "text-red-400",    category: "impact", variants: { initial: { scale: 2, opacity: 0 }, animate: { scale: 0.8, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  shadowstep:  { emoji: "🌑",  color: "text-purple-400", category: "impact", variants: { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1.3 }, exit: { opacity: 0, scale: 0 } } },
  eagleeye:    { emoji: "👁️",  color: "text-yellow-400", category: "impact", variants: { initial: { scale: 0.3, opacity: 0 }, animate: { scale: 1.3, opacity: 1 }, exit: { scale: 2, opacity: 0 } } },
  trap:        { emoji: "⚙️",  color: "text-gray-400",   category: "impact", variants: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } } },
  arrowrain:   { emoji: "☔",  color: "text-blue-400",   category: "impact", variants: { initial: { y: -40, opacity: 0 }, animate: { y: 20, opacity: 1 }, exit: { y: 50, opacity: 0 } } },
  blizzard:    { emoji: "🌨️",  color: "text-blue-200",   category: "impact", variants: { initial: { y: -30, opacity: 0 }, animate: { y: 10, opacity: 1 }, exit: { y: 40, opacity: 0 } } },
  blackhole:   { emoji: "🕳️",  color: "text-purple-500", category: "impact", variants: { initial: { scale: 2, opacity: 0 }, animate: { scale: 0.5, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  timewarp:    { emoji: "⏰",  color: "text-purple-300", category: "impact", variants: { initial: { scale: 1.5, opacity: 0, rotate: 0 }, animate: { scale: 0.8, opacity: 1, rotate: 360 }, exit: { scale: 2, opacity: 0, rotate: 720 } } },

  // Self/area — plays on the player
  shield:      { emoji: "🛡️",  color: "text-blue-400",   category: "self", variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  frostshield: { emoji: "❄️",  color: "text-cyan-300",   category: "self", variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  roar:        { emoji: "📣",  color: "text-yellow-400", category: "self", variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.5, opacity: 1 }, exit: { scale: 2.5, opacity: 0 } } },
  whirlwind:   { emoji: "🌀",  color: "text-cyan-400",   category: "self", variants: { initial: { scale: 0, rotate: 0, opacity: 0 }, animate: { scale: 1.5, rotate: 720, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  berserker:   { emoji: "😤",  color: "text-red-500",    category: "self", variants: { initial: { rotate: -90, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, exit: { rotate: 90, opacity: 0 } } },
  taunt:       { emoji: "😈",  color: "text-orange-400", category: "self", variants: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } } },
  divine:      { emoji: "✨",  color: "text-yellow-300", category: "self", variants: { initial: { scale: 0, opacity: 0, rotate: 0 }, animate: { scale: 1.5, opacity: 1, rotate: 360 }, exit: { scale: 2, opacity: 0 } } },
  titan:       { emoji: "⚡",  color: "text-yellow-400", category: "self", variants: { initial: { scale: 0, opacity: 0 }, animate: { scale: 2, opacity: 1 }, exit: { scale: 0, opacity: 0 } } },
  nova:        { emoji: "💫",  color: "text-purple-400", category: "self", variants: { initial: { scale: 0, opacity: 0, rotate: 0 }, animate: { scale: 1.5, opacity: 1, rotate: 360 }, exit: { scale: 2.5, opacity: 0, rotate: 720 } } },
  smoke:       { emoji: "💨",  color: "text-gray-400",   category: "self", variants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.5, opacity: 0.8 }, exit: { scale: 2.5, opacity: 0 } } },
  dodge:       { emoji: "💨",  color: "text-green-300",  category: "self", variants: { initial: { x: 0, opacity: 0 }, animate: { x: -30, opacity: 1 }, exit: { x: -60, opacity: 0 } } },
};

const CLASS_BASIC = {
  warrior: "slash",
  mage:    "projectile",
  ranger:  "arrow",
  rogue:   "slash",
};

function getRelativeCenter(elRef, containerRef) {
  if (!elRef?.current || !containerRef?.current) return null;
  const el = elRef.current.getBoundingClientRect();
  const container = containerRef.current.getBoundingClientRect();
  return {
    x: el.left + el.width / 2 - container.left,
    y: el.top + el.height / 2 - container.top,
  };
}

// ── Projectile sub-component: flies from player to enemy ──
function ProjectileAnim({ config, animKey, positions, seq, damage, isCrit }) {
  const { start, end, dx, dy } = positions;
  return (
    <motion.div
      key={`attack-${seq}`}
      className="absolute pointer-events-none z-30"
      style={{ left: start.x, top: start.y, transform: "translate(-50%, -50%)" }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      animate={{
        x: dx,
        y: dy,
        opacity: [0, 1, 1, 0.8],
        scale: [0.4, config.scale || 1.3, config.scale || 1.3, config.scale || 1.3],
        rotate: config.rotate || 0,
      }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 1.1, ease: [0.15, 0.0, 0.35, 1] }}
    >
      <motion.span className="inline-flex items-center justify-center drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
        <AttackSprite animKey={animKey} emoji={config.emoji} />
      </motion.span>
      {damage && (
        <motion.div
          className={`absolute -top-6 left-1/2 -translate-x-1/2 font-orbitron font-bold text-lg whitespace-nowrap ${
            isCrit ? "text-yellow-400 scale-125" : config.color
          }`}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -32, opacity: [0, 0, 0, 1, 1, 0] }}
          transition={{ duration: 1.6, ease: "easeOut", times: [0, 0.55, 0.65, 0.7, 0.85, 1] }}
        >
          {isCrit && "CRIT! "}{damage}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Impact sub-component: plays on enemy card ──
function ImpactAnim({ config, animKey, positions, seq, damage, isCrit }) {
  const { end } = positions;
  return (
    <motion.div
      key={`attack-${seq}`}
      className="absolute pointer-events-none z-30"
      style={{ left: end.x, top: end.y, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.span
        className="inline-flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        variants={config.variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AttackSprite animKey={animKey} emoji={config.emoji} />
      </motion.span>
      {damage && (
        <motion.div
          className={`absolute -top-6 left-1/2 -translate-x-1/2 font-orbitron font-bold text-lg whitespace-nowrap ${
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
  );
}

// ── Self sub-component: plays on player card ──
function SelfAnim({ config, animKey, positions, seq }) {
  const { start } = positions;
  return (
    <motion.div
      key={`attack-${seq}`}
      className="absolute pointer-events-none z-30"
      style={{ left: start.x, top: start.y, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.span
        className="inline-flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        variants={config.variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AttackSprite animKey={animKey} emoji={config.emoji} />
      </motion.span>
    </motion.div>
  );
}

export default function AttackVisual({
  characterClass, isSkill, skillId, show, seq = 0, damage, isCrit,
  arenaRef, playerRef, enemyRef,
}) {
  const animKey = skillId && SKILL_ANIMATIONS[skillId]
    ? SKILL_ANIMATIONS[skillId]
    : (isSkill ? "nova" : (CLASS_BASIC[characterClass] || "slash"));

  const config = ANIM_CONFIG[animKey] || ANIM_CONFIG.slash;
  const category = config.category || "impact";

  // Compute positions on each new attack
  const positions = useMemo(() => {
    if (!show) return null;
    const start = getRelativeCenter(playerRef, arenaRef);
    const end = getRelativeCenter(enemyRef, arenaRef);
    if (!start || !end) return null;
    return { start, end, dx: end.x - start.x, dy: end.y - start.y };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq, show]);

  // Fallback: render in-place on enemy if refs unavailable
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
              animate={{ scale: 1.3, opacity: 1 }}
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

  return (
    <AnimatePresence mode="wait">
      {show && (
        category === "projectile" ? (
          <ProjectileAnim config={config} animKey={animKey} positions={positions} seq={seq} damage={damage} isCrit={isCrit} />
        ) : category === "self" ? (
          <SelfAnim config={config} animKey={animKey} positions={positions} seq={seq} />
        ) : (
          <ImpactAnim config={config} animKey={animKey} positions={positions} seq={seq} damage={damage} isCrit={isCrit} />
        )
      )}
    </AnimatePresence>
  );
}
