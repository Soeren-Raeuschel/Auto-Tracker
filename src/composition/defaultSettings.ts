import type { Settings } from '../domain/settings';

export const defaultSettings: Settings = {
  suggestionThreshold: 70,
  criteria: [
    {
      id: 'price',
      label: 'Preis',
      kind: 'number',
      attributeKey: 'priceEur',
      direction: 'lower-better',
      min: 35000,
      max: 65000,
      weight: 3,
      knockout: false,
    },
    {
      id: 'pano',
      label: 'Panoramadach',
      kind: 'boolean',
      attributeKey: 'panoramaRoof',
      weight: 2,
      knockout: false,
    },
    {
      id: 'hud',
      label: 'Head-up-Display',
      kind: 'boolean',
      attributeKey: 'hud',
      weight: 2,
      knockout: false,
    },
    {
      id: 'massage',
      label: 'Massagesitze',
      kind: 'boolean',
      attributeKey: 'massageSeats',
      weight: 1,
      knockout: false,
    },
    {
      id: 'dc',
      label: 'DC-Ladeleistung (Budapest)',
      kind: 'number',
      attributeKey: 'dcMaxKw',
      direction: 'higher-better',
      min: 100,
      max: 450,
      weight: 2,
      knockout: false,
    },
  ],
};
