from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "home"
OUT.mkdir(parents=True, exist_ok=True)


def ellipse(draw, x, y, rx, ry, fill):
    draw.ellipse([x - rx, y - ry, x + rx, y + ry], fill=fill)


def paint_meadow() -> None:
    w, h = 1600, 900
    img = Image.new("RGBA", (w, h), (110, 203, 255, 255))
    draw = ImageDraw.Draw(img)
    for i in range(h):
        t = i / h
        if t < 0.42:
            u = t / 0.42
            c = (
                int(80 + 70 * u),
                int(180 + 40 * u),
                int(255 - 20 * u),
                255,
            )
        elif t < 0.68:
            u = (t - 0.42) / 0.26
            c = (
                int(150 + 90 * u),
                int(220 + 20 * u),
                int(235 - 80 * u),
                255,
            )
        else:
            u = (t - 0.68) / 0.32
            c = (
                int(240 - 80 * u),
                int(240 - 40 * u),
                int(155 - 70 * u),
                255,
            )
        draw.line([(0, i), (w, i)], fill=c)

    # distant clouds
    for x, y, s in ((180, 140, 1.0), (430, 90, 0.7), (1280, 160, 0.85)):
        ellipse(draw, x, y, int(70 * s), int(28 * s), (255, 255, 255, 210))
        ellipse(draw, x + int(40 * s), y - int(10 * s), int(50 * s), int(24 * s), (255, 255, 255, 210))

    # balloons
    for x, y, color in (
        (220, 210, (255, 107, 122, 255)),
        (310, 250, (79, 195, 255, 255)),
        (1180, 230, (126, 217, 87, 255)),
        (1380, 280, (180, 120, 255, 255)),
    ):
        ellipse(draw, x, y, 16, 22, color)
        draw.line([(x, y + 22), (x, y + 46)], fill=(255, 255, 255, 180), width=2)

    # hills
    draw.ellipse([-200, 520, 900, 1100], fill=(102, 200, 74, 255))
    draw.ellipse([400, 560, 1500, 1120], fill=(126, 217, 87, 255))
    draw.ellipse([900, 540, 1800, 1140], fill=(90, 186, 70, 255))
    draw.rectangle([0, 780, w, h], fill=(110, 205, 80, 255))

    # trees
    def tree(tx, ty, scale):
        trunk_h = int(36 * scale)
        draw.rectangle([tx - 5, ty - trunk_h, tx + 5, ty], fill=(139, 90, 43, 255))
        r = int(38 * scale)
        ellipse(draw, tx, ty - trunk_h - int(8 * scale), r, r, (61, 186, 74, 255))
        ellipse(draw, tx - int(18 * scale), ty - trunk_h, int(r * 0.8), int(r * 0.8), (80, 200, 90, 255))
        ellipse(draw, tx + int(16 * scale), ty - trunk_h, int(r * 0.75), int(r * 0.75), (70, 175, 80, 255))

    tree(140, 760, 1.15)
    tree(280, 790, 0.8)
    tree(1320, 770, 1.05)
    tree(1460, 800, 0.7)

    # flowers
    def flower(fx, fy, petal):
        for ang in range(0, 360, 72):
            rad = ang * pi / 180
            ellipse(
                draw,
                int(fx + cos(rad) * 10),
                int(fy + sin(rad) * 10),
                8,
                8,
                petal,
            )
        ellipse(draw, fx, fy, 6, 6, (255, 217, 61, 255))

    flower(180, 840, (255, 107, 122, 255))
    flower(320, 860, (124, 77, 255, 255))
    flower(470, 845, (255, 159, 28, 255))
    flower(1100, 850, (255, 107, 122, 255))
    flower(1240, 835, (79, 195, 255, 255))
    flower(1380, 860, (255, 159, 28, 255))

    img.save(OUT / "meadow.png")


def paint_rainbow() -> None:
    w, h = 1600, 820
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = w // 2, h + 40
    bands = [
        ((255, 79, 109), (190, 30, 70), 470),
        ((255, 154, 30), (205, 95, 0), 422),
        ((255, 214, 50), (220, 165, 10), 376),
        ((110, 210, 80), (50, 150, 45), 332),
        ((90, 210, 255), (20, 140, 210), 290),
        ((70, 110, 230), (30, 60, 170), 250),
        ((150, 90, 255), (90, 40, 190), 212),
    ]
    stroke = 48
    for top, side, radius in bands:
        bbox = [cx - radius, cy - radius, cx + radius, cy + radius]
        for extra in range(16, 0, -1):
            draw.arc(
                [bbox[0], bbox[1] + extra, bbox[2], bbox[3] + extra],
                198,
                342,
                fill=side + (255,),
                width=stroke,
            )
        draw.arc(bbox, 198, 342, fill=top + (255,), width=stroke)
        draw.arc(
            [bbox[0] + 6, bbox[1] - 5, bbox[2] - 6, bbox[3] - 5],
            205,
            255,
            fill=(255, 255, 255, 110),
            width=10,
        )
    img = Image.alpha_composite(img, layer)

    cloud = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(cloud)

    def puff(x, y, scale):
        parts = [
            (0, 8, 70),
            (55, 16, 64),
            (108, 6, 76),
            (30, -22, 58),
            (78, -30, 68),
            (124, -10, 54),
            (16, 28, 46),
            (96, 32, 50),
        ]
        for dx, dy, r in parts:
            rr = int(r * scale)
            px, py = int(x + dx * scale), int(y + dy * scale)
            ellipse(cdraw, px, py + 10, rr, int(rr * 0.78), (210, 220, 230, 120))
            ellipse(cdraw, px, py, rr, int(rr * 0.78), (255, 255, 255, 255))
            ellipse(cdraw, px - int(rr * 0.25), py - int(rr * 0.28), int(rr * 0.45), int(rr * 0.28), (255, 255, 255, 200))

    puff(90, 520, 1.25)
    puff(1120, 515, 1.3)
    img = Image.alpha_composite(img, cloud)

    sun = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sun)
    sx, sy, sr = 1188, 168, 72
    for i in range(14):
        ang = i * (360 / 14) * pi / 180
        bx = sx + int(cos(ang) * (sr + 22))
        by = sy + int(sin(ang) * (sr + 22))
        ellipse(sdraw, bx, by, 11, 11, (255, 210, 60, 255))
    ellipse(sdraw, sx, sy, sr + 6, sr + 6, (255, 186, 40, 70))
    ellipse(sdraw, sx, sy, sr, sr, (255, 214, 55, 255))
    ellipse(sdraw, sx - 16, sy - 18, 40, 28, (255, 245, 190, 160))
    ellipse(sdraw, sx - 18, sy - 8, 7, 9, (91, 61, 20, 255))
    ellipse(sdraw, sx + 16, sy - 8, 7, 9, (91, 61, 20, 255))
    sdraw.arc([sx - 22, sy + 2, sx + 22, sy + 38], 15, 165, fill=(91, 61, 20, 255), width=5)
    img = Image.alpha_composite(img, sun)

    # crop empty
    bbox = img.getbbox()
    if bbox:
        pad = 8
        img = img.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad)))
    img.save(OUT / "rainbow.png")


if __name__ == "__main__":
    paint_meadow()
    paint_rainbow()
    print("wrote meadow and rainbow")
