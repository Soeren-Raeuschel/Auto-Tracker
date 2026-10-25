import { describe, expect, it } from 'vitest';
import { backupSchema, carSchema, criterionSchema, parseValid, settingsSchema } from './schemas';

const validCar = {
  id: 'a',
  brand: 'Xpeng',
  model: 'P7+',
  bodyType: 'sedan',
  powertrain: 'bev',
  attributes: { priceEur: { value: 53600, confidence: 'estimated' } },
};

describe('schemas', () => {
  it('accepts a valid car, including unknown (null) values', () => {
    expect(carSchema.safeParse(validCar).success).toBe(true);
    const unknown = { ...validCar, attributes: { hud: { value: null, confidence: 'estimated' } } };
    expect(carSchema.safeParse(unknown).success).toBe(true);
  });

  it('rejects a car with an unknown confidence or missing fields', () => {
    const badConfidence = {
      ...validCar,
      attributes: { priceEur: { value: 1, confidence: 'sure' } },
    };
    expect(carSchema.safeParse(badConfidence).success).toBe(false);
    expect(carSchema.safeParse({ id: 'x' }).success).toBe(false);
  });

  it('validates the criterion kinds', () => {
    const base = { id: 'c', label: 'L', attributeKey: 'hud', weight: 2, knockout: false };
    expect(criterionSchema.safeParse({ ...base, kind: 'boolean' }).success).toBe(true);
    expect(criterionSchema.safeParse({ ...base, kind: 'number' }).success).toBe(false);
    expect(criterionSchema.safeParse({ ...base, kind: 'choice', scores: { a: 2 } }).success).toBe(
      false,
    );
  });

  it('validates settings and backups', () => {
    const settings = { criteria: [], suggestionThreshold: 70 };
    expect(settingsSchema.safeParse(settings).success).toBe(true);
    expect(settingsSchema.safeParse({ ...settings, suggestionThreshold: 120 }).success).toBe(false);
    const backup = { version: 1, exportedAt: 'now', settings, userState: [] };
    expect(backupSchema.safeParse(backup).success).toBe(true);
    expect(backupSchema.safeParse({ ...backup, version: 2 }).success).toBe(false);
  });

  it('parseValid keeps valid items and reports invalid ones', () => {
    const reports: string[] = [];
    const result = parseValid(carSchema, [validCar, { id: 1 }], (i, m) =>
      reports.push(`${i}:${m}`),
    );
    expect(result).toHaveLength(1);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatch(/^1:/);
  });
});
