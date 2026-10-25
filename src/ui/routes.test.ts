import { describe, expect, it } from 'vitest';
import { ROUTES, routePaths } from './routes';

describe('routes', () => {
  it('enthält alle in T2.1 geforderten Routen', () => {
    expect(ROUTES.ranking).toBe('/');
    expect(ROUTES.settings).toBe('/settings');
    expect(ROUTES.carDetail).toBe('/car/:id');
    expect(ROUTES.compare).toBe('/compare');
  });

  it('hat keine doppelten Pfade', () => {
    expect(new Set(routePaths).size).toBe(routePaths.length);
  });
});
