import { useEffect, useMemo, useRef, useState } from "react";
import {
  LetterCategory,
  LetterItem,
  OptionCount,
  PlayActivity,
  StudyOrder
} from "../types";
import { letterAllowsActivity } from "../utils/playSettings";
import { assetUrl } from "../utils/assets";
import { DifficultySelector } from "./DifficultySelector";
import { HomeChoiceList } from "./HomePanel";
import { LetterPickGrid } from "./LetterPickGrid";
import { MenuImageButton, PlayMenuKind } from "./MenuImageButton";
import { ACTIVITY_OPTIONS, CATEGORY_OPTIONS, ORDER_OPTIONS, studyOrderVisuals } from "./playMenuOptions";

interface GameControlsProps {
  optionCount: OptionCount;
  availableCounts: readonly OptionCount[];
  onOptionCountChange: (value: OptionCount) => void;
  playActivity: PlayActivity;
  onPlayActivityChange: (value: PlayActivity) => void;
  studyOrder: StudyOrder;
  onStudyOrderChange: (value: StudyOrder) => void;
  letterCategory: LetterCategory;
  onLetterCategoryChange: (value: LetterCategory) => void;
  selectedLetterId: string;
  pickableLetters: readonly LetterItem[];
  onSelectedLetterChange: (id: string) => void;
  currentLetter?: LetterItem;
}

export { ACTIVITY_OPTIONS, CATEGORY_OPTIONS, ORDER_OPTIONS } from "./playMenuOptions";

export function GameControls({
  optionCount,
  availableCounts,
  onOptionCountChange,
  playActivity,
  onPlayActivityChange,
  studyOrder,
  onStudyOrderChange,
  letterCategory,
  onLetterCategoryChange,
  selectedLetterId,
  pickableLetters,
  onSelectedLetterChange,
  currentLetter,
}: GameControlsProps) {
  const [open, setOpen] = useState<PlayMenuKind | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeTransientUi = () => setOpen(null);
    window.addEventListener("popstate", closeTransientUi);
    return () => window.removeEventListener("popstate", closeTransientUi);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeFromOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(null);
      }
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
      }
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [open]);

  const activityOptions = useMemo(
    () =>
      ACTIVITY_OPTIONS.map((option) => ({
        ...option,
        disabled: !letterAllowsActivity(currentLetter, option.value),
        unavailableLabel: "Пока нельзя"
      })),
    [currentLetter]
  );

  function toggle(kind: PlayMenuKind) {
    setOpen((current) => (current === kind ? null : kind));
  }

  return (
    <div className="game-controls" ref={rootRef}>
      <div className="game-controls__buttons">
        <MenuImageButton kind="difficulty" expanded={open === "difficulty"} onClick={() => toggle("difficulty")} />
        <MenuImageButton kind="activity" expanded={open === "activity"} onClick={() => toggle("activity")} />
        <MenuImageButton kind="order" expanded={open === "order"} onClick={() => toggle("order")} />
        <MenuImageButton kind="category" expanded={open === "category"} onClick={() => toggle("category")} />
      </div>
      {open === "difficulty" ? (
        <div className="game-controls__popover game-controls__popover--difficulty" role="dialog" aria-label="Уровень сложности">
          <DifficultySelector
            value={optionCount}
            availableCounts={availableCounts}
            onChange={(value) => {
              onOptionCountChange(value);
              setOpen(null);
            }}
            compact
            layout="vertical"
          />
        </div>
      ) : null}
      {open === "activity" ? (
        <div className="game-controls__popover game-controls__popover--activity" role="dialog" aria-label="Выбери занятие">
          <HomeChoiceList
            name="Выбери занятие"
            value={playActivity}
            options={activityOptions}
            onChange={(value) => {
              onPlayActivityChange(value);
              setOpen(null);
            }}
          />
        </div>
      ) : null}
      {open === "order" ? (
        <div className="game-controls__popover game-controls__popover--order" role="dialog" aria-label="Порядок изучения">
          <HomeChoiceList
            name="Порядок изучения"
            value={studyOrder}
            options={ORDER_OPTIONS}
            rowLayout
            onChange={(value) => {
              onStudyOrderChange(value);
              if (value !== "pick") {
                setOpen(null);
              }
            }}
          />
          {studyOrder === "pick" ? (
            <div className="game-controls__letters">
              <img
                className="letter-selector-title"
                src={assetUrl(studyOrderVisuals.manual)}
                alt="Выбери букву"
                draggable={false}
              />
              <LetterPickGrid
                letters={pickableLetters}
                selectedLetterId={selectedLetterId}
                onSelect={(id) => {
                  onSelectedLetterChange(id);
                  setOpen(null);
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {open === "category" ? (
        <div className="game-controls__popover game-controls__popover--category" role="dialog" aria-label="Категория букв">
          <HomeChoiceList
            name="Категория букв"
            value={letterCategory}
            options={CATEGORY_OPTIONS}
            onChange={(value) => {
              onLetterCategoryChange(value);
              setOpen(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
