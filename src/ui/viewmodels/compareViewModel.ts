import { carLabel } from '../../domain/car';
import { attributeCatalog } from '../../domain/attributeCatalog';
import type { Criterion } from '../../domain/criterion';
import type { ScoredCar } from '../../domain/score';
import { attributeRows } from './carDetailViewModel';

export const MAX_COMPARE_CARS = 3;

/** Eine Auto-Spalte im Vergleich (T3.3). */
export interface CompareColumnVM {
  id: string;
  label: string;
  score: number;
  excluded: boolean;
  excludedLabel: string | null;
}

/** Eine Zeile mit einem Wert pro Auto; bestIndex markiert die beste Note (hoeller ist besser). */
export interface CompareRowVM {
  key: string;
  label: string;
  values: string[];
  bestIndex: number | null;
}

export interface CompareVM {
  columns: CompareColumnVM[];
  attributeRows: CompareRowVM[];
  criteriaRows: CompareRowVM[];
}

/** Ein Auswahl-Slot (1 bis 3) fuer die Auswahl-Oberflaeche. */
export interface CompareSlotVM {
  index: number;
  /** Gewaehlte Auto-ID oder "" fuer "kein Auto". */
  value: string;
  options: { id: string; label: string }[];
}

/** IDs aus dem Query-Parameter `ids`: trimmen, leere entfernen, Deduplikate, max. 3. */
export function parseCompareIds(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (id) seen.add(id);
  }
  return [...seen].slice(0, MAX_COMPARE_CARS);
}

/** IDs aus den Slots zurueck in die URL-Form `a,b,c` (null, wenn leer). */
export function idsToParam(ids: string[]): string | null {
  const unique = parseCompareIds(ids.join(','));
  return unique.length > 0 ? unique.join(',') : null;
}

/** Setzt oder entfernt den Wert eines Slots, leere Slots fallen weg. */
export function idsWithSlot(ids: string[], index: number, value: string): string[] {
  const filled = [...ids];
  while (filled.length < MAX_COMPARE_CARS) filled.push('');
  filled[index] = value;
  return parseCompareIds(filled.join(','));
}

function toCriteriaRow(criterion: Criterion, scored: ScoredCar[]): CompareRowVM {
  const values = scored.map((entry) => {
    const detail = entry.details.find((d) => d.criterionId === criterion.id);
    return detail === undefined || detail.score === null
      ? 'unbekannt'
      : String(Math.round(detail.score * 100));
  });
  const numeric = values.map((value) => (value === 'unbekannt' ? Number.NaN : Number(value)));
  let bestIndex: number | null = null;
  let best = Number.NaN;
  numeric.forEach((value, index) => {
    if (!Number.isNaN(value) && (Number.isNaN(best) || value > best)) {
      best = value;
      bestIndex = index;
    }
  });
  return { key: criterion.id, label: criterion.label, values, bestIndex };
}

// Pattern: MVVM. Pure function = easy to test without a browser.
export function toCompareViewModel(scored: ScoredCar[], criteria: Criterion[]): CompareVM {
  // Attribut-Zeilen: Katalog-Reihenfolge, Wertformatierung aus dem Detail-ViewModel.
  const perCar = scored.map((entry) => {
    const rows = attributeRows(entry.car);
    return new Map(rows.map((row) => [row.key, row.value]));
  });
  const attributeRowVMs: CompareRowVM[] = attributeCatalog.map((definition) => ({
    key: definition.key,
    label: definition.label,
    values: perCar.map((map) => map.get(definition.key) ?? 'unbekannt'),
    bestIndex: null, // Richtung pro Attribut unbekannt, daher keine beste Note
  }));

  return {
    columns: scored.map((entry) => ({
      id: entry.car.id,
      label: carLabel(entry.car),
      score: entry.total,
      excluded: entry.excluded,
      excludedLabel: entry.excluded ? 'K.-o.' : null,
    })),
    attributeRows: attributeRowVMs,
    criteriaRows: criteria.map((criterion) => toCriteriaRow(criterion, scored)),
  };
}

/** Auswahl-Oberflaeche: MAX_COMPARE_CARS Slots, jedes listet alle Autos als Option. */
export function toCompareSelectionVM(
  available: { id: string; label: string }[],
  ids: string[],
): CompareSlotVM[] {
  return Array.from({ length: MAX_COMPARE_CARS }, (_, index) => ({
    index,
    value: ids[index] ?? '',
    options: available,
  }));
}
