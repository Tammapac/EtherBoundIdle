import React from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Pure CSS sprite animation with dual layers (glow + core)
 * and mix-blend-mode: screen for AAA fire look.
 * 9 frames in horizontal strip, CSS steps() handles cycling.
 */

const FRAMES = 9;

const baseStyle = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  pointerEvents: "none",
  backgroundImage: "url(/sprites/effects/burn_frame.png)",
  backgroundRepeat: "no-repeat",
  backgroundSize: `${FRAMES * 100}% 100%`,
  animation: `fire-frame-anim 0.8s steps(${FRAMES}) infinite`,
  mixBlendMode: "screen",
};

export default function BurnOverlay({ active }) {
  if (!active) return null;

  return (
    <>
      {/* Glow layer — blurred, lower opacity for soft ambient light */}
      <div
        style={{
          ...baseStyle,
          filter: "blur(8px)",
          opacity: 0.6,
        }}
      />
      {/* Core layer — sharp fire sprites */}
      <div
        style={{
          ...baseStyle,
          opacity: 0.9,
        }}
      />
    </>
  );
}
