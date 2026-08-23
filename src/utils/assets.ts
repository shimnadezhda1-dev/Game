export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}

export const ASSETS = {
  letters: {
    A: "/assets/letters/a-watermelon.png",
    B: "/assets/letters/b-drum.png",
    V: "/assets/letters/v-wolf.png",
    G: "/assets/letters/g-mushroom.png",
    D: "/assets/letters/d-house.png"
  },
  letterGlyphs: {
    A: "/assets/letters/A.png",
    B: "/assets/letters/B.png",
    V: "/assets/letters/V.png",
    G: "/assets/letters/G.png",
    D: "/assets/letters/D.png"
  },
  objects: {
    watermelon: "/assets/objects/watermelon.png",
    drum: "/assets/letters/b-drum.png",
    wolf: "/assets/letters/v-wolf.png",
    mushroom: "/assets/letters/g-mushroom.png",
    house: "/assets/letters/d-house.png"
  },
  learn: {
    meadow: "/assets/letters/meadow-bg.png"
  },
  find: {
    meadow: "/assets/find/meadow.png",
    fox: "/assets/find/fox.png",
    letterA: "/assets/find/letter-a.png",
    watermelon: "/assets/find/watermelon.png",
    choiceA: "/assets/find/choice-a.png",
    choiceB: "/assets/find/choice-b.png",
    choiceV: "/assets/find/choice-v.png",
    choiceG: "/assets/find/choice-g.png",
    choiceD: "/assets/find/choice-d.png"
  },
  picture: {
    meadow: "/assets/picture/meadow.png",
    fox: "/assets/picture/fox.png",
    watermelon: "/assets/picture/watermelon.png",
    mushroom: "/assets/picture/mushroom.png",
    house: "/assets/picture/house.png"
  },
  listen: {
    meadow: "/assets/listen/meadow.png"
  },
  fox: {
    idle: "/assets/character/fox-idle.png",
    happy: "/assets/character/fox-happy.png",
    tip: "/assets/character/fox-tip.png",
    celebrate: "/assets/character/fox-celebrate.png",
    teacher: "/assets/fox/fox-teacher.png"
  },
  ui: {
    cubes: "/assets/ui/learn-cubes.png",
    play: "/assets/ui/play-letters.png",
    stars: "/assets/ui/stars.png",
    rewards: "/assets/ui/rewards-chest.png",
    home: "/assets/ui/home-house.png"
  }
} as const;
