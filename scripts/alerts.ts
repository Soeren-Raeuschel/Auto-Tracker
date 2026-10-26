// T7.7: Vergleicht den Stand vor und nach dem Pipeline-Lauf und meldet neue
// KI-Kandidaten sowie Preisfaelle. Reine Logik unten, Node I/O nur in main().
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { CarCandidate } from '../src/domain/carCandidate';
import type { PriceHistory } from '../src/ports/priceHistoryRepository';
import { detectPriceDrops, type PriceDrop } from './priceHistoryLogic';

export interface AlertsResult {
  newCandidateCount: number;
  priceDrops: PriceDrop[];
}

/** Neue Kandidaten = Anzahl nach minus Anzahl vor (Dedupe in mergeCandidates). */
export function detectAlerts(
  candidatesBefore: CarCandidate[],
  candidatesAfter: CarCandidate[],
  historyBefore: PriceHistory,
  historyAfter: PriceHistory,
  minPercent = 3,
): AlertsResult {
  return {
    newCandidateCount: Math.max(0, candidatesAfter.length - candidatesBefore.length),
    priceDrops: detectPriceDrops(historyAfter, minPercent).filter(
      (drop) => {
        const before = historyBefore[drop.carId] ?? [];
        // Nur melden, wenn der letzte Preis neu ist (dieser Lauf hat ihn angehaengt).
        const lastBefore = before[before.length - 1]?.priceEur ?? null;
        const lastAfter = historyAfter[drop.carId]?.at(-1)?.priceEur ?? null;
        return lastAfter !== null && lastAfter !== lastBefore;
      },
    ),
  };
}

/** Markdown-Text fuer das GitHub-Issue-Backend. */
export function alertsSummary(result: AlertsResult, labelOf: (carId: string) => string): string {
  const lines: string[] = [];
  if (result.newCandidateCount > 0) {
    lines.push(`- ${result.newCandidateCount} neue KI-Kandidaten zur Pruefung unter /candidates`);
  }
  for (const drop of result.priceDrops) {
    lines.push(
      `- Preisfall ${labelOf(drop.carId)}: ${drop.from} -> ${drop.to} EUR (-${drop.percent} %)`,
    );
  }
  return lines.join('\n');
}

async function main(): Promise<void> {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const beforeDir = process.argv[2];
  if (!beforeDir) throw new Error('usage: tsx scripts/alerts.ts <beforeDir>');
  const read = (path: string) => readFile(path, 'utf8').then(JSON.parse).catch(() => []);
  const [candidatesBefore, candidatesAfter, historyBefore, historyAfter] = await Promise.all([
    read(`${beforeDir}/candidates.json`),
    read(`${root}public/data/candidates.json`),
    read(`${beforeDir}/price-history.json`),
    read(`${root}public/data/price-history.json`),
  ]);
  const result = detectAlerts(
    candidatesBefore,
    candidatesAfter,
    historyBefore,
    historyAfter,
  );
  const summary = alertsSummary(result, (id) => id);
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `alerts=${summary ? 'true' : 'false'}\n`, {
      flag: 'a',
    });
  }
  console.log(`alerts=${summary ? 'true' : 'false'}`); // eslint-disable-line no-console
  if (summary) {
    console.log(`ALERTS_BEGIN\n${summary}\nALERTS_END`); // eslint-disable-line no-console
  }
}

if (process.argv[1] && process.argv[1].endsWith('alerts.ts')) {
  await main();
}
