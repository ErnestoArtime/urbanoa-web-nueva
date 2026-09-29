import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsAdapter } from './analytics-adapter';
import { AnalyticsEvent } from './analytics.catalog';
import { provideAnalytics } from './analytics.providers';
import { AnalyticsService } from './analytics.service';

class RecordingAdapter implements AnalyticsAdapter {
  readonly events: AnalyticsEvent[] = [];

  track(event: AnalyticsEvent): void {
    this.events.push(event);
  }
}

describe('AnalyticsService', () => {
  it('is disabled and noop by default', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const service = TestBed.inject(AnalyticsService);

    expect(() => service.trackScreen('home')).not.toThrow();
  });

  it('forwards a catalogued event only when enabled and consented', () => {
    const adapter = new RecordingAdapter();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideAnalytics({ enabled: true, consentGranted: () => true }, adapter)],
    });
    const service = TestBed.inject(AnalyticsService);

    service.track('payment_challenge_result', { flow: 'fine', result: 'success' });

    expect(adapter.events).toEqual([
      {
        name: 'payment_challenge_result',
        params: { flow: 'fine', result: 'success' },
      },
    ]);
  });

  it('does not forward events without current consent', () => {
    const adapter = new RecordingAdapter();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideAnalytics({ enabled: true, consentGranted: () => false }, adapter)],
    });

    TestBed.inject(AnalyticsService).trackScreen('support_detail');

    expect(adapter.events).toEqual([]);
  });

  it('swallows synchronous adapter failures', () => {
    const onError = jasmine.createSpy('onError');
    const adapter: AnalyticsAdapter = {
      track: () => {
        throw new Error('adapter failed');
      },
    };
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideAnalytics({ enabled: true, consentGranted: () => true, onError }, adapter)],
    });
    const service = TestBed.inject(AnalyticsService);

    expect(() => service.trackScreen('home')).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('swallows asynchronous adapter failures', async () => {
    const onError = jasmine.createSpy('onError');
    const adapter: AnalyticsAdapter = {
      track: () => Promise.reject(new Error('adapter failed')),
    };
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideAnalytics({ enabled: true, consentGranted: () => true, onError }, adapter)],
    });

    TestBed.inject(AnalyticsService).trackScreen('home');
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('swallows failures while reading consent or reporting an error', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideAnalytics({
          enabled: true,
          consentGranted: () => {
            throw new Error('consent unavailable');
          },
          onError: () => {
            throw new Error('diagnostics unavailable');
          },
        }),
      ],
    });
    const service = TestBed.inject(AnalyticsService);

    expect(() => service.trackScreen('home')).not.toThrow();
  });
});
