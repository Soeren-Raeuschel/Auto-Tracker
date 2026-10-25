import type { Settings } from '../domain/settings';

export type AppEvent =
  | { type: 'SettingsChanged'; settings: Settings }
  | { type: 'UserStateChanged'; carId: string }
  | { type: 'NewCarSuggested'; carId: string; score: number };

type EventType = AppEvent['type'];
type Handler<T extends EventType> = (event: Extract<AppEvent, { type: T }>) => void;

// Pattern: Observer (Vorlesung 02, S. 91-95). Events are small objects (S. 95).
export class EventBus {
  private readonly handlers = new Map<EventType, Set<(event: AppEvent) => void>>();

  subscribe<T extends EventType>(type: T, handler: Handler<T>): () => void {
    const wrapped = handler as unknown as (event: AppEvent) => void;
    const set = this.handlers.get(type) ?? new Set<(event: AppEvent) => void>();
    set.add(wrapped);
    this.handlers.set(type, set);
    return () => {
      set.delete(wrapped);
    };
  }

  /** One failing handler must not block the others. */
  publish(event: AppEvent): void {
    this.handlers.get(event.type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Handler for ${event.type} failed`, error);
      }
    });
  }
}
