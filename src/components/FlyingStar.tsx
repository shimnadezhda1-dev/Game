import type { CSSProperties } from "react";

interface FlyingStarProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export function FlyingStar({ fromX, fromY, toX, toY }: FlyingStarProps) {
  return (
    <div
      className="flying-star"
      style={
        {
          left: fromX,
          top: fromY,
          "--dx": `${toX - fromX}px`,
          "--dy": `${toY - fromY}px`
        } as CSSProperties
      }
      aria-hidden
    >
      ★
    </div>
  );
}
