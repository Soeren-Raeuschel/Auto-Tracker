import { allowedTransitions, canTransition } from '../../domain/statusTransitions';
import type { CarStatus, UserCarState } from '../../domain/userState';

/** Probefahrt-Checkliste (T3.1): feste Punkte, Werte als Boolean. */
export const checklistCatalog: readonly { key: string; label: string }[] = [
  { key: 'hud', label: 'Head-up-Display' },
  { key: 'massage', label: 'Massagesitze' },
  { key: 'acc', label: 'Abstandsregelung' },
  { key: 'regen', label: 'Rekuperation einstellbar' },
];

export const DEFAULT_STATUS: CarStatus = 'watching';

/** Neuer Eintrag: Status "watching", leere Notizen, alle Checklistenpunkte unchecked. */
export function createUserCarState(carId: string): UserCarState {
  return {
    carId,
    status: DEFAULT_STATUS,
    notes: '',
    checklist: Object.fromEntries(checklistCatalog.map((item) => [item.key, false])),
  };
}

/** Zustand ohne Eintrag: leerer Default, damit die UI immer einen Zustand hat. */
export function stateFor(states: readonly UserCarState[], carId: string): UserCarState {
  return states.find((s) => s.carId === carId) ?? createUserCarState(carId);
}

/** Statuswechsel nur ueber die Tabelle; ungueltiger Wechsel gibt null zurueck. */
export function withStatus(state: UserCarState, to: CarStatus): UserCarState | null {
  if (!canTransition(state.status, to)) return null;
  if (state.status === to) return state;
  return { ...state, status: to };
}

export function withNotes(state: UserCarState, notes: string): UserCarState {
  return { ...state, notes };
}

/** Checklistenpunkt setzen; unbekannte Schluessel werden ignoriert (state bleibt gleich). */
export function withChecklistItem(
  state: UserCarState,
  key: string,
  checked: boolean,
): UserCarState {
  if (!checklistCatalog.some((item) => item.key === key)) return state;
  return { ...state, checklist: { ...state.checklist, [key]: checked } };
}

/** Zulaessige Ziel-Status fuer die UI-Auswahl (inkl. des aktuellen als No-op). */
export function allowedTargets(status: CarStatus): CarStatus[] {
  return [status, ...allowedTransitions[status]];
}
