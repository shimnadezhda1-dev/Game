interface WorldBackgroundProps {
  variant?: "cover" | "play";
}

export function WorldBackground({ variant = "play" }: WorldBackgroundProps) {
  return (
    <div className={`world world-${variant}`} aria-hidden>
      <div className="world-sky" />
      <div className="toy-sun">
        <span className="sun-core">
          <i className="sun-eye sun-eye-l" />
          <i className="sun-eye sun-eye-r" />
          <i className="sun-smile" />
        </span>
      </div>
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" />
      {variant === "cover" ? (
        <>
          <div className="balloon balloon-a" />
          <div className="balloon balloon-b" />
          <div className="balloon balloon-c" />
          <div className="balloon balloon-d" />
          <div className="balloon balloon-e" />
        </>
      ) : null}
      <div className="hills">
        <span className="hill hill-left" />
        <span className="hill hill-right" />
        <span className="hill hill-mid" />
      </div>
      <div className="tree tree-a" />
      <div className="tree tree-b" />
      <div className="grass-line" />
      <div className="flowers">
        <span className="flower f-a" />
        <span className="flower f-b" />
        <span className="flower f-c" />
        <span className="flower f-d" />
        <span className="flower f-e" />
        <span className="flower f-f" />
      </div>
      <div className="tree tree-c" />
    </div>
  );
}
