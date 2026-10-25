import { describe, expect, it } from 'vitest';
import { MergedCarRepository } from './mergedCarRepository';
import type { Car } from '../domain/car';
import type { CarRepository } from '../ports/carRepository';

function car(id: string): Car {
  return {
    id,
    brand: 'T',
    model: id,
    bodyType: 'suv',
    powertrain: 'bev',
    attributes: {},
  };
}

function repoOf(cars: Car[]): CarRepository {
  return { list: async () => cars };
}

describe('MergedCarRepository', () => {
  it('kombiniert Basis und Import ohne doppelte ids', async () => {
    const repo = new MergedCarRepository(
      repoOf([car('a'), car('b')]),
      repoOf([car('b'), car('c')]),
    );
    const cars = await repo.list();
    expect(cars.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});
