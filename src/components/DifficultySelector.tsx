import { OptionCount } from "../types";

interface DifficultySelectorProps {
  value: OptionCount;
  availableCounts: readonly OptionCount[];
  onChange: (value: OptionCount) => void;
  compact?: boolean;
  layout?: "horizontal" | "vertical";
}

const OPTIONS: Array<{ value: OptionCount; label: string; tone: "easy" | "medium" | "hard"; stars: number }> = [
  { value: 3, label: "Лёгкий", tone: "easy", stars: 1 },
  { value: 5, label: "Средний", tone: "medium", stars: 2 },
  { value: 7, label: "Сложный", tone: "hard", stars: 3 }
];

function StarMarks({ count }: { count: number }) {
  return (
    <span className="difficulty-stars" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index}>★</span>
      ))}
    </span>
  );
}

export function DifficultySelector({
  value,
  availableCounts,
  onChange,
  compact = false,
  layout = "horizontal"
}: DifficultySelectorProps) {
  return (
    <div
      className={`difficulty-selector difficulty-selector--${layout} ${
        compact ? "difficulty-selector--compact" : ""
      }`}
      role="radiogroup"
      aria-label="Уровень сложности"
    >
      {OPTIONS.map((option) => {
        const available = availableCounts.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`difficulty-option difficulty-option--${option.tone} ${
              value === option.value ? "is-selected" : ""
            }`}
            role="radio"
            aria-checked={value === option.value}
            aria-label={`${option.label}, ${option.value} варианта`}
            disabled={!available}
            onClick={() => onChange(option.value)}
          >
            <span className="difficulty-option__main">
              {value === option.value ? (
                <span className="difficulty-option__check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
              <StarMarks count={option.stars} />
              <span>{option.label}</span>
              {!available ? <span aria-hidden="true">🔒</span> : null}
            </span>
            {!available ? <small>Скоро</small> : null}
          </button>
        );
      })}
    </div>
  );
}
