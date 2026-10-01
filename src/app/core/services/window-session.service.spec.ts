import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { WindowSessionService } from './window-session.service';

describe('WindowSessionService', () => {
  let first: WindowSessionService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    localStorage.removeItem('urbanoa.auth.active-window');
    first = TestBed.inject(WindowSessionService);
  });

  it('does not inherit ownership when a new window instance opens', () => {
    first.activate();
    const second = TestBed.runInInjectionContext(() => new WindowSessionService());
    expect(first.ensureActive()).toBeTrue();
    expect(second.ensureActive()).toBeFalse();
  });

  it('keeps only the last activated window and prevents the previous one releasing its marker', () => {
    first.activate();
    const marker = localStorage.getItem('urbanoa.auth.active-window');
    const invalidated = jasmine.createSpy('invalidated');
    first.onInvalidated(invalidated);
    const second = TestBed.runInInjectionContext(() => new WindowSessionService());
    second.activate();

    expect(first.ensureActive()).toBeFalse();
    expect(invalidated).toHaveBeenCalledTimes(1);
    first.release();
    expect(second.ensureActive()).toBeTrue();
    expect(localStorage.getItem('urbanoa.auth.active-window')).not.toBe(marker);
  });

  it('reads current ownership instead of trusting an outdated queued storage event', () => {
    first.activate();
    window.dispatchEvent(new StorageEvent('storage', { key: 'urbanoa.auth.active-window', newValue: 'stale-window' }));
    expect(first.ensureActive()).toBeTrue();
  });

  it('fails closed when coordination storage is unavailable', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('Storage unavailable');
    expect(() => first.activate()).toThrowError('Storage unavailable');
    expect(first.ensureActive()).toBeFalse();
  });

  it('stores only an opaque marker, never reusable login credentials', () => {
    first.activate();
    expect(localStorage.getItem('urbanoa.auth.active-window')).toMatch(/^[a-f0-9-]{36}$/);
    first.release();
    expect(localStorage.getItem('urbanoa.auth.active-window')).toBeNull();
  });
});
