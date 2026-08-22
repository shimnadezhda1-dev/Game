import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { LetterItem, ProgressState } from "../types";
import { LetterVisual } from "./LetterVisual";
import { STAR_REWARDS } from "../utils/rewards";
import { isLetterMastered } from "../utils/selectors";
import { assetUrl, ASSETS } from "../utils/assets";
import { letterTone } from "../utils/cardTones";
import { letterVoiceKey } from "../audio/voiceCatalog";

interface StarsScreenProps {
  progress: ProgressState;
  letters: LetterItem[];
  onBack: () => void;
  onSpeak: (text: string, options?: { key?: string }) => void;
}

export function StarsScreen({ progress, letters, onSpeak }: StarsScreenProps) {
  const foxMood = progress.stars >= 20 ? "celebrate" : "happy";

  function playLetter(letter: LetterItem) {
    if (letter.group > progress.unlockedGroupIndex) {
      return;
    }
    onSpeak(`${letter.upper} — ${letter.word.toLowerCase()}!`, {
      key: letterVoiceKey("letter", letter.id)
    });
  }

  return (
    <div className="screen stars-screen">
      <WorldBackground variant="play" />
      <Character mood={foxMood} size="guide" />
      <div className="stars-hero">
        <img src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
        <div className="stars-big">
          <span className="gold-star tiny-star" aria-hidden="true" />
          {progress.stars}
        </div>
      </div>
      <div className="reward-row">
        {STAR_REWARDS.map((reward) => {
          const open = progress.unlockedRewards.includes(reward.id) || progress.stars >= reward.at;
          return (
            <div key={reward.id} className={`mini-reward ${open ? "open" : "locked"}`}>
              <span className={`reward-gem reward-${reward.id}`} />
              <small>{reward.at}</small>
            </div>
          );
        })}
      </div>
      <div className="album-grid">
        {letters.map((letter) => {
          const mastered = isLetterMastered(progress, letter.id);
          const lockedNext = letter.group > progress.unlockedGroupIndex;
          return (
            <button
              key={letter.id}
              className={`album-card ${letterTone(letter.id)} ${mastered ? "mastered" : ""} ${
                lockedNext ? "locked" : ""
              }`}
              onClick={() => playLetter(letter)}
              disabled={lockedNext}
              aria-label={letter.upper}
            >
              {lockedNext ? (
                <div className="album-lock" />
              ) : (
                <LetterVisual letter={letter} size="card" />
              )}
              <strong className="toy-cube mini-cube">{letter.upper}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}
