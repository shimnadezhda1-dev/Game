interface WorldBackgroundProps {
  variant?: "cover" | "play";
}

export function WorldBackground({ variant = "play" }: WorldBackgroundProps) {
  return (
    <div className={`world world-${variant}`} aria-hidden>
      <div className="world-sky" />
      {variant === "cover" ? <div className="world-rainbow" /> : null}
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      {variant === "cover" ? <div className="butterfly" /> : null}
      <div className="sparkle s1" />
      <div className="sparkle s2" />
      <div className="hills">
        <span className="hill hill-left" />
        <span className="hill hill-right" />
        <span className="hill hill-mid" />
      </div>
      <div className="flowers">
        <span className="flower f-a" />
        <span className="flower f-b" />
        <span className="flower f-c" />
      </div>
    </div>
  );
}
