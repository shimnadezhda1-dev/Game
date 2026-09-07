import { useEffect, useState } from "react";
import {
  LetterCategory,
  LetterItem,
  OptionCount,
  PlayActivity,
  PlayerPreference,
  StudyOrder
} from "../types";
import { assetUrl } from "../utils/assets";
import { SpeakerMuteIcon } from "./ToyIcons";
import { DifficultySelector } from "./DifficultySelector";
import {
  HomeChoiceList,
  HomePanel
} from "./HomePanel";
import { ACTIVITY_OPTIONS, CATEGORY_OPTIONS, ORDER_OPTIONS, studyOrderVisuals } from "./playMenuOptions";
import { LetterPickGrid } from "./LetterPickGrid";
import { playerPreferenceAriaLabel, playerPreferenceIcon } from "./PlayerChooser";
import { HomeButton } from "./HomeButton";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
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
  onSpeak,
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
    onSpeak("Привет! Давай играть с буквами!", { key: "welcome" });
    setPulsePlay(true);
    const timer = window.setTimeout(() => setPulsePlay(false), 2200);
    return () => window.clearTimeout(timer);
  }, [onSpeak]);

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

      <img
        className="home-sun"
        src={assetUrl("/assets/home/sun-smiling.webp")}
        fetchPriority="high"
        decoding="async"
        alt=""
        draggable={false}
      />

      <h1 className="visually-hidden">Весёлый алфавит</h1>

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
        </div>
      </div>

      <aside className="home-panels" aria-label="Настройки игры">
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
        <HomePanel kind="order">
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
        <HomePanel kind="category">
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

      <button
        className="home-ui home-ui-sound"
        onClick={onToggleMusic}
        aria-label={musicOn ? "Музыка включена" : "Музыка выключена"}
      >
        <SpeakerMuteIcon muted={!musicOn} />
      </button>

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
        <span aria-hidden="true">{playerPreferenceIcon(playerPreference)}</span>
      </button>
    </div>
  );
}
