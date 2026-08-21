import { assetUrl, ASSETS } from "../utils/assets";

export function PlayActionArt({ celebrate }: { celebrate?: boolean }) {
  return (
    <span className="action-scene play-scene">
      <img
        className="play-scene-fox"
        src={assetUrl(celebrate ? ASSETS.fox.celebrate : ASSETS.fox.happy)}
        alt=""
        draggable={false}
      />
      <span className="play-letters" aria-hidden="true">
        <span className="chunky-letter letter-a">А</span>
        <span className="chunky-letter letter-b">Б</span>
        <span className="chunky-letter letter-v">В</span>
      </span>
      <span className="play-glyph" aria-hidden="true">
        ▶
      </span>
    </span>
  );
}

export function LearnActionArt() {
  return (
    <span className="action-scene learn-scene">
      <img className="action-photo" src={assetUrl(ASSETS.ui.cubes)} alt="" draggable={false} />
    </span>
  );
}

export function RewardsActionArt() {
  return (
    <span className="action-scene rewards-scene">
      <img className="action-photo" src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
    </span>
  );
}
