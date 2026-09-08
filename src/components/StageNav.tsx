import { NextArrowIcon, PrevArrowIcon } from "./ToyIcons";

export type StageNavDest = "learn" | "find" | "picture" | "listen" | "finish";

const DEST_LABEL: Record<StageNavDest, string> = {
  learn: "Знакомство с буквой",
  find: "Найди букву",
  picture: "Что начинается на букву",
  listen: "Послушай и выбери букву",
  finish: "Дальше"
};

interface StageNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  prevDest?: StageNavDest;
  nextDest?: StageNavDest;
}

export function StageNav({
  onPrev,
  onNext,
  showPrev = Boolean(onPrev),
  showNext = Boolean(onNext),
  prevDest = "picture",
  nextDest = "finish"
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
          className={`stage-side-nav__btn stage-side-nav--prev stage-side-nav__btn--${prevDest}`}
          onClick={onPrev}
          aria-label={DEST_LABEL[prevDest]}
        >
          <PrevArrowIcon />
        </button>
      ) : null}
      {showForward && onNext ? (
        <button
          type="button"
          className={`stage-side-nav__btn stage-side-nav--next stage-side-nav__btn--${nextDest}`}
          onClick={onNext}
          aria-label={DEST_LABEL[nextDest]}
        >
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
