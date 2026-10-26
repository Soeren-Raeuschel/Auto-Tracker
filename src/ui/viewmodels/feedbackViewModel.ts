/**
 * Reine Logik fuer Fehler-, Lade- und Leerzustaende (T8.3).
 * Prioritaet: Fehler zuerst, dann Ladezustand, dann leerer Zustand.
 */
export type FeedbackKind = 'error' | 'loading' | 'empty' | 'ready';

export interface FeedbackInput {
  loading: boolean;
  error: string | null;
  empty: boolean;
}

export function pickFeedbackState({ loading, error, empty }: FeedbackInput): FeedbackKind {
  if (error !== null) return 'error';
  if (loading) return 'loading';
  if (empty) return 'empty';
  return 'ready';
}

/**
 * "Stand"-Zeitstempel fuer Repo-Daten (T8.3): Last-Modified oder ISO-Datum
 * wird menschenlesbar de-DE formatiert. Ungueltig oder fehlend -> null.
 */
export function formatStandTimestamp(value: string | null): string | null {
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Stand: ${formatter.format(date)}`;
}
