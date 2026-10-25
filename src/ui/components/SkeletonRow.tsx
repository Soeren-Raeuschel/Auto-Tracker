import './SkeletonRow.css';

/**
 * Skeleton-Ladezustand (T10.6): Glas-Karte mit Shimmer-Streifen, der per
 * `translateX` ueber die Karte laeuft. Kein Spinner.
 */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton__row glass">
          <span className="skeleton__line skeleton__line--rank" />
          <span className="skeleton__line skeleton__line--name" />
          <span className="skeleton__line skeleton__line--bar" />
          <span className="skeleton__line skeleton__line--score" />
          <span className="skeleton__shimmer" />
        </div>
      ))}
    </div>
  );
}
