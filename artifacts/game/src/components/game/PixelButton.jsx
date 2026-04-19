import React, { useState } from "react";

/**
 * PixelButton — pixel art styled button with rounded corners.
 * variant: "ok" (gold frame, navy text) | "cancel" (dark frame, golden text)
 * Scales to fit any text length. Uses CSS borders for proper border-radius.
 * size: "sm" (default) | "lg" (bigger for prominent actions)
 */
export default function PixelButton({ variant = "ok", label, onClick, disabled, className = "", size = "sm", style: extraStyle, fontSize: fontSizeOverride }) {
  const [hovered, setHovered] = useState(false);

  const isGold = variant === "ok";
  const textColor = isGold ? "#1a1a3a" : "#f0c850";
  const bgColor = isGold ? "#f0c850" : "#1e1d3a";
  const borderColor = isGold ? "#b8872a" : "#c8973a";
  const shadowColor = isGold ? "rgba(255,224,144,0.4)" : "rgba(200,151,58,0.3)";

  const isLg = size === "lg";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        background: bgColor,
        boxShadow: `inset 0 1px 0 ${shadowColor}, 0 1px 3px rgba(0,0,0,0.3)`,
        padding: isLg ? "6px 20px" : "3px 10px",
        minHeight: isLg ? 32 : 24,
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
          fontSize: fontSizeOverride || (isLg ? 11 : 9),
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
