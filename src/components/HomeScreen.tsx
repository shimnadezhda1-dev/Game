import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LetterCategory,
  LetterItem,
  OptionCount,
  PlayActivity,
  PlayerPreference,
  StudyOrder
} from "../types";
import { assetUrl } from "../utils/assets";
import { DifficultySelector } from "./DifficultySelector";
import {
  HomeChoiceList,
  HomePanel
} from "./HomePanel";
import { ACTIVITY_OPTIONS, CATEGORY_OPTIONS, ORDER_OPTIONS, studyOrderVisuals } from "./playMenuOptions";
import { LetterPickGrid } from "./LetterPickGrid";
import { playerPreferenceAriaLabel, playerPreferenceIcon } from "./PlayerChooser";
import { HomeButton } from "./HomeButton";
import { GameTitle } from "./GameTitle";
import { MusicToggleButton } from "./MusicToggleButton";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
  onOpenStickers: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onToggleMusic: () => void;
  musicOn: boolean;
  optionCount: OptionCount;
  availableOptionCounts: readonly OptionCount[];
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
  foxCelebrate?: boolean;
  playerPreference: PlayerPreference | null;
  onOpenPlayerChooser: () => void;
}

const FIRST_VISIT_KEY = "happy-alphabet-first-visit-v1";

export function HomeScreen({
  onGoLearn,
  onPlayGames,
  onOpenStickers,
  onToggleMusic,
  musicOn,
  optionCount,
  availableOptionCounts,
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
  playerPreference,
  onOpenPlayerChooser
}: HomeScreenProps) {
  const [pulsePlay, setPulsePlay] = useState(false);
  const [letterPickerOpen, setLetterPickerOpen] = useState(false);
  const settingsGridRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (studyOrder !== "pick") {
      setLetterPickerOpen(false);
    }
  }, [studyOrder]);

  useEffect(() => {
    const closeTransientUi = () => setLetterPickerOpen(false);
    window.addEventListener("popstate", closeTransientUi);
    return () => window.removeEventListener("popstate", closeTransientUi);
  }, []);

  useEffect(() => {
    const first = !localStorage.getItem(FIRST_VISIT_KEY);
    if (!first) {
      return;
    }
    localStorage.setItem(FIRST_VISIT_KEY, "1");
    setPulsePlay(true);
    const timer = window.setTimeout(() => setPulsePlay(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const grid = settingsGridRef.current;
    if (!grid) {
      return;
    }

    let frame = 0;

    const equalize = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>(".home-settings-card"));
      const topCards = cards.filter((card) => !card.classList.contains("home-settings-card--compact"));
      const compactCards = cards.filter((card) => card.classList.contains("home-settings-card--compact"));
      compactCards.forEach((card) => {
        card.style.minHeight = "max-content";
      });
      void grid.offsetHeight;
      const compactMax = Math.ceil(
        Math.max(0, ...compactCards.map((card) => card.getBoundingClientRect().height))
      );
      if (compactMax > 0) {
        compactCards.forEach((card) => {
          card.style.minHeight = `${compactMax}px`;
        });
      }
      if (topCards.length === 0) {
        return;
      }
      grid.style.removeProperty("--home-settings-card-min-height");
      topCards.forEach((card) => {
        card.style.minHeight = "max-content";
      });
      void grid.offsetHeight;
      const maxHeight = Math.ceil(
        Math.max(...topCards.map((card) => card.getBoundingClientRect().height))
      );
      if (maxHeight > 0) {
        const value = `${maxHeight}px`;
        grid.style.setProperty("--home-settings-card-min-height", value);
        topCards.forEach((card) => {
          card.style.minHeight = value;
        });
      }
      const title = document.querySelector<HTMLElement>(".home-game-title");
      if (!title) {
        return;
      }
      if (window.innerWidth <= 820) {
        title.style.removeProperty("margin-top");
        document.querySelector<HTMLElement>(".home-cluster")?.style.removeProperty("top");
        document.querySelector<HTMLElement>(".home-cluster")?.style.removeProperty("transform");
        return;
      }
      const firDrop = 96;
      title.style.marginTop = "0px";
      const natural = title.getBoundingClientRect();
      const room = Math.floor(grid.getBoundingClientRect().top - natural.bottom - 10);
      const drop = Math.max(0, Math.min(firDrop, room));
      title.style.marginTop = `${drop}px`;
      title.dataset.titleDrop = String(drop);
      const cluster = document.querySelector<HTMLElement>(".home-cluster");
      if (!cluster) {
        return;
      }
      const gap = 102;
      const belowTitle = Math.round(title.getBoundingClientRect().bottom + gap);
      cluster.style.top = `${belowTitle}px`;
      cluster.style.transform = "translateX(-50%)";
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(equalize);
    };

    schedule();
    window.addEventListener("resize", schedule);
    const images = Array.from(grid.querySelectorAll("img"));
    const onImage = () => schedule();
    images.forEach((image) => {
      image.addEventListener("load", onImage);
      if (image.complete) {
        schedule();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      images.forEach((image) => image.removeEventListener("load", onImage));
    };
  }, []);

  return (
    <div className="screen home-screen">
      <div className="home-layer home-layer-bg" aria-hidden="true">
        <img
          className="home-meadow"
          src={assetUrl("/assets/home/home-meadow.webp")}
          alt=""
          draggable={false}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="home-brand">
        <img
          className="home-sun"
          src={assetUrl("/assets/home/sun-smiling.webp")}
          fetchPriority="high"
          decoding="async"
          alt=""
          draggable={false}
        />
        <GameTitle />
      </div>

      <div className="home-cluster">
        <img
          className="home-fox-art"
          src={assetUrl("/assets/home/fox-home.webp")}
          fetchPriority="high"
          decoding="async"
          alt=""
          draggable={false}
        />
        <div className="home-cta">
          <button
            className={`play-btn home-play-btn ${pulsePlay ? "home-play-hint" : ""}`}
            onClick={onPlayGames}
            disabled={!availableOptionCounts.includes(optionCount)}
            aria-label="Играть"
          >
            <span className="home-play-glyph" aria-hidden="true">
              ▶
            </span>
            <span className="home-play-label">ИГРАТЬ</span>
          </button>
          <button className="home-abc" onClick={onGoLearn} aria-label="Буквы А Б В">
            <img
              src={assetUrl("/assets/home/letters-abv.webp")}
              alt="А Б В"
              draggable={false}
              decoding="async"
            />
          </button>
          <button type="button" className="home-stickers-btn" onClick={onOpenStickers}>
            <img
              className="home-stickers-btn__icon"
              src={assetUrl("/assets/ui/stickers-album-icon.png")}
              alt=""
              draggable={false}
            />
            <span className="home-stickers-btn__label">МОИ НАКЛЕЙКИ</span>
          </button>
        </div>
      </div>

      <aside ref={settingsGridRef} className="home-panels home-settings-grid" aria-label="Настройки игры">
        <HomePanel kind="difficulty">
          <DifficultySelector
            value={optionCount}
            availableCounts={availableOptionCounts}
            onChange={onOptionCountChange}
            layout="vertical"
          />
        </HomePanel>
        <HomePanel kind="activity">
          <HomeChoiceList
            name="Выбери занятие"
            value={playActivity}
            options={ACTIVITY_OPTIONS}
            onChange={onPlayActivityChange}
          />
        </HomePanel>
        <HomePanel kind="order" compact>
          <HomeChoiceList
            name="Порядок изучения"
            value={studyOrder}
            options={ORDER_OPTIONS}
            onChange={(value) => {
              onStudyOrderChange(value);
              setLetterPickerOpen(value === "pick");
            }}
          />
        </HomePanel>
        <HomePanel kind="category" compact>
          <HomeChoiceList
            name="Категория букв"
            value={letterCategory}
            options={CATEGORY_OPTIONS}
            onChange={onLetterCategoryChange}
          />
        </HomePanel>
      </aside>

      {letterPickerOpen && studyOrder === "pick" ? (
        <div className="home-letter-overlay" role="dialog" aria-label="Выбери букву">
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
              setLetterPickerOpen(false);
            }}
          />
        </div>
      ) : null}

      <HomeButton ariaLabel="Домой" />

      <MusicToggleButton
        musicOn={musicOn}
        onToggle={onToggleMusic}
        className="home-ui home-ui-sound"
      />

      <button
        type="button"
        className={`home-ui home-ui-profile ${
          playerPreference === "boy"
            ? "home-ui-profile--boy"
            : playerPreference === "girl"
              ? "home-ui-profile--girl"
              : "home-ui-profile--neutral"
        }`}
        title="Кто играет?"
        aria-label={playerPreferenceAriaLabel(playerPreference)}
        onClick={onOpenPlayerChooser}
      >
        <span className="home-ui-profile__face" aria-hidden="true">
          {playerPreferenceIcon(playerPreference)}
        </span>
      </button>
    </div>
  );
}
