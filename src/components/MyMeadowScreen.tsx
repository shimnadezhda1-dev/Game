import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FavoriteStickerLayouts,
  FavoriteStickerPosition,
  MeadowLayoutKind,
  MeadowTheme
} from "../types";
import { audioManager } from "../audio/AudioManager";
import { MEADOW_TUTORIAL_CLIPS } from "../audio/meadowTutorialVoice";
import { assetUrl } from "../utils/assets";
import {
  layoutMeadowStars,
  meadowLayoutKindFromWidth,
  MEADOW_STAR_COUNT_DESKTOP,
  MEADOW_STAR_COUNT_MOBILE
} from "../utils/favoriteStickers";
import { WorldBackground } from "./WorldBackground";
import { MeadowStickerLayer, type MeadowFriendArt } from "./MeadowStickerLayer";

const MEADOW_THEME_TRANSITION_MS = 700;
const MEADOW_TUTORIAL_START_MS = 1600;

interface MyMeadowScreenProps {
  friends: MeadowFriendArt[];
  layouts: FavoriteStickerLayouts;
  theme: MeadowTheme;
  tutorialSeen: boolean;
  nightUnlocked: boolean;
  sunHintHeard: boolean;
  onToggleTheme: () => void;
  onMarkSunHintHeard: () => void;
  onMarkNightUnlocked: () => void;
  onMarkTutorialSeen: () => void;
  onCommitPosition: (
    id: string,
    position: FavoriteStickerPosition,
    kind: MeadowLayoutKind
  ) => void;
  onOpenAlbum: () => void;
}

type TutorialHint = "sun" | "moon" | null;

export function MyMeadowScreen({
  friends,
  layouts,
  theme,
  tutorialSeen,
  nightUnlocked,
  sunHintHeard,
  onToggleTheme,
  onMarkSunHintHeard,
  onMarkNightUnlocked,
  onMarkTutorialSeen,
  onCommitPosition,
  onOpenAlbum
}: MyMeadowScreenProps) {
  const [layoutKind, setLayoutKind] = useState<MeadowLayoutKind>(() =>
    meadowLayoutKindFromWidth(window.innerWidth)
  );
  const [hintTarget, setHintTarget] = useState<TutorialHint>(null);
  const sessionHintRef = useRef(false);
  const pendingNightRef = useRef(false);
  const markSunHintRef = useRef(onMarkSunHintHeard);
  const markNightRef = useRef(onMarkNightUnlocked);
  const markDoneRef = useRef(onMarkTutorialSeen);
  markSunHintRef.current = onMarkSunHintHeard;
  markNightRef.current = onMarkNightUnlocked;
  markDoneRef.current = onMarkTutorialSeen;
  const positions = layouts[layoutKind];
  const isNight = theme === "night";
  const stars = useMemo(
    () =>
      layoutMeadowStars(
        layoutKind === "mobile" ? MEADOW_STAR_COUNT_MOBILE : MEADOW_STAR_COUNT_DESKTOP
      ),
    [layoutKind]
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const sync = () => setLayoutKind(meadowLayoutKindFromWidth(window.innerWidth));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (tutorialSeen || sessionHintRef.current) {
      return;
    }
    let cancelled = false;
    const start = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      sessionHintRef.current = true;
      if (theme === "night") {
        const afterWow = () => {
          if (cancelled) {
            return;
          }
          setHintTarget("moon");
          audioManager.playVoice(MEADOW_TUTORIAL_CLIPS.dayHint.path);
        };
        if (!nightUnlocked) {
          markNightRef.current();
          setHintTarget("moon");
          audioManager.playVoice(MEADOW_TUTORIAL_CLIPS.nightWow.path, afterWow);
        } else {
          afterWow();
        }
        return;
      }
      setHintTarget("sun");
      const clip = sunHintHeard
        ? MEADOW_TUTORIAL_CLIPS.nightReminder
        : MEADOW_TUTORIAL_CLIPS.nightHint;
      markSunHintRef.current();
      audioManager.playVoice(clip.path);
    }, MEADOW_TUTORIAL_START_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
    // Intentionally only on first mount / tutorial gate — sessionHintRef blocks repeats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialSeen]);

  useEffect(() => {
    if (!pendingNightRef.current || theme !== "night" || tutorialSeen) {
      return;
    }
    pendingNightRef.current = false;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      markNightRef.current();
      setHintTarget("moon");
      audioManager.playVoice(MEADOW_TUTORIAL_CLIPS.nightWow.path, () => {
        if (cancelled) {
          return;
        }
        audioManager.playVoice(MEADOW_TUTORIAL_CLIPS.dayHint.path);
      });
    }, MEADOW_THEME_TRANSITION_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [theme, tutorialSeen]);

  function handleCelestialClick() {
    const goingToNight = theme === "day";
    setHintTarget(null);
    if (!tutorialSeen && goingToNight) {
      pendingNightRef.current = true;
    }
    if (!tutorialSeen && !goingToNight) {
      markDoneRef.current();
    }
    onToggleTheme();
  }

  const showSunHint = hintTarget === "sun" && !isNight;
  const showMoonHint = hintTarget === "moon" && isNight;

  return (
    <div
      className={`screen my-meadow-screen my-meadow-screen--${layoutKind}${
        isNight ? " my-meadow-screen--night" : ""
      }`}
      data-my-meadow
      data-meadow-layout={layoutKind}
      data-meadow-theme={theme}
      data-meadow-tutorial={tutorialSeen ? "done" : "pending"}
    >
      <WorldBackground
        variant="play"
        lively
        sunSrc={assetUrl("/assets/stickers-page/sun.png")}
      />
      <div className="my-meadow-night-veil" aria-hidden />
      <div className="my-meadow-stars" data-meadow-stars aria-hidden>
        {stars.map((star) => (
          <span
            key={star.id}
            className={`my-meadow-star${star.twinkle ? " is-twinkle" : ""}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>
      <div className="my-meadow-lawn" aria-hidden />
      <button
        type="button"
        className={`my-meadow-celestial${
          showSunHint || showMoonHint ? " is-tutorial-hint" : ""
        }`}
        data-meadow-celestial
        aria-label={isNight ? "Включить день" : "Включить ночь"}
        onClick={handleCelestialClick}
      >
        <img
          className="my-meadow-celestial__sun"
          src={assetUrl("/assets/stickers-page/sun.png")}
          alt=""
          draggable={false}
        />
        <img
          className="my-meadow-celestial__moon"
          src={assetUrl("/assets/home/meadow-moon.jpg")}
          alt=""
          draggable={false}
        />
        {(showSunHint || showMoonHint) && (
          <span className="my-meadow-celestial__sparks" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      {friends.length ? (
        <MeadowStickerLayer
          friends={friends}
          positions={positions}
          layoutKind={layoutKind}
          onCommitPosition={(id, position) => onCommitPosition(id, position, layoutKind)}
        />
      ) : (
        <div className="my-meadow-empty">
          <p>Пока нет любимых наклеек.</p>
          <p>Отметь сердечком в альбоме — и они появятся здесь.</p>
          <button type="button" className="my-meadow-empty-btn" onClick={onOpenAlbum}>
            Мои наклейки
          </button>
        </div>
      )}
    </div>
  );
}
