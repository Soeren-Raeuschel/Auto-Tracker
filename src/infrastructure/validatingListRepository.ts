import type { ZodType } from 'zod';
import type { ListSource } from '../ports/listSource';

// Pattern: Decorator (Vorlesung 02, S. 70). Keeps only schema-valid items, never throws.
export class ValidatingListRepository<T> implements ListSource<T> {
  constructor(
    private readonly inner: ListSource<T>,
    private readonly schema: ZodType<T>,
    private readonly onInvalid: (message: string) => void = () => undefined,
  ) {}

  async list(): Promise<T[]> {
    const items = await this.inner.list();
    const valid: T[] = [];
    items.forEach((item, index) => {
      const result = this.schema.safeParse(item);
      if (result.success) {
        valid.push(result.data);
      } else {
        this.onInvalid(
          `Eintrag ${index} verworfen: ${result.error.issues
            .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('; ')}`,
        );
      }
    });
    return valid;
  }
}
