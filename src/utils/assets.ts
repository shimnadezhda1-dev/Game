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
  fox: {
    idle: "/assets/character/fox-idle.png",
    happy: "/assets/character/fox-happy.png",
    tip: "/assets/character/fox-tip.png",
    celebrate: "/assets/character/fox-celebrate.png"
  },
  ui: {
    cubes: "/assets/ui/learn-cubes.png",
    play: "/assets/ui/play-letters.png",
    stars: "/assets/ui/stars.png",
    rewards: "/assets/ui/rewards-chest.png",
    home: "/assets/ui/home-house.png"
  }
} as const;
