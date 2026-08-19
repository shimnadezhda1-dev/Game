interface BottomNavProps {
  onBack: () => void;
  onNext?: () => void;
}

export function BottomNav({ onBack, onNext }: BottomNavProps) {
  return (
    <div className="bottom-nav">
      <button className="nav-arrow nav-back" onClick={onBack} aria-label="Назад">
        ←
      </button>
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
