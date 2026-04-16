import React from "react";

const BAR_FILLS = {
  hp: "/sprites/ui/bars/bar_hp.png",
  mp: "/sprites/ui/bars/bar_mp.png",
  exp: "/sprites/ui/bars/bar_exp.png",
};

/**
 * PixelBar — pixel-art styled HP/MP/EXP bar using sprite assets.
 * Frame: 73×14 sprite with ~3px decorative border.
 * Fill: 56×7 sprites positioned inside with 1px padding to the frame.
 */
export default function PixelBar({ current, max, type = "hp", label, showText = true, width, height }) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const pct = Math.max(0, Math.min(100, (safeCurrent / safeMax) * 100));

  const fillSrc = BAR_FILLS[type] || BAR_FILLS.hp;

  // Frame aspect ratio: 73:14 ≈ 5.21:1
  // At width 180, height ≈ 35 (scaled 2.5x from native 73×14)
  const barWidth = Number.isFinite(width) ? width : 180;
  const barHeight = Number.isFinite(height) ? height : 34;

  // Border is ~3px at native scale → ~7px at 2.5x
  // Plus 1px padding → 8px inset from each edge (top/bottom: ~7px border + 1px ≈ 10px at 2.5x, but fill is 7/14 = 50% height)
  // Fill area inset: left/right ~8px from edges, top/bottom ~10px from edges
  const insetX = 10;
  const insetY = 10;

  return (
    <div style={{ width: barWidth, maxWidth: "100%" }}>
      {label && (
        <div className="flex justify-between text-xs mb-0.5" style={{ width: "100%" }}>
          <span className="text-muted-foreground font-bold text-[10px]">{label}</span>
          {showText && (
            <span className="text-foreground font-medium text-[10px]">
              {Math.round(safeCurrent)}/{safeMax}
            </span>
          )}
        </div>
      )}
      <div
        className="relative"
        style={{
          width: "100%",
          height: barHeight,
        }}
      >
        {/* Dark background behind fill area */}
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
        {/* Colored fill — percentage-based so it scales with container width */}
        <div
          style={{
            position: "absolute",
            left: insetX,
            top: insetY,
            bottom: insetY,
            width: `calc((100% - ${insetX * 2}px) * ${pct / 100})`,
            backgroundImage: `url('${fillSrc}')`,
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
            transition: "width 0.4s ease",
          }}
        />
        {/* Frame overlay (on top of fill) */}
        <img
          src="/sprites/ui/bars/bar_frame.png"
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
      </div>
    </div>
  );
}
