import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio" / "voice"
VOICE = "ru-RU-SvetlanaNeural"

LINES = {
    "welcome": "Привет! Давай играть с буквами!",
    "try-again": "Попробуй ещё!",
    "listen-prompt": "Послушай и выбери букву!",
    "letter-a": "Это буква А! А-а-а... А — арбуз!",
    "letter-b": "Это буква Б! Б-бэ... Б — барабан!",
    "letter-v": "Это буква В! В-вэ... В — волк!",
    "letter-g": "Это буква Г! Г-гэ... Г — гриб!",
    "letter-d": "Это буква Д! Д-дэ... Д — дом!",
    "find-a": "Найди букву А!",
    "find-b": "Найди букву Б!",
    "find-v": "Найди букву В!",
    "find-g": "Найди букву Г!",
    "find-d": "Найди букву Д!",
    "picture-a": "Что начинается на букву А?",
    "picture-b": "Что начинается на букву Б?",
    "picture-v": "Что начинается на букву В?",
    "picture-g": "Что начинается на букву Г?",
    "picture-d": "Что начинается на букву Д?",
    "correct-a": "Молодец! Это буква А!",
    "correct-b": "Молодец! Это буква Б!",
    "correct-v": "Молодец! Это буква В!",
    "correct-g": "Молодец! Это буква Г!",
    "correct-d": "Молодец! Это буква Д!",
    "listen-a": "А-а-а",
    "listen-b": "Б-бэ",
    "listen-v": "В-вэ",
    "listen-g": "Г-гэ",
    "listen-d": "Д-дэ",
    "reward-a": "Ура! Ты выучил букву А!",
    "reward-b": "Ура! Ты выучил букву Б!",
    "reward-v": "Ура! Ты выучил букву В!",
    "reward-g": "Ура! Ты выучил букву Г!",
    "reward-d": "Ура! Ты выучил букву Д!",
}


async def save(key: str, text: str) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate="-10%")
    path = OUT / f"{key}.mp3"
    await asyncio.wait_for(communicate.save(str(path)), timeout=40)
    print(f"voice {key}", flush=True)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, text in LINES.items():
        try:
            await save(key, text)
        except Exception as error:
            print(f"FAIL {key}: {error}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
