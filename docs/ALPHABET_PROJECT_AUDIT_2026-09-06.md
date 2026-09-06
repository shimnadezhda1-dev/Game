# Технический аудит проекта «Весёлый алфавит»

**Дата аудита:** 6 сентября 2026 года  
**Локальный проект:** `F:\AI\CursorProjects\Game\Game`  
**Опубликованная версия:** <https://shimnadezhda1-dev.github.io/Game/>  
**Режим проведения:** только чтение; код, дизайн, настройки, зависимости и GitHub Pages во время аудита не изменялись.

## Обозначения

- **Подтверждённый факт** — вывод непосредственно подтверждён существующими файлами и кодом.
- **Проблема** — обнаруженное неполное, недостижимое, противоречивое или хрупкое поведение.
- **Рекомендация** — возможное направление будущей модернизации; в рамках аудита не реализовывалось.
- **Вопрос владельцу** — решение, которое нельзя корректно принять только на основании кода.

# A. ТЕКУЩИЙ ТЕХНОЛОГИЧЕСКИЙ СТЕК

## Подтверждённые факты

Проект представляет собой одностраничное React-приложение без внешнего роутера и state manager.

| Слой | Технология | Установленная версия по `package-lock.json` |
| --- | --- | --- |
| UI | React | 18.3.1 |
| DOM renderer | React DOM | 18.3.1 |
| Язык | TypeScript | 5.9.3 |
| Сборка и dev server | Vite | 5.4.21 |
| React plugin | `@vitejs/plugin-react` | 4.7.0 |
| Мобильная оболочка | Capacitor | 8.5.0 |
| Стили | Один глобальный CSS | около 4965 строк |
| Хранение | Web Storage | `localStorage` |
| Голос | MP3 + Web Speech API | `HTMLAudioElement`, `speechSynthesis` |
| Эффекты | Web Audio API | осцилляторы для success/error |
| Музыка | WAV | зацикленный `HTMLAudioElement` |
| Web deploy | GitHub Actions / GitHub Pages | Node.js 20 в CI |
| Native | Android / Gradle / Capacitor | `android/` |

Шрифт Nunito загружается с Google Fonts в [`index.html`](../index.html), строки 7–9.

Не обнаружены:

- React Router;
- Redux, Zustand или другой state manager;
- Tailwind, CSS Modules, styled-components;
- ESLint и Prettier;
- Jest, Vitest, Playwright, Cypress;
- автоматизированные unit/e2e-тесты приложения.

## `package.json`

Источник: [`package.json`](../package.json), строки 6–26.

Скрипты:

- `dev` → `vite`;
- `build` → `vite build`;
- `build:android` → `vite build --base=/`;
- `cap:sync` → web build для Android и `npx cap sync android`;
- `preview` → `vite preview`.

Dependencies:

- `react`;
- `react-dom`;
- `@capacitor/core`;
- `@capacitor/android`.

DevDependencies:

- `@capacitor/cli`;
- `@types/react`;
- `@types/react-dom`;
- `@vitejs/plugin-react`;
- `typescript`;
- `vite`.

Фактическое использование:

- React и React DOM — [`src/main.tsx`](../src/main.tsx) и все React-компоненты.
- Vite и React plugin — [`vite.config.ts`](../vite.config.ts).
- TypeScript и React type packages — `tsconfig*.json` и `.ts/.tsx`.
- Capacitor CLI — тип конфигурации в [`capacitor.config.ts`](../capacitor.config.ts).
- Capacitor Android/Core — Android-проект, Gradle и `BridgeActivity`; прямого импорта `@capacitor/core` в `src/` нет, но пакет нужен нативной сборке.

Доказуемо лишних прямых npm-зависимостей нет.

Сверка с npm registry на дату аудита показала:

- React/React DOM: 18.3.1 при доступной 19.2.8;
- Vite: 5.4.21 при доступной 8.2.2;
- TypeScript: 5.9.3 при доступной 7.0.2;
- `@vitejs/plugin-react`: 4.7.0 при доступной 6.1.1;
- Capacitor: 8.5.0 при доступной 8.5.1.

## Проблемы и рекомендации

- Отставание от major-версий не является ошибкой работающего проекта. Одновременное обновление React/Vite/TypeScript и игровой архитектуры повысит риск.
- В [`vite.config.ts`](../vite.config.ts), строки 5–8, предусмотрен `process.env.CAPACITOR === "1"`, но package script эту переменную не задаёт. Android base фактически задаётся аргументом `--base=/`.
- В CI используется `npm install`, а не детерминированный `npm ci`.
- В CI нет отдельной проверки типов и тестов.
- Major-обновления рекомендуется выполнять отдельно от рефакторинга игровой логики.

# B. СТРУКТУРА ПРОЕКТА

## Подтверждённые факты

```text
Game/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── capacitor.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── README.md
├── .github/
│   └── workflows/deploy.yml
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── styles.css
│   ├── data/letters.ts
│   ├── audio/
│   ├── components/
│   └── utils/
├── public/
│   ├── assets/
│   ├── images/
│   └── audio/
├── scripts/
└── android/
```

Назначение:

- [`index.html`](../index.html) — HTML shell, язык `ru`, viewport, root element.
- [`src/main.tsx`](../src/main.tsx) — точка входа React, подключает `App` и `styles.css`.
- [`src/App.tsx`](../src/App.tsx) — экранное состояние, навигация, прогресс, звёзды, награды и аудио.
- [`src/types.ts`](../src/types.ts) — типы `Screen`, `GameId`, `LetterItem`, `ProgressState`.
- [`src/data/letters.ts`](../src/data/letters.ts) — список 33 букв и группы.
- `src/components/` — экраны, упражнения и UI.
- `src/audio/` — MP3/TTS и музыка.
- `src/utils/` — ассеты, storage, раунды, выбор букв, тексты, награды.
- [`src/styles.css`](../src/styles.css) — базовый UI, legacy-слои и новые immersive-композиции.
- `public/` — runtime-изображения и аудио, копируемые Vite без обработки.
- `scripts/` — офлайн-обработка изображений и генерация аудио/музыки.
- `android/` — нативная оболочка Capacitor; игровая логика в ней отсутствует.

Основные компоненты:

- [`HomeScreen.tsx`](../src/components/HomeScreen.tsx);
- [`AdventurePlay.tsx`](../src/components/AdventurePlay.tsx);
- [`LearnLetters.tsx`](../src/components/LearnLetters.tsx);
- [`LearnScene.tsx`](../src/components/LearnScene.tsx);
- [`FindLetterGame.tsx`](../src/components/FindLetterGame.tsx);
- [`PictureLetterGame.tsx`](../src/components/PictureLetterGame.tsx);
- [`ListenAndChooseGame.tsx`](../src/components/ListenAndChooseGame.tsx);
- [`Progress.tsx`](../src/components/Progress.tsx);
- [`StarsScreen.tsx`](../src/components/StarsScreen.tsx);
- [`RewardScreen.tsx`](../src/components/RewardScreen.tsx);
- [`GameStage.tsx`](../src/components/GameStage.tsx);
- [`StageNav.tsx`](../src/components/StageNav.tsx);
- [`FlyingStar.tsx`](../src/components/FlyingStar.tsx);
- [`Character.tsx`](../src/components/Character.tsx);
- [`WorldBackground.tsx`](../src/components/WorldBackground.tsx);
- [`ToyLetter.tsx`](../src/components/ToyLetter.tsx);
- [`ToyIcons.tsx`](../src/components/ToyIcons.tsx);
- [`GoldStar.tsx`](../src/components/GoldStar.tsx);
- [`LetterTile.tsx`](../src/components/LetterTile.tsx);
- [`LetterHint.tsx`](../src/components/LetterHint.tsx);
- [`LetterVisual.tsx`](../src/components/LetterVisual.tsx);
- [`SpeakButton.tsx`](../src/components/SpeakButton.tsx).

# C. ЧТО УЖЕ РЕАЛЬНО РАБОТАЕТ И НУЖНО СОХРАНИТЬ

## Подтверждённые факты

- Главный экран с финальными WebP-ассетами: [`HomeScreen.tsx`](../src/components/HomeScreen.tsx), строки 50–117.
- Кнопка «ИГРАТЬ» запускает `startAdventure()` и экран `adventure`: [`App.tsx`](../src/App.tsx), строки 91–100 и 248–271.
- Кнопка «А Б В» открывает standalone-режим изучения.
- Линейный цикл из четырёх этапов задаётся `STAGE_FLOW`: [`AdventurePlay.tsx`](../src/components/AdventurePlay.tsx), строки 24–28.
- Четыре универсальных упражнения:
  - Learn;
  - Find;
  - Picture;
  - Listen.
- Общая модель буквы `LetterItem`: [`types.ts`](../src/types.ts), строки 16–33.
- Общий игровой hook `useRound`: [`utils/useRound.ts`](../src/utils/useRound.ts).
- Общая рандомизация вариантов и взвешенный выбор: [`utils/selectors.ts`](../src/utils/selectors.ts).
- Полный набор контента и MP3 для А, Б, В, Г, Д.
- MP3 с fallback на системный русский TTS: [`audio/AudioManager.ts`](../src/audio/AudioManager.ts), строки 82–185.
- Отдельная фоновая музыка: [`audio/BackgroundMusicManager.ts`](../src/audio/BackgroundMusicManager.ts).
- Приглушение музыки во время речи через `duck()`/`unduck()`.
- Раздельное управление music и sound.
- Начисление звезды, FlyingStar и статистика: [`App.tsx`](../src/App.tsx), строки 102–179.
- Система освоения букв и разблокировки групп: [`utils/selectors.ts`](../src/utils/selectors.ts), строки 24–55.
- Награды на 5, 10, 15, 20 звёзд: [`utils/rewards.ts`](../src/utils/rewards.ts).
- Альбом букв/наград: [`StarsScreen.tsx`](../src/components/StarsScreen.tsx).
- Сохранение прогресса и миграция старой статистики: [`utils/storage.ts`](../src/utils/storage.ts).
- Мобильные safe-area, `100dvh`, `clamp()` и большие touch targets.
- Корректная подготовка URL ассетов через `assetUrl()`.
- Рабочая конфигурация GitHub Pages для `/Game/`.
- Готовая Capacitor Android-обёртка.

## Рекомендация

Модернизация возможна без смены технологического стека. Перечисленные механизмы следует эволюционно переиспользовать, а не переписывать.

# D. ЧТО ЕСТЬ, НО РАБОТАЕТ НЕПОЛНОСТЬЮ ИЛИ НЕПРАВИЛЬНО

## Подтверждённые проблемы

1. Adventure проходит массив `LETTERS` по индексу, не фильтруя `contentReady`. После Д игра переходит к Е–Я с пустыми изображениями: [`AdventurePlay.tsx`](../src/components/AdventurePlay.tsx), строки 129–139; [`utils/letterProgress.ts`](../src/utils/letterProgress.ts), строки 57–68.
2. Adventure всегда начинается с А. `startPlayLetterIndex()` игнорирует прогресс: [`utils/letterProgress.ts`](../src/utils/letterProgress.ts), строки 42–48.
3. Боковые стрелки позволяют перейти к следующему этапу без правильного ответа: [`AdventurePlay.tsx`](../src/components/AdventurePlay.tsx), строки 141–168.
4. Routes `find`, `picture`, `listen` существуют в [`App.tsx`](../src/App.tsx), строки 286–322, но ни один активный обработчик не вызывает `go()` с этими значениями.
5. `modeSelect` рендерит тот же `AdventurePlay`, что и `adventure`; настоящий [`GameHubScreen.tsx`](../src/components/GameHubScreen.tsx) не подключён.
6. `AdventurePlay` содержит недостижимые `findLetter` и `reward`. Вызовы `setStep("findLetter")` и `setStep("reward")` отсутствуют.
7. `findLetter` практически дублирует `findHint`: [`AdventurePlay.tsx`](../src/components/AdventurePlay.tsx), строки 180–221.
8. [`LearnLetters.tsx`](../src/components/LearnLetters.tsx) объявляет `letters`, `onSelectLetter`, `onBack`, но компонент их не использует.
9. `letter-*.mp3` зарегистрированы, но Learn вызывает `onSpeak()` без voice key: [`LearnLetters.tsx`](../src/components/LearnLetters.tsx), строки 26–37. На этом экране фактически используется TTS.
10. [`RewardScreen.tsx`](../src/components/RewardScreen.tsx) принимает `title` и `text`, которые передаются из `App`, но не отображает их.
11. `HomeScreen.onOpenStars` и `foxCelebrate` объявлены, но не используются.
12. Кнопка «Домой» на главной в [`HomeScreen.tsx`](../src/components/HomeScreen.tsx), строки 105–107, не имеет `onClick`.
13. `StarsScreen.onBack` не используется.
14. `trailStep` объявлен в Find/Picture/Listen, но не читается.
15. `ProgressState.unlockedGames` загружается как постоянный default и не управляет активным UI.
16. `difficulty` присутствует в `LetterItem` и данных, но игровая логика его не читает.
17. `GameStage` принимает `onBack`, но не выводит кнопку Back.
18. HUD-кнопка Listen повторяет общий prompt; саму букву воспроизводит отдельная большая кнопка.
19. После неправильного ответа:
    - Find запускает error chime/MP3, shake и после двух ошибок подсвечивает правильный вариант;
    - Picture и Listen произносят «Попробуй ещё раз», но не имеют аналогичной подсказки;
    - лимита попыток нет.
20. Похвала зависит от типа упражнения, но внутри типа всегда одинакова и не рандомизируется.
21. Цвет буквы Г рассинхронизирован: cyan в `cardTones`, `findColors`, `ToyLetter`, но purple в Listen.
22. Главный экран не даёт прямого доступа к Stars: глобальная кнопка скрыта в home mode, а `onOpenStars` не используется.

## Фактическая runtime-проверка

Опубликованный URL был прочитан без изменения проекта. Главный экран и пути вида `/Game/assets/home/...` доступны. Полный интерактивный click-through не выполнялся. Production build не запускался, поскольку он создал бы `dist`, что противоречило режиму первоначального аудита.

# E. ЧЕГО В ПРОЕКТЕ ПОКА НЕТ

## Подтверждённые факты

- Уровней с 3/5/7 вариантами. Сейчас используется три варианта.
- Фильтра «все буквы».
- Фильтра гласных.
- Фильтра согласных.
- Выбора конкретной буквы.
- Пользовательского режима «по алфавиту / случайный порядок».
- Экрана настроек.
- Сохранения текущего adventure-экрана, буквы и этапа.
- Единой системы подсказок для всех упражнений.
- Ограничения числа попыток.
- Случайного набора похвал.
- Полного контента Е–Я.
- Автоматической проверки целостности данных и ассетов.
- Унифицированного `StageShell`.
- Автоматизированных тестов.
- Проверки типов/тестов в GitHub Actions.
- Полностью офлайн-шрифта: Nunito загружается с Google.

# F. ТЕКУЩАЯ СИСТЕМА БУКВ И КОНТЕНТА

## Подтверждённые факты

Центральный каталог — [`src/data/letters.ts`](../src/data/letters.ts).

В `LETTERS` присутствуют все 33 буквы русского алфавита. ID представлены латиницей/транслитом: `A`, `B`, `V`, `G`, `D`, `Yo`, `Zh`, `Kh`, `Shch`, `Hard`, `Soft`, `Yery` и т. д.

Полностью готовые записи:

- `A` — А/а, Арбуз, group 0, difficulty 1.
- `B` — Б/б, Барабан, group 0, difficulty 1.
- `V` — В/в, Волк, group 0, difficulty 1.
- `G` — Г/г, Гриб, group 1, difficulty 2.
- `D` — Д/д, Дом, group 1, difficulty 2.

Для них установлено `contentReady: true`.

Остальные 28 создаются через `laterLetter()`:

- `imagePath: ""`;
- `contentReady: false`;
- difficulty обычно 2;
- group обычно 2.

Особые буквы без готового слова и с `needsContent: true`:

- Ё;
- Й;
- Ъ;
- Ы;
- Ь.

`SPECIAL_CONTENT_LETTER_IDS` объявлен в [`letters.ts`](../src/data/letters.ts), строка 140, но сейчас не используется.

Группы:

```text
0: A, B, V
1: G, D
2: все остальные
```

## Универсальность

Отдельных экранов для А, Б, В, Г, Д нет. Все четыре упражнения принимают `LetterItem` и общий массив букв. Уже существует основа data-driven архитектуры.

## Проблема

Контент централизован не полностью. Изображения, voice keys, цвета, SVG paths и особенности произношения распределены по нескольким файлам. Добавление буквы требует синхронных изменений в этих картах.

# G. ТЕКУЩАЯ СИСТЕМА ИЗОБРАЖЕНИЙ И АУДИО

## Централизованные каталоги

- Изображения: [`src/utils/assets.ts`](../src/utils/assets.ts).
- Привязка изображений к буквам: [`src/data/letters.ts`](../src/data/letters.ts).
- Голос: [`src/audio/voiceCatalog.ts`](../src/audio/voiceCatalog.ts).
- Runtime audio: [`src/audio/AudioManager.ts`](../src/audio/AudioManager.ts).
- Музыка: [`src/audio/BackgroundMusicManager.ts`](../src/audio/BackgroundMusicManager.ts).

## Изображения по буквам

### А — Арбуз

- `public/assets/letters/a-watermelon.webp` — общая карточка `imagePath`.
- `public/assets/letters/A.webp` — глиф.
- `public/assets/objects/watermelon.webp` — объект Learn.
- `public/assets/find/watermelon.webp` — объект Find.
- `public/assets/picture/watermelon.webp` — объект Picture.
- `public/assets/find/choice-a.webp` — вариант Find.
- `public/images/a-arbuz.svg` и `public/assets/letters/a-watermelon.svg` — runtime не использует.

### Б — Барабан

- `public/assets/letters/b-drum.webp` — `imagePath`, object, findObject и pictureImage.
- `public/assets/letters/B.webp` — глиф.
- `public/assets/find/choice-b.webp` — вариант Find.
- `public/images/b-baraban.svg`, `public/assets/letters/b-drum.svg` — runtime не использует.

### В — Волк

- `public/assets/letters/v-wolf.webp` — `imagePath` и объект всех упражнений.
- `public/assets/letters/V.webp` — глиф.
- `public/assets/find/choice-v.webp` — вариант Find.
- `public/images/v-volk.svg`, `public/assets/letters/v-wolf.svg` — runtime не использует.

### Г — Гриб

- `public/assets/letters/g-mushroom.webp` — общая карточка.
- `public/assets/letters/G.webp` — глиф.
- `public/assets/picture/mushroom.webp` — объект Learn/Find/Picture.
- `public/assets/find/choice-g.webp` — вариант Find.
- `public/images/g-grib.svg`, `public/assets/letters/g-mushroom.svg` — runtime не использует.

### Д — Дом

- `public/assets/letters/d-house.webp` — общая карточка.
- `public/assets/letters/D.webp` — глиф.
- `public/assets/picture/house.webp` — объект Learn/Find/Picture.
- `public/assets/find/choice-d.webp` — вариант Find.
- `public/images/d-dom.svg` — runtime не использует.

## Общие runtime-изображения

- Home:
  - `home-meadow.webp`;
  - `sun-smiling.webp`;
  - `fox-home.webp`;
  - `letters-abv.webp`.
- Learn:
  - `letters/meadow-bg.webp`;
  - `fox/fox-teacher.webp`.
- Find:
  - `find/meadow.webp`;
  - `find/fox.webp`.
- Picture:
  - `picture/meadow.webp`.
- Listen:
  - `listen/meadow.webp`;
  - `picture/fox.webp` на reward-state.
- Character:
  - `fox-idle.webp`;
  - `fox-happy.webp`;
  - `fox-tip.webp`;
  - `fox-celebrate.webp`.
- UI:
  - `home-house.webp`;
  - `rewards-chest.webp`;
  - `learn-cubes.webp` и `play-letters.webp` только в неподключённом GameHub.

SHA-256 проверка не обнаружила байтово идентичных медиа. Смысловые варианты существуют:

- три изображения арбуза;
- два изображения гриба;
- два изображения дома;
- несколько изображений лисёнка;
- отдельные луга для Learn/Find/Picture/Listen.

## Аудио

В `public/audio/voice/` находятся 33 MP3:

- глобальные `welcome`, `try-again`, `listen-prompt`;
- по шесть файлов для каждой A/B/V/G/D:
  - `letter-*`;
  - `find-*`;
  - `picture-*`;
  - `correct-*`;
  - `listen-*`;
  - `reward-*`.

Музыка:

- `public/audio/music/background.wav`;
- loop;
- normal volume `0.12`;
- duck volume `0.024`;
- fade через интервалы.

Алгоритм речи:

1. `AudioManager.speak()` проверяет `enabled`.
2. Останавливает предыдущую речь.
3. Приглушает музыку.
4. Если есть voice key, пытается воспроизвести MP3.
5. При отсутствии/ошибке MP3 использует `SpeechSynthesisUtterance`.
6. Выбирает русский, предпочтительно женский голос.
7. Использует `lang="ru-RU"`, rate `0.68`, pitch `1.02`.
8. После завершения восстанавливает музыку.

Web Audio API создаёт success chime и try-again chime без отдельных файлов.

## Раздельное управление

Звук:

- `progress.soundEnabled`;
- сохраняется внутри progress;
- отключает речь и chimes.

Музыка:

- отдельный key `happy-alphabet-music-v1`;
- отдельный `BackgroundMusicManager`;
- отдельные кнопки на Home и в `Progress`.

На Home speaker-иконка управляет именно музыкой, хотя визуально может восприниматься как общий звук.

# H. ТЕКУЩАЯ НАВИГАЦИЯ

## Подтверждённые факты

Навигация — `useState<Screen>` в [`App.tsx`](../src/App.tsx), строка 35. React Router не используется. `go()` останавливает речь и переключает экран.

Типы экранов:

- `home`;
- `modeSelect`;
- `learn`;
- `adventure`;
- `find`;
- `picture`;
- `listen`;
- `stars`;
- `reward`.

Реально достижимый flow:

```text
home
├── ИГРАТЬ → adventure
└── А Б В → learn

adventure
└── learn → findHint → findPicture → listenChoose → следующая буква

не-home top bar
└── stars

разблокировка награды + выход
└── reward
```

Внутренние кнопки:

- Home — переход на главный экран.
- Sound/replay — повтор инструкции или буквы.
- Stage Previous/Next — переключение этапов.
- Internal Next — продолжение после правильного ответа.
- Progress Home — глобальный возврат домой.
- Star bank — альбом.
- Music и Sound — раздельные toggles.

`BottomNav` с кнопками Назад/Домой/Вперёд существует, но используется только неподключёнными GameHub и MatchGame.

## Проблемы

- Нет browser history и deep links.
- `screen` не сохраняется.
- Adventure начинается с А.
- Adventure идёт по всем 33 индексам, включая неготовые.
- Stage Next позволяет пропустить ответ.
- Standalone games недостижимы.
- `modeSelect` — legacy alias, а не настоящий экран выбора.

# I. ТЕКУЩАЯ СИСТЕМА ПРОГРЕССА

## Подтверждённые факты

Источник: [`src/utils/storage.ts`](../src/utils/storage.ts).

Ключи:

- `happy-alphabet-progress-v1`;
- `happy-alphabet-first-visit-v1`;
- `happy-alphabet-music-v1`.

`ProgressState` хранит:

- `learnedLetterIds`;
- `currentLearnIndex`;
- `correctAnswers`;
- `stars`;
- `unlockedGames`;
- `mistakeCounts`;
- `letterStats`;
- `unlockedGroupIndex`;
- `unlockedRewards`;
- `soundEnabled`.

`LetterStats`:

- `correctCount`;
- `wrongCount`;
- `lastPracticed`.

Прогресс загружается при создании state в `App` и автоматически сохраняется при каждом изменении.

`loadProgress()`:

- обрабатывает invalid/missing JSON;
- мигрирует старые `mistakeCounts` в `letterStats`;
- игнорирует legacy-поля `screen`, `currentLetter`, `currentLetterIndex`, `selectedLetter`, `activeLetter`;
- восстанавливает rewards по числу звёзд;
- всегда возвращает default-набор `unlockedGames`.

Буква считается освоенной, если:

- ID есть в `learnedLetterIds`; или
- `correctCount >= 3`.

Группа открывается после освоения всех букв текущей группы.

Не используются:

- `sessionStorage`;
- IndexedDB;
- cookies;
- серверное хранение.

Не сохраняются:

- текущий Adventure screen;
- текущая буква Adventure;
- текущий этап;
- случайные варианты;
- незавершённый раунд.

# J. ДУБЛИРУЮЩИЙСЯ КОД

## Подтверждённые факты

1. HUD с Home, Stars и Sound повторяется в [`LearnLetters.tsx`](../src/components/LearnLetters.tsx), [`FindLetterGame.tsx`](../src/components/FindLetterGame.tsx), [`PictureLetterGame.tsx`](../src/components/PictureLetterGame.tsx), [`ListenAndChooseGame.tsx`](../src/components/ListenAndChooseGame.tsx).
2. Backdrop и полноэкранная оболочка повторяются в тех же четырёх компонентах.
3. Conditional `internal-next` повторяется в Find/Picture/Listen.
4. `AdventurePlay` дважды рендерит почти одинаковый Find для `findHint` и `findLetter`.
5. Find содержит две парадигмы UI:
   - immersive branch при `hint === "image"`;
   - legacy `GameStage` branch.
6. Цвета букв независимо определены в четырёх модулях.
7. Тексты похвалы и «Попробуй ещё раз» распределены по компонентам.
8. Существуют две модели навигации:
   - активное Adventure;
   - legacy GameHub/standalone games.
9. В CSS присутствуют четыре последовательных поколения стилей:
   - базовый UI;
   - Toy world;
   - Reference layout lock;
   - Home/learn/find/picture/listen immersive locks.
10. `.app-shell`, `.home-screen`, `.character-bubble`, `.fox-embed`, `.picture-choice`, `.butterfly` и другие классы переопределяются поздними блоками.

## Рекомендации

- Общий `StageShell`.
- Единый `letterTheme`.
- Конфигурация этапов вместо веток.
- Декомпозиция CSS с сохранением текущих class names и визуального результата.

# K. HARDCODE, ПРИВЯЗАННЫЙ К КОНКРЕТНЫМ БУКВАМ

## Подтверждённые факты

- [`data/letters.ts`](../src/data/letters.ts) — явные полные записи А–Д.
- [`utils/assets.ts`](../src/utils/assets.ts) — свойства A/B/V/G/D в `letters`, `letterGlyphs`, `find.choice*`.
- [`audio/voiceCatalog.ts`](../src/audio/voiceCatalog.ts) — явный список MP3 каждой буквы и типа.
- [`audio/AudioManager.ts`](../src/audio/AudioManager.ts), строки 5–11 — произношение А–Д.
- [`components/ToyLetter.tsx`](../src/components/ToyLetter.tsx) — `PALETTES`, `PATHS`, особый `fillRule`.
- [`utils/findColors.ts`](../src/utils/findColors.ts) — `GLYPH_NATIVE_HUE` А–Д.
- [`utils/cardTones.ts`](../src/utils/cardTones.ts) — `LETTER_TONES` А–Д.
- [`ListenAndChooseGame.tsx`](../src/components/ListenAndChooseGame.tsx), строки 29–35 — отдельная tone map.
- [`PictureLetterGame.tsx`](../src/components/PictureLetterGame.tsx), строка 115 — `id === "A"` для арбуза.
- [`HomeScreen.tsx`](../src/components/HomeScreen.tsx), строки 94–97 — `letters-abv.webp` и «Буквы А Б В».
- [`HomeActionArts.tsx`](../src/components/HomeActionArts.tsx) — явные А/Б/В.
- `LETTER_GROUPS` — явные массивы A/B/V и G/D.
- [`README.md`](../README.md) — описание проекта как игры А–Д.

Для неизвестных ID уже есть hash-based fallback палитры и текстовый fallback `ToyLetter`, но они не заменяют отсутствующий предметный контент.

# L. ПОТЕНЦИАЛЬНО НЕИСПОЛЬЗУЕМЫЕ ФАЙЛЫ

## Компоненты

- [`src/components/GameHubScreen.tsx`](../src/components/GameHubScreen.tsx) — старый хаб.
- [`src/components/MatchGame.tsx`](../src/components/MatchGame.tsx) — «Собери пару».
- [`src/components/Rainbow.tsx`](../src/components/Rainbow.tsx) — inline SVG радуга.
- [`src/components/QuestTrail.tsx`](../src/components/QuestTrail.tsx) — trail.
- [`src/components/LetterPlaceholder.tsx`](../src/components/LetterPlaceholder.tsx) — неподключённая заглушка.
- [`src/components/HomeActionArts.tsx`](../src/components/HomeActionArts.tsx) — старые мини-арты.
- [`src/components/BottomNav.tsx`](../src/components/BottomNav.tsx) — используется только orphan-компонентами.

## Потенциально неиспользуемые exports

- `letterIntroText`;
- `masteredCount`;
- `isTargetColorDistinct`;
- `STORAGE_KEYS`;
- `alphabetMatchesOrder`;
- `nextAlphabetLetter`;
- `nextContentReadyLetter`;
- `SPECIAL_CONTENT_LETTER_IDS`.

## Изображения

- `public/assets/find/letter-a.webp`;
- `public/assets/find/choice-row.webp`;
- `public/assets/ui/stars.webp`;
- `public/assets/ui/play.png`;
- `public/assets/ui/cubes.png`;
- `public/assets/home/abc-tiles.png`;
- `public/assets/home/fox.png`;
- `public/assets/home/fox-main.png`;
- `public/assets/home/fox-jump.png`;
- `public/assets/home/fox-jumping.png`;
- `public/assets/home/fox-src.png`;
- `public/assets/home/meadow.png`;
- `public/assets/home/meadow-nonsun.png`;
- `public/assets/home/sun.png`;
- `public/assets/home/rainbow.png`;
- `public/assets/home/rainbow-clean.png`;
- `public/assets/home/rainbow-3d.png`;
- `public/assets/letters/a-watermelon.svg`;
- `public/assets/letters/b-drum.svg`;
- `public/assets/letters/v-wolf.svg`;
- `public/assets/letters/g-mushroom.svg`;
- все SVG из `public/images/`.

## Аудио

Файлы `letter-a.mp3`, `letter-b.mp3`, `letter-v.mp3`, `letter-g.mp3`, `letter-d.mp3` зарегистрированы, но Learn не передаёт соответствующий key.

## Экспериментальные/служебные части

- Скрипты генерации/обработки в `scripts/`.
- Стандартные Capacitor `ExampleUnitTest` и `ExampleInstrumentedTest`.
- Legacy home/hub CSS.
- Routes `find`, `picture`, `listen`.
- Steps `findLetter`, `reward`.
- `trailStep`.
- `unlockedGames`.

## Untracked на момент аудита

- `public/assets/home/fox-src.png`;
- `tsconfig.app.tsbuildinfo`;
- `tsconfig.node.tsbuildinfo`.

Этот список является кандидатом на последующую проверку, а не разрешением на удаление.

# M. ПРОБЛЕМЫ АДАПТИВНОСТИ

## Что уже предусмотрено

- Correct viewport в [`index.html`](../index.html), строка 5.
- `viewport-fit=cover`.
- `env(safe-area-inset-*)`.
- `100dvh`.
- `clamp()`, `min()`, `vw`, `vh`.
- Breakpoints для 1366, 1100, 900, 860, 820, 768, 720, 640, 430, 420, 400, 390 px.
- Height breakpoints 800, 768, 700, 640, 520 px.
- Отдельный grid layout Learn для ≤768 px.
- Крупные touch targets 48–104 px.

## Подтверждённые риски

- Около 33 media query в одном монолитном CSS.
- Immersive-экраны используют `position: fixed`.
- Контент сцен преимущественно `position: absolute`.
- Значимые magic positions:
  - Home cluster `top: 54%`;
  - Learn content `bottom: 38vh`;
  - Picture board `top: calc(12% + 10vh)`;
  - Find fox `left: calc(50% - min(390px, 34vw))`;
  - Listen board `top: 14%`.
- `overflow: hidden` на `html/body/root` и всех основных immersive-экранах. Невместившийся интерфейс не скроллится.
- Многократные каскадные переопределения `.app-shell`.
- Mobile game boards резервируют по ширине 124 px под боковые стрелки.
- Picture начинает перенос карточек только при ≤430 px.
- Landscape-обработка неравномерна между новыми экранами.
- Split view и необычные aspect ratio не имеют отдельной модели layout.
- `:has()` может не работать в старых Android WebView.
- `:focus-visible` реализован лишь для части кнопок.
- Глобальный `user-select: none`.

## Оценка устройств

- Desktop: композиция наиболее стабильна и явно «залочена».
- Tablet: предусмотрены промежуточные ограничения, но остаются абсолютные позиции.
- Phone portrait: предусмотрен отдельный layout, особенно для Learn.
- Phone landscape/низкая высота: самый высокий риск наложений и обрезания.

# N. РИСКИ ПРИ МОДЕРНИЗАЦИИ

## Подтверждённые риски

1. Регрессии CSS из-за порядка четырёх слоёв и `!important`.
2. Поломка Pages при обходе `assetUrl()` или изменении `/Game/`.
3. Поломка Android при использовании Pages base в native build.
4. Потеря прогресса при несовместимой смене storage schema/key.
5. Нарушение ID → filename: voice keys строятся через `letterId.toLowerCase()`.
6. 404 на GitHub Pages при ошибке регистра имени.
7. Индексная навигация зависит от порядка `LETTERS`.
8. Продолжение Adventure по неготовым данным.
9. Рассинхронизация параллельных tone maps.
10. Удаление GameHub/MatchGame до решения об их будущем.
11. Изменение аудиотаймингов может нарушить `introDone`, Next и transition callbacks.
12. React StrictMode может повторять effects в dev.
13. Обновление major-зависимостей одновременно с архитектурой усложнит поиск причин ошибок.
14. Раннее удаление исходных PNG/SVG может разрушить офлайн-pipeline подготовки контента.

# O. ЧТО НЕЛЬЗЯ ТРОГАТЬ ПРИ ПЕРЕДЕЛКЕ

До появления проверенной эквивалентной замены необходимо сохранить:

- React/Vite/TypeScript/Capacitor как технологическую основу.
- [`assetUrl()`](../src/utils/assets.ts) и `import.meta.env.BASE_URL`.
- `/Game/` для GitHub Pages.
- `/` для Android build.
- существующие runtime URL ассетов.
- exact case файлов.
- ID A/B/V/G/D и существующие progress records.
- модель `LetterItem` как миграционную основу.
- `useRound`.
- `weightedLetterPick`, `randomOptions`, `shuffle`.
- статистику correct/wrong/lastPracticed.
- key `happy-alphabet-progress-v1` либо обязательную миграцию из него.
- separate music/sound state.
- MP3 → TTS fallback.
- music ducking.
- текущий четырёхэтапный учебный сценарий.
- FlyingStar и начисление звезды.
- reward thresholds.
- существующие immersive-композиции как визуальный эталон.
- safe-area, `100dvh`, крупные touch targets.
- Capacitor appId `com.shimnadezhda.game`.
- GitHub Pages workflow до отдельной проверенной замены.

# P. ПРЕДЛАГАЕМАЯ ЦЕЛЕВАЯ АРХИТЕКТУРА

## Рекомендация

Цель — расширить уже существующий data-driven слой, не переписывая приложение.

### Единая запись буквы

```ts
interface LetterContent {
  id: string;
  upper: string;
  lower: string;
  category: "vowel" | "consonant" | "special";
  word?: string;
  group: number;
  difficulty: number;
  ready: boolean;

  theme: {
    tone: string;
    nativeHue?: number;
  };

  images: {
    glyph?: string;
    card?: string;
    object?: string;
    findChoice?: string;
  };

  audio: {
    intro?: string;
    find?: string;
    picture?: string;
    correct?: string;
    listen?: string;
    reward?: string;
  };
}
```

### Слои

```text
data/
├── letters
├── gameConfig
└── rewards

game/
├── useRound
├── useAdventure
├── selectors
└── progress

audio/
├── AudioManager
└── BackgroundMusicManager

components/
├── StageShell
└── exercises/
    ├── Learn
    ├── FindLetter
    ├── ChoosePicture
    └── ListenAndChoose
```

Принципы:

- контент отделён от игровой логики;
- упражнения не проверяют конкретные ID;
- один компонент работает с любой готовой буквой;
- тема и аудио находятся рядом с данными буквы либо вычисляются единой функцией;
- Adventure получает список готовых букв и config этапов;
- количество вариантов — параметр;
- фильтр и порядок — параметры с сохранёнными настройками;
- отсутствие необязательного MP3 приводит к TTS, а не к поломке;
- отсутствие обязательной картинки выявляется валидатором до публикации.

# Q. ПОШАГОВЫЙ ПЕРЕХОД К ЦЕЛЕВОЙ АРХИТЕКТУРЕ

## Рекомендованный эволюционный порядок

1. Зафиксировать решения по вопросам раздела T.
2. Зафиксировать smoke-сценарии текущих А–Д и ключевые viewport.
3. Добавить read-only validation данных и файлов.
4. Расширить `LetterItem`, сохраняя старые поля на переходный период.
5. Перенести voice keys/пути в данные буквы.
6. Перенести tone/hue/palette в единый theme source.
7. Удалить из компонентов `id === "A"` и аналогичные условия.
8. Ограничить Adventure готовыми буквами, сохранив порядок А–Д.
9. Выделить общий `StageShell`, сначала без изменения class names.
10. Перевести на него Learn.
11. Затем перевести Find, Picture, Listen по одному.
12. Описать этапы конфигурационным массивом.
13. Удалить недостижимые `findLetter`/`reward` только после сравнения поведения.
14. Добавить параметр `optionCount` 3/5/7.
15. Добавить категорию букв и фильтр.
16. Добавить режим последовательного/случайного порядка.
17. Версионировать progress schema и обеспечить миграцию.
18. Подключить последовательные правила ошибок, попыток и подсказок.
19. Добавить пул похвалы, если это будет подтверждено владельцем.
20. Разделить `styles.css` по слоям/экранам, сохраняя итоговый cascade.
21. Решить судьбу GameHub, MatchGame и orphan-компонентов.
22. Провести visual QA phone/tablet/desktop/landscape.
23. Проверить GitHub Pages с `/Game/`.
24. Отдельно проверить Capacitor Android с `/`.
25. Только после этого рассматривать обновление major-зависимостей.

# R. КАК ПОСЛЕ ЭТОГО БУДЕТ ДОБАВЛЯТЬСЯ НОВАЯ БУКВА

## Контрольный факт

Буква Г уже полностью присутствует:

- запись `G` в [`letters.ts`](../src/data/letters.ts), строки 74–88;
- изображения гриба и глифа;
- choice image;
- шесть MP3;
- TTS pronunciation;
- group 1;
- tone/path/hue настройки.

## Текущее добавление аналогичной буквы

Сейчас пришлось бы изменять:

- `letters.ts`;
- `assets.ts`;
- `voiceCatalog.ts`;
- `AudioManager.ts`;
- `ToyLetter.tsx`;
- `findColors.ts`;
- `cardTones.ts`;
- `ListenAndChooseGame.tsx`;
- при особом размере — компонент/CSS.

## Целевое добавление

После модернизации потребуется:

1. Добавить изображения.
2. Добавить аудио, если оно записано.
3. Добавить одну запись `LetterContent`.
4. Указать категорию, группу, сложность и `ready`.
5. Запустить validation контента.
6. Пройти четыре существующих упражнения.

Создавать новые копии Learn, Find, Picture и Listen не потребуется.

# S. СПИСОК ФАЙЛОВ, КОТОРЫЕ ПОТЕНЦИАЛЬНО ПОТРЕБУЕТСЯ ИЗМЕНИТЬ

## Существующие файлы

- `src/types.ts`
- `src/data/letters.ts`
- `src/App.tsx`
- `src/components/AdventurePlay.tsx`
- `src/components/LearnLetters.tsx`
- `src/components/FindLetterGame.tsx`
- `src/components/PictureLetterGame.tsx`
- `src/components/ListenAndChooseGame.tsx`
- `src/components/Progress.tsx`
- `src/components/StageNav.tsx`
- `src/components/RewardScreen.tsx`
- `src/utils/useRound.ts`
- `src/utils/selectors.ts`
- `src/utils/storage.ts`
- `src/utils/assets.ts`
- `src/utils/letterCopy.ts`
- `src/utils/letterProgress.ts`
- `src/utils/cardTones.ts`
- `src/utils/findColors.ts`
- `src/audio/AudioManager.ts`
- `src/audio/voiceCatalog.ts`
- `src/styles.css`
- `README.md`
- `package.json`
- `.github/workflows/deploy.yml`

## Возможные новые файлы

- `src/data/gameConfig.ts`
- `src/data/letterThemes.ts`
- `src/components/StageShell.tsx`
- `src/game/useAdventure.ts`
- validator данных/ассетов
- тесты миграции и игровых раундов

Для самой data-driven модернизации предположительно не требуется менять:

- `vite.config.ts`;
- `capacitor.config.ts`;
- Android shell;
- GitHub Pages base.

# T. ВОПРОСЫ И НЕОПРЕДЕЛЁННОСТИ ДО НАЧАЛА РЕФАКТОРИНГА

## Вопросы владельцу проекта

1. Нужно ли сохранять отдельный хаб Find/Picture/Listen или оставить только линейное приключение?
2. Должны ли стрелки этапов позволять пропускать задания без правильного ответа?
3. После буквы Д игра сейчас должна завершаться, возвращаться на главную или показывать закрытые будущие буквы?
4. Должно ли приключение возобновляться с последней буквы и этапа?
5. Каков точный **критерий освоения буквы**:
   - три правильных ответа;
   - успешное завершение всех четырёх этапов;
   - сочетание этих условий;
   - другой критерий?
6. Нужны ли отдельные профессиональные **MP3 для всех реплик и букв**, или допустим смешанный режим MP3/TTS?
7. Должен ли TTS оставаться обязательным fallback, если MP3 отсутствует или не воспроизводится?
8. Нужно ли подключить уже существующие `letter-*.mp3` к Learn вместо текущего TTS?
9. Как классифицировать **Й, Ъ, Ь, Ы**, а также Е, Ё, Ю, Я и другие йотированные буквы в фильтрах «гласные/согласные/особые»?
10. Какие буквы должны иметь предметное слово, а какие — специальный учебный сценарий без обычной картинки?
11. Как должны сочетаться:
    - фильтр букв;
    - сложность 3/5/7;
    - алфавитный/случайный порядок;
    - группы разблокировки?
12. Должен ли пользователь выбирать конкретную букву до начала Adventure или только в отдельном Learn?
13. Нужна ли адаптивная сложность на основе ошибок или только ручной выбор 3/5/7?
14. Какие **изображения** являются финальными, а какие исходниками, черновиками или резервом?
15. Нужно ли хранить SVG/PNG-исходники внутри `public/`, либо вынести их из runtime assets?
16. Должны ли разные упражнения использовать разные изображения предмета или один универсальный файл?
17. Нужно ли сохранять `GameHubScreen` и отдельные игры?
18. Нужен ли в продукте **MatchGame «Собери пару»**?
19. Нужен ли отдельный **экран настроек**?
20. Какие настройки должны находиться в нём: music, sound, difficulty, filters, order, reset progress?
21. Как должна обрабатываться **ошибка ребёнка**:
    - только мягкая голосовая реакция;
    - визуальный shake;
    - скрытие неправильного варианта;
    - повтор инструкции;
    - демонстрация правильного ответа?
22. Должны ли error sound и voice reaction быть одинаковыми во всех упражнениях?
23. После какого количества неправильных **попыток показывать подсказку**: после 1, 2, 3 или адаптивно?
24. Нужен ли лимит попыток и что происходит после его достижения?
25. Должны ли подсказки отличаться для Find, Picture и Listen?
26. Нужна ли **случайная похвала**, и сколько вариантов текста/MP3 следует подготовить?
27. Похвала должна зависеть от буквы, упражнения, серии правильных ответов или награды?
28. Должна ли игра полностью работать **offline**, включая шрифт Nunito?
29. Нужно ли обеспечивать offline-кеширование/PWA, или достаточно офлайн-работы APK?
30. Какие минимальные Android/API и версии **Android WebView** требуется поддерживать?
31. Допустимо ли использование CSS `:has()` для минимально поддерживаемого WebView?
32. Какие физические устройства и разрешения входят в обязательную матрицу тестирования?
33. Какой экран/размер является **эталонным для visual regression**?
34. Нужно ли считать опубликованный desktop layout неизменяемым пиксельным эталоном?
35. Как должны выглядеть phone landscape и tablet split-screen, если композиция не помещается?
36. Нужно ли обновлять **React/Vite/TypeScript** вообще?
37. Если обновлять React/Vite, выполнять ли это отдельным этапом после игрового рефакторинга? Рекомендация аудита — да.
38. Следует ли обновить Capacitor 8.5.0 → 8.5.1 отдельно как patch update?
39. Нужно ли сохранить существующий progress key или вводить новую версию с миграцией?
40. Должны ли звёзды начисляться за каждый правильный этап, за букву целиком или по другой формуле?
41. Нужно ли позволять повторно получать звёзды за уже освоенную букву?
42. Что именно должны показывать награды на 5/10/15/20 звёзд, учитывая, что `RewardScreen` сейчас игнорирует title/text?
43. Должна ли кнопка Home на главной быть удалена как декоративная или получить отдельное действие?
44. Нужен ли прямой доступ к альбому Stars с главного экрана?
45. Какая навигационная модель является целевой: только Home/Adventure или Home/Hub/Standalone games?

---

## Итог аудита

Проект уже имеет правильную основу для модернизации без смены стека: централизованный каталог букв, универсальные упражнения и общий игровой hook. Основная задача будущего рефакторинга — не переписать игру, а завершить разделение контента и логики, объединить распределённый hardcode, ограничить flow готовыми буквами и упорядочить CSS/навигацию. До решений владельца по разделу T реализацию целевой архитектуры начинать не следует.
