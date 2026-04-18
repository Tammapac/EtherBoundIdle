import React from "react";

/**
 * Animated fire border overlay for the enemy card.
 * Pure CSS — no sprites. Uses layered box-shadows and animated
 * gradients that perfectly hug the card border at any size.
 */

export default function BurnOverlay({ active }) {
  if (!active) return null;

  return (
    <>
      {/* Outer glow — soft ambient fire light */}
      <div
        className="burn-glow"
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 9,
        }}
      />
      {/* Inner fire border — bright flickering edge */}
      <div
        className="burn-core"
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      {/* Animated flame tips along edges */}
      <div
        className="burn-flames"
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 8,
          overflow: "visible",
        }}
      />
    </>
  );
}
