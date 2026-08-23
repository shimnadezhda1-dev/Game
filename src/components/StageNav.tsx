import { NextArrowIcon, PrevArrowIcon } from "./ToyIcons";

interface StageNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  nextPulse?: boolean;
}

export function StageNav({
  onPrev,
  onNext,
  showPrev = Boolean(onPrev),
  showNext = Boolean(onNext),
  nextPulse = false
}: StageNavProps) {
  return (
    <>
      {showPrev && onPrev ? (
        <button
          className="stage-nav-btn stage-nav-prev"
          onClick={onPrev}
          aria-label="Предыдущий этап"
        >
          <PrevArrowIcon />
        </button>
      ) : null}
      {showNext && onNext ? (
        <button
          className={`stage-nav-btn stage-nav-next ${nextPulse ? "is-pulse" : ""}`}
          onClick={onNext}
          aria-label="Следующий этап"
        >
          <NextArrowIcon />
        </button>
      ) : null}
    </>
  );
}
