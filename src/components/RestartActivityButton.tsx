interface RestartActivityButtonProps {
  onClick: () => void;
}

export function RestartActivityButton({ onClick }: RestartActivityButtonProps) {
  return (
    <button type="button" className="restart-activity" onClick={onClick}>
      Начать сначала
    </button>
  );
}
