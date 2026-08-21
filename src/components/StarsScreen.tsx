import { Character } from "./Character";
import { LetterItem, ProgressState } from "../types";
import { WorldBackground } from "./WorldBackground";
import { LetterVisual } from "./LetterVisual";
import { BottomNav } from "./BottomNav";
import { STAR_REWARDS } from "../utils/rewards";
import { isLetterMastered, masteredCount } from "../utils/selectors";
import { assetUrl, ASSETS } from "../utils/assets";

interface StarsScreenProps {
  progress: ProgressState;
  letters: LetterItem[];
  onBack: () => void;
}

const REWARD_ICON: Record<string, string> = {
  gift: "🎁",
  sticker: "🌈",
  medal: "🏅",
  fox: "🦊"
};

export function StarsScreen({ progress, letters, onBack }: StarsScreenProps) {
  const learned = masteredCount(progress, letters);
  const foxMood = progress.stars >= 20 ? "celebrate" : "happy";

  return (
    <div className="screen stars-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood={foxMood} message={learned ? "Какая коллекция!" : "Давай собирать звёзды!"} />
      <h2 className="title stars-title">Мои награды</h2>
      <div className="stars-hero">
        <img src={assetUrl(ASSETS.ui.stars)} alt="" draggable={false} />
        <div className="stars-big">★ {progress.stars}</div>
      </div>
      <p className="stars-copy">
        {learned ? `Ты уже выучил ${learned} ${learned === 1 ? "букву" : "буквы"}!` : "Пока буквы ждут тебя!"}
      </p>
      <div className="reward-row">
        {STAR_REWARDS.map((reward) => {
          const open = progress.unlockedRewards.includes(reward.id) || progress.stars >= reward.at;
          return (
            <div key={reward.id} className={`mini-reward ${open ? "open" : "locked"}`}>
              <span>{open ? REWARD_ICON[reward.id] : "🔒"}</span>
              <small>{reward.at}★</small>
            </div>
          );
        })}
      </div>
      <div className="album-grid">
        {letters.map((letter) => {
          const mastered = isLetterMastered(progress, letter.id);
          const lockedNext = letter.group > progress.unlockedGroupIndex;
          return (
            <div
              key={letter.id}
              className={`album-card ${mastered ? "mastered" : ""} ${lockedNext ? "locked" : ""}`}
            >
              {lockedNext ? (
                <div className="album-lock">🔒</div>
              ) : (
                <LetterVisual letter={letter} size="card" />
              )}
              <strong>
                {letter.upper}
                {mastered ? " ★" : ""}
              </strong>
              <span>{lockedNext ? "Скоро" : letter.word}</span>
            </div>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
