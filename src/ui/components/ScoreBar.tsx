import './ScoreBar.css';

/** Balken für einen Score 0 bis 100. Füllung nur per transform (transform-origin: left). */
export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="score-bar" role="img" aria-label={label ?? `Eignung ${clamped} von 100`}>
      <div className="score-bar__fill" style={{ transform: `scaleX(${clamped / 100})` }} />
    </div>
  );
}
