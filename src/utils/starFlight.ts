export const STAR_COUNTER_SELECTOR = "[data-star-counter]";

export function isElementVisiblyLaidOut(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

export function getVisibleStarCounterElement(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(STAR_COUNTER_SELECTOR);
  for (const el of nodes) {
    if (isElementVisiblyLaidOut(el)) {
      return el;
    }
  }
  return null;
}

/** Viewport center of the visible star icon, or of the counter chip. */
export function getStarFlightTarget(): { x: number; y: number } | null {
  const counter = getVisibleStarCounterElement();
  if (!counter) {
    return null;
  }
  const icon = counter.querySelector(".gold-star-tiny, .gold-star-icon, .gold-star-svg");
  const el = isElementVisiblyLaidOut(icon) ? icon : counter;
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
