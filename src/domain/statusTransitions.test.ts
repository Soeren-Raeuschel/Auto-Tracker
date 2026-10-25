import { describe, expect, it } from 'vitest';
import { canTransition } from './statusTransitions';

describe('canTransition', () => {
  it('allows listed transitions', () => {
    expect(canTransition('watching', 'interested')).toBe(true);
    expect(canTransition('interested', 'test-drive-planned')).toBe(true);
  });

  it('rejects unlisted transitions', () => {
    expect(canTransition('watching', 'test-drive-planned')).toBe(false);
    expect(canTransition('rejected', 'interested')).toBe(false);
  });

  it('treats staying in the same status as allowed', () => {
    expect(canTransition('rejected', 'rejected')).toBe(true);
  });
});
