import { letterVoiceAssetPath, PICTURE_SKIP_LETTER_IDS } from "../audio/letterFolders";
import {
  EligibleActivity,
  LetterAudio,
  LetterContent,
  LetterItem,
  LetterVoiceKind,
  PictureExample,
  SpecialExample
} from "../types";
import { letterIntroSpeech } from "../utils/letterCopy";

const ALL_ACTIVITIES = ["learn", "find", "picture", "listen"] as const;

const DEFAULT_PRONUNCIATION: Record<string, string> = {
  A: "а",
  B: "бэ",
  V: "вэ",
  G: "гэ",
  D: "дэ",
  E: "е",
  Yo: "ё",
  Zh: "жэ",
  Z: "зэ",
  I: "и",
  J: "й",
  K: "ка",
  L: "эль",
  M: "эм",
  N: "эн",
  O: "о",
  P: "пэ",
  R: "эр",
  S: "эс",
  T: "тэ",
  U: "у",
  F: "эф",
  Kh: "ха",
  Ts: "цэ",
  Ch: "че",
  Sh: "ша",
  Shch: "ща",
  Hard: "твёрдый знак",
  Yery: "ы",
  Soft: "мягкий знак",
  Eh: "э",
  Yu: "ю",
  Ya: "я"
};

function audioClip(kind: LetterVoiceKind, letterId: string) {
  const key = `${kind}-${letterId.toLowerCase()}`;
  return {
    key,
    path: `/audio/voice/${key}.mp3`
  };
}

function pictureExample(id: string, word: string, image: string): PictureExample {
  return {
    id,
    word,
    image,
    pictureEligible: true,
    allowedAsTarget: true,
    allowedAsDistractor: true
  };
}

function specialExample(
  id: string,
  word: string,
  image: string,
  targetLetter: string,
  targetIndex: number
): SpecialExample {
  return { id, word, image, targetLetter, targetIndex };
}

function letterEntry(letter: LetterContent): LetterItem {
  const images = letter.images;
  const primaryPicture = letter.pictureExamples?.find(
    (example) => example.pictureEligible && example.allowedAsTarget
  );
  return {
    ...letter,
    imagePath: images?.card ?? "",
    letterImage: images?.glyph,
    objectImage: images?.object,
    findObjectImage: images?.findObject,
    pictureImage: images?.picture ?? primaryPicture?.image,
    choiceImage: images?.choice,
    voiceText: letterIntroSpeech(letter)
  };
}

function ruAudio(kind: LetterVoiceKind, letterId: string) {
  const path = letterVoiceAssetPath(kind, letterId);
  return path
    ? {
        key: `${kind}-${letterId.toLowerCase()}`,
        path
      }
    : undefined;
}

function finalizeLetterContent(letter: LetterContent): LetterContent {
  const primaryPicture = letter.pictureExamples?.find(
    (example) => example.pictureEligible && example.allowedAsTarget
  );
  const primaryImage =
    letter.images?.object ??
    letter.images?.picture ??
    primaryPicture?.image ??
    letter.specialExamples?.[0]?.image;
  const skipPicture = PICTURE_SKIP_LETTER_IDS.has(letter.id) || !primaryPicture;
  const eligibleActivities: EligibleActivity[] = skipPicture
    ? ["learn", "find", "listen"]
    : [...ALL_ACTIVITIES];
  const audio: LetterAudio = {
    letter: letter.audio?.letter ?? ruAudio("letter", letter.id),
    find: letter.audio?.find ?? ruAudio("find", letter.id),
    correct: letter.audio?.correct ?? ruAudio("correct", letter.id),
    listen: letter.audio?.listen ?? ruAudio("listen", letter.id),
    reward: letter.audio?.reward ?? ruAudio("reward", letter.id)
  };
  if (!skipPicture) {
    audio.picture = letter.audio?.picture ?? ruAudio("picture", letter.id);
  }

  return {
    ...letter,
    contentReady: true,
    eligibleActivities,
    images: {
      ...letter.images,
      object: letter.images?.object ?? primaryImage,
      findObject: letter.images?.findObject ?? letter.images?.object ?? primaryImage,
      picture: letter.images?.picture ?? primaryPicture?.image ?? primaryImage,
      card: letter.images?.card ?? primaryImage
    },
    audio,
    pronunciation: letter.pronunciation ?? DEFAULT_PRONUNCIATION[letter.id] ?? letter.lower
  };
}

const RAW_LETTER_CONTENT: LetterContent[] = [
  {
    id: "A",
    upper: "А",
    lower: "а",
    word: "Арбуз",
    difficulty: 1,
    group: 0,
    contentReady: true,
    eligibleActivities: [...ALL_ACTIVITIES],
    pictureExamples: [
      pictureExample("A-watermelon", "Арбуз", "/assets/picture/watermelon.webp"),
      pictureExample("A-bus", "Автобус", "/assets/picture/bus.webp"),
      pictureExample("A-orange", "Апельсин", "/assets/picture/orange.webp")
    ],
    images: {
      card: "/assets/letters/a-watermelon.webp",
      glyph: "/assets/letters/A.webp",
      object: "/assets/objects/watermelon.webp",
      findObject: "/assets/find/watermelon.webp",
      picture: "/assets/picture/watermelon.webp",
      choice: "/assets/find/choice-a.webp"
    },
    audio: {
      letter: audioClip("letter", "A"),
      find: audioClip("find", "A"),
      picture: audioClip("picture", "A"),
      correct: audioClip("correct", "A"),
      listen: audioClip("listen", "A"),
      reward: audioClip("reward", "A")
    },
    theme: {
      toy: {
        palette: { light: "#ffb3c2", mid: "#ff5d7a", dark: "#e0244e", shade: "#9a1233" },
        path: "M100 18 L178 188 Q182 198 170 198 L138 198 L126 166 H74 L62 198 H30 Q18 198 22 188 Z M86 132 H114 L100 92 Z",
        fillRule: "evenodd"
      },
      cardTone: "tone-pink",
      findNativeHue: 352,
      listenTone: "pink"
    },
    pronunciation: "а"
  },
  {
    id: "B",
    upper: "Б",
    lower: "б",
    word: "Барабан",
    difficulty: 1,
    group: 0,
    contentReady: true,
    eligibleActivities: [...ALL_ACTIVITIES],
    pictureExamples: [
      pictureExample("B-drum", "Барабан", "/assets/letters/b-drum.webp"),
      pictureExample("B-banana", "Банан", "/assets/picture/banana.webp"),
      pictureExample("B-butterfly", "Бабочка", "/assets/picture/butterfly.webp")
    ],
    images: {
      card: "/assets/letters/b-drum.webp",
      glyph: "/assets/letters/B.webp",
      object: "/assets/letters/b-drum.webp",
      findObject: "/assets/letters/b-drum.webp",
      picture: "/assets/letters/b-drum.webp",
      choice: "/assets/find/choice-b.webp"
    },
    audio: {
      letter: audioClip("letter", "B"),
      find: audioClip("find", "B"),
      picture: audioClip("picture", "B"),
      correct: audioClip("correct", "B"),
      listen: audioClip("listen", "B"),
      reward: audioClip("reward", "B")
    },
    theme: {
      toy: {
        palette: { light: "#ffd18a", mid: "#ff9f1c", dark: "#e07a00", shade: "#a35400" },
        path: "M38 22 H166 Q176 22 176 40 V58 H86 V90 H128 Q174 92 174 148 Q174 200 116 200 H38 Z M86 124 V168 H118 Q146 168 146 146 Q146 124 118 124 Z",
        fillRule: "evenodd"
      },
      cardTone: "tone-orange",
      findNativeHue: 32,
      listenTone: "orange"
    },
    pronunciation: "бэ"
  },
  {
    id: "V",
    upper: "В",
    lower: "в",
    word: "Волк",
    difficulty: 1,
    group: 0,
    contentReady: true,
    eligibleActivities: [...ALL_ACTIVITIES],
    pictureExamples: [
      pictureExample("V-wolf", "Волк", "/assets/letters/v-wolf.webp"),
      pictureExample("V-bucket", "Ведро", "/assets/picture/bucket.webp"),
      pictureExample("V-bicycle", "Велосипед", "/assets/picture/bicycle.webp")
    ],
    images: {
      card: "/assets/letters/v-wolf.webp",
      glyph: "/assets/letters/V.webp",
      object: "/assets/letters/v-wolf.webp",
      findObject: "/assets/letters/v-wolf.webp",
      picture: "/assets/letters/v-wolf.webp",
      choice: "/assets/find/choice-v.webp"
    },
    audio: {
      letter: audioClip("letter", "V"),
      find: audioClip("find", "V"),
      picture: audioClip("picture", "V"),
      correct: audioClip("correct", "V"),
      listen: audioClip("listen", "V"),
      reward: audioClip("reward", "V")
    },
    theme: {
      toy: {
        palette: { light: "#9af0e4", mid: "#2ec4b6", dark: "#1a9e92", shade: "#0e6e66" },
        path: "M48 20 H120 Q172 20 172 78 Q172 112 140 124 Q176 136 176 176 Q176 198 118 198 H48 Z M86 50 V98 H114 Q132 98 132 74 Q132 50 114 50 Z M86 132 V168 H116 Q140 168 140 150 Q140 132 116 132 Z"
      },
      cardTone: "tone-teal",
      findNativeHue: 172,
      listenTone: "teal"
    },
    pronunciation: "вэ"
  },
  {
    id: "G",
    upper: "Г",
    lower: "г",
    word: "Гриб",
    difficulty: 2,
    group: 1,
    contentReady: true,
    eligibleActivities: [...ALL_ACTIVITIES],
    pictureExamples: [
      pictureExample("G-mushroom", "Гриб", "/assets/picture/mushroom.webp"),
      pictureExample("G-goose", "Гусь", "/assets/picture/goose.webp"),
      pictureExample("G-pear", "Груша", "/assets/picture/pear.webp")
    ],
    images: {
      card: "/assets/letters/g-mushroom.webp",
      glyph: "/assets/letters/G.webp",
      object: "/assets/picture/mushroom.webp",
      findObject: "/assets/picture/mushroom.webp",
      picture: "/assets/picture/mushroom.webp",
      choice: "/assets/find/choice-g.webp"
    },
    audio: {
      letter: audioClip("letter", "G"),
      find: audioClip("find", "G"),
      picture: audioClip("picture", "G"),
      correct: audioClip("correct", "G"),
      listen: audioClip("listen", "G"),
      reward: audioClip("reward", "G")
    },
    theme: {
      toy: {
        palette: { light: "#b6ecff", mid: "#4fc3ff", dark: "#1d9ee0", shade: "#0d6fa6" },
        path: "M168 36 H70 Q36 36 36 78 V178 Q36 198 62 198 H92 V154 H70 V78 H168 Z"
      },
      cardTone: "tone-cyan",
      findNativeHue: 198,
      listenTone: "purple"
    },
    pronunciation: "гэ"
  },
  {
    id: "D",
    upper: "Д",
    lower: "д",
    word: "Дом",
    difficulty: 2,
    group: 1,
    contentReady: true,
    eligibleActivities: [...ALL_ACTIVITIES],
    pictureExamples: [
      pictureExample("D-house", "Дом", "/assets/picture/house.webp"),
      pictureExample("D-tree", "Дерево", "/assets/picture/tree.webp"),
      pictureExample("D-dolphin", "Дельфин", "/assets/picture/dolphin.webp")
    ],
    images: {
      card: "/assets/letters/d-house.webp",
      glyph: "/assets/letters/D.webp",
      object: "/assets/picture/house.webp",
      findObject: "/assets/picture/house.webp",
      picture: "/assets/picture/house.webp",
      choice: "/assets/find/choice-d.webp"
    },
    audio: {
      letter: audioClip("letter", "D"),
      find: audioClip("find", "D"),
      picture: audioClip("picture", "D"),
      correct: audioClip("correct", "D"),
      listen: audioClip("listen", "D"),
      reward: audioClip("reward", "D")
    },
    theme: {
      toy: {
        palette: { light: "#d2c4ff", mid: "#7c4dff", dark: "#5a2fd6", shade: "#3b1a96" },
        path: "M36 198 L64 28 H136 L164 198 H132 L124 156 H76 L68 198 Z M86 118 H114 L100 52 Z",
        fillRule: "evenodd"
      },
      cardTone: "tone-purple",
      findNativeHue: 263,
      listenTone: "blue"
    },
    pronunciation: "дэ"
  },
  {
    id: "E",
    upper: "Е",
    lower: "е",
    word: "Енот",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("E-raccoon", "Енот", "/assets/picture/raccoon.webp"),
      pictureExample("E-unicorn", "Единорог", "/assets/picture/unicorn.webp"),
      pictureExample("E-blackberry", "Ежевика", "/assets/picture/blackberry.webp")
    ],
    images: {
      glyph: "/assets/letters/E.webp",
      object: "/assets/picture/raccoon.webp",
      findObject: "/assets/picture/raccoon.webp",
      picture: "/assets/picture/raccoon.webp"
    },
    pronunciation: "е"
  },
  {
    id: "Yo",
    upper: "Ё",
    lower: "ё",
    word: "Ёж",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Yo-hedgehog", "Ёж", "/assets/picture/hedgehog.webp"),
      pictureExample("Yo-christmas-tree", "Ёлка", "/assets/picture/christmas-tree.webp"),
      pictureExample("Yo-brush", "Ёршик", "/assets/picture/brush.webp")
    ],
    images: {
      glyph: "/assets/letters/Yo.webp",
      object: "/assets/picture/hedgehog.webp",
      findObject: "/assets/picture/hedgehog.webp",
      picture: "/assets/picture/hedgehog.webp"
    },
    pronunciation: "ё"
  },
  {
    id: "Zh",
    upper: "Ж",
    lower: "ж",
    word: "Жираф",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Zh-beetle", "Жук", "/assets/picture/beetle.webp"),
      pictureExample("Zh-giraffe", "Жираф", "/assets/picture/giraffe.webp"),
      pictureExample("Zh-acorn", "Желудь", "/assets/picture/acorn.webp")
    ],
    images: {
      glyph: "/assets/letters/Zh.webp"
    }
  },
  {
    id: "Z",
    upper: "З",
    lower: "з",
    word: "Заяц",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Z-hare", "Заяц", "/assets/picture/hare.webp"),
      pictureExample("Z-umbrella", "Зонт", "/assets/picture/umbrella.webp"),
      pictureExample("Z-zebra", "Зебра", "/assets/picture/zebra.webp")
    ],
    images: {
      glyph: "/assets/letters/Z.webp"
    }
  },
  {
    id: "I",
    upper: "И",
    lower: "и",
    word: "Игла",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("I-turkey", "Индюк", "/assets/picture/turkey.webp"),
      pictureExample("I-needle", "Игла", "/assets/picture/needle.webp"),
      pictureExample("I-toys", "Игрушки", "/assets/picture/toys.webp")
    ],
    images: {
      glyph: "/assets/letters/I.webp"
    }
  },
  {
    id: "J",
    upper: "Й",
    lower: "й",
    word: "",
    needsContent: true,
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("J-yogurt", "Йогурт", "/assets/picture/yogurt.webp"),
      pictureExample("J-yogi", "Йог", "/assets/picture/yogi.webp"),
      pictureExample("J-iodine", "Йод", "/assets/picture/iodine.webp")
    ],
    images: {
      glyph: "/assets/letters/J.webp"
    }
  },
  {
    id: "K",
    upper: "К",
    lower: "к",
    word: "Кот",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("K-cat", "Кот", "/assets/picture/cat.webp"),
      pictureExample("K-ship", "Корабль", "/assets/picture/ship.webp"),
      pictureExample("K-doll", "Кукла", "/assets/picture/doll.webp")
    ],
    images: {
      glyph: "/assets/letters/K.webp"
    }
  },
  {
    id: "L",
    upper: "Л",
    lower: "л",
    word: "Лимон",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("L-lion", "Лев", "/assets/picture/lion.webp"),
      pictureExample("L-lemon", "Лимон", "/assets/picture/lemon.webp"),
      pictureExample("L-spoon", "Ложка", "/assets/picture/spoon.webp")
    ],
    images: {
      glyph: "/assets/letters/L.webp"
    }
  },
  {
    id: "M",
    upper: "М",
    lower: "м",
    word: "Мяч",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("M-ball", "Мяч", "/assets/picture/ball.webp"),
      pictureExample("M-car", "Машина", "/assets/picture/car.webp"),
      pictureExample("M-carrot", "Морковь", "/assets/picture/carrot.webp")
    ],
    images: {
      glyph: "/assets/letters/M.webp"
    }
  },
  {
    id: "N",
    upper: "Н",
    lower: "н",
    word: "Носорог",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("N-rhino", "Носорог", "/assets/picture/rhino.webp"),
      pictureExample("N-scissors", "Ножницы", "/assets/picture/scissors.webp"),
      pictureExample("N-sock", "Носок", "/assets/picture/sock.webp")
    ],
    images: {
      glyph: "/assets/letters/N.webp"
    }
  },
  {
    id: "O",
    upper: "О",
    lower: "о",
    word: "Облако",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("O-donkey", "Осёл", "/assets/picture/donkey.webp"),
      pictureExample("O-cloud", "Облако", "/assets/picture/cloud.webp"),
      pictureExample("O-cucumber", "Огурец", "/assets/picture/cucumber.webp")
    ],
    images: {
      glyph: "/assets/letters/O.webp"
    }
  },
  {
    id: "P",
    upper: "П",
    lower: "п",
    word: "Пингвин",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("P-penguin", "Пингвин", "/assets/picture/penguin.webp"),
      pictureExample("P-rooster", "Петух", "/assets/picture/rooster.webp"),
      pictureExample("P-parrot", "Попугай", "/assets/picture/parrot.webp")
    ],
    images: {
      glyph: "/assets/letters/P.webp"
    }
  },
  {
    id: "R",
    upper: "Р",
    lower: "р",
    word: "Рыба",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("R-fish", "Рыба", "/assets/picture/fish.webp"),
      pictureExample("R-rocket", "Ракета", "/assets/picture/rocket.webp"),
      pictureExample("R-robot", "Робот", "/assets/picture/robot.webp")
    ],
    images: {
      glyph: "/assets/letters/R.webp"
    }
  },
  {
    id: "S",
    upper: "С",
    lower: "с",
    word: "Слон",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("S-elephant", "Слон", "/assets/picture/elephant.webp"),
      pictureExample("S-dog", "Собака", "/assets/picture/dog.webp"),
      pictureExample("S-airplane", "Самолёт", "/assets/picture/airplane.webp")
    ],
    images: {
      glyph: "/assets/letters/S.webp"
    }
  },
  {
    id: "T",
    upper: "Т",
    lower: "т",
    word: "Тигр",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("T-tiger", "Тигр", "/assets/picture/tiger.webp"),
      pictureExample("T-tractor", "Трактор", "/assets/picture/tractor.webp"),
      pictureExample("T-cake", "Торт", "/assets/picture/cake.webp")
    ],
    images: {
      glyph: "/assets/letters/T.webp"
    }
  },
  {
    id: "U",
    upper: "У",
    lower: "у",
    word: "Утка",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("U-duck", "Утка", "/assets/picture/duck.webp"),
      pictureExample("U-snail", "Улитка", "/assets/picture/snail.webp"),
      pictureExample("U-iron", "Утюг", "/assets/picture/iron.webp")
    ],
    images: {
      glyph: "/assets/letters/U.webp"
    }
  },
  {
    id: "F",
    upper: "Ф",
    lower: "ф",
    word: "Фотоаппарат",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("F-camera", "Фотоаппарат", "/assets/picture/camera.webp"),
      pictureExample("F-lantern", "Фонарь", "/assets/picture/lantern.webp"),
      pictureExample("F-flamingo", "Фламинго", "/assets/picture/flamingo.webp")
    ],
    images: {
      glyph: "/assets/letters/F.webp"
    }
  },
  {
    id: "Kh",
    upper: "Х",
    lower: "х",
    word: "Хомяк",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Kh-hamster", "Хомяк", "/assets/picture/hamster.webp"),
      pictureExample("Kh-bread", "Хлеб", "/assets/picture/bread.webp"),
      pictureExample("Kh-fridge", "Холодильник", "/assets/picture/fridge.webp")
    ],
    images: {
      glyph: "/assets/letters/Kh.webp"
    }
  },
  {
    id: "Ts",
    upper: "Ц",
    lower: "ц",
    word: "Цыплёнок",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Ts-chick", "Цыплёнок", "/assets/picture/chick.webp"),
      pictureExample("Ts-heron", "Цапля", "/assets/picture/heron.webp"),
      pictureExample("Ts-flower", "Цветок", "/assets/picture/flower.webp")
    ],
    images: {
      glyph: "/assets/letters/Ts.webp"
    }
  },
  {
    id: "Ch",
    upper: "Ч",
    lower: "ч",
    word: "Чайник",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Ch-teapot", "Чайник", "/assets/picture/teapot.webp"),
      pictureExample("Ch-clock", "Часы", "/assets/picture/clock.webp"),
      pictureExample("Ch-turtle", "Черепаха", "/assets/picture/turtle.webp")
    ],
    images: {
      glyph: "/assets/letters/Ch.webp"
    }
  },
  {
    id: "Sh",
    upper: "Ш",
    lower: "ш",
    word: "Шар",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Sh-balloon", "Шар", "/assets/picture/balloon.webp"),
      pictureExample("Sh-hat", "Шапка", "/assets/picture/hat.webp"),
      pictureExample("Sh-wardrobe", "Шкаф", "/assets/picture/wardrobe.webp")
    ],
    images: {
      glyph: "/assets/letters/Sh.webp"
    }
  },
  {
    id: "Shch",
    upper: "Щ",
    lower: "щ",
    word: "Щука",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Shch-pike", "Щука", "/assets/picture/pike.webp"),
      pictureExample("Shch-toothbrush", "Щётка", "/assets/picture/toothbrush.webp"),
      pictureExample("Shch-shield", "Щит", "/assets/picture/shield.webp")
    ],
    images: {
      glyph: "/assets/letters/Shch.webp"
    }
  },
  {
    id: "Hard",
    upper: "Ъ",
    lower: "ъ",
    word: "",
    needsContent: true,
    difficulty: 2,
    group: 2,
    contentReady: false,
    specialExamples: [
      specialExample("Hard-entrance", "Подъезд", "/assets/picture/entrance.webp", "Ъ", 3),
      specialExample("Hard-lift", "Подъёмник", "/assets/picture/lift-platform.webp", "Ъ", 3),
      specialExample("Hard-hug", "Объятие", "/assets/picture/hug.webp", "Ъ", 2)
    ],
    images: {
      glyph: "/assets/letters/Hard.webp"
    }
  },
  {
    id: "Yery",
    upper: "Ы",
    lower: "ы",
    word: "",
    needsContent: true,
    difficulty: 2,
    group: 2,
    contentReady: false,
    specialExamples: [
      specialExample("Yery-cheese", "Сыр", "/assets/picture/cheese-y.webp", "Ы", 1),
      specialExample("Yery-fish", "Рыба", "/assets/picture/fish-y.webp", "Ы", 1),
      specialExample("Yery-pumpkin", "Тыква", "/assets/picture/pumpkin.webp", "Ы", 1)
    ],
    images: {
      glyph: "/assets/letters/Yery.webp"
    }
  },
  {
    id: "Soft",
    upper: "Ь",
    lower: "ь",
    word: "",
    needsContent: true,
    difficulty: 2,
    group: 2,
    contentReady: false,
    specialExamples: [
      specialExample("Soft-horse", "Конь", "/assets/picture/horse-soft.webp", "Ь", 3),
      specialExample("Soft-goose", "Гусь", "/assets/picture/goose-soft.webp", "Ь", 3),
      specialExample("Soft-moose", "Лось", "/assets/picture/moose.webp", "Ь", 3)
    ],
    images: {
      glyph: "/assets/letters/Soft.webp"
    }
  },
  {
    id: "Eh",
    upper: "Э",
    lower: "э",
    word: "Экскаватор",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Eh-excavator", "Экскаватор", "/assets/picture/excavator.webp"),
      pictureExample("Eh-icecream", "Эскимо", "/assets/picture/icecream.webp"),
      pictureExample("Eh-screen", "Экран", "/assets/picture/screen.webp")
    ],
    images: {
      glyph: "/assets/letters/Eh.webp"
    }
  },
  {
    id: "Yu",
    upper: "Ю",
    lower: "ю",
    word: "Юла",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Yu-spinning-top", "Юла", "/assets/picture/spinning-top.webp"),
      pictureExample("Yu-skirt", "Юбка", "/assets/picture/skirt.webp"),
      pictureExample("Yu-yunga", "Юнга", "/assets/picture/yunga.webp")
    ],
    images: {
      glyph: "/assets/letters/Yu.webp"
    }
  },
  {
    id: "Ya",
    upper: "Я",
    lower: "я",
    word: "Яблоко",
    difficulty: 2,
    group: 2,
    contentReady: false,
    eligibleActivities: ["picture"],
    pictureExamples: [
      pictureExample("Ya-apple", "Яблоко", "/assets/picture/apple.webp"),
      pictureExample("Ya-anchor", "Якорь", "/assets/picture/anchor.webp"),
      pictureExample("Ya-lizard", "Ящерица", "/assets/picture/lizard.webp")
    ],
    images: {
      glyph: "/assets/letters/Ya.webp"
    }
  }
];

export const LETTER_CONTENT: LetterContent[] = RAW_LETTER_CONTENT.map(finalizeLetterContent);

export const LETTERS: LetterItem[] = LETTER_CONTENT.map(letterEntry);

export const LETTER_GROUPS = [
  ["A", "B", "V"],
  ["G", "D"],
  LETTERS.filter((letter) => letter.group >= 2).map((letter) => letter.id)
];

export const SPECIAL_CONTENT_LETTER_IDS = ["Yo", "J", "Hard", "Yery", "Soft"] as const;

export function isContentReady(letter: Pick<LetterItem, "contentReady">): boolean {
  return letter.contentReady === true;
}

export function contentReadyLetters(letters: LetterItem[] = LETTERS): LetterItem[] {
  return letters.filter(isContentReady);
}

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

export function nextContentReadyLetter(
  letters: LetterItem[],
  currentId: string
): LetterItem | null {
  const next = nextAlphabetLetter(letters, currentId);
  if (!next || !isContentReady(next)) {
    return null;
  }
  return next;
}
