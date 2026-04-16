import React, { useState } from "react";

/**
 * Lightweight, looping sprite overlay for battle status effects (buffs,
 * debuffs, shields). Drops a pixel-art PNG into position with a gentle CSS
 * breathing animation — no per-frame sheets needed.
 *
 * If the sprite file is missing the component renders nothing (never shows a
 * broken image and never blocks the card layout).
 *
 * Expected sprite paths (drop PNGs here):
 *   /public/sprites/effects/buffs/{key}.png     ← type="buff"    (e.g. attack.png, defense.png, fire_dmg.png)
 *   /public/sprites/effects/debuffs/{key}.png   ← type="debuff"  (e.g. poison.png, bleed.png, fire.png)
 *   /public/sprites/effects/shield.png          ← type="shield"
 *
 * Recommended sprite size: 48-96px square, transparent background.
 */

const ANIM_CLASS = {
  // Gentle pulse — good for passive auras (buffs, shields)
  pulse: "eb-aura-pulse",
  // Shaky/jitter — good for debuffs (poison, bleed)
  jitter: "eb-aura-jitter",
  // Slow spin — good for magical shields
  spin: "eb-aura-spin",
};

function spritePath(type, key) {
  if (type === "shield") return "/sprites/effects/shield.png";
  if (type === "buff") return `/sprites/effects/buffs/${key}.png`;
  if (type === "debuff") return `/sprites/effects/debuffs/${key}.png`;
  return null;
}

export default function EffectAura({ type, effectKey, size = 48, anim = "pulse", position = "center", opacity = 0.85 }) {
  const [errored, setErrored] = useState(false);
  const src = spritePath(type, effectKey);
  if (errored || !src) return null;

  // Anchor the aura inside its parent (parent must be position: relative)
  const posStyle = (() => {
    switch (position) {
      case "top-right":  return { position: "absolute", top: 4, right: 4 };
      case "top-left":   return { position: "absolute", top: 4, left: 4 };
      case "bottom":     return { position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)" };
      case "full":       return { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" };
      case "center":
      default:           return { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
  })();

  return (
    <div style={{ ...posStyle, pointerEvents: "none", zIndex: 5 }}>
      <img
        src={src}
        alt=""
        draggable={false}
        onError={() => setErrored(true)}
        className={ANIM_CLASS[anim] || ANIM_CLASS.pulse}
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
          objectFit: "contain",
          opacity,
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.15))",
        }}
      />
    </div>
  );
}
