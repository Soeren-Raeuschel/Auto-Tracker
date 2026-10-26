import type { CarCandidate } from '../../domain/carCandidate';
import { slugify } from '../../application/carFactory';
import { toCarPreviewVM, type CarPreviewVM } from './importViewModel';

/** Stabile Kennung eines Kandidaten (wie die spaetere Auto-ID). */
export function candidateKey(candidate: CarCandidate): string {
  return slugify([candidate.brand, candidate.model, candidate.variant].filter(Boolean).join(' '));
}

export interface EditableCandidate {
  brand: string;
  model: string;
  variant: string;
}

/** Bearbeitbare Textfelder eines Kandidaten (T7.5: pruefen, bearbeiten). */
export function toEditable(candidate: CarCandidate): EditableCandidate {
  return {
    brand: candidate.brand,
    model: candidate.model,
    variant: candidate.variant ?? '',
  };
}

/** Wendet die Bearbeitung an; leere Marke/Modell bleibt unveraendert. */
export function applyEdit(candidate: CarCandidate, edit: EditableCandidate): CarCandidate {
  const brand = edit.brand.trim() === '' ? candidate.brand : edit.brand.trim();
  const model = edit.model.trim() === '' ? candidate.model : edit.model.trim();
  const variant = edit.variant.trim();
  return {
    ...candidate,
    brand,
    model,
    ...(variant === '' ? {} : { variant }),
  };
}

export interface CandidateRowVM {
  /** Kennung, auch fuer Verwerfen/uebernehmen. */
  id: string;
  label: string;
  sourceUrl: string;
  preview: CarPreviewVM;
  /** Original-Kandidat fuer Uebernehmen/Verwerfen (Hook-Callback). */
  candidate: CarCandidate;
  /** Bearbeitbare Textfelder als Ausgangswert. */
  editable: EditableCandidate;
}

export interface CandidatesVM {
  rows: CandidateRowVM[];
  decidedCount: number;
  empty: boolean;
}

/** Reine Funktion: offene Kandidaten (noch nicht uebernommen/verworfen). */
// Pattern: MVVM. Pure function = easy to test without a browser.
export function toCandidatesViewModel(
  candidates: readonly CarCandidate[],
  dismissedIds: readonly string[],
): CandidatesVM {
  const dismissed = new Set(dismissedIds);
  const rows = candidates
    .filter((candidate) => !dismissed.has(candidateKey(candidate)))
    .map((candidate) => {
      const id = candidateKey(candidate);
      return {
        id,
        label: [candidate.brand, candidate.model, candidate.variant].filter(Boolean).join(' '),
        sourceUrl: candidate.sourceUrl,
        preview: toCarPreviewVM({ ...candidate, id }),
        candidate,
        editable: toEditable(candidate),
      };
    });
  return {
    rows,
    decidedCount: candidates.length - rows.length,
    empty: rows.length === 0,
  };
}
