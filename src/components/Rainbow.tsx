export function Rainbow() {
  return (
    <div className="rainbow" aria-hidden="true">
      <svg className="rainbow-svg" viewBox="0 0 1000 420" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="rb-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="rb-soft" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#5b3d14" floodOpacity="0.16" />
          </filter>
        </defs>
        <g fill="none" strokeLinecap="round" filter="url(#rb-soft)">
          <path d="M80 390 A420 420 0 0 1 920 390" stroke="#ff5d7a" strokeWidth="42" />
          <path d="M118 390 A382 382 0 0 1 882 390" stroke="#ff9f1c" strokeWidth="40" />
          <path d="M156 390 A344 344 0 0 1 844 390" stroke="#ffd93d" strokeWidth="38" />
          <path d="M194 390 A306 306 0 0 1 806 390" stroke="#7ed957" strokeWidth="36" />
          <path d="M232 390 A268 268 0 0 1 768 390" stroke="#4fc3ff" strokeWidth="34" />
          <path d="M270 390 A230 230 0 0 1 730 390" stroke="#7c4dff" strokeWidth="32" />
        </g>
        <path d="M80 390 A420 420 0 0 1 920 390" fill="none" stroke="url(#rb-shine)" strokeWidth="18" />
      </svg>
      <span className="rainbow-cloud rainbow-cloud-left" />
      <span className="rainbow-cloud rainbow-cloud-right" />
    </div>
  );
}
