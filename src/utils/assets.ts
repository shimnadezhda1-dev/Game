import { getLetterContent } from "../data/letterRegistry";

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}

function letterImages(id: string) {
  return getLetterContent(id)?.images;
}

export const ASSETS = {
  letters: {
    A: letterImages("A")?.card ?? "",
    B: letterImages("B")?.card ?? "",
    V: letterImages("V")?.card ?? "",
    G: letterImages("G")?.card ?? "",
    D: letterImages("D")?.card ?? ""
  },
  letterGlyphs: {
    A: letterImages("A")?.glyph ?? "",
    B: letterImages("B")?.glyph ?? "",
    V: letterImages("V")?.glyph ?? "",
    G: letterImages("G")?.glyph ?? "",
    D: letterImages("D")?.glyph ?? ""
  },
  objects: {
    watermelon: letterImages("A")?.object ?? "",
    drum: letterImages("B")?.object ?? "",
    wolf: letterImages("V")?.object ?? "",
    mushroom: letterImages("G")?.object ?? "",
    house: letterImages("D")?.object ?? ""
  },
  learn: {
    meadow: "/assets/letters/meadow-bg.webp"
  },
  find: {
    meadow: "/assets/find/meadow.webp",
    fox: "/assets/find/fox.webp",
    letterA: "/assets/find/letter-a.webp",
    watermelon: letterImages("A")?.findObject ?? "",
    choiceA: letterImages("A")?.choice ?? "",
    choiceB: letterImages("B")?.choice ?? "",
    choiceV: letterImages("V")?.choice ?? "",
    choiceG: letterImages("G")?.choice ?? "",
    choiceD: letterImages("D")?.choice ?? ""
  },
  picture: {
    meadow: "/assets/picture/meadow.webp",
    fox: "/assets/picture/fox.webp",
    watermelon: letterImages("A")?.picture ?? "",
    mushroom: letterImages("G")?.picture ?? "",
    house: letterImages("D")?.picture ?? ""
  },
  listen: {
    meadow: "/assets/listen/meadow.webp"
  },
  fox: {
    idle: "/assets/character/fox-idle.webp",
    happy: "/assets/character/fox-happy.webp",
    tip: "/assets/character/fox-tip.webp",
    celebrate: "/assets/character/fox-celebrate.webp",
    teacher: "/assets/fox/fox-teacher.webp"
  },
  ui: {
    cubes: "/assets/ui/learn-cubes.webp",
    play: "/assets/ui/play-letters.webp",
    stars: "/assets/ui/stars.webp",
    rewards: "/assets/ui/rewards-chest.webp",
    /** Future sticker files: `/assets/rewards/{id}.webp` */
    home: "/assets/ui/home-house.webp",
    difficultyMenu: "/assets/ui/menu/difficulty-menu.png",
    activityMenu: "/assets/ui/menu/activity-menu.png",
    orderMenu: "/assets/ui/menu/order-menu.png",
    categoryMenu: "/assets/ui/menu/category-menu.png",
    learnButton: "/assets/ui/activity/learn-button.png",
    selectLetterButton: "/assets/ui/order/select-letter-button.png",
    musicButton: "/assets/ui/music-button.png"
  }
} as const;
