import { useId } from "react";
import { getToyLetterTheme } from "../data/letterRegistry";

interface ToyLetterProps {
  letterId: string;
  glyph: string;
  size?: "hero" | "tile" | "hint";
}

export function ToyLetter({ letterId, glyph, size = "hero" }: ToyLetterProps) {
  const uid = useId().replace(/:/g, "");
  const { palette, path, fillRule = "nonzero" } = getToyLetterTheme(letterId);
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
        {path ? (
          <>
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
          </>
        ) : (
          <>
            <text
              x="108"
              y="158"
              textAnchor="middle"
              fontSize="132"
              fontWeight="900"
              fill={palette.shade}
            >
              {glyph}
            </text>
            <text
              x="100"
              y="148"
              textAnchor="middle"
              fontSize="132"
              fontWeight="900"
              fill={`url(#${faceId})`}
              stroke="#fff"
              strokeOpacity="0.38"
              strokeWidth="6"
            >
              {glyph}
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
