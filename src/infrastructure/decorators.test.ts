import { describe, expect, it, vi } from 'vitest';
import type { Car } from '../domain/car';
import type { CarRepository } from '../ports/carRepository';
import { CachingListRepository } from './cachingListRepository';
import { ValidatingCarRepository } from './validatingCarRepository';

const car: Car = {
  id: 'a',
  brand: 'Test',
  model: 'One',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: { priceEur: { value: 1, confidence: 'verified' } },
};

describe('ValidatingCarRepository', () => {
  it('skips invalid entries, reports them and never throws', async () => {
    const broken = { id: 'b' } as unknown as Car;
    const inner: CarRepository = { list: async () => [car, broken] };
    const report = vi.fn();
    const result = await new ValidatingCarRepository(inner, report).list();
    expect(result).toEqual([car]);
    expect(report).toHaveBeenCalledTimes(1);
  });
});

describe('CachingListRepository', () => {
  it('calls the inner source once within the ttl and again after it', async () => {
    const list = vi.fn(async () => [1, 2]);
    let time = 0;
    const repo = new CachingListRepository({ list }, 1000, () => time);
    await repo.list();
    time = 500;
    await repo.list();
    expect(list).toHaveBeenCalledTimes(1);
    time = 1500;
    await repo.list();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const list = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue([1]);
    const repo = new CachingListRepository({ list }, 1000, () => 0);
    await expect(repo.list()).rejects.toThrow('down');
    await expect(repo.list()).resolves.toEqual([1]);
  });
});
