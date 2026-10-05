// Development-only manifest for «Весёлый алфавит».
// UTF-8. Do not put secrets here.

export const commonEntries = [
  ["common/hello.mp3", "Привет! Давай учить буквы вместе.", "common", "hello"],
  ["common/try-again.mp3", "Попробуй ещё раз.", "common", "try-again"],
  ["common/almost.mp3", "Почти получилось. Посмотри внимательно.", "common", "almost"],
  ["common/hint.mp3", "Давай, немного помогу.", "common", "hint"],
  ["common/replay.mp3", "Послушай ещё раз.", "common", "replay"],
  ["common/correct.mp3", "Молодец! Всё правильно!", "common", "correct"],
  ["common/next.mp3", "Отлично! Давай дальше!", "common", "next"],
  ["common/reward-new-sticker.mp3", "Ура! Новая наклейка!", "common", "reward-new-sticker"],
  ["common/reward-continue.mp3", "Продолжить", "common", "reward-continue"],
  ["common/listen-instruction.mp3", "Послушай и выбери картинку.", "common", "listen-instruction"],
];

const ordinaryLetters = [
  { folder: "a", letter: "А", words: ["арбуз", "автобус", "апельсин"] },
  { folder: "b", letter: "Б", words: ["барабан", "банан", "бабочка"] },
  { folder: "v", letter: "В", words: ["волк", "ведро", "велосипед"] },
  { folder: "g", letter: "Г", words: ["гриб", "гусь", "груша"] },
  { folder: "d", letter: "Д", words: ["дом", "дерево", "дельфин"] },
  { folder: "e", letter: "Е", words: ["енот", "единорог", "ежевика"] },
  { folder: "yo", letter: "Ё", words: ["ёж", "ёлка", "ёршик"] },
  { folder: "zh", letter: "Ж", words: ["жук", "жираф", "желудь"] },
  { folder: "z", letter: "З", words: ["заяц", "зонт", "зебра"] },
  { folder: "i", letter: "И", words: ["индюк", "игла", "игрушки"] },
  { folder: "y-short", letter: "Й", words: ["йогурт", "йог", "йод"] },
  { folder: "k", letter: "К", words: ["кот", "корабль", "кукла"] },
  { folder: "l", letter: "Л", words: ["лев", "лимон", "ложка"] },
  { folder: "m", letter: "М", words: ["мяч", "машина", "морковь"] },
  { folder: "n", letter: "Н", words: ["носорог", "ножницы", "носок"] },
  { folder: "o", letter: "О", words: ["осёл", "облако", "огурец"] },
  { folder: "p", letter: "П", words: ["пингвин", "петух", "попугай"] },
  { folder: "r", letter: "Р", words: ["рыба", "ракета", "робот"] },
  { folder: "s", letter: "С", words: ["слон", "собака", "самолёт"] },
  { folder: "t", letter: "Т", words: ["тигр", "трактор", "торт"] },
  { folder: "u", letter: "У", words: ["утка", "улитка", "утюг"] },
  { folder: "f", letter: "Ф", words: ["фотоаппарат", "фонарь", "фламинго"] },
  { folder: "h", letter: "Х", words: ["хомяк", "хлеб", "холодильник"] },
  { folder: "ts", letter: "Ц", words: ["цыплёнок", "цапля", "цветок"] },
  { folder: "ch", letter: "Ч", words: ["чайник", "часы", "черепаха"] },
  { folder: "sh", letter: "Ш", words: ["шар", "шапка", "шкаф"] },
  { folder: "shch", letter: "Щ", words: ["щука", "щётка", "щит"] },
  { folder: "eh", letter: "Э", words: ["экскаватор", "эскимо", "экран"] },
  { folder: "yu", letter: "Ю", words: ["юла", "юбка", "юнга"] },
  { folder: "ya", letter: "Я", words: ["яблоко", "якорь", "ящерица"] },
];

const LETTER_SPOKEN = {
  А: "А",
  Б: "Бэ",
  В: "Вэ",
  Г: "Гэ",
  Д: "Дэ",
  Е: "Е",
  Ё: "Ё",
  Ж: "Жэ",
  З: "Зэ",
  И: "И",
  Й: "И краткое",
  К: "Ка",
  Л: "Эль",
  М: "Эм",
  Н: "Эн",
  О: "О",
  П: "Пэ",
  Р: "Эр",
  С: "Эс",
  Т: "Тэ",
  У: "У",
  Ф: "Эф",
  Х: "Ха",
  Ц: "Цэ",
  Ч: "Че",
  Ш: "Ша",
  Щ: "Ща",
  Э: "Э",
  Ю: "Ю",
  Я: "Я"
};

function ordinaryEntries({ folder, letter, words }) {
  const spoken = LETTER_SPOKEN[letter] ?? letter;
  const success = letter === "Я"
    ? "Молодец! Это буква Я! Отличная работа!"
    : `Молодец! Это буква ${letter}! Давай найдём следующую!`;

  return [
    [`${folder}/learn.mp3`, `Это буква ${letter}. ${letter} — ${words[0]}.`, letter, "learn"],
    [`${folder}/find.mp3`, `Найди букву ${letter}.`, letter, "find"],
    [`${folder}/picture.mp3`, `Что начинается на букву ${letter}?`, letter, "picture"],
    [`${folder}/listen-letter.mp3`, `${spoken}.`, letter, "listen-letter"],
    [`${folder}/listen-1.mp3`, `${spoken} — ${words[0]}.`, letter, "listen", words[0]],
    [`${folder}/listen-2.mp3`, `${spoken} — ${words[1]}.`, letter, "listen", words[1]],
    [`${folder}/listen-3.mp3`, `${spoken} — ${words[2]}.`, letter, "listen", words[2]],
    [`${folder}/success.mp3`, success, letter, "success"],
  ];
}

export const specialEntries = [
  ["hard-sign/learn.mp3", "Это твёрдый знак — Ъ. Сам он звука не обозначает.", "Ъ", "learn"],
  ["hard-sign/find.mp3", "Найди твёрдый знак.", "Ъ", "find"],
  ["hard-sign/example-1.mp3", "Подъезд. Здесь спрятался твёрдый знак.", "Ъ", "example", "подъезд"],
  ["hard-sign/example-2.mp3", "Подъёмник. Здесь спрятался твёрдый знак.", "Ъ", "example", "подъёмник"],
  ["hard-sign/example-3.mp3", "Объятие. Здесь спрятался твёрдый знак.", "Ъ", "example", "объятие"],
  ["hard-sign/success.mp3", "Молодец! Это твёрдый знак!", "Ъ", "success"],

  ["y/learn.mp3", "Это буква Ы.", "Ы", "learn"],
  ["y/find.mp3", "Найди букву Ы.", "Ы", "find"],
  ["y/example-1.mp3", "Сыр. Найди букву Ы.", "Ы", "example", "сыр"],
  ["y/example-2.mp3", "Рыба. Найди букву Ы.", "Ы", "example", "рыба"],
  ["y/example-3.mp3", "Тыква. Найди букву Ы.", "Ы", "example", "тыква"],
  ["y/success.mp3", "Молодец! Это буква Ы!", "Ы", "success"],

  ["soft-sign/learn.mp3", "Это мягкий знак — Ь. Сам он звука не обозначает.", "Ь", "learn"],
  ["soft-sign/find.mp3", "Найди мягкий знак.", "Ь", "find"],
  ["soft-sign/example-1.mp3", "Конь. Здесь спрятался мягкий знак.", "Ь", "example", "конь"],
  ["soft-sign/example-2.mp3", "Гусь. Здесь спрятался мягкий знак.", "Ь", "example", "гусь"],
  ["soft-sign/example-3.mp3", "Лось. Здесь спрятался мягкий знак.", "Ь", "example", "лось"],
  ["soft-sign/success.mp3", "Молодец! Это мягкий знак!", "Ь", "success"],
];

export const audioEntries = [
  ...commonEntries,
  ...ordinaryLetters.flatMap(ordinaryEntries),
  ...specialEntries,
].map(([path, text, letter, activity, word = null]) => ({
  path,
  text,
  letter,
  activity,
  word,
}));

if (audioEntries.length !== 268) {
  throw new Error(`Manifest count mismatch: expected 268, got ${audioEntries.length}`);
}
