import React from "react";

/**
 * PixelButton — uses pixel art button sprites for OK/Cancel actions.
 * variant: "ok" | "cancel"
 */
export default function PixelButton({ variant = "ok", onClick, disabled, children, className = "" }) {
  const src = variant === "cancel"
    ? "/sprites/ui/buttons/btn_cancel.png"
    : "/sprites/ui/buttons/btn_ok.png";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center hover:scale-105 hover:brightness-125 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ${className}`}
      style={{ background: "none", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <img
        src={src}
        alt={variant === "cancel" ? "Cancel" : "OK"}
        style={{
          height: 34,
          imageRendering: "pixelated",
          userSelect: "none",
          pointerEvents: "none",
        }}
        draggable={false}
      />
      {children && (
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-wide"
          style={{
            color: variant === "cancel" ? "#1a1a3a" : "#1a1a3a",
            textShadow: "none",
            pointerEvents: "none",
          }}
        >
          {children}
        </span>
      )}
    </button>
  );
}
