const GAME_TITLE = "Весёлый алфавит";
const [TITLE_FIRST, TITLE_SECOND] = GAME_TITLE.split(" ");

export const TITLE_LETTER_COLORS = [
  "#ff9a1a",
  "#ffd23f",
  "#6fce4a",
  "#3ec3ff",
  "#2f8de8",
  "#ff6b88"
] as const;

export function TitleStyleLetters({
  text,
  className,
  startIndex = 0
}: {
  text: string;
  className: string;
  startIndex?: number;
}) {
  return (
    <>
      {Array.from(text).map((character, index) => (
        <span
          key={`${text}-${startIndex}-${index}`}
          className={className}
          style={{
            color: TITLE_LETTER_COLORS[(startIndex + index) % TITLE_LETTER_COLORS.length]
          }}
        >
          {character}
        </span>
      ))}
    </>
  );
}

function TitleWord({
  word,
  startIndex
}: {
  word: string;
  startIndex: number;
}) {
  return (
    <TitleStyleLetters text={word} className="home-game-title__letter" startIndex={startIndex} />
  );
}

export function GameTitle() {
  return (
    <h1 className="home-game-title">
      <span className="home-game-title__line">
        <TitleWord word={TITLE_FIRST} startIndex={0} />
      </span>
      <span className="home-game-title__space"> </span>
      <span className="home-game-title__line">
        <TitleWord word={TITLE_SECOND} startIndex={TITLE_FIRST.length} />
      </span>
    </h1>
  );
}
