from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "assets" / "home" / "fox-src.png"
OUT = ROOT / "public" / "assets" / "home" / "fox.png"


def flood(img: Image.Image, thresh: int = 48) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2)]
    seen = [[False] * w for _ in range(h)]
    q = deque()

    def close(a, b) -> bool:
        return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) <= thresh

    for x, y in seeds:
        q.append((x, y))
        seen[y][x] = True
    while q:
        x, y = q.popleft()
        r, g, b, a = px[x, y]
        if a == 0:
            pass
        else:
            # only remove pale paper / near-white / near-black leftover matte
            pale = r > 220 and g > 215 and b > 200
            dark = r < 28 and g < 28 and b < 28
            if pale or dark:
                px[x, y] = (r, g, b, 0)
            else:
                continue
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                nr, ng, nb, na = px[nx, ny]
                if na == 0 or close((r, g, b), (nr, ng, nb)) or (nr > 220 and ng > 215 and nb > 200) or (nr < 28 and ng < 28 and nb < 28):
                    seen[ny][nx] = True
                    q.append((nx, ny))
    return img


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # restore original from git if possible later; work from current file
    cut = flood(Image.open(SRC), 55)
    cut.save(OUT)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
