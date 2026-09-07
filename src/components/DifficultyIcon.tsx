interface DifficultyIconProps {
  className?: string;
}

export function DifficultyIcon({ className = "difficulty-icon" }: DifficultyIconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="#8b94a3">
        <rect x="28" y="4" width="8" height="14" rx="2" />
        <rect x="28" y="46" width="8" height="14" rx="2" />
        <rect x="4" y="28" width="14" height="8" rx="2" />
        <rect x="46" y="28" width="14" height="8" rx="2" />
        <rect x="10" y="10" width="8" height="14" rx="2" transform="rotate(-45 14 17)" />
        <rect x="46" y="10" width="8" height="14" rx="2" transform="rotate(45 50 17)" />
        <rect x="10" y="40" width="8" height="14" rx="2" transform="rotate(45 14 47)" />
        <rect x="46" y="40" width="8" height="14" rx="2" transform="rotate(-45 50 47)" />
        <circle cx="32" cy="32" r="14" />
      </g>
      <circle cx="32" cy="32" r="6" fill="#eef3f8" />
    </svg>
  );
}
