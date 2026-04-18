import React, { useEffect, useRef, useState } from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Uses a wrapper div positioned beyond the card edges, with a canvas
 * inside that renders 4 edge strips from the sprite sheet.
 * Each strip stretches in only one direction for natural fire flow.
 */

const BURN_SPRITE = {
  src: "/sprites/effects/burn_frame.png",
  frames: 9,
  frameW: 200,
  frameH: 78,
  frameDuration: 110,
};

// Source crop sizes (pixels in the sprite frame)
const SRC_EDGE_H = 24;  // top/bottom strip height
const SRC_EDGE_W = 30;  // left/right strip width

// Rendered strip thickness on screen
const STRIP = 38;

// How far fire extends beyond the card border
const PAD = 14;

export default function BurnOverlay({ active }) {
  const wrapperRef = useRef(null);
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

  // Size canvas pixel buffer to match wrapper's actual rendered size
  useEffect(() => {
    if (!active || !wrapperRef.current || !canvasRef.current) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    const sync = () => {
      const rect = wrapper.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w !== sizeRef.current.w || h !== sizeRef.current.h) {
        canvas.width = w;
        canvas.height = h;
        sizeRef.current = { w, h };
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [active]);

  // Animate frames
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
      if (cw === 0 || ch === 0) return;

      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = 0.8;

      // Top strip — source top edge, stretched to full canvas width
      ctx.drawImage(img, fx, 0, fw, SRC_EDGE_H, 0, 0, cw, STRIP);
      // Bottom strip — source bottom edge
      ctx.drawImage(img, fx, fh - SRC_EDGE_H, fw, SRC_EDGE_H, 0, ch - STRIP, cw, STRIP);
      // Left strip — source left edge, stretched to full canvas height
      ctx.drawImage(img, fx, 0, SRC_EDGE_W, fh, 0, 0, STRIP, ch);
      // Right strip — source right edge
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
    <div
      ref={wrapperRef}
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
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
