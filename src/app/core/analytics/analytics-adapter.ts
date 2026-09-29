import { InjectionToken } from '@angular/core';
import { AnalyticsEvent } from './analytics.catalog';

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void | Promise<void>;
}

/** Adaptador seguro por defecto: no transmite ni persiste eventos. */
export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  track(): void {
    // Intencionalmente vacío.
  }
}

export const ANALYTICS_ADAPTER = new InjectionToken<AnalyticsAdapter>('ANALYTICS_ADAPTER', {
  providedIn: 'root',
  factory: () => new NoopAnalyticsAdapter(),
});
