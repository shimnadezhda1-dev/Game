import { LetterItem } from "../types";
import { ASSETS } from "../utils/assets";
import { letterIntroSpeech } from "../utils/letterCopy";

function letterEntry(letter: Omit<LetterItem, "voiceText">): LetterItem {
  return {
    ...letter,
    voiceText: letterIntroSpeech(letter)
  };
}

function laterLetter(
  letter: Omit<LetterItem, "voiceText" | "imagePath" | "difficulty" | "group"> & {
    difficulty?: number;
    group?: number;
  }
): LetterItem {
  return letterEntry({
    imagePath: "",
    difficulty: letter.difficulty ?? 2,
    group: letter.group ?? 2,
    ...letter
  });
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
  }),
  laterLetter({ id: "E", upper: "Е", lower: "е", word: "Енот" }),
  laterLetter({ id: "Yo", upper: "Ё", lower: "ё", word: "", needsContent: true }),
  laterLetter({ id: "Zh", upper: "Ж", lower: "ж", word: "Жираф" }),
  laterLetter({ id: "Z", upper: "З", lower: "з", word: "Заяц" }),
  laterLetter({ id: "I", upper: "И", lower: "и", word: "Игла" }),
  laterLetter({ id: "J", upper: "Й", lower: "й", word: "", needsContent: true }),
  laterLetter({ id: "K", upper: "К", lower: "к", word: "Кот" }),
  laterLetter({ id: "L", upper: "Л", lower: "л", word: "Лимон" }),
  laterLetter({ id: "M", upper: "М", lower: "м", word: "Мяч" }),
  laterLetter({ id: "N", upper: "Н", lower: "н", word: "Нос" }),
  laterLetter({ id: "O", upper: "О", lower: "о", word: "Облако" }),
  laterLetter({ id: "P", upper: "П", lower: "п", word: "Петух" }),
  laterLetter({ id: "R", upper: "Р", lower: "р", word: "Рыба" }),
  laterLetter({ id: "S", upper: "С", lower: "с", word: "Слон" }),
  laterLetter({ id: "T", upper: "Т", lower: "т", word: "Тигр" }),
  laterLetter({ id: "U", upper: "У", lower: "у", word: "Утка" }),
  laterLetter({ id: "F", upper: "Ф", lower: "ф", word: "Флаг" }),
  laterLetter({ id: "Kh", upper: "Х", lower: "х", word: "Хлеб" }),
  laterLetter({ id: "Ts", upper: "Ц", lower: "ц", word: "Цветок" }),
  laterLetter({ id: "Ch", upper: "Ч", lower: "ч", word: "Чайник" }),
  laterLetter({ id: "Sh", upper: "Ш", lower: "ш", word: "Шар" }),
  laterLetter({ id: "Shch", upper: "Щ", lower: "щ", word: "Щука" }),
  laterLetter({ id: "Hard", upper: "Ъ", lower: "ъ", word: "", needsContent: true }),
  laterLetter({ id: "Yery", upper: "Ы", lower: "ы", word: "", needsContent: true }),
  laterLetter({ id: "Soft", upper: "Ь", lower: "ь", word: "", needsContent: true }),
  laterLetter({ id: "Eh", upper: "Э", lower: "э", word: "Экскаватор" }),
  laterLetter({ id: "Yu", upper: "Ю", lower: "ю", word: "Юла" }),
  laterLetter({ id: "Ya", upper: "Я", lower: "я", word: "Яблоко" })
];

export const LETTER_GROUPS = [
  ["A", "B", "V"],
  ["G", "D"],
  LETTERS.filter((letter) => letter.group >= 2).map((letter) => letter.id)
];

export const SPECIAL_CONTENT_LETTER_IDS = ["Yo", "J", "Hard", "Yery", "Soft"] as const;

export function nextAlphabetLetter(
  letters: LetterItem[],
  currentId: string
): LetterItem | null {
  const index = letters.findIndex((item) => item.id === currentId);
  if (index < 0 || index >= letters.length - 1) {
    return null;
  }
  return letters[index + 1];
}
