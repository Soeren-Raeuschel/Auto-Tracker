// T11.3: Orchestriert alle Pipeline-Schritte. Ein fehlgeschlagener Schritt bricht
// die anderen nicht ab; der Exit-Code meldet den Fehler (CI committet dann nicht).
import { FetchNewsStep } from './fetchNews';
import { MatchNewsStep } from './matchNews';
import { ExtractCandidatesStep } from './extractCandidates';
import { SnapshotPricesStep } from './priceHistory';

const steps: { run(): Promise<boolean> }[] = [
  new FetchNewsStep(),
  new MatchNewsStep(),
  new ExtractCandidatesStep(),
  new SnapshotPricesStep(),
];

for (const step of steps) {
  const ok = await step.run();
  if (!ok) {
    process.exitCode = 1;
  }
}
