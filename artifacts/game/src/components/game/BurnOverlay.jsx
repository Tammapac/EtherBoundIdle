import React, { useState, useEffect, useRef } from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Uses a 9-frame horizontal sprite strip of fire wrapping around a card border.
 * Canvas renders each frame stretched to cover the card with slight overhang.
 * Parent must have position: relative.
 */

const BURN_SPRITE = {
  src: "/sprites/effects/burn_frame.png",
  frames: 9,
  frameW: 200,
  frameH: 78,
  frameDuration: 110,
};

// Padding around the card — how far the fire extends beyond the card border
const PAD = 14;

export default function BurnOverlay({ active }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef(0);
  const intervalRef = useRef(null);
  const parentSizeRef = useRef({ w: 0, h: 0 });

  // Load sprite sheet once
  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; setLoaded(true); };
    img.onerror = () => setLoaded(false);
    img.src = BURN_SPRITE.src;
  }, []);

  // Resize canvas to match parent card
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const card = canvas.closest("[class*='rpg-frame']") || canvas.parentElement?.parentElement;
    if (!card) return;

    const resize = () => {
      const rect = card.getBoundingClientRect();
      const w = Math.round(rect.width + PAD * 2);
      const h = Math.round(rect.height + PAD * 2);
      if (w !== parentSizeRef.current.w || h !== parentSizeRef.current.h) {
        canvas.width = w;
        canvas.height = h;
        parentSizeRef.current = { w, h };
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(card);
    return () => observer.disconnect();
  }, [active]);

  // Animate frames
  useEffect(() => {
    if (!active || !loaded || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    frameRef.current = 0;

    const draw = () => {
      const f = frameRef.current;
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = 0.75;
      ctx.drawImage(
        img,
        f * BURN_SPRITE.frameW, 0, BURN_SPRITE.frameW, BURN_SPRITE.frameH,
        0, 0, cw, ch
      );
      ctx.globalAlpha = 1.0;
    };

    draw();
    intervalRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % BURN_SPRITE.frames;
      draw();
    }, BURN_SPRITE.frameDuration);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, loaded]);

  if (!active) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: -PAD,
        left: -PAD,
        right: -PAD,
        bottom: -PAD,
        zIndex: 10,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}
