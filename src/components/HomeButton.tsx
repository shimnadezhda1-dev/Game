interface HomeButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export function HomeButton({
  onClick,
  ariaLabel = "На главную",
  className = ""
}: HomeButtonProps) {
  return (
    <button
      type="button"
      className={`learn-home ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span aria-hidden="true">🏠</span>
    </button>
  );
}
