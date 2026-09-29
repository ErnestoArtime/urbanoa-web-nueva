import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { ANALYTICS_ADAPTER, AnalyticsAdapter } from './analytics-adapter';

export interface AnalyticsOptions {
  /** Debe activarse explícitamente por entorno. */
  enabled?: boolean;
  /** Debe consultar la decisión vigente del usuario en cada evento. */
  consentGranted?: () => boolean;
  /** Gancho opcional de diagnóstico local; nunca recibe el evento ni sus parámetros. */
  onError?: (error: unknown) => void;
}

export interface AnalyticsConfig {
  readonly enabled: boolean;
  readonly consentGranted: () => boolean;
  readonly onError?: (error: unknown) => void;
}

const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = Object.freeze({
  enabled: false,
  consentGranted: () => false,
});

export const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('ANALYTICS_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_ANALYTICS_CONFIG,
});

/**
 * Configura analítica sin acoplar la aplicación a un proveedor.
 * Si no se invoca, o falta consentimiento, el comportamiento es noop.
 */
export function provideAnalytics(options: AnalyticsOptions = {}, adapter?: AnalyticsAdapter): EnvironmentProviders {
  const config: AnalyticsConfig = {
    enabled: options.enabled ?? false,
    consentGranted: options.consentGranted ?? (() => false),
    ...(options.onError ? { onError: options.onError } : {}),
  };

  return makeEnvironmentProviders([
    { provide: ANALYTICS_CONFIG, useValue: config },
    ...(adapter ? [{ provide: ANALYTICS_ADAPTER, useValue: adapter }] : []),
  ]);
}
