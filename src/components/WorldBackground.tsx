interface WorldBackgroundProps {
  variant?: "cover" | "play";
}

export function WorldBackground({ variant = "play" }: WorldBackgroundProps) {
  return (
    <div className={`world world-${variant}`} aria-hidden>
      <div className="world-sky" />
      <div className="sun-glow" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      {variant === "cover" ? (
        <>
          <div className="balloon balloon-a" />
          <div className="balloon balloon-b" />
          <div className="balloon balloon-c" />
          <span className="float-letter fl-a">А</span>
          <span className="float-letter fl-b">Б</span>
          <span className="float-letter fl-c">В</span>
          <div className="tiny-arc" />
        </>
      ) : null}
      <div className="sparkle s1" />
      <div className="sparkle s2" />
      <div className="hills">
        <span className="hill hill-left" />
        <span className="hill hill-right" />
        <span className="hill hill-mid" />
      </div>
      <div className="butterfly" />
      <div className="flowers">
        <span className="flower f-a" />
        <span className="flower f-b" />
        <span className="flower f-c" />
      </div>
    </div>
  );
}
