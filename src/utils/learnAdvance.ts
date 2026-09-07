export const LEARN_ADVANCE_MIN = 1;
export const LEARN_ADVANCE_MAX = 10;
export const LEARN_ADVANCE_DEFAULT = 5;

export function clampLearnAdvanceSeconds(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return LEARN_ADVANCE_DEFAULT;
  }
  return Math.min(
    LEARN_ADVANCE_MAX,
    Math.max(LEARN_ADVANCE_MIN, Math.round(numeric))
  );
}
