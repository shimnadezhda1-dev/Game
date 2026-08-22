from collections import deque
from pathlib import Path

from PIL import Image

ASSETS = Path(r"C:\Users\user\.cursor\projects\f-AI-CURSOR-Game-Game\assets")
ROOT = Path(r"f:\AI\Проекты CURSOR\Game\Game\public\assets")


def load(name: str) -> Image.Image:
    return Image.open(ASSETS / name)


def idx(w: int, x: int, y: int) -> int:
    return y * w + x


def flood_alpha(im: Image.Image, is_bg, edge_limit: int, hole_limit: int | None = None) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def maybe(x: int, y: int, limit: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h:
            return
        i = idx(w, x, y)
        if visited[i]:
            return
        r, g, b, _a = px[x, y]
        if is_bg(r, g, b, limit):
            visited[i] = 1
            q.append((x, y))

    for x in range(w):
        maybe(x, 0, edge_limit)
        maybe(x, h - 1, edge_limit)
    for y in range(h):
        maybe(0, y, edge_limit)
        maybe(w - 1, y, edge_limit)

    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        strength = is_bg(r, g, b, edge_limit)
        alpha = 0 if strength >= 0.72 else int((1 - strength) * 255)
        px[x, y] = (r, g, b, alpha)
        maybe(x + 1, y, edge_limit)
        maybe(x - 1, y, edge_limit)
        maybe(x, y + 1, edge_limit)
        maybe(x, y - 1, edge_limit)

    if hole_limit is None:
        return im

    for y in range(h):
        for x in range(w):
            i = idx(w, x, y)
            if visited[i]:
                continue
            r, g, b, _a = px[x, y]
            if is_bg(r, g, b, hole_limit) >= 0.9:
                visited[i] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        px[x, y] = (r, g, b, 0)
        maybe(x + 1, y, hole_limit)
        maybe(x - 1, y, hole_limit)
        maybe(x, y + 1, hole_limit)
        maybe(x, y - 1, hole_limit)

    return im


def black_bg(r: int, g: int, b: int, limit: int) -> float:
    mx = max(r, g, b)
    if mx > limit:
        return 0.0
    return 1.0 - mx / max(limit, 1)


def light_bg(r: int, g: int, b: int, _limit: int) -> float:
    mn, mx = min(r, g, b), max(r, g, b)
    if mn < 210 or mx - mn > 22:
        return 0.0
    return min(1.0, (mn - 200) / 40)


letter_src = (
    "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_9d844bf4b299c65b44ba9d5dd8d48212_"
    "images_ChatGPT_Image_22____._2026__.__20_54_37-05ed3f59-c67f-4523-9c23-cdf75fd2ff5c.jpg"
)
melon_src = (
    "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_9d844bf4b299c65b44ba9d5dd8d48212_"
    "images_ChatGPT_Image_22____._2026__.__20_55_05-21c41dc7-7009-4834-85d4-ba782b6a094b.jpg"
)
meadow_src = (
    "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_9d844bf4b299c65b44ba9d5dd8d48212_"
    "images_ChatGPT_Image_22____._2026__.__21_14_11-0f92a33f-842e-40c0-bc29-f86a6f670575.jpg"
)
fox_src = (
    "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_9d844bf4b299c65b44ba9d5dd8d48212_"
    "images_ChatGPT_Image_22____._2026__.__21_14_41-5cd3b983-a4e8-4695-a65f-0112474d6824.jpg"
)

(ROOT / "letters").mkdir(parents=True, exist_ok=True)
(ROOT / "objects").mkdir(parents=True, exist_ok=True)
(ROOT / "fox").mkdir(parents=True, exist_ok=True)

letter = flood_alpha(load(letter_src), light_bg, 1, hole_limit=1)
letter.save(ROOT / "letters" / "A.png", "PNG")

melon = flood_alpha(load(melon_src), black_bg, 18)
melon.save(ROOT / "objects" / "watermelon.png", "PNG")

meadow = load(meadow_src).convert("RGB")
meadow.save(ROOT / "letters" / "meadow-bg.png", "PNG")

fox = flood_alpha(load(fox_src), black_bg, 18, hole_limit=2)
fox.save(ROOT / "fox" / "fox-teacher.png", "PNG")

print("saved letter", letter.size)
print("saved melon", melon.size)
print("saved meadow", meadow.size)
print("saved fox", fox.size)
