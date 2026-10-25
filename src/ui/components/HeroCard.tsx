import './HeroCard.css';
import { CarSilhouette } from './CarSilhouette';
import { ScoreRing } from './ScoreRing';
import { confidenceBadgeLabel, type RankingRowVM } from '../viewmodels/rankingViewModel';

/** Auto auf Platz 1. Rendert nur, alle Werte kommen aus dem ViewModel. */
export function HeroCard({ row }: { row: RankingRowVM }) {
  const badge = confidenceBadgeLabel(row.confidenceBadge);
  return (
    <section className="hero" aria-label={`Beste Eignung: ${row.label}, ${row.score} von 100`}>
      <p className="hero__eyebrow label">Beste Eignung</p>
      <div className="hero__grid">
        <div className="hero__car">
          <CarSilhouette bodyType={row.bodyType} />
          <h2 className="hero__name">{row.label}</h2>
          {badge && <span className="hero__badge label">{badge}</span>}
        </div>
        <div className="hero__side">
          <span className="hero__score-desktop">{row.score}</span>
          <span className="hero__score-mobile">
            <ScoreRing score={row.score} label={`Eignung ${row.score} von 100`} />
          </span>
          <ul className="hero__facts">
            {row.facts.map((fact) => (
              <li key={fact.label} className="hero__fact">
                <span className="label">{fact.label}</span>
                <span className="hero__fact-value">{fact.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
