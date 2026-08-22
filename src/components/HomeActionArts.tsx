import { assetUrl, ASSETS } from "../utils/assets";

export function LettersMiniArt() {
  return (
    <span className="letters-mini" aria-hidden="true">
      <span className="letters-mini-a">А</span>
      <span className="letters-mini-b">Б</span>
      <span className="letters-mini-v">В</span>
    </span>
  );
}

export function RewardsMiniArt() {
  return (
    <img className="rewards-mini" src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
  );
}
