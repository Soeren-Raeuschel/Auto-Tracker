import { useState } from 'react';
import './RankRow.css';
import { Icon } from './Icon';
import { ScoreBar } from './ScoreBar';
import { confidenceBadgeLabel, type RankingRowVM } from '../viewmodels/rankingViewModel';

/**
 * Eine Zeile der Rangliste, aufklappbar mit Einzelscores. Rendert nur.
 * `delayMs` staffelt das Einblenden (T10.6), `data-row-id` dient dem FLIP-Hook.
 */
export function RankRow({ row, delayMs = 0 }: { row: RankingRowVM; delayMs?: number }) {
  const [open, setOpen] = useState(false);
  const badge = confidenceBadgeLabel(row.confidenceBadge);
  return (
    <article
      className={`rank-row glass rise${row.excluded ? ' rank-row--excluded' : ''}`}
      data-row-id={row.id}
      style={delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <button
        type="button"
        className="rank-row__summary"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="rank-row__rank label">{row.rank}</span>
        <span className="rank-row__name">{row.label}</span>
        {row.excludedLabel && <span className="rank-row__ko label">{row.excludedLabel}</span>}
        <span className="rank-row__bar">
          <ScoreBar score={row.score} label={`Eignung ${row.score} von 100`} />
        </span>
        <span className="rank-row__score">{row.score}</span>
        <span className="rank-row__chevron" data-open={open}>
          <Icon name="chevronDown" size={16} />
        </span>
      </button>
      {open && (
        <div className="rank-row__details">
          <ul className="rank-row__facts">
            {row.facts.map((fact) => (
              <li key={fact.label} className="rank-row__fact">
                <span className="label">{fact.label}</span>
                <span>{fact.value}</span>
              </li>
            ))}
          </ul>
          {badge && <p className="rank-row__badge label">{badge}</p>}
          {row.unknownLabel && <p className="rank-row__unknown label">{row.unknownLabel}</p>}
          {row.excludedByLabels.length > 0 && (
            <p className="rank-row__ko-details">K.-o. durch: {row.excludedByLabels.join(', ')}</p>
          )}
          <ul className="rank-row__criteria">
            {row.criteria.map((criterion) => (
              <li key={criterion.id} className="rank-row__criterion">
                <span className="rank-row__criterion-label">{criterion.label}</span>
                {criterion.score === null ? (
                  <span className="rank-row__criterion-unknown">unbekannt</span>
                ) : (
                  <span className="rank-row__criterion-score">
                    <ScoreBar
                      score={criterion.score}
                      label={`${criterion.label}: ${criterion.score} von 100`}
                    />
                    <span className="rank-row__criterion-value">{criterion.score}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
