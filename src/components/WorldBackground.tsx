import { layoutMeadowFriends } from "../utils/favoriteStickers";
import type { CSSProperties } from "react";

interface MeadowFriendArt {
  id: string;
  src: string;
}

interface WorldBackgroundProps {
  variant?: "cover" | "play";
  sunSrc?: string;
  lively?: boolean;
  meadowFriends?: MeadowFriendArt[];
}

export function WorldBackground({
  variant = "play",
  sunSrc,
  lively = false,
  meadowFriends = []
}: WorldBackgroundProps) {
  const friends = lively ? layoutMeadowFriends(meadowFriends.map((friend) => friend.id)) : [];
  const friendArt = new Map(meadowFriends.map((friend) => [friend.id, friend.src]));
  return (
    <div className={`world world-${variant}`} aria-hidden>
      <div className="world-sky" />
      <div className="toy-sun">
        {sunSrc ? (
          <img className="toy-sun-art" src={sunSrc} alt="" draggable={false} />
        ) : (
          <span className="sun-core">
            <i className="sun-eye sun-eye-l" />
            <i className="sun-eye sun-eye-r" />
            <i className="sun-smile" />
          </span>
        )}
      </div>
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" />
      {variant === "cover" ? (
        <>
          <div className="balloon balloon-a" />
          <div className="balloon balloon-b" />
          <div className="balloon balloon-c" />
          <div className="balloon balloon-d" />
          <div className="balloon balloon-e" />
        </>
      ) : null}
      <div className="hills">
        <span className="hill hill-left" />
        <span className="hill hill-right" />
        <span className="hill hill-mid" />
      </div>
      <div className="tree tree-a" />
      <div className="tree tree-b" />
      <div className="grass-line" />
      {lively ? (
        <div className="meadow-life">
          <span className="meadow-path" />
          <span className="meadow-bush meadow-bush-a" />
          <span className="meadow-bush meadow-bush-b" />
          <span className="meadow-bush meadow-bush-c" />
          <span className="meadow-mushroom meadow-mushroom-a" />
          <span className="meadow-pebble" />
          <span className="meadow-bloom meadow-bloom-a" />
          <span className="meadow-bloom meadow-bloom-b" />
          <span className="meadow-bloom meadow-bloom-c" />
          <span className="meadow-bloom meadow-bloom-d" />
          <span className="meadow-bloom meadow-bloom-e" />
          <span className="meadow-wing meadow-wing-a" />
          <span className="meadow-wing meadow-wing-b" />
          {friends.map((friend) => (
            <span
              key={friend.id}
              className={`meadow-friend meadow-friend-${friend.side}`}
              data-meadow-friend={friend.id}
              style={
                {
                  "--friend-inset": `${friend.inset}%`,
                  "--friend-bottom": `${friend.bottom}vh`,
                  "--friend-size": `${friend.size}px`,
                  "--friend-delay": `${friend.delay}s`,
                  "--friend-tilt": `${friend.tilt}deg`
                } as CSSProperties
              }
            >
              <img src={friendArt.get(friend.id) ?? ""} alt="" draggable={false} />
            </span>
          ))}
        </div>
      ) : null}
      <div className="flowers">
        <span className="flower f-a" />
        <span className="flower f-b" />
        <span className="flower f-c" />
        <span className="flower f-d" />
        <span className="flower f-e" />
        <span className="flower f-f" />
      </div>
      <div className="tree tree-c" />
    </div>
  );
}
