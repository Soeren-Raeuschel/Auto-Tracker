import type { ListSource } from '../ports/listSource';

// Pattern: Decorator (Vorlesung 02, S. 70). Caches the result for a short time.
export class CachingListRepository<T> implements ListSource<T> {
  private cached: { at: number; value: Promise<T[]> } | null = null;

  constructor(
    private readonly inner: ListSource<T>,
    private readonly ttlMs: number = 60_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async list(): Promise<T[]> {
    const current = this.now();
    if (this.cached && current - this.cached.at < this.ttlMs) return this.cached.value;
    const value = this.inner.list();
    this.cached = { at: current, value };
    try {
      return await value;
    } catch (error) {
      this.cached = null; // never cache failures
      throw error;
    }
  }
}
