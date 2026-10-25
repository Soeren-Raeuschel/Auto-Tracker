import { describe, expect, it } from 'vitest';
import { computeFlipTransforms, staggerDelayMs } from './motionViewModel';

describe('staggerDelayMs', () => {
  it('staffelt mit 100 ms pro Stufe', () => {
    expect(staggerDelayMs(0)).toBe(0);
    expect(staggerDelayMs(1)).toBe(100);
    expect(staggerDelayMs(4)).toBe(400);
  });

  it('begrenzt auf maximal 5 Stufen', () => {
    expect(staggerDelayMs(5)).toBe(500);
    expect(staggerDelayMs(6)).toBe(500);
    expect(staggerDelayMs(50)).toBe(500);
  });

  it('ignoriert negative Indizes', () => {
    expect(staggerDelayMs(-1)).toBe(0);
  });
});

describe('computeFlipTransforms', () => {
  it('berechnet die Verschiebung von alt nach neu', () => {
    const before = new Map([
      ['a', { top: 0, left: 0 }],
      ['b', { top: 100, left: 0 }],
    ]);
    const after = new Map([
      ['a', { top: 100, left: 0 }],
      ['b', { top: 0, left: 0 }],
    ]);
    expect(computeFlipTransforms(before, after)).toEqual(
      new Map([
        ['a', { dx: 0, dy: -100 }],
        ['b', { dx: 0, dy: 100 }],
      ]),
    );
  });

  it('gibt fuer neue und verschwundene Elemente kein Delta', () => {
    const before = new Map([['a', { top: 0, left: 0 }]]);
    const after = new Map([
      ['b', { top: 50, left: 0 }],
      ['a', { top: 0, left: 0 }],
    ]);
    expect(computeFlipTransforms(before, after)).toEqual(new Map([['a', { dx: 0, dy: 0 }]]));
  });
});
