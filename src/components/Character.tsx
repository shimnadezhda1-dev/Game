import { ASSETS, assetUrl } from "../utils/assets";

export type FoxMood = "happy" | "tip" | "neutral" | "celebrate";

interface CharacterProps {
  mood: FoxMood;
  message?: string;
  size?: "hero" | "normal" | "guide";
}

const FOX_SRC: Record<FoxMood, string> = {
  happy: ASSETS.fox.happy,
  tip: ASSETS.fox.tip,
  neutral: ASSETS.fox.idle,
  celebrate: ASSETS.fox.celebrate
};

export function Character({ mood, message, size = "normal" }: CharacterProps) {
  return (
    <div className={`character character-${mood} character-${size}`}>
      <div className="fox-embed">
        <img className="fox-img" src={assetUrl(FOX_SRC[mood])} alt="" draggable={false} />
      </div>
      {message ? (
        <div className="character-bubble">
          {message.split("\n").map((line, index) => (
            <span key={`${line}-${index}`}>
              {index ? <br /> : null}
              {line}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
