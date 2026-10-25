import type { RankingRowVM, RankingVM } from './viewmodels/rankingViewModel';

function Row({ row }: { row: RankingRowVM }) {
  return (
    <tr style={{ opacity: row.excluded ? 0.4 : 1 }}>
      <td>{row.rank}</td>
      <td>
        {row.label}
        {row.excludedLabel ? ` (${row.excludedLabel})` : ''}
      </td>
      <td>{row.subtitle}</td>
      <td style={{ textAlign: 'right' }}>{row.score}</td>
    </tr>
  );
}

/** Dumb view: only renders what the ViewModel provides. Real design follows in T10.4. */
export function RankingTable({ viewModel }: { viewModel: RankingVM }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      {viewModel.hero && (
        <p>
          Beste Eignung: <strong>{viewModel.hero.label}</strong> ({viewModel.hero.score}/100)
        </p>
      )}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th align="left">#</th>
            <th align="left">Auto</th>
            <th align="left">Eckdaten</th>
            <th align="right">Score</th>
          </tr>
        </thead>
        <tbody>
          {viewModel.hero && <Row row={viewModel.hero} />}
          {viewModel.rest.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
