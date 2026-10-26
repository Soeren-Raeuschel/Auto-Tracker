import type { PriceChartVM } from '../viewmodels/priceHistoryViewModel';
import './PriceHistoryChart.css';

const VIEWBOX = '0 0 320 120';

/** Statisches SVG-Diagramm der Preis-Historie (T7.6), keine Chart-Library. Rendert nur. */
export function PriceHistoryChart({ viewModel }: { viewModel: PriceChartVM }) {
  if (!viewModel.available) {
    return <p className="label">Noch keine Preis-Historie gesammelt.</p>;
  }
  return (
    <div className="price-history">
      <div className="price-history__summary">
        <div>
          <span className="price-history__eyebrow label">Aktueller Preis</span>
          <strong className="price-history__latest">{viewModel.latestLabel}</strong>
        </div>
        {viewModel.span && <span className="price-history__period label">{viewModel.span}</span>}
      </div>
      {viewModel.path ? (
        <svg
          className="price-history__chart"
          viewBox={VIEWBOX}
          role="img"
          aria-label={`Preis-Historie von ${viewModel.maxLabel} bis ${viewModel.minLabel}`}
        >
          <path className="price-history__line" d={viewModel.path} />
          {viewModel.points.map((p) => (
            <circle key={p.date} cx={p.x} cy={p.y} r={3} className="price-history__dot">
              <title>{`${p.date}: ${p.priceLabel}`}</title>
            </circle>
          ))}
        </svg>
      ) : (
        <div className="price-history__empty-chart">Erster erfasster Preis</div>
      )}
      <div className="price-history__range" aria-label="Preisbereich">
        <span>
          <span className="label">Tiefster Preis</span>
          <strong>{viewModel.minLabel}</strong>
        </span>
        <span>
          <span className="label">Höchster Preis</span>
          <strong>{viewModel.maxLabel}</strong>
        </span>
      </div>
    </div>
  );
}
