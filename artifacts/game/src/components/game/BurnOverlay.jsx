import React, { useState, useEffect, useRef } from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Uses CSS border-image with 9-slice rendering so corners stay
 * at their natural proportions and only edges stretch.
 * Pre-renders each sprite frame as a data-URL on load, then
 * cycles through them via setInterval.
 */

const BURN_SPRITE = {
  src: "/sprites/effects/burn_frame.png",
  frames: 9,
  frameW: 200,
  frameH: 78,
  frameDuration: 110,
};

// border-image-slice: how many pixels from each edge of the source
// frame constitute the "border" (corners + edges).
const SLICE = 26;

// Rendered border thickness around the card (px).
const BORDER_W = 40;

// How far the border extends outside the card (outset).
const OUTSET = 14;

export default function BurnOverlay({ active }) {
  const [frameURLs, setFrameURLs] = useState([]);
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);

  /* Load sprite sheet & pre-render every frame as a data-URL */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const urls = [];
      for (let i = 0; i < BURN_SPRITE.frames; i++) {
        const c = document.createElement("canvas");
        c.width = BURN_SPRITE.frameW;
        c.height = BURN_SPRITE.frameH;
        const ctx = c.getContext("2d");
        ctx.drawImage(
          img,
          i * BURN_SPRITE.frameW, 0,
          BURN_SPRITE.frameW, BURN_SPRITE.frameH,
          0, 0,
          BURN_SPRITE.frameW, BURN_SPRITE.frameH,
        );
        urls.push(c.toDataURL());
      }
      setFrameURLs(urls);
    };
    img.src = BURN_SPRITE.src;
  }, []);

  /* Cycle frames while active */
  useEffect(() => {
    if (!active || frameURLs.length === 0) {
      clearInterval(intervalRef.current);
      return;
    }
    setFrame(0);
    intervalRef.current = setInterval(() => {
      setFrame(f => (f + 1) % BURN_SPRITE.frames);
    }, BURN_SPRITE.frameDuration);
    return () => clearInterval(intervalRef.current);
  }, [active, frameURLs]);

  if (!active || frameURLs.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 10,
        borderStyle: "solid",
        borderWidth: `${BORDER_W}px`,
        borderImageSource: `url(${frameURLs[frame]})`,
        borderImageSlice: `${SLICE}`,
        borderImageWidth: `${BORDER_W}px`,
        borderImageOutset: `${OUTSET}px`,
        borderImageRepeat: "round",
        opacity: 0.8,
        imageRendering: "auto",
      }}
    />
  );
}
