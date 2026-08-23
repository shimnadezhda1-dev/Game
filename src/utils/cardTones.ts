export const CARD_TONES = ["card-sun", "card-sky", "card-mint", "card-coral"];

export const LETTER_TONES: Record<string, string> = {
  A: "tone-pink",
  B: "tone-orange",
  V: "tone-teal",
  G: "tone-cyan",
  D: "tone-purple"
};

export function letterTone(id: string): string {
  if (LETTER_TONES[id]) {
    return LETTER_TONES[id];
  }
  const tones = ["tone-pink", "tone-orange", "tone-teal", "tone-cyan", "tone-purple"];
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[index % tones.length];
}
