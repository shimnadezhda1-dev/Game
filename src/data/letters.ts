import { LetterItem } from "../types";
import { ASSETS } from "../utils/assets";
import { letterIntroSpeech } from "../utils/letterCopy";

function letterEntry(letter: Omit<LetterItem, "voiceText">): LetterItem {
  return {
    ...letter,
    voiceText: letterIntroSpeech(letter)
  };
}

export const LETTERS: LetterItem[] = [
  letterEntry({
    id: "A",
    upper: "А",
    lower: "а",
    word: "Арбуз",
    imagePath: ASSETS.letters.A,
    letterImage: ASSETS.letterGlyphs.A,
    objectImage: ASSETS.objects.watermelon,
    findObjectImage: ASSETS.find.watermelon,
    pictureImage: ASSETS.picture.watermelon,
    choiceImage: ASSETS.find.choiceA,
    difficulty: 1,
    group: 0
  }),
  letterEntry({
    id: "B",
    upper: "Б",
    lower: "б",
    word: "Барабан",
    imagePath: ASSETS.letters.B,
    letterImage: ASSETS.letterGlyphs.B,
    objectImage: ASSETS.objects.drum,
    findObjectImage: ASSETS.objects.drum,
    pictureImage: ASSETS.objects.drum,
    choiceImage: ASSETS.find.choiceB,
    difficulty: 1,
    group: 0
  }),
  letterEntry({
    id: "V",
    upper: "В",
    lower: "в",
    word: "Волк",
    imagePath: ASSETS.letters.V,
    letterImage: ASSETS.letterGlyphs.V,
    objectImage: ASSETS.objects.wolf,
    findObjectImage: ASSETS.objects.wolf,
    pictureImage: ASSETS.objects.wolf,
    choiceImage: ASSETS.find.choiceV,
    difficulty: 1,
    group: 0
  }),
  letterEntry({
    id: "G",
    upper: "Г",
    lower: "г",
    word: "Гриб",
    imagePath: ASSETS.letters.G,
    letterImage: ASSETS.letterGlyphs.G,
    objectImage: ASSETS.objects.mushroom,
    findObjectImage: ASSETS.objects.mushroom,
    pictureImage: ASSETS.picture.mushroom,
    choiceImage: ASSETS.find.choiceG,
    difficulty: 2,
    group: 1
  }),
  letterEntry({
    id: "D",
    upper: "Д",
    lower: "д",
    word: "Дом",
    imagePath: ASSETS.letters.D,
    letterImage: ASSETS.letterGlyphs.D,
    objectImage: ASSETS.objects.house,
    findObjectImage: ASSETS.objects.house,
    pictureImage: ASSETS.picture.house,
    choiceImage: ASSETS.find.choiceD,
    difficulty: 2,
    group: 1
  })
];

export const LETTER_GROUPS = [
  ["A", "B", "V"],
  ["G", "D"]
];
