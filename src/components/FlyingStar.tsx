import { useEffect, useState, type CSSProperties } from "react";
import { getStarFlightTarget } from "../utils/starFlight";

interface FlyingStarProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export function FlyingStar({ fromX, fromY, toX, toY }: FlyingStarProps) {
  const [target, setTarget] = useState({ x: toX, y: toY });

  useEffect(() => {
    const refresh = () => {
      const next = getStarFlightTarget();
      if (next) {
        setTarget(next);
      }
    };
    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);
    window.visualViewport?.addEventListener("resize", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      window.visualViewport?.removeEventListener("resize", refresh);
    };
  }, [toX, toY]);

  return (
    <div
      className="flying-star"
      style={
        {
          left: fromX,
          top: fromY,
          "--dx": `${target.x - fromX}px`,
          "--dy": `${target.y - fromY}px`
        } as CSSProperties
      }
      aria-hidden
    >
      ★
    </div>
  );
}
