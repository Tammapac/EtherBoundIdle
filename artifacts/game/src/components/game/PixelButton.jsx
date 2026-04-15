import React, { useState } from "react";

const FILLS = {
  ok: "/sprites/ui/buttons/btn_gold.png",
  cancel: "/sprites/ui/buttons/btn_blue.png",
  danger: "/sprites/ui/buttons/btn_red.png",
};

const DEFAULT_LABELS = {
  ok: "OKAY",
  cancel: "CANCEL",
  danger: "DELETE",
};

/**
 * PixelButton — pixel art button with frame sprite + colored fill + pixel font text.
 * variant: "ok" (gold) | "cancel" (blue) | "danger" (red)
 * label: custom text, defaults to variant name
 */
export default function PixelButton({ variant = "ok", label, onClick, disabled, className = "" }) {
  const [hovered, setHovered] = useState(false);
  const fillSrc = FILLS[variant] || FILLS.ok;
  const text = label || DEFAULT_LABELS[variant] || "OK";

  // Frame is 73x14 native, scaled ~2.5x → 180x34
  const btnWidth = 130;
  const btnHeight = 34;
  const insetX = 10;
  const insetY = 10;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        width: btnWidth,
        height: btnHeight,
        transform: hovered && !disabled ? "scale(1.05)" : "scale(1)",
        filter: hovered && !disabled ? "brightness(1.25)" : "none",
        transition: "transform 150ms ease, filter 150ms ease",
      }}
    >
      {/* Dark background behind fill */}
      <div
        style={{
          position: "absolute",
          left: insetX,
          right: insetX,
          top: insetY,
          bottom: insetY,
          background: "#080b18",
        }}
      />
      {/* Colored fill — full width */}
      <div
        style={{
          position: "absolute",
          left: insetX,
          right: insetX,
          top: insetY,
          bottom: insetY,
          backgroundImage: `url('${fillSrc}')`,
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      />
      {/* Frame overlay */}
      <img
        src="/sprites/ui/buttons/btn_frame.png"
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
      {/* Pixel font text */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          letterSpacing: "0.5px",
          color: "#1a1a2e",
          textShadow: "0 1px 0 rgba(255,255,255,0.2)",
          pointerEvents: "none",
          userSelect: "none",
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
    </button>
  );
}
