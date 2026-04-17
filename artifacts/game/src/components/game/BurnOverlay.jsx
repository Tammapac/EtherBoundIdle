import React from "react";
import { motion } from "framer-motion";

/**
 * Animated burning effect overlay for the enemy card.
 * Renders flickering flame sprites along the edges of the card.
 * Parent must have position: relative and overflow: visible.
 */

// Individual flame element with randomized animation
function Flame({ style, delay, size, flip }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        ...style,
        width: size,
        height: size * 1.4,
        transformOrigin: "bottom center",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
      initial={{ opacity: 0, scaleY: 0.3, y: 5 }}
      animate={{
        opacity: [0.4, 0.9, 0.6, 0.95, 0.5],
        scaleY: [0.6, 1.1, 0.8, 1.2, 0.7],
        scaleX: [0.8, 1.1, 0.9, 1.05, 0.85],
        y: [2, -3, 1, -4, 0],
      }}
      transition={{
        duration: 0.6 + Math.random() * 0.4,
        repeat: Infinity,
        repeatType: "mirror",
        delay,
        ease: "easeInOut",
      }}
    >
      {/* Flame body — CSS gradient, no sprite needed */}
      <div
        className="w-full h-full rounded-[40%_40%_50%_50%/60%_60%_40%_40%]"
        style={{
          background: "linear-gradient(to top, #ff4500 0%, #ff6a00 30%, #ffa500 55%, #ffcc00 75%, #ffee88 90%, transparent 100%)",
          filter: "blur(0.5px)",
          boxShadow: "0 0 6px 2px rgba(255, 100, 0, 0.4)",
        }}
      />
    </motion.div>
  );
}

export default function BurnOverlay({ active }) {
  if (!active) return null;

  // Place flames along bottom edge + sides
  const flames = [];

  // Bottom edge — main fire line
  const bottomCount = 8;
  for (let i = 0; i < bottomCount; i++) {
    const xPercent = (i / (bottomCount - 1)) * 100;
    const size = 10 + Math.random() * 8;
    flames.push(
      <Flame
        key={`b-${i}`}
        style={{ bottom: -4, left: `${xPercent}%`, marginLeft: -size / 2 }}
        delay={i * 0.08}
        size={size}
        flip={Math.random() > 0.5}
      />
    );
  }

  // Left edge — smaller flames climbing up
  for (let i = 0; i < 4; i++) {
    const yPercent = 60 + i * 10;
    const size = 7 + Math.random() * 5;
    flames.push(
      <Flame
        key={`l-${i}`}
        style={{ bottom: `${100 - yPercent}%`, left: -3, transform: "rotate(90deg)" }}
        delay={0.1 + i * 0.12}
        size={size}
        flip={false}
      />
    );
  }

  // Right edge — smaller flames climbing up
  for (let i = 0; i < 4; i++) {
    const yPercent = 60 + i * 10;
    const size = 7 + Math.random() * 5;
    flames.push(
      <Flame
        key={`r-${i}`}
        style={{ bottom: `${100 - yPercent}%`, right: -3, transform: "rotate(-90deg)" }}
        delay={0.15 + i * 0.12}
        size={size}
        flip={false}
      />
    );
  }

  return (
    <>
      {/* Ambient glow behind the card */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: "0 0 20px 4px rgba(255, 100, 0, 0.3), inset 0 0 15px 2px rgba(255, 80, 0, 0.08)",
          zIndex: 0,
        }}
        animate={{
          boxShadow: [
            "0 0 20px 4px rgba(255, 100, 0, 0.3), inset 0 0 15px 2px rgba(255, 80, 0, 0.08)",
            "0 0 30px 8px rgba(255, 100, 0, 0.45), inset 0 0 20px 4px rgba(255, 80, 0, 0.12)",
            "0 0 20px 4px rgba(255, 100, 0, 0.3), inset 0 0 15px 2px rgba(255, 80, 0, 0.08)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Orange tint on border */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: "1px solid rgba(255, 120, 0, 0.5)",
          zIndex: 1,
        }}
      />
      {/* Flames */}
      {flames}
    </>
  );
}
