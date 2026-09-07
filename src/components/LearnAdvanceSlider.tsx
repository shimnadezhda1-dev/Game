import { LEARN_ADVANCE_MAX, LEARN_ADVANCE_MIN } from "../utils/learnAdvance";

interface LearnAdvanceSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function LearnAdvanceSlider({ value, onChange, className = "" }: LearnAdvanceSliderProps) {
  return (
    <div className={`learn-advance ${className}`.trim()} aria-label="Пауза между буквами">
      <span className="learn-advance__clock" aria-hidden="true">
        🕒
      </span>
      <input
        className="learn-advance__slider"
        type="range"
        min={LEARN_ADVANCE_MIN}
        max={LEARN_ADVANCE_MAX}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuemin={LEARN_ADVANCE_MIN}
        aria-valuemax={LEARN_ADVANCE_MAX}
        aria-valuenow={value}
        aria-label="Пауза после озвучки"
      />
      <span className="learn-advance__value">{value} сек</span>
    </div>
  );
}
