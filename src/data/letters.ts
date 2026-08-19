import { LetterItem } from "../types";
import { ASSETS } from "../utils/assets";

export const LETTERS: LetterItem[] = [
  {
    id: "A",
    upper: "А",
    lower: "а",
    word: "Арбуз",
    imagePath: ASSETS.letters.A,
    voiceText: "А — арбуз",
    difficulty: 1
  },
  {
    id: "B",
    upper: "Б",
    lower: "б",
    word: "Барабан",
    imagePath: ASSETS.letters.B,
    voiceText: "Б — барабан",
    difficulty: 1
  },
  {
    id: "V",
    upper: "В",
    lower: "в",
    word: "Волк",
    imagePath: ASSETS.letters.V,
    voiceText: "В — волк",
    difficulty: 1
  },
  {
    id: "G",
    upper: "Г",
    lower: "г",
    word: "Гриб",
    imagePath: ASSETS.letters.G,
    voiceText: "Г — гриб",
    difficulty: 2
  },
  {
    id: "D",
    upper: "Д",
    lower: "д",
    word: "Дом",
    imagePath: ASSETS.letters.D,
    voiceText: "Д — дом",
    difficulty: 2
  }
];
