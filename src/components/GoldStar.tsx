import { useId } from "react";

export function GoldStar({ size = "hero" }: { size?: "hero" | "tiny" }) {
  const uid = useId().replace(/:/g, "");
  const face = `gold-face-${uid}`;
  const glow = `gold-glow-${uid}`;
  return (
    <svg
      className={`gold-star-svg gold-star-${size}`}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={face} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6b0" />
          <stop offset="45%" stopColor="#ffd93d" />
          <stop offset="100%" stopColor="#f5b400" />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#e0a000" floodOpacity="0.55" />
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ffd93d" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        filter={`url(#${glow})`}
        fill={`url(#${face})`}
        stroke="#e29b00"
        strokeWidth="3"
        strokeLinejoin="round"
        d="M60 8 L73 42 H108 L80 64 L91 100 L60 78 L29 100 L40 64 L12 42 H47 Z"
      />
      <ellipse cx="48" cy="36" rx="10" ry="5" fill="#fff" opacity="0.45" />
    </svg>
  );
}
