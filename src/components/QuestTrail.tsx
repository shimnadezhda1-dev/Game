interface QuestTrailProps {
  step: number;
  total?: number;
}

export function QuestTrail({ step, total = 5 }: QuestTrailProps) {
  return (
    <div className="quest-trail" aria-hidden>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`trail-dot ${index < step ? "done" : ""} ${index === step ? "current" : ""}`}
        >
          {index === total - 1 ? "🎁" : index < step ? "★" : ""}
        </span>
      ))}
    </div>
  );
}
