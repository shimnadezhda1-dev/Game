export const CARD_TONES = ["card-sun", "card-sky", "card-mint", "card-coral"];

export const LETTER_TONES: Record<string, string> = {
  A: "tone-pink",
  B: "tone-orange",
  V: "tone-teal",
  G: "tone-cyan",
  D: "tone-purple"
};

export function letterTone(id: string): string {
  return LETTER_TONES[id] ?? "tone-pink";
}
