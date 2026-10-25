import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import { GenericModelProvider, genericModelUrl } from './genericModelProvider';
import { SpecificModelProvider, specificModelUrl } from './specificModelProvider';

const car: Car = {
  id: 'audi/q4 e-tron',
  brand: 'Audi',
  model: 'Q4 e-tron',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {},
};

describe('SpecificModelProvider', () => {
  const providerWith = (exists: (url: string) => boolean): SpecificModelProvider => {
    const checker = { exists: async (url: string) => exists(url) };
    const generic = new GenericModelProvider('/base', {
      exists: async (url) => url.endsWith('models/suv.glb'),
    });
    return new SpecificModelProvider('/base', checker, generic);
  };

  it('prefers the car-specific GLB and marks it as specific', async () => {
    const provider = providerWith((url) => url === specificModelUrl('/base', car.id));
    const model = await provider.getModel(car);
    expect(model).toEqual({ url: '/base/models/cars/audi%2Fq4%20e-tron.glb', kind: 'specific' });
  });

  it('falls back to the generic provider when no specific file exists', async () => {
    const provider = providerWith(() => false);
    const model = await provider.getModel(car);
    expect(model).toEqual({ url: genericModelUrl('/base', 'suv'), kind: 'generic' });
  });

  it('stays null when neither specific nor generic model exists', async () => {
    const checker = { exists: async () => false };
    const generic = new GenericModelProvider('/base', checker);
    const provider = new SpecificModelProvider('/base', checker, generic);
    expect(await provider.getModel(car)).toBeNull();
  });
});
