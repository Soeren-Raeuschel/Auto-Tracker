import { describe, expect, it } from 'vitest';
import { pickFeedbackState, formatStandTimestamp } from './feedbackViewModel';

describe('pickFeedbackState', () => {
  it('Fehler hat Vorrang vor Ladezustand', () => {
    expect(pickFeedbackState({ loading: true, error: 'kaputt', empty: true })).toBe('error');
  });

  it('Ladezustand vor leer', () => {
    expect(pickFeedbackState({ loading: true, error: null, empty: true })).toBe('loading');
  });

  it('leer nur ohne Fehler', () => {
    expect(pickFeedbackState({ loading: false, error: null, empty: true })).toBe('empty');
  });

  it('Daten vorhanden', () => {
    expect(pickFeedbackState({ loading: false, error: null, empty: false })).toBe('ready');
  });
});

describe('formatStandTimestamp', () => {
  it('null bleibt null', () => {
    expect(formatStandTimestamp(null)).toBeNull();
  });

  it('Formatiert Last-Modified de-DE', () => {
    const result = formatStandTimestamp('Mon, 26 Oct 2026 10:30:00 GMT');
    expect(result).toMatch(/^Stand: \d{2}\.\d{2}\.2026, \d{2}:\d{2}$/);
  });

  it('Ungueltiges Datum wird verworfen', () => {
    expect(formatStandTimestamp('kein datum')).toBeNull();
  });
});
