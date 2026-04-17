import React, { useState, useEffect } from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Uses a sprite sheet of 9 frames showing fire around a card border.
 * The sprite stretches to cover the full card size.
 * Parent must have position: relative and overflow: visible.
 */

const BURN_SPRITE = {
  src: "/sprites/effects/burn_frame.png",
  frames: 9,
  frameW: 200,   // source frame width
  frameH: 78,    // source frame height
  frameDuration: 100, // ms per frame
};

export default function BurnOverlay({ active }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Cycle through frames
  useEffect(() => {
    if (!active || !loaded) return;
    setFrame(0);
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % BURN_SPRITE.frames);
    }, BURN_SPRITE.frameDuration);
    return () => clearInterval(interval);
  }, [active, loaded]);

  if (!active || errored) return null;

  return (
    <>
      {/* Hidden image to trigger load */}
      <img
        src={BURN_SPRITE.src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ display: "none" }}
      />
      {loaded && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -8,
            zIndex: 10,
            overflow: "visible",
            backgroundImage: `url('${BURN_SPRITE.src}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${BURN_SPRITE.frames * 100}% 100%`,
            backgroundPositionX: `${(-frame / (BURN_SPRITE.frames - 1)) * 100}%`,
            imageRendering: "auto",
            filter: "drop-shadow(0 0 6px rgba(255, 100, 0, 0.5))",
          }}
        />
      )}
    </>
  );
}
