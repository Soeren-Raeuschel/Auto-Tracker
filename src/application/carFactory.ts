import type { Car } from '../domain/car';
import type { CarCandidate } from '../domain/carCandidate';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pattern: Factory Method (Vorlesung 02, S. 6-13): one place for ID, defaults and provenance.
export function createCarFromCandidate(candidate: CarCandidate, today: Date = new Date()): Car {
  const { sourceUrl, ...rest } = candidate;
  const date = today.toISOString().slice(0, 10);
  const attributes = Object.fromEntries(
    Object.entries(rest.attributes).map(([key, attribute]) => [
      key,
      {
        ...attribute,
        confidence: 'ai-extracted' as const,
        source: attribute.source ?? sourceUrl,
        updatedAt: attribute.updatedAt ?? date,
      },
    ]),
  );
  const id = slugify([rest.brand, rest.model, rest.variant].filter(Boolean).join(' '));
  return { ...rest, id, attributes };
}
