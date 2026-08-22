from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "home" / "rainbow.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 1400, 720
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

cx, cy = W // 2, H + 30
bands = [
    ((255, 93, 122), (210, 40, 80), 430),
    ((255, 159, 28), (220, 110, 0), 382),
    ((255, 217, 61), (230, 170, 20), 336),
    ((126, 217, 87), (70, 160, 50), 292),
    ((79, 195, 255), (30, 140, 210), 250),
    ((124, 77, 255), (80, 40, 200), 210),
]
stroke = 46

for color, shade, radius in bands:
    bbox = [cx - radius, cy - radius, cx + radius, cy + radius]
    draw.arc(bbox, 198, 342, fill=shade + (255,), width=stroke)
    draw.arc(
        [bbox[0], bbox[1] - 7, bbox[2], bbox[3] - 7],
        200,
        340,
        fill=color + (255,),
        width=max(18, stroke - 16),
    )
    draw.arc(
        [bbox[0] + 10, bbox[1] + 4, bbox[2] - 10, bbox[3] + 4],
        205,
        250,
        fill=(255, 255, 255, 90),
        width=8,
    )

img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
draw = ImageDraw.Draw(img)


def puff(x: int, y: int, scale: float = 1.0) -> None:
    parts = [
        (0, 0, 78),
        (52, 10, 70),
        (96, 4, 82),
        (28, -28, 64),
        (70, -34, 72),
        (112, -18, 60),
        (18, 18, 50),
        (88, 22, 54),
    ]
    for dx, dy, r in parts:
        rr = int(r * scale)
        px, py = x + int(dx * scale), y + int(dy * scale)
        draw.ellipse(
            [px - rr, py - rr + 10, px + rr, py + rr + 10],
            fill=(210, 220, 230, 90),
        )
        draw.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(255, 255, 255, 255))
        draw.ellipse(
            [px - rr + 12, py - rr + 8, px + int(rr * 0.2), py - 4],
            fill=(255, 255, 255, 180),
        )


puff(70, 470, 1.15)
puff(1080, 470, 1.2)

# Sun at the top-right of the rainbow
sx, sy, sr = 1120, 150, 78
for i, ray in enumerate(range(12)):
    ang = i * 30
    import math

    rad = math.radians(ang)
    x1 = sx + int(math.cos(rad) * (sr + 8))
    y1 = sy + int(math.sin(rad) * (sr + 8))
    x2 = sx + int(math.cos(rad) * (sr + 28))
    y2 = sy + int(math.sin(rad) * (sr + 28))
    draw.line([(x1, y1), (x2, y2)], fill=(255, 196, 40, 255), width=14)
draw.ellipse([sx - sr - 8, sy - sr - 8, sx + sr + 8, sy + sr + 8], fill=(255, 214, 80, 70))
draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 210, 48, 255))
draw.ellipse([sx - sr + 10, sy - sr + 8, sx + 10, sy + 8], fill=(255, 245, 180, 160))
draw.ellipse([sx - 22, sy - 12, sx - 8, sy + 8], fill=(91, 61, 20, 255))
draw.ellipse([sx + 10, sy - 12, sx + 24, sy + 8], fill=(91, 61, 20, 255))
draw.arc([sx - 24, sy + 4, sx + 24, sy + 42], 20, 160, fill=(91, 61, 20, 255), width=6)

img.save(OUT)
print(f"wrote {OUT}")
