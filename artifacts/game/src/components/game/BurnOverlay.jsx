import React from "react";

/**
 * Animated burning frame overlay for the enemy card.
 * Uses separate corner + edge sprite sheets so corners stay at
 * fixed size (no distortion) and edges stretch naturally.
 * Dual layers (glow + core) with mix-blend-mode: screen.
 */

const FRAMES = 9;
const CORNER_SIZE = 36;
const EDGE_THICKNESS = 24;
const INSET = -12;
const ANIM = `fire-frame-anim 0.8s steps(${FRAMES}) infinite`;

const SPRITES = {
  cornerTL: "/sprites/effects/fire-corner-tl.png",
  cornerTR: "/sprites/effects/fire-corner-tr.png",
  cornerBL: "/sprites/effects/fire-corner-bl.png",
  cornerBR: "/sprites/effects/fire-corner-br.png",
  edgeTop: "/sprites/effects/fire-edge-top.png",
  edgeBottom: "/sprites/effects/fire-edge-bottom.png",
  edgeLeft: "/sprites/effects/fire-edge-left.png",
  edgeRight: "/sprites/effects/fire-edge-right.png",
};

function FirePieces() {
  const cornerBase = {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${FRAMES * 100}% 100%`,
    animation: ANIM,
  };

  const edgeBase = {
    position: "absolute",
    backgroundRepeat: "no-repeat",
    backgroundSize: `${FRAMES * 100}% 100%`,
    animation: ANIM,
  };

  return (
    <>
      {/* Corners — fixed size */}
      <div style={{ ...cornerBase, top: 0, left: 0, backgroundImage: `url(${SPRITES.cornerTL})` }} />
      <div style={{ ...cornerBase, top: 0, right: 0, backgroundImage: `url(${SPRITES.cornerTR})` }} />
      <div style={{ ...cornerBase, bottom: 0, left: 0, backgroundImage: `url(${SPRITES.cornerBL})` }} />
      <div style={{ ...cornerBase, bottom: 0, right: 0, backgroundImage: `url(${SPRITES.cornerBR})` }} />

      {/* Horizontal edges — stretch width, fixed height */}
      <div style={{ ...edgeBase, top: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_THICKNESS, backgroundImage: `url(${SPRITES.edgeTop})` }} />
      <div style={{ ...edgeBase, bottom: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_THICKNESS, backgroundImage: `url(${SPRITES.edgeBottom})` }} />

      {/* Vertical edges — stretch height, fixed width */}
      <div style={{ ...edgeBase, top: CORNER_SIZE, bottom: CORNER_SIZE, left: 0, width: EDGE_THICKNESS, backgroundImage: `url(${SPRITES.edgeLeft})` }} />
      <div style={{ ...edgeBase, top: CORNER_SIZE, bottom: CORNER_SIZE, right: 0, width: EDGE_THICKNESS, backgroundImage: `url(${SPRITES.edgeRight})` }} />
    </>
  );
}

export default function BurnOverlay({ active }) {
  if (!active) return null;

  const wrapperBase = {
    position: "absolute",
    inset: INSET,
    pointerEvents: "none",
    mixBlendMode: "screen",
  };

  return (
    <>
      {/* Glow layer — blurred for soft ambient light */}
      <div style={{ ...wrapperBase, zIndex: 9, filter: "blur(8px)", opacity: 0.6 }}>
        <FirePieces />
      </div>
      {/* Core layer — sharp fire */}
      <div style={{ ...wrapperBase, zIndex: 10, opacity: 0.9 }}>
        <FirePieces />
      </div>
    </>
  );
}
