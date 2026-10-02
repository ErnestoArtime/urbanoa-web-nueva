import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { WindowSessionService } from './window-session.service';

const keys = (): string[] => Object.keys(localStorage).filter((key) => key.startsWith('urbanoa.auth.active-window.'));

describe('WindowSessionService', () => {
  let first: WindowSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    localStorage.clear();
    first = TestBed.inject(WindowSessionService);
  });

  it('allows different users to remain active in different windows', () => {
    first.activate('u1@example.com');
    const second = TestBed.runInInjectionContext(() => new WindowSessionService());
    second.activate('u2@example.com');

    expect(first.ensureActive()).toBeTrue();
    expect(second.ensureActive()).toBeTrue();
    expect(keys().length).toBe(2);
  });

  it('keeps only the last window for the same user and protects its marker on release', () => {
    first.activate('u1@example.com');
    const marker = localStorage.getItem(keys()[0]);
    const invalidated = jasmine.createSpy('invalidated');
    first.onInvalidated(invalidated);
    const second = TestBed.runInInjectionContext(() => new WindowSessionService());
    second.activate('u1@example.com');

    expect(first.ensureActive()).toBeFalse();
    expect(invalidated).toHaveBeenCalledTimes(1);
    first.release();
    expect(second.ensureActive()).toBeTrue();
    expect(localStorage.getItem(keys()[0])).not.toBe(marker);
  });

  it('reads current ownership instead of trusting an outdated queued storage event', () => {
    first.activate('u1@example.com');
    const key = keys()[0];
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: 'stale-window' }));
    expect(first.ensureActive()).toBeTrue();
  });

  it('fails closed when coordination storage is unavailable', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('Storage unavailable');
    expect(() => first.activate('u1@example.com')).toThrowError('Storage unavailable');
    expect(first.ensureActive()).toBeFalse();
  });

  it('stores only an opaque user scope and marker, never reusable credentials', () => {
    first.activate('private-user@example.com');
    expect(keys()[0]).toMatch(/^urbanoa\.auth\.active-window\.[a-f0-9]{16}$/);
    expect(keys()[0]).not.toContain('private-user');
    expect(localStorage.getItem(keys()[0])).toMatch(/^[a-f0-9-]{36}$/);
    first.release();
    expect(keys()).toEqual([]);
  });

  it('can activate without randomUUID on an HTTP network origin', () => {
    const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      first.activate('u1@example.com');
      const marker = localStorage.getItem(keys()[0]);
      expect(marker).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      expect(first.ensureActive()).toBeTrue();
      first.release();
      first.activate('u1@example.com');
      expect(first.ensureActive()).toBeTrue();
      expect(localStorage.getItem(keys()[0])).not.toBe(marker);
    } finally {
      if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor);
      else Reflect.deleteProperty(crypto, 'randomUUID');
    }
  });
});
