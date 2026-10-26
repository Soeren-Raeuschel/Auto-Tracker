// T9.1 Smoke-Check: Skripte importieren Domain-Typen direkt, keine Kopien.
import type { Car } from '../src/domain/car';
import { carLabel } from '../src/domain/car';

const car: Car = {
  id: 'hello-world',
  brand: 'Hello',
  model: 'World',
  bodyType: 'other',
  powertrain: 'bev',
  attributes: {},
};

// eslint-disable-next-line no-console
console.log(`T9.1 ok: ${carLabel(car)}`);
