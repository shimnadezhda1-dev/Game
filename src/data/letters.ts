import { LetterItem } from "../types";
import { ASSETS } from "../utils/assets";

export const LETTERS: LetterItem[] = [
  {
    id: "A",
    upper: "А",
    lower: "а",
    word: "Арбуз",
    imagePath: ASSETS.letters.A,
    voiceText: "Это буква А. А-а-а. А — арбуз!",
    difficulty: 1,
    group: 0
  },
  {
    id: "B",
    upper: "Б",
    lower: "б",
    word: "Барабан",
    imagePath: ASSETS.letters.B,
    voiceText: "Это буква Б. Б-бэ. Б — барабан!",
    difficulty: 1,
    group: 0
  },
  {
    id: "V",
    upper: "В",
    lower: "в",
    word: "Волк",
    imagePath: ASSETS.letters.V,
    voiceText: "Это буква В. В-вэ. В — волк!",
    difficulty: 1,
    group: 0
  },
  {
    id: "G",
    upper: "Г",
    lower: "г",
    word: "Гриб",
    imagePath: ASSETS.letters.G,
    voiceText: "Это буква Г. Г-гэ. Г — гриб!",
    difficulty: 2,
    group: 1
  },
  {
    id: "D",
    upper: "Д",
    lower: "д",
    word: "Дом",
    imagePath: ASSETS.letters.D,
    voiceText: "Это буква Д. Д-дэ. Д — дом!",
    difficulty: 2,
    group: 1
  }
];

export const LETTER_GROUPS = [
  ["A", "B", "V"],
  ["G", "D"]
];
