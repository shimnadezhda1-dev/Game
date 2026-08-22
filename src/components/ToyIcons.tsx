export function MusicNoteIcon() {
  return (
    <svg className="toy-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M44 8v28.4a12 12 0 1 1-8-11.3V18l16-6V8z"
        fill="#fff"
      />
      <circle cx="24" cy="46" r="10" fill="#fff" />
      <circle cx="44" cy="40" r="10" fill="#fff" />
    </svg>
  );
}

export function SpeakerMuteIcon({ muted }: { muted?: boolean }) {
  return (
    <svg className="toy-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 26h12l16-12v36L22 38H10a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z" fill="#fff" />
      {muted ? (
        <path d="M42 24l16 16M58 24L42 40" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <path d="M42 24c3 3 3 13 0 16" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50 18c6 6 6 22 0 28" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

export function GoldStarIcon() {
  return (
    <svg className="toy-icon gold-star-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 6l7.4 15.1 16.6 2.4-12 11.7 2.8 16.6L32 43.8 17.2 51.8l2.8-16.6-12-11.7 16.6-2.4z"
        fill="#ffe566"
        stroke="#f5b400"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NextArrowIcon() {
  return (
    <svg className="toy-icon next-arrow-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M18 32h22M28 18l18 14-18 14"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
