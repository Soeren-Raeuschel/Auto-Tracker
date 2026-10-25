import { describe, expect, it } from 'vitest';
import type { UserCarState } from '../../domain/userState';
import {
  allowedTargets,
  checklistCatalog,
  createUserCarState,
  stateFor,
  withChecklistItem,
  withNotes,
  withStatus,
} from './userStateViewModel';

const state = (status: UserCarState['status']): UserCarState => ({
  ...createUserCarState('car-1'),
  status,
});

describe('userStateViewModel', () => {
  it('creates a default state with all checklist items unchecked', () => {
    const s = createUserCarState('car-1');
    expect(s.status).toBe('watching');
    expect(s.notes).toBe('');
    expect(s.checklist).toEqual({ hud: false, massage: false, acc: false, regen: false });
    expect(checklistCatalog.map((i) => i.key)).toEqual(['hud', 'massage', 'acc', 'regen']);
  });

  it('falls back to a default state for unknown cars', () => {
    const s = stateFor([{ ...createUserCarState('x'), carId: 'car-9' }], 'car-1');
    expect(s.carId).toBe('car-1');
    expect(stateFor([], 'car-1').status).toBe('watching');
  });

  it('allows only transitions from the table and returns null for invalid ones', () => {
    expect(withStatus(state('watching'), 'interested')?.status).toBe('interested');
    expect(withStatus(state('watching'), 'test-drive-planned')).toBeNull();
    expect(withStatus(state('rejected'), 'watching')?.status).toBe('watching');
    // No-op: same status returns the same object.
    const s = state('interested');
    expect(withStatus(s, 'interested')).toBe(s);
  });

  it('lists allowed targets including the current status', () => {
    expect(allowedTargets('watching')).toEqual(['watching', 'interested', 'rejected']);
    expect(allowedTargets('rejected')).toEqual(['rejected', 'watching']);
  });

  it('sets notes without touching status or checklist', () => {
    const s = withNotes(state('interested'), 'Probefahrt am Freitag');
    expect(s.notes).toBe('Probefahrt am Freitag');
    expect(s.status).toBe('interested');
  });

  it('toggles checklist items and ignores unknown keys', () => {
    const s = withChecklistItem(state('watching'), 'hud', true);
    expect(s.checklist['hud']).toBe(true);
    expect(s.checklist['massage']).toBe(false);
    const unchanged = state('watching');
    expect(withChecklistItem(unchanged, 'panoramaRoof', true)).toBe(unchanged);
  });
});
