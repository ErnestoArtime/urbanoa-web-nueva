import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(ConnectivityService);
  });

  it('goes offline when the probe fails and recovers when it succeeds, counting each recovery', async () => {
    fetchSpy.and.rejectWith(new TypeError('Failed to fetch'));
    expect(await service.verify()).toBeFalse();
    expect(service.online()).toBeFalse();
    expect(service.restored()).toBe(0);

    fetchSpy.and.resolveTo(new Response(null, { status: 200 }));
    expect(await service.verify()).toBeTrue();
    expect(service.online()).toBeTrue();
    expect(service.restored()).toBe(1);
  });

  it('reuses an in-flight probe', async () => {
    fetchSpy.and.resolveTo(new Response(null, { status: 200 }));
    const first = service.verify();
    const second = service.verify();
    expect(second).toBe(first);
    await first;
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('treats a successful API response as proof of connectivity', async () => {
    fetchSpy.and.rejectWith(new TypeError('Failed to fetch'));
    await service.verify();
    service.reportSuccess();
    expect(service.online()).toBeTrue();
    expect(service.restored()).toBe(1);
  });

  it('goes offline immediately on the browser offline event', () => {
    window.dispatchEvent(new Event('offline'));
    expect(service.online()).toBeFalse();
  });
});
