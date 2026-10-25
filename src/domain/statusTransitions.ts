import type { CarStatus } from './userState';

// Pattern: table-driven State (Vorlesung 02, S. 129)
export const allowedTransitions: Record<CarStatus, readonly CarStatus[]> = {
  watching: ['interested', 'rejected'],
  interested: ['test-drive-planned', 'watching', 'rejected'],
  'test-drive-planned': ['interested', 'rejected'],
  rejected: ['watching'],
};

/** Staying in the same status is always allowed (no-op). */
export function canTransition(from: CarStatus, to: CarStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}
