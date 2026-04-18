import React, { useState, useEffect, useRef } from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Uses the full burn_frame.png sprite stretched to fill the card.
 * JS-driven frame cycling with computed background-position values
 * ensures each frame snaps to exact pixel boundaries (no sliding).
 * Dual layers (glow + core) with mix-blend-mode: screen.
 */

const FRAMES = 9;
const INSET = -8;

export default function BurnOverlay({ active }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    setFrame(0);
    const id = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES);
    }, 88);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  // For background-size: 900% 100%, frame i is at exactly i * 12.5%
  // This formula is derived from the CSS bg-position percentage spec:
  //   offset = (X/100) * (containerW - imageW)
  //   imageW = 9 * containerW  →  offset = -8 * X * containerW / 100
  //   frame i at offset -i * containerW  →  X = i * 12.5
  const bgX = frame * 12.5;

  const layerBase = {
    position: "absolute",
    inset: INSET,
    pointerEvents: "none",
    backgroundImage: "url(/sprites/effects/burn_frame.png)",
    backgroundRepeat: "no-repeat",
    backgroundSize: `${FRAMES * 100}% 100%`,
    backgroundPosition: `${bgX}% 0`,
    mixBlendMode: "screen",
  };

  return (
    <>
      {/* Glow layer */}
      <div style={{ ...layerBase, zIndex: 9, filter: "blur(8px)", opacity: 0.6 }} />
      {/* Core layer */}
      <div style={{ ...layerBase, zIndex: 10, opacity: 0.9 }} />
    </>
  );
}
