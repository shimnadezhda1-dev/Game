interface BottomNavProps {
  onBack: () => void;
  onNext?: () => void;
  onHome?: () => void;
}

export function BottomNav({ onBack, onNext, onHome }: BottomNavProps) {
  return (
    <div className="bottom-nav">
      <button className="nav-arrow nav-back" onClick={onBack} aria-label="Назад">
        ←
      </button>
      {onHome ? (
        <button className="nav-arrow nav-home" onClick={onHome} aria-label="Домой">
          ⌂
        </button>
      ) : (
        <span className="nav-spacer" />
      )}
      {onNext ? (
        <button className="nav-arrow nav-next" onClick={onNext} aria-label="Дальше">
          →
        </button>
      ) : (
        <span className="nav-spacer" />
      )}
    </div>
  );
}
