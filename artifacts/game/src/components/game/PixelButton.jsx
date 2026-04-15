import React, { useState } from "react";

/**
 * PixelButton — pixel art button using 9-slice border-image frames.
 * variant: "ok" (gold frame, navy text) | "cancel" (dark frame, golden text)
 * Scales to fit any text length via border-image stretching.
 */
export default function PixelButton({ variant = "ok", label, onClick, disabled, className = "", style: extraStyle }) {
  const [hovered, setHovered] = useState(false);

  const isGold = variant === "ok";
  const frameSrc = isGold
    ? "/sprites/ui/buttons/btn_gold.png"
    : "/sprites/ui/buttons/btn_dark.png";
  const textColor = isGold ? "#1a1a3a" : "#f0c850";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        borderImage: `url('${frameSrc}') 3 / 6px`,
        borderStyle: "solid",
        imageRendering: "pixelated",
        background: "transparent",
        padding: "4px 14px",
        minHeight: 34,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: hovered && !disabled ? "scale(1.05)" : "scale(1)",
        filter: hovered && !disabled ? "brightness(1.2)" : "none",
        transition: "transform 150ms ease, filter 150ms ease",
        ...extraStyle,
      }}
    >
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          lineHeight: 1,
          color: textColor,
          pointerEvents: "none",
          userSelect: "none",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label || (isGold ? "OKAY" : "CANCEL")}
      </span>
    </button>
  );
}
