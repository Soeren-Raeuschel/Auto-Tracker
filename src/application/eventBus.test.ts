import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './eventBus';

describe('EventBus', () => {
  it('delivers events only to subscribers of that type', () => {
    const bus = new EventBus();
    const suggested = vi.fn();
    const changed = vi.fn();
    bus.subscribe('NewCarSuggested', suggested);
    bus.subscribe('UserStateChanged', changed);
    bus.publish({ type: 'NewCarSuggested', carId: 'a', score: 88 });
    expect(suggested).toHaveBeenCalledWith({ type: 'NewCarSuggested', carId: 'a', score: 88 });
    expect(changed).not.toHaveBeenCalled();
  });

  it('stops delivering after unsubscribe', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('UserStateChanged', handler);
    unsubscribe();
    bus.publish({ type: 'UserStateChanged', carId: 'a' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('isolates failing handlers', () => {
    const bus = new EventBus();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const good = vi.fn();
    bus.subscribe('UserStateChanged', () => {
      throw new Error('boom');
    });
    bus.subscribe('UserStateChanged', good);
    bus.publish({ type: 'UserStateChanged', carId: 'a' });
    expect(good).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
