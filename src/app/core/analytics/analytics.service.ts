import { inject, Injectable } from '@angular/core';
import { ANALYTICS_ADAPTER } from './analytics-adapter';
import { AnalyticsEventName, AnalyticsEventParams, AnalyticsScreen, createAnalyticsEvent } from './analytics.catalog';
import { ANALYTICS_CONFIG } from './analytics.providers';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly adapter = inject(ANALYTICS_ADAPTER);
  private readonly config = inject(ANALYTICS_CONFIG);

  trackScreen(screen: AnalyticsScreen): void {
    this.track('screen_view', { screen });
  }

  track<EventName extends AnalyticsEventName>(name: EventName, params: AnalyticsEventParams[EventName]): void {
    try {
      if (!this.config.enabled || !this.config.consentGranted()) {
        return;
      }

      const event = createAnalyticsEvent(name, params);
      if (!event) {
        return;
      }

      Promise.resolve(this.adapter.track(event)).catch((error: unknown) => {
        this.reportError(error);
      });
    } catch (error) {
      this.reportError(error);
    }
  }

  private reportError(error: unknown): void {
    try {
      this.config.onError?.(error);
    } catch {
      // La observabilidad nunca debe afectar al flujo funcional.
    }
  }
}
