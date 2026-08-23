export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}

export const ASSETS = {
  letters: {
    A: "/assets/letters/a-watermelon.webp",
    B: "/assets/letters/b-drum.webp",
    V: "/assets/letters/v-wolf.webp",
    G: "/assets/letters/g-mushroom.webp",
    D: "/assets/letters/d-house.webp"
  },
  letterGlyphs: {
    A: "/assets/letters/A.webp",
    B: "/assets/letters/B.webp",
    V: "/assets/letters/V.webp",
    G: "/assets/letters/G.webp",
    D: "/assets/letters/D.webp"
  },
  objects: {
    watermelon: "/assets/objects/watermelon.webp",
    drum: "/assets/letters/b-drum.webp",
    wolf: "/assets/letters/v-wolf.webp",
    mushroom: "/assets/picture/mushroom.webp",
    house: "/assets/picture/house.webp"
  },
  learn: {
    meadow: "/assets/letters/meadow-bg.webp"
  },
  find: {
    meadow: "/assets/find/meadow.webp",
    fox: "/assets/find/fox.webp",
    letterA: "/assets/find/letter-a.webp",
    watermelon: "/assets/find/watermelon.webp",
    choiceA: "/assets/find/choice-a.webp",
    choiceB: "/assets/find/choice-b.webp",
    choiceV: "/assets/find/choice-v.webp",
    choiceG: "/assets/find/choice-g.webp",
    choiceD: "/assets/find/choice-d.webp"
  },
  picture: {
    meadow: "/assets/picture/meadow.webp",
    fox: "/assets/picture/fox.webp",
    watermelon: "/assets/picture/watermelon.webp",
    mushroom: "/assets/picture/mushroom.webp",
    house: "/assets/picture/house.webp"
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
    home: "/assets/ui/home-house.webp"
  }
} as const;
