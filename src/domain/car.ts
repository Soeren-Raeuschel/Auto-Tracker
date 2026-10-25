export type Confidence = 'verified' | 'estimated' | 'ai-extracted';
export type AttributeValue = number | boolean | string;

/** A value that remembers where it came from, so guesses stay visible as guesses. */
export interface Sourced<T> {
  value: T | null; // null = unknown (never guess)
  confidence: Confidence;
  source?: string;
  updatedAt?: string; // ISO date
}

export type BodyType = 'suv' | 'sedan' | 'hatchback' | 'wagon' | 'other';
export type Powertrain = 'bev' | 'phev' | 'reev';

export interface Car {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  bodyType: BodyType;
  powertrain: Powertrain;
  /** Data-driven attributes, e.g. priceEur, hud, panoramaRoof. Criteria refer to these keys. */
  attributes: Record<string, Sourced<AttributeValue>>;
}

export function getAttributeValue(car: Car, key: string): AttributeValue | null {
  return car.attributes[key]?.value ?? null;
}

export function carLabel(car: Car): string {
  return [car.brand, car.model, car.variant].filter(Boolean).join(' ');
}
