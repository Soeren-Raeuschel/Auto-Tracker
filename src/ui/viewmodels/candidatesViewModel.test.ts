import { describe, expect, it } from 'vitest';
import type { CarCandidate } from '../../domain/carCandidate';
import { applyEdit, candidateKey, toCandidatesViewModel, toEditable } from './candidatesViewModel';

const candidate = (overrides: Partial<CarCandidate> = {}): CarCandidate => ({
  brand: 'XPeng',
  model: 'G6',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {},
  sourceUrl: 'https://example.com/a',
  ...overrides,
});

describe('candidateKey', () => {
  it('builds a slug like the CarFactory', () => {
    expect(candidateKey(candidate())).toBe('xpeng-g6');
    expect(candidateKey(candidate({ variant: 'Performance' }))).toBe('xpeng-g6-performance');
  });
});

describe('toCandidatesViewModel', () => {
  it('lists open candidates with preview and hides decided ones', () => {
    const vm = toCandidatesViewModel(
      [candidate(), candidate({ brand: 'BYD', model: 'Tang' })],
      ['xpeng-g6'],
    );
    expect(vm.rows.map((row) => row.id)).toEqual(['byd-tang']);
    expect(vm.decidedCount).toBe(1);
    expect(vm.empty).toBe(false);
  });

  it('is empty when everything is decided', () => {
    const vm = toCandidatesViewModel([candidate()], ['xpeng-g6']);
    expect(vm.empty).toBe(true);
    expect(vm.decidedCount).toBe(1);
  });
});

describe('toEditable / applyEdit', () => {
  it('exposes brand, model and variant', () => {
    expect(toEditable(candidate({ variant: 'Long Range' }))).toEqual({
      brand: 'XPeng',
      model: 'G6',
      variant: 'Long Range',
    });
  });

  it('applies edits and falls back to original values when cleared', () => {
    const edited = applyEdit(candidate(), { brand: ' Xpeng ', model: '', variant: '  ' });
    expect(edited).toMatchObject({ brand: 'Xpeng', model: 'G6' });
    expect(edited.variant).toBeUndefined();
  });
});
