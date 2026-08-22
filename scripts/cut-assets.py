from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CHAR = ROOT / "public" / "assets" / "character"
LETTERS = ROOT / "public" / "assets" / "letters"


def knock_near(path: Path, keys: list[tuple[int, int, int]], thresh: int) -> None:
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            for kr, kg, kb in keys:
                if abs(r - kr) + abs(g - kg) + abs(b - kb) <= thresh:
                    pixels[x, y] = (r, g, b, 0)
                    break
    img.save(path)
    print(f"cut {path.name}")


def corner_color(path: Path) -> tuple[int, int, int]:
    img = Image.open(path).convert("RGBA")
    return img.getpixel((2, 2))[:3]


def main() -> None:
    for name in ["fox-happy.png", "fox-idle.png", "fox-tip.png", "fox-celebrate.png"]:
        path = CHAR / name
        bg = corner_color(path)
        knock_near(path, [bg, (255, 255, 255), (250, 246, 236), (248, 244, 232)], 42)

    melon = LETTERS / "a-watermelon.png"
    bg = corner_color(melon)
    knock_near(melon, [bg], 28)


if __name__ == "__main__":
    main()
