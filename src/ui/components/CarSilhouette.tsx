import './CarSilhouette.css';

/** Platzhalter-Silhouette bis zur 3D-Ansicht. Vorerst überall dieselbe Form. */
export function CarSilhouette({ bodyType }: { bodyType: string }) {
  void bodyType;
  return (
    <div className="car-silhouette">
      <svg
        viewBox="0 0 252 84"
        role="img"
        aria-label="Fahrzeugsilhouette"
        className="car-silhouette__svg"
      >
        <defs>
          <linearGradient id="car-silhouette-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity=".02" />
          </linearGradient>
        </defs>
        <ellipse className="car-silhouette__glow" cx="126" cy="70" rx="110" ry="10" />
        <path
          d="M6 60 C10 54 28 51 48 46 C66 32 92 25 130 25 C160 25 188 31 206 46 C224 50 240 54 246 60 L247 68 L6 68 Z"
          fill="url(#car-silhouette-gradient)"
          stroke="var(--accent)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M72 44 C86 32 108 29 130 29 L152 29 C172 30 188 36 200 46 Z"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity=".55"
        />
        <g fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.4">
          <circle cx="58" cy="68" r="12" />
          <circle cx="198" cy="68" r="12" />
        </g>
      </svg>
    </div>
  );
}
