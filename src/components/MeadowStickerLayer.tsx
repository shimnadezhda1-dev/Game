import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { FavoriteStickerPosition, MeadowLayoutKind } from "../types";
import {
  FAVORITE_STICKER_SPACE_SCENE,
  MEADOW_DRAG_THRESHOLD_PX,
  isManualMeadowPosition,
  layoutMeadowAutoPositions,
  layoutMeadowFriends,
  meadowAutoStickerSize,
  nextFavoriteStickerZ,
  pxToNormalizedCenter,
  pushOutOfObstacles,
  type MeadowBox
} from "../utils/favoriteStickers";

export interface MeadowFriendArt {
  id: string;
  src: string;
}

interface MeadowStickerLayerProps {
  friends: MeadowFriendArt[];
  positions: Record<string, FavoriteStickerPosition>;
  onCommitPosition: (id: string, position: FavoriteStickerPosition) => void;
  layoutKind?: MeadowLayoutKind;
  cardRef?: { readonly current: HTMLElement | null };
  continueRef?: { readonly current: HTMLElement | null };
  chromeRefs?: Array<{ readonly current: HTMLElement | null }>;
}

interface DragSession {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  origLeft: number;
  origTop: number;
  size: number;
  moved: boolean;
  target: HTMLElement;
}

function localBox(el: HTMLElement | null, layer: DOMRect): MeadowBox | null {
  if (!el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - layer.left,
    y: rect.top - layer.top,
    w: rect.width,
    h: rect.height
  };
}

export function MeadowStickerLayer({
  friends,
  positions,
  onCommitPosition,
  layoutKind = "desktop",
  cardRef,
  continueRef,
  chromeRefs = []
}: MeadowStickerLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ id: string; left: number; top: number } | null>(null);
  const [live, setLive] = useState<{ id: string; left: number; top: number } | null>(null);
  const [area, setArea] = useState(() => ({
    w: typeof window === "undefined" ? 0 : window.innerWidth,
    h: typeof window === "undefined" ? 0 : window.innerHeight
  }));
  const skipClickRef = useRef(false);
  const slots = useMemo(
    () => layoutMeadowFriends(friends.map((friend) => friend.id), layoutKind),
    [friends, layoutKind]
  );
  const slotById = useMemo(() => new Map(slots.map((slot) => [slot.id, slot])), [slots]);
  const unsavedIds = useMemo(
    () => friends.filter((friend) => !isManualMeadowPosition(positions[friend.id])).map((friend) => friend.id),
    [friends, positions]
  );
  const occupiedCenters = useMemo(
    () =>
      friends.flatMap((friend) => {
        const saved = positions[friend.id];
        if (!isManualMeadowPosition(saved)) {
          return [];
        }
        return [
          {
            x: saved.x,
            y: saved.y,
            size: meadowAutoStickerSize(layoutKind, area.w, area.h)
          }
        ];
      }),
    [friends, positions, layoutKind, area]
  );
  const autoPlacements = useMemo(
    () => layoutMeadowAutoPositions(unsavedIds, layoutKind, area.w, area.h, occupiedCenters),
    [unsavedIds, layoutKind, area, occupiedCenters]
  );
  const autoById = useMemo(
    () => new Map(autoPlacements.map((item) => [item.id, item])),
    [autoPlacements]
  );

  useEffect(() => {
    const el = layerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }
    const sync = () => {
      const rect = el.getBoundingClientRect();
      setArea((prev) =>
        Math.abs(prev.w - rect.width) < 0.5 && Math.abs(prev.h - rect.height) < 0.5
          ? prev
          : { w: rect.width, h: rect.height }
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [friends.length]);

  const flushLive = useCallback(() => {
    frameRef.current = null;
    const pending = pendingRef.current;
    if (pending) {
      setLive(pending);
    }
  }, []);

  const applyLive = useCallback(
    (next: { id: string; left: number; top: number }) => {
      pendingRef.current = next;
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(flushLive);
      }
    },
    [flushLive]
  );

  const obstacles = useCallback((): MeadowBox[] => {
    const layer = layerRef.current?.getBoundingClientRect();
    if (!layer) {
      return [];
    }
    return [
      localBox(cardRef?.current ?? null, layer),
      localBox(continueRef?.current ?? null, layer),
      ...chromeRefs.map((ref) => localBox(ref.current, layer))
    ].filter((box): box is MeadowBox => box !== null);
  }, [cardRef, continueRef, chromeRefs]);

  const clampPoint = useCallback(
    (left: number, top: number, size: number) => {
      const layer = layerRef.current?.getBoundingClientRect();
      if (!layer) {
        return { left, top };
      }
      return pushOutOfObstacles(left, top, size, layer.width, layer.height, obstacles());
    },
    [obstacles]
  );

  const finishDrag = useCallback(
    (event: { pointerId: number; clientX: number; clientY: number }, save: boolean) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      try {
        drag.target.releasePointerCapture(drag.pointerId);
      } catch {
        // Capture may already be gone after pointercancel.
      }
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      const layer = layerRef.current?.getBoundingClientRect();
      const last = pendingRef.current;
      pendingRef.current = null;
      dragRef.current = null;
      setLive(null);
      if (drag.moved) {
        skipClickRef.current = true;
      }
      if (!save || !drag.moved || !layer) {
        return;
      }
      const rawLeft = last
        ? last.left
        : drag.origLeft + (event.clientX - drag.startX);
      const rawTop = last ? last.top : drag.origTop + (event.clientY - drag.startY);
      const clamped = clampPoint(rawLeft, rawTop, drag.size);
      const center = pxToNormalizedCenter(
        clamped.left,
        clamped.top,
        drag.size,
        layer.width,
        layer.height
      );
      onCommitPosition(drag.id, {
        x: center.x,
        y: center.y,
        z: nextFavoriteStickerZ(positions),
        space: FAVORITE_STICKER_SPACE_SCENE,
        source: "manual"
      });
    },
    [clampPoint, onCommitPosition, positions]
  );

  const moveDrag = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < MEADOW_DRAG_THRESHOLD_PX) {
          return;
        }
        drag.moved = true;
      }
      event.preventDefault();
      applyLive({
        id: drag.id,
        ...clampPoint(drag.origLeft + dx, drag.origTop + dy, drag.size)
      });
    },
    [applyLive, clampPoint]
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => moveDrag(event);
    const onUp = (event: PointerEvent) => finishDrag(event, true);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [finishDrag, moveDrag]);

  function onPointerDown(id: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }
    event.preventDefault();
    const layer = layerRef.current?.getBoundingClientRect();
    const target = event.currentTarget.getBoundingClientRect();
    if (!layer) {
      return;
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window listeners still keep the drag alive.
    }
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: target.left - layer.left,
      origTop: target.top - layer.top,
      size: target.width,
      moved: false,
      target: event.currentTarget
    };
  }

  if (!friends.length) {
    return null;
  }

  return (
    <div ref={layerRef} className="meadow-sticker-layer" data-meadow-layer data-sticker-playground>
      {friends.map((friend) => {
        const slot = slotById.get(friend.id);
        const saved = isManualMeadowPosition(positions[friend.id])
          ? positions[friend.id]
          : undefined;
        const auto = autoById.get(friend.id);
        const isLive = live?.id === friend.id;
        const placed = Boolean(saved) || Boolean(auto) || isLive;
        const source = saved ? "manual" : "auto";
        const style = {
          ...(auto ? { ["--friend-size"]: `${auto.size}px` } : {}),
          ["--friend-delay"]: `${auto?.delay ?? slot?.delay ?? 0}s`,
          ["--friend-tilt"]: `${auto?.tilt ?? slot?.tilt ?? 0}deg`,
          zIndex: isLive ? 80 : saved?.z ?? 1,
          ...(isLive && live
            ? { left: `${live.left}px`, top: `${live.top}px` }
            : saved
              ? { left: `${saved.x * 100}%`, top: `${saved.y * 100}%` }
              : auto
                ? { left: `${auto.x * 100}%`, top: `${auto.y * 100}%` }
                : slot
                  ? {
                      ["--friend-inset"]: `${slot.inset}%`,
                      ["--friend-bottom"]: `${slot.bottom}vh`
                    }
                  : {})
        } as unknown as CSSProperties;
        return (
          <button
            key={friend.id}
            type="button"
            className={`meadow-friend meadow-friend-drag${
              slot ? ` meadow-friend-${slot.side}` : ""
            }${placed ? " is-placed" : ""}${isLive ? " is-dragging" : ""}`}
            data-meadow-friend={friend.id}
            data-meadow-source={source}
            aria-label="Любимая наклейка, можно подвинуть"
            style={{ ...style, touchAction: "none" }}
            onPointerDown={(event) => onPointerDown(friend.id, event)}
            onClick={(event) => {
              if (skipClickRef.current) {
                event.preventDefault();
                event.stopPropagation();
                skipClickRef.current = false;
              }
            }}
          >
            <img src={friend.src} alt="" draggable={false} />
          </button>
        );
      })}
    </div>
  );
}
