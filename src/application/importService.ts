import type { Car } from '../domain/car';
import type { CarCandidate } from '../domain/carCandidate';
import { createCarFromCandidate } from './carFactory';

/** Wandelt extrahierte Kandidaten inCars (Factory setzt id + Provenance). */
export function toImportableCars(
  candidates: readonly CarCandidate[],
  today: Date = new Date(),
): Car[] {
  return candidates.map((candidate) => createCarFromCandidate(candidate, today));
}

export interface MergeResult {
  /** Neue Autos, die noch nicht vorhanden sind. */
  added: Car[];
  /** Autos, deren id es schon gibt (kein stilles Duplikat). */
  skipped: Car[];
}

/** Reine Merge-Logik: importierte Autos an die bekannten Liste anhängen. */
export function mergeImported(existing: readonly Car[], imported: readonly Car[]): MergeResult {
  const existingIds = new Set(existing.map((car) => car.id));
  const added: Car[] = [];
  const skipped: Car[] = [];
  for (const car of imported) {
    if (existingIds.has(car.id)) {
      skipped.push(car);
    } else {
      existingIds.add(car.id);
      added.push(car);
    }
  }
  return { added, skipped };
}

/** Fertiger JSON-Block (alle Autos inkl. neuer), zum Einfügen in cars.json. */
export function buildCarsJsonExport(existing: readonly Car[], imported: readonly Car[]): string {
  const { added } = mergeImported(existing, imported);
  return JSON.stringify([...existing, ...added], null, 2);
}
