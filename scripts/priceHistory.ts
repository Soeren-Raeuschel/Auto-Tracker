// T7.6: Pipeline-Schritt — haengt priceEur pro Auto mit Datum an
// public/data/price-history.json an. Bei Fehler bleibt der letzte Stand (T11.3).
// Reine Logik in priceHistoryLogic.ts, hier nur Node I/O und der Template-Hook.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PipelineStep } from './pipelineStep';
import type { Car } from '../src/domain/car';
import type { PriceHistory } from '../src/ports/priceHistoryRepository';
import { buildPriceHistory, sortHistory } from './priceHistoryLogic';

const root = fileURLToPath(new URL('..', import.meta.url));
const CARS = `${root}public/data/cars.json`;
const OUTPUT = `${root}public/data/price-history.json`;

export class SnapshotPricesStep extends PipelineStep {
  readonly name = 'snapshotPrices';

  protected async execute(): Promise<void> {
    let existing: PriceHistory = {};
    try {
      existing = JSON.parse(await readFile(OUTPUT, 'utf8')) as PriceHistory;
    } catch {
      // Erster Lauf oder kaputte Datei: neu anfangen, niemals abbrechen.
    }
    const cars = JSON.parse(await readFile(CARS, 'utf8')) as Car[];
    const today = new Date().toISOString().slice(0, 10);
    const history = sortHistory(buildPriceHistory(existing, cars, today));
    await writeFile(OUTPUT, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
  }
}
