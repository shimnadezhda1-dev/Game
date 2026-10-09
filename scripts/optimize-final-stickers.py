"""Batch-resize the final sticker collection to 512px PNG with alpha.

Originals stay in git at checkpoint-before-stickers-batch-optimization.
This script overwrites public/assets/stickers/final only after each file
keeps a transparent PNG. It also refreshes src/data/finalStickerArt.ts
so every sticker id, title, and file path stay on one record.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FINAL = ROOT / "public" / "assets" / "stickers" / "final"
ART = ROOT / "src" / "data" / "finalStickerArt.ts"
MAX_EDGE = 512

FOLDERS = (
    ("universal", "meadow-friends", "universal"),
    ("boys", "toy-magic", "boy"),
    ("girls", "sky-party", "girl"),
)

TITLES = {
    "universal/alpaca.png": "Альпака",
    "universal/axolotl.png": "Аксолотль",
    "universal/baby-dragon.png": "Дракончик",
    "universal/brachiosaurus.png": "Брахиозавр",
    "universal/capybara.png": "Капибара",
    "universal/chameleon.png": "Хамелеон",
    "universal/clownfish.png": "Рыбка-клоун",
    "universal/dolphin.png": "Дельфин",
    "universal/dragon-egg.png": "Яйцо дракона",
    "universal/elephant.png": "Слонёнок",
    "universal/firefly.png": "Светлячок",
    "universal/fox.png": "Лисёнок",
    "universal/frog.png": "Лягушонок",
    "universal/giraffe.png": "Жираф",
    "universal/gorilla.png": "Горилла",
    "universal/griffin.png": "Грифон",
    "universal/hummingbird.png": "Колибри",
    "universal/hamster.png": "Хомячок",
    "universal/hedgehog.png": "Ёжик",
    "universal/hot-air-balloon.png": "Воздушный шар",
    "universal/jellyfish.png": "Медуза",
    "universal/kangaroo.png": "Кенгуру",
    "universal/kitten.png": "Котёнок",
    "universal/koala.png": "Коала",
    "universal/ladybug.png": "Божья коровка",
    "universal/lemur.png": "Лемур",
    "universal/lion-cub.png": "Львёнок",
    "universal/magic-sailboat.png": "Волшебный кораблик",
    "universal/magic-tree.png": "Волшебное дерево",
    "universal/meerkat.png": "Сурикат",
    "universal/monkey.png": "Обезьянка",
    "universal/narwhal.png": "Нарвал",
    "universal/octopus.png": "Осьминог",
    "universal/owl.png": "Сова",
    "universal/panda.png": "Панда",
    "universal/parrot.png": "Попугай",
    "universal/peacock.png": "Павлин",
    "universal/penguin.png": "Пингвин",
    "universal/phoenix.png": "Феникс",
    "universal/polar-bear.png": "Белый мишка",
    "universal/pufferfish.png": "Рыба-ёж",
    "universal/puppy.png": "Щенок",
    "universal/quokka.png": "Квокка",
    "universal/raccoon.png": "Енот",
    "universal/red-panda.png": "Красная панда",
    "universal/sea-turtle.png": "Черепашка",
    "universal/seahorse.png": "Морской конёк",
    "universal/sloth.png": "Ленивец",
    "universal/spellbook.png": "Книга заклинаний",
    "universal/stegosaurus.png": "Стегозавр",
    "universal/t-rex.png": "Тираннозавр",
    "universal/tiger.png": "Тигрёнок",
    "universal/toucan.png": "Тукан",
    "universal/triceratops.png": "Трицератопс",
    "universal/whale.png": "Кит",
    "boys/airship.png": "Дирижабль",
    "boys/astronaut.png": "Космонавт",
    "boys/bulldozer.png": "Бульдозер",
    "boys/cement-mixer.png": "Бетономешалка",
    "boys/excavator.png": "Экскаватор",
    "boys/fire-helicopter.png": "Пожарный вертолёт",
    "boys/fire-truck.png": "Пожарная машина",
    "boys/helicopter.png": "Вертолёт",
    "boys/jet-plane.png": "Самолёт",
    "boys/knight.png": "Рыцарь",
    "boys/lunar-rover.png": "Луноход",
    "boys/monster-truck.png": "Монстр-трак",
    "boys/offroad-buggy.png": "Багги",
    "boys/parachute.png": "Парашют",
    "boys/pirate-ship.png": "Пиратский корабль",
    "boys/race-car.png": "Гоночная машина",
    "boys/rescue-boat.png": "Спасательный катер",
    "boys/robot.png": "Робот",
    "boys/rocket.png": "Ракета",
    "boys/satellite.png": "Спутник",
    "boys/spaceship.png": "Космический корабль",
    "boys/submarine.png": "Подводная лодка",
    "boys/superhero.png": "Супергерой",
    "boys/tractor.png": "Трактор",
    "boys/train.png": "Поезд",
    "boys/treasure-chest.png": "Сундук с сокровищами",
    "boys/wizard.png": "Волшебник",
    "girls/ballerina-kitten.png": "Котёнок-балерина",
    "girls/ballerina.png": "Балерина",
    "girls/butterfly.png": "Бабочка",
    "girls/crystal-slipper.png": "Хрустальная туфелька",
    "girls/crystal-snail.png": "Хрустальная улитка",
    "girls/fairy-girl.png": "Фея",
    "girls/fairy-house.png": "Домик феи",
    "girls/flower-fairy.png": "Цветочная фея",
    "girls/flower-wreath.png": "Цветочный венок",
    "girls/magic-crystal.png": "Волшебный кристалл",
    "girls/magic-key.png": "Волшебный ключик",
    "girls/magic-lantern.png": "Волшебный фонарик",
    "girls/mermaid-b.png": "Русалочка",
    "girls/moon-bunny.png": "Лунный зайчик",
    "girls/pegasus.png": "Пегас",
    "girls/pink-castle.png": "Розовый замок",
    "girls/princess-carriage.png": "Карета",
    "girls/princess-crown.png": "Корона",
    "girls/princess-mirror.png": "Зеркальце",
    "girls/princess.png": "Принцесса",
    "girls/rainbow-cloud.png": "Радужное облако",
    "girls/rainbow.png": "Радуга",
    "girls/star.png": "Звезда",
    "girls/unicorn.png": "Единорог",
}


def sticker_files() -> list[tuple[str, str, str, Path]]:
    rows: list[tuple[str, str, str, Path]] = []
    for folder, collection_id, audience in FOLDERS:
        directory = FINAL / folder
        for path in sorted(directory.glob("*.png")):
            rel = f"{folder}/{path.name}"
            rows.append((rel, collection_id, audience, path))
    return rows


def optimize(path: Path) -> tuple[int, int, tuple[int, int]]:
    before = path.stat().st_size
    image = Image.open(path).convert("RGBA")
    source_alpha = image.getchannel("A").getextrema()
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    if image.width > MAX_EDGE or image.height > MAX_EDGE:
        raise RuntimeError(f"{path.name} is still larger than {MAX_EDGE}")
    if image.mode != "RGBA":
        raise RuntimeError(f"{path.name} lost RGBA")
    alpha = image.getchannel("A").getextrema()
    if source_alpha[0] == 0 and alpha[0] != 0:
        raise RuntimeError(f"{path.name} lost transparent pixels")
    temp = path.with_suffix(".opt.png")
    image.save(temp, "PNG", optimize=True, compress_level=9)
    temp.replace(path)
    return before, path.stat().st_size, image.size


def write_catalog(rows: list[tuple[str, str, str, Path]]) -> None:
    missing = [rel for rel, _, _, _ in rows if rel not in TITLES]
    extra = sorted(set(TITLES) - {rel for rel, _, _, _ in rows})
    if missing or extra:
        raise SystemExit(f"title map mismatch missing={missing} extra={extra}")
    lines = [
        "import { RewardAudience } from \"./rewardCatalog\";",
        "",
        "export interface FinalStickerArt {",
        "  id: string;",
        "  title: string;",
        "  asset: string;",
        "  collectionId: string;",
        "  preferredAudience: RewardAudience;",
        "}",
        "",
        "/** Final collection. id, title, and file stay on the same record. */",
        "export const FINAL_STICKER_ART: readonly FinalStickerArt[] = [",
    ]
    for index, (rel, collection_id, audience, _) in enumerate(rows):
        sticker_id = f"sticker-{str(index + 5).zfill(2)}"
        title = TITLES[rel].replace("\\", "\\\\").replace('"', '\\"')
        lines.append(
            "  { "
            f'id: "{sticker_id}", '
            f'title: "{title}", '
            f'asset: "/assets/stickers/final/{rel}", '
            f'collectionId: "{collection_id}", '
            f'preferredAudience: "{audience}" '
            "},"
        )
    lines.append("];")
    lines.append("")
    ART.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    rows = sticker_files()
    before_bytes = []
    after_bytes = []
    sizes: set[tuple[int, int]] = set()
    for rel, _, _, path in rows:
        before, after, size = optimize(path)
        before_bytes.append(before)
        after_bytes.append(after)
        sizes.add(size)
        print(f"{rel} {before} -> {after} {size[0]}x{size[1]}")
    write_catalog(rows)
    summary = {
        "countBefore": len(before_bytes),
        "countAfter": len(after_bytes),
        "bytesBefore": sum(before_bytes),
        "bytesAfter": sum(after_bytes),
        "avgBefore": round(sum(before_bytes) / len(before_bytes)),
        "avgAfter": round(sum(after_bytes) / len(after_bytes)),
        "maxEdge": MAX_EDGE,
        "sizes": sorted(f"{w}x{h}" for w, h in sizes),
    }
    report = ROOT / "tmp" / "sticker-opt-report.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
