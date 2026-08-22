import { useId } from "react";

const PALETTES: Record<string, { light: string; mid: string; dark: string; shade: string }> = {
  A: { light: "#ffb3c2", mid: "#ff5d7a", dark: "#e0244e", shade: "#9a1233" },
  B: { light: "#ffd18a", mid: "#ff9f1c", dark: "#e07a00", shade: "#a35400" },
  V: { light: "#9af0e4", mid: "#2ec4b6", dark: "#1a9e92", shade: "#0e6e66" },
  G: { light: "#b6ecff", mid: "#4fc3ff", dark: "#1d9ee0", shade: "#0d6fa6" },
  D: { light: "#d2c4ff", mid: "#7c4dff", dark: "#5a2fd6", shade: "#3b1a96" }
};

const PATHS: Record<string, string> = {
  A: "M100 18 L178 188 Q182 198 170 198 L138 198 L126 166 H74 L62 198 H30 Q18 198 22 188 Z M86 132 H114 L100 92 Z",
  B: "M48 20 H118 Q168 20 168 70 Q168 96 142 108 Q176 118 176 158 Q176 198 118 198 H48 Z M86 52 V86 H112 Q128 86 128 68 Q128 52 112 52 Z M86 128 V166 H116 Q138 166 138 148 Q138 128 116 128 Z",
  V: "M48 20 H120 Q172 20 172 78 Q172 112 140 124 Q176 136 176 176 Q176 198 118 198 H48 Z M86 50 V98 H114 Q132 98 132 74 Q132 50 114 50 Z M86 132 V168 H116 Q140 168 140 150 Q140 132 116 132 Z",
  G: "M168 36 H70 Q36 36 36 78 V178 Q36 198 62 198 H92 V154 H70 V78 H168 Z",
  D: "M36 198 L64 28 H136 L164 198 H132 L124 156 H76 L68 198 Z M86 118 H114 L100 52 Z"
};

interface ToyLetterProps {
  letterId: string;
  glyph: string;
  size?: "hero" | "tile" | "hint";
}

export function ToyLetter({ letterId, glyph, size = "hero" }: ToyLetterProps) {
  const uid = useId().replace(/:/g, "");
  const palette = PALETTES[letterId] ?? PALETTES.A;
  const path = PATHS[letterId] ?? PATHS.A;
  const fillRule = letterId === "A" || letterId === "D" ? "evenodd" : "nonzero";
  const faceId = `toy-face-${uid}`;
  const softId = `toy-soft-${uid}`;

  return (
    <svg
      className={`toy-letter toy-letter-${size}`}
      viewBox="0 0 200 220"
      aria-hidden="true"
    >
      <title>{glyph}</title>
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="55%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.dark} />
        </linearGradient>
        <filter id={softId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${softId})`}>
        <path d={path} fill={palette.shade} transform="translate(8 12)" fillRule={fillRule} />
        <path d={path} fill={`url(#${faceId})`} fillRule={fillRule} />
        <path
          d={path}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.38"
          strokeWidth="7"
          strokeLinejoin="round"
          fillRule={fillRule}
        />
        <ellipse cx="78" cy="48" rx="22" ry="10" fill="#fff" opacity="0.35" />
      </g>
    </svg>
  );
}
