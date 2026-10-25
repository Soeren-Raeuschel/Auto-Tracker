import { describe, expect, it } from 'vitest';
import {
  getAnimationDefinition,
  shouldAnimate,
  type AnimationDefinition,
} from './animationCatalog';

const definition: AnimationDefinition = {
  id: 'success',
  file: 'success.json',
  loop: false,
  fallbackIcon: 'check',
  source: 'LottieFlow',
};

describe('shouldAnimate', () => {
  it('animiert bei Motion und vorhandener Definition', () => {
    expect(shouldAnimate(false, definition)).toBe(true);
  });

  it('zeigt bei Reduced Motion das Ersatz-Icon', () => {
    expect(shouldAnimate(true, definition)).toBe(false);
  });

  it('zeigt ohne registrierten Slot das Ersatz-Icon', () => {
    expect(shouldAnimate(false, null)).toBe(false);
  });
});

describe('getAnimationDefinition', () => {
  it('liefert die registrierten Slots', () => {
    expect(getAnimationDefinition('success')?.file).toBe('success.json');
    expect(getAnimationDefinition('watchlistToggle')?.fallbackIcon).toBe('bookmark');
  });

  it('kennt genau die fuenf Slots aus T13.2', () => {
    for (const id of ['success', 'empty', 'error', 'watchlistToggle', 'loadingHero'] as const) {
      expect(getAnimationDefinition(id)).not.toBeNull();
    }
  });
});
