interface CharacterProps {
  mood: "happy" | "tip" | "neutral";
  message?: string;
}

export function Character({ mood, message }: CharacterProps) {
  const emoji = mood === "happy" ? "🦊✨" : mood === "tip" ? "🦊💡" : "🦊";
  return (
    <div className={`character character-${mood}`}>
      <div className="character-emoji" aria-hidden>
        {emoji}
      </div>
      {message ? <div className="character-bubble">{message}</div> : null}
    </div>
  );
}
