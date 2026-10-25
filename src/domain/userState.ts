export type CarStatus = 'watching' | 'interested' | 'test-drive-planned' | 'rejected';

/** Personal data about a car. Deliberately separate from the Car catalog data. */
export interface UserCarState {
  carId: string;
  status: CarStatus;
  notes: string;
  checklist: Record<string, boolean>; // e.g. { hud: true, acc: false }
}
