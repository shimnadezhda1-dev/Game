/** Matches `@media (max-width: 820px)`. */
export const MOBILE_MAX_WIDTH = 820;

/**
 * Short landscape height for phones (not a typical desktop monitor).
 * Matches `@media (orientation: landscape) and (max-height: 500px)`.
 */
export const MOBILE_LANDSCAPE_MAX_HEIGHT = 500;

export function isMobileLandscape(width: number, height: number): boolean {
  return width > height && height <= MOBILE_LANDSCAPE_MAX_HEIGHT;
}

export function isMobileViewport(width: number, height: number): boolean {
  return width <= MOBILE_MAX_WIDTH || isMobileLandscape(width, height);
}

export function subscribeViewportChange(onChange: () => void): () => void {
  const portrait = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
  const landscape = window.matchMedia(
    `(orientation: landscape) and (max-height: ${MOBILE_LANDSCAPE_MAX_HEIGHT}px)`
  );
  portrait.addEventListener("change", onChange);
  landscape.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    portrait.removeEventListener("change", onChange);
    landscape.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}
