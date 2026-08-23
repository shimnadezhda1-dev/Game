import { NextArrowIcon, PrevArrowIcon } from "./ToyIcons";

interface StageNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}

export function StageNav({
  onPrev,
  onNext,
  showPrev = Boolean(onPrev),
  showNext = Boolean(onNext)
}: StageNavProps) {
  const showBack = Boolean(showPrev && onPrev);
  const showForward = Boolean(showNext && onNext);

  if (!showBack && !showForward) {
    return null;
  }

  return (
    <div className="stage-side-nav">
      {showBack && onPrev ? (
        <button
          type="button"
          className="stage-side-nav__btn stage-side-nav--prev"
          onClick={onPrev}
          aria-label="Предыдущий этап"
        >
          <PrevArrowIcon />
        </button>
      ) : null}
      {showForward && onNext ? (
        <button
          type="button"
          className="stage-side-nav__btn stage-side-nav--next"
          onClick={onNext}
          aria-label="Следующий этап"
        >
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
