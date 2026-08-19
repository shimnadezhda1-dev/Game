interface CharacterProps {
  mood: "happy" | "tip" | "neutral";
  message?: string;
}

export function Character({ mood, message }: CharacterProps) {
  return (
    <div className={`character character-${mood}`}>
      <div className="fox" aria-hidden>
        <svg viewBox="0 0 160 160" className="fox-svg">
          <ellipse cx="80" cy="148" rx="42" ry="8" fill="#00000022" />
          <circle cx="80" cy="92" r="46" fill="#ff8a3d" />
          <polygon points="42,62 28,18 68,54" fill="#ff8a3d" />
          <polygon points="118,62 132,18 92,54" fill="#ff8a3d" />
          <polygon points="42,62 36,28 64,54" fill="#ffe0c2" />
          <polygon points="118,62 124,28 96,54" fill="#ffe0c2" />
          <circle cx="80" cy="100" r="32" fill="#ffe8cf" />
          <circle cx="66" cy="90" r="6" fill="#2b2b2b" />
          <circle cx="94" cy="90" r="6" fill="#2b2b2b" />
          {mood === "happy" ? (
            <>
              <circle cx="68" cy="88" r="2" fill="#fff" />
              <circle cx="96" cy="88" r="2" fill="#fff" />
              <path d="M68 112c8 10 16 10 24 0" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : mood === "tip" ? (
            <>
              <path d="M62 86c4-8 8-8 12 0" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
              <path d="M86 86c4-8 8-8 12 0" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
              <circle cx="80" cy="112" r="4" fill="#2b2b2b" />
            </>
          ) : (
            <>
              <circle cx="68" cy="88" r="2" fill="#fff" />
              <circle cx="96" cy="88" r="2" fill="#fff" />
              <path d="M70 112h20" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          <ellipse cx="80" cy="102" rx="7" ry="5" fill="#ff5d73" />
        </svg>
      </div>
      {message ? <div className="character-bubble">{message}</div> : null}
    </div>
  );
}
