from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def bbox(img: Image.Image) -> tuple[int, int, int, int]:
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 12:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    pad = 12
    return (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + pad + 1),
        min(h, maxy + pad + 1),
    )


def flood_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    key = px[8, 8][:3]
    seen = [[False] * w for _ in range(h)]
    q = deque([(0, y) for y in range(0, h, 2)] + [(w - 1, y) for y in range(0, h, 2)] + [(x, 0) for x in range(0, w, 2)] + [(x, h - 1) for x in range(0, w, 2)])
    for x, y in q:
        seen[y][x] = True

    def similar(c) -> bool:
        return abs(c[0] - key[0]) + abs(c[1] - key[1]) + abs(c[2] - key[2]) < 70 or (c[0] > 228 and c[1] > 220 and c[2] > 190)

    while q:
        x, y = q.popleft()
        r, g, b, a = px[x, y]
        if similar((r, g, b)) or a < 8:
            px[x, y] = (0, 0, 0, 0)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                    seen[ny][nx] = True
                    q.append((nx, ny))
    # drop leftover sparkles
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if visited[y][x] or px[x, y][3] == 0:
                visited[y][x] = True
                continue
            stack = [(x, y)]
            blob = []
            orange = 0
            visited[y][x] = True
            while stack:
                cx, cy = stack.pop()
                blob.append((cx, cy))
                r, g, b, a = px[cx, cy]
                if r > 160 and g < 140 and b < 90:
                    orange += 1
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and px[nx, ny][3] > 0:
                        visited[ny][nx] = True
                        stack.append((nx, ny))
            if len(blob) < 900 and orange < 30:
                for bx, by in blob:
                    px[bx, by] = (0, 0, 0, 0)
    return img


def main() -> None:
    fox = flood_bg(Image.open(ROOT / "public" / "assets" / "home" / "fox-src.png"))
    fox = fox.crop(bbox(fox))
    fox.save(ROOT / "public" / "assets" / "home" / "fox.png")

    rainbow = Image.open(ROOT / "public" / "assets" / "home" / "rainbow.png").convert("RGBA")
    rainbow.crop(bbox(rainbow)).save(ROOT / "public" / "assets" / "home" / "rainbow.png")
    print("cropped fox and rainbow")


if __name__ == "__main__":
    main()
