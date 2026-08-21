interface SpeakButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export function SpeakButton({ onClick, label = "Послушать", disabled }: SpeakButtonProps) {
  return (
    <button className="speak-again" onClick={onClick} disabled={disabled} aria-label={label}>
      🔊
      <span>{label}</span>
    </button>
  );
}
