import './ScoreRing.css';

const CIRCUMFERENCE = 176;

/** Kreisförmiger Score-Indikator, 64x64 SVG, Start oben. */
export function ScoreRing({ score, label }: { score: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const dashoffset = CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <div className="score-ring" role="img" aria-label={label ?? `Eignung ${clamped} von 100`}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="score-ring__track" cx="32" cy="32" r="28" />
        <circle
          className="score-ring__fill"
          cx="32"
          cy="32"
          r="28"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="score-ring__value">{clamped}</span>
    </div>
  );
}
