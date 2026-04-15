import React from "react";

const BAR_FILLS = {
  hp: "/sprites/ui/bars/bar_hp.png",
  mp: "/sprites/ui/bars/bar_mp.png",
  exp: "/sprites/ui/bars/bar_exp.png",
};

/**
 * PixelBar — pixel-art styled HP/MP/EXP bar using sprite assets.
 * type: "hp" | "mp" | "exp"
 */
export default function PixelBar({ current, max, type = "hp", label, showText = true }) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const pct = Math.max(0, Math.min(100, (safeCurrent / safeMax) * 100));

  const fillSrc = BAR_FILLS[type] || BAR_FILLS.hp;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-muted-foreground font-bold text-[10px]">{label}</span>
          {showText && (
            <span className="text-foreground font-medium text-[10px]">
              {Math.round(safeCurrent)}/{safeMax}
            </span>
          )}
        </div>
      )}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 14,
          borderImage: "url('/sprites/ui/bars/bar_frame.png') 3 / 3px",
          borderStyle: "solid",
          imageRendering: "pixelated",
          background: "#080b18",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            backgroundImage: `url('${fillSrc}')`,
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
