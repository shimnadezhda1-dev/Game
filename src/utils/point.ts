export type Point = { x: number; y: number };

export function pointFromEvent(event: { currentTarget: EventTarget }): Point {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
