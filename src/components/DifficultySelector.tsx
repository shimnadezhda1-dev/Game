import { OptionCount } from "../types";

interface DifficultySelectorProps {
  value: OptionCount;
  availableCounts: readonly OptionCount[];
  onChange: (value: OptionCount) => void;
  compact?: boolean;
}

const OPTIONS: Array<{ value: OptionCount; label: string }> = [
  { value: 3, label: "Легко" },
  { value: 5, label: "Средне" },
  { value: 7, label: "Сложно" }
];

export function DifficultySelector({
  value,
  availableCounts,
  onChange,
  compact = false
}: DifficultySelectorProps) {
  return (
    <div
      className={`difficulty-selector ${compact ? "difficulty-selector--compact" : ""}`}
      role="radiogroup"
      aria-label="Сложность"
    >
      {OPTIONS.map((option) => {
        const available = availableCounts.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`difficulty-option ${value === option.value ? "is-selected" : ""}`}
            role="radio"
            aria-checked={value === option.value}
            disabled={!available}
            onClick={() => onChange(option.value)}
          >
            <span className="difficulty-option__main">
              <span>{option.label}</span>
              <strong>{option.value}</strong>
              {!available ? <span aria-hidden="true">🔒</span> : null}
            </span>
            {!available ? <small>Скоро</small> : null}
          </button>
        );
      })}
    </div>
  );
}
