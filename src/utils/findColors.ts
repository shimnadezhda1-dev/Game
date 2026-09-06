import { getFindNativeHue } from "../data/letterRegistry";
import { shuffle } from "./selectors";

export const FIND_COLOR_IDS = ["pink", "orange", "teal", "cyan", "purple", "green"] as const;
export type FindColorId = (typeof FIND_COLOR_IDS)[number];

export const FIND_COLORS: Record<FindColorId, { hue: number; css: string }> = {
  pink: { hue: 340, css: "#ff5d7a" },
  orange: { hue: 32, css: "#ff9f1c" },
  teal: { hue: 172, css: "#2ec4b6" },
  cyan: { hue: 198, css: "#4fc3ff" },
  purple: { hue: 263, css: "#7c4dff" },
  green: { hue: 142, css: "#22c55e" }
};

export function hueRotateFor(letterId: string, color: FindColorId): number {
  return FIND_COLORS[color].hue - (getFindNativeHue(letterId) ?? FIND_COLORS[color].hue);
}

export interface FindColorPlan {
  buttonColors: Record<string, FindColorId>;
  buttonHueRotates: Record<string, number>;
  targetDisplayColor: FindColorId;
  targetDisplayCss: string;
  correctAnswerButtonColor: FindColorId;
  hueRotate: number;
}

export function planFindColors(targetId: string, optionIds: string[]): FindColorPlan {
  const palette = shuffle([...FIND_COLOR_IDS]);
  const buttonColors: Record<string, FindColorId> = {};

  optionIds.forEach((id, index) => {
    buttonColors[id] = palette[index % palette.length];
  });

  const correctAnswerButtonColor = buttonColors[targetId];
  const usedButtonColors = new Set(optionIds.map((id) => buttonColors[id]));
  const targetDisplayColor =
    palette.find((color) => !usedButtonColors.has(color)) ??
    palette.find((color) => color !== correctAnswerButtonColor) ??
    FIND_COLOR_IDS.find((color) => color !== correctAnswerButtonColor) ??
    "green";

  const buttonHueRotates: Record<string, number> = {};
  optionIds.forEach((id) => {
    buttonHueRotates[id] = hueRotateFor(id, buttonColors[id]);
  });

  return {
    buttonColors,
    buttonHueRotates,
    targetDisplayColor,
    targetDisplayCss: FIND_COLORS[targetDisplayColor].css,
    correctAnswerButtonColor,
    hueRotate: hueRotateFor(targetId, targetDisplayColor)
  };
}

export function isTargetColorDistinct(plan: FindColorPlan): boolean {
  return plan.targetDisplayColor !== plan.correctAnswerButtonColor;
}
