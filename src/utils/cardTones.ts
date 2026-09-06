import { LETTER_CONTENT } from "../data/letters";
import { getCardTone } from "../data/letterRegistry";

export const CARD_TONES = ["card-sun", "card-sky", "card-mint", "card-coral"];

export const LETTER_TONES: Record<string, string> = Object.fromEntries(
  LETTER_CONTENT.flatMap((letter) =>
    letter.theme?.cardTone ? [[letter.id, letter.theme.cardTone]] : []
  )
);

export function letterTone(id: string): string {
  return getCardTone(id);
}
