import { useEffect, useState } from "react";

interface SpeakButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  hintKey?: string;
}

export function SpeakButton({ onClick, label = "Послушать", disabled, hintKey }: SpeakButtonProps) {
  const [waves, setWaves] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!hintKey || disabled) {
      return;
    }
    setHint(true);
    const timer = window.setTimeout(() => setHint(false), 1600);
    return () => window.clearTimeout(timer);
  }, [hintKey, disabled]);

  function handleClick() {
    if (disabled) {
      return;
    }
    setWaves(true);
    onClick();
    window.setTimeout(() => setWaves(false), 1400);
  }

  return (
    <button
      className={`speaker-btn ${waves ? "speaker-waves" : ""} ${hint ? "pulse-hint" : ""}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <svg className="speaker-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M8 26h12l16-12v36L20 38H8a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"
          fill="#16324f"
        />
        <path
          className="wave-path wave-a"
          d="M42 24c3 3 3 13 0 16"
          fill="none"
          stroke="#16324f"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          className="wave-path wave-b"
          d="M50 18c6 6 6 22 0 28"
          fill="none"
          stroke="#16324f"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
