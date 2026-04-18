import React, { useEffect, useRef, useState } from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Renders 4 edge strips (top, bottom, left, right) from the sprite
 * on a canvas. Each strip only stretches in one direction, avoiding
 * the corner distortion of uniform stretching or 9-slice artefacts.
 * Strips overlap in corners for a natural fire look.
 */

const BURN_SPRITE = {
  src: "/sprites/effects/burn_frame.png",
  frames: 9,
  frameW: 200,
  frameH: 78,
  frameDuration: 110,
};

// How many source pixels to take from each edge for the strips.
const SRC_EDGE_H = 24;  // top / bottom strip height in source
const SRC_EDGE_W = 30;  // left / right strip width in source

// Rendered strip thickness and padding around the card.
const STRIP = 38;
const PAD = 12;

export default function BurnOverlay({ active }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Load sprite sheet once
  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; setLoaded(true); };
    img.src = BURN_SPRITE.src;
  }, []);

  // Size canvas to parent card (once + on resize)
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const card = canvas.closest(".rpg-frame") || canvas.parentElement;
    if (!card) return;

    const sync = () => {
      const { width, height } = card.getBoundingClientRect();
      const w = Math.round(width) + PAD * 2;
      const h = Math.round(height) + PAD * 2;
      if (w !== sizeRef.current.w || h !== sizeRef.current.h) {
        canvas.width = w;
        canvas.height = h;
        sizeRef.current = { w, h };
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(card);
    return () => ro.disconnect();
  }, [active]);

  // Animate
  useEffect(() => {
    if (!active || !loaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    const { frameW: fw, frameH: fh, frames, frameDuration } = BURN_SPRITE;
    frameRef.current = 0;

    const draw = () => {
      const f = frameRef.current;
      const fx = f * fw;
      const cw = canvas.width;
      const ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = 0.8;

      // Top strip — source top SRC_EDGE_H px, stretched to full width
      ctx.drawImage(img, fx, 0, fw, SRC_EDGE_H, 0, 0, cw, STRIP);
      // Bottom strip — source bottom SRC_EDGE_H px
      ctx.drawImage(img, fx, fh - SRC_EDGE_H, fw, SRC_EDGE_H, 0, ch - STRIP, cw, STRIP);
      // Left strip — source left SRC_EDGE_W px, stretched to full height
      ctx.drawImage(img, fx, 0, SRC_EDGE_W, fh, 0, 0, STRIP, ch);
      // Right strip — source right SRC_EDGE_W px
      ctx.drawImage(img, fx + fw - SRC_EDGE_W, 0, SRC_EDGE_W, fh, cw - STRIP, 0, STRIP, ch);

      ctx.globalAlpha = 1;
    };

    draw();
    const id = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames;
      draw();
    }, frameDuration);
    return () => clearInterval(id);
  }, [active, loaded]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none"
      style={{
        top: -PAD,
        left: -PAD,
        right: -PAD,
        bottom: -PAD,
        zIndex: 10,
        width: `calc(100% + ${PAD * 2}px)`,
        height: `calc(100% + ${PAD * 2}px)`,
        imageRendering: "auto",
      }}
    />
  );
}
