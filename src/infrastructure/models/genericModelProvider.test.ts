import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import {
  FetchModelFileChecker,
  GenericModelProvider,
  genericModelUrl,
  modelFileName,
  modelUrlCandidates,
  type ModelFileChecker,
} from './genericModelProvider';

const car = (bodyType: Car['bodyType']): Car => ({
  id: 'a',
  brand: 'Test',
  model: 'X',
  bodyType,
  powertrain: 'bev',
  attributes: {},
});

describe('genericModelUrl / modelFileName', () => {
  it('builds the public/models URL per bodyType', () => {
    expect(modelFileName('sedan')).toBe('sedan.glb');
    expect(genericModelUrl('/base/', 'suv')).toBe('/base/models/suv.glb');
    expect(genericModelUrl('/base', 'wagon')).toBe('/base/models/wagon.glb');
  });
});

describe('modelUrlCandidates', () => {
  it('lists the own file first, then fallbacks', () => {
    expect(modelUrlCandidates('/base', 'hatchback')).toEqual([
      '/base/models/hatchback.glb',
      '/base/models/sedan.glb',
      '/base/models/suv.glb',
    ]);
    expect(modelUrlCandidates('/base', 'suv')).toEqual([
      '/base/models/suv.glb',
      '/base/models/other.glb',
      '/base/models/sedan.glb',
    ]);
  });
});

describe('FetchModelFileChecker', () => {
  it('returns true on ok response', async () => {
    const ok = (async () => ({
      ok: true,
      headers: new Headers({ 'content-type': 'model/gltf-binary' }),
    })) as unknown as typeof fetch;
    expect(await new FetchModelFileChecker(ok).exists('/m.glb')).toBe(true);
  });

  it('returns false on HTTP errors and network failures', async () => {
    const notFound = (async () => ({ ok: false, status: 404 })) as unknown as typeof fetch;
    const throws = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await new FetchModelFileChecker(notFound).exists('/m.glb')).toBe(false);
    expect(await new FetchModelFileChecker(throws).exists('/m.glb')).toBe(false);
  });

  it('rejects the SPA fallback that serves HTML with 200', async () => {
    const spaFallback = (async () => ({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
    })) as unknown as typeof fetch;
    expect(await new FetchModelFileChecker(spaFallback).exists('/m.glb')).toBe(false);
  });
});

describe('GenericModelProvider', () => {
  const providerWith = (exists: boolean): GenericModelProvider => {
    const checker: ModelFileChecker = {
      exists: async (url) => url.endsWith('models/sedan.glb') && exists,
    };
    return new GenericModelProvider('/base', checker);
  };

  it('returns a generic ModelRef when the file exists', async () => {
    expect(await providerWith(true).getModel(car('sedan'))).toEqual({
      url: '/base/models/sedan.glb',
      kind: 'generic',
    });
  });

  it('returns null when the file is missing', async () => {
    expect(await providerWith(false).getModel(car('sedan'))).toBeNull();
  });

  it('falls back to a similar model when the own file is missing', async () => {
    const checker: ModelFileChecker = {
      exists: async (url) => url.endsWith('models/sedan.glb'),
    };
    const provider = new GenericModelProvider('/base', checker);
    expect(await provider.getModel(car('hatchback'))).toEqual({
      url: '/base/models/sedan.glb',
      kind: 'generic',
    });
  });
});
