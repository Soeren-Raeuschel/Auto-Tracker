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
      <p className="price-history__latest">
        <span className="label">Aktueller Preis</span> {viewModel.latestLabel}
      </p>
      {viewModel.path && (
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
      )}
      <p className="price-history__meta label">
        {viewModel.span ? `${viewModel.span} · ` : ''}min {viewModel.minLabel} · max{' '}
        {viewModel.maxLabel}
      </p>
    </div>
  );
}
