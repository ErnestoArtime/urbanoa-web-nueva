export const ANALYTICS_SCREENS = [
  'home',
  'parking_time_selection',
  'parking_confirmation',
  'parking_success',
  'parking_extension',
  'payment_return',
  'operations_report',
  'vehicles',
  'profile',
  'notification_preferences',
  'support_list',
  'support_detail',
] as const;

const FLOW_TYPES = ['new_parking', 'parking_extension'] as const;
const PAYMENT_METHODS = ['wallet', 'card', 'mixed', 'unknown'] as const;
const FLOW_RESULTS = ['success', 'rejected', 'cancelled', 'pending', 'error'] as const;
const PAYMENT_FLOWS = ['parking', 'fine', 'top_up', 'card_enrollment'] as const;
const REPORT_TYPES = ['parking_operations'] as const;
const ACCOUNT_AREAS = ['vehicles', 'profile', 'notification_preferences'] as const;
const ACCOUNT_ACTIONS = ['create', 'update', 'delete'] as const;
const ACTION_RESULTS = ['success', 'error'] as const;
const SUPPORT_ACTIONS = ['created', 'opened', 'responded'] as const;
const ERROR_AREAS = ['parking', 'payments', 'reports', 'account', 'support'] as const;
const ERROR_CATEGORIES = ['network', 'timeout', 'unauthorized', 'forbidden', 'validation', 'backend', 'unknown'] as const;

/**
 * Catálogo v4 de eventos y únicos valores que pueden salir de la aplicación.
 * Todos los parámetros son categóricos para impedir el envío accidental de PII.
 */
export const ANALYTICS_EVENT_CATALOG = {
  screen_view: {
    screen: ANALYTICS_SCREENS,
  },
  parking_flow_started: {
    flow: FLOW_TYPES,
    paymentMethod: PAYMENT_METHODS,
  },
  parking_flow_result: {
    flow: FLOW_TYPES,
    result: FLOW_RESULTS,
  },
  payment_challenge_started: {
    flow: PAYMENT_FLOWS,
  },
  payment_challenge_result: {
    flow: PAYMENT_FLOWS,
    result: FLOW_RESULTS,
  },
  report_requested: {
    reportType: REPORT_TYPES,
  },
  report_result: {
    reportType: REPORT_TYPES,
    result: ACTION_RESULTS,
  },
  account_action_result: {
    area: ACCOUNT_AREAS,
    action: ACCOUNT_ACTIONS,
    result: ACTION_RESULTS,
  },
  support_action: {
    action: SUPPORT_ACTIONS,
    result: ACTION_RESULTS,
  },
  operation_error: {
    area: ERROR_AREAS,
    category: ERROR_CATEGORIES,
  },
} as const;

type Catalog = typeof ANALYTICS_EVENT_CATALOG;
type ValueOf<T> = T[keyof T];

export type AnalyticsScreen = (typeof ANALYTICS_SCREENS)[number];
export type AnalyticsEventName = keyof Catalog;
export type AnalyticsEventParams = {
  [EventName in AnalyticsEventName]: {
    [ParamName in keyof Catalog[EventName]]: Catalog[EventName][ParamName] extends readonly (infer ParamValue)[] ? ParamValue : never;
  };
};
export type AnalyticsEvent = ValueOf<{
  [EventName in AnalyticsEventName]: {
    name: EventName;
    params: AnalyticsEventParams[EventName];
  };
}>;

/**
 * Construye un evento exclusivamente desde las claves y valores del catálogo.
 * Los campos desconocidos se ignoran y cualquier valor libre invalida el evento.
 */
export function createAnalyticsEvent<EventName extends AnalyticsEventName>(
  name: EventName,
  params: AnalyticsEventParams[EventName],
): AnalyticsEvent | null {
  const definition = ANALYTICS_EVENT_CATALOG[name] as Record<string, readonly unknown[]>;
  const input = params as Record<string, unknown>;
  const safeParams: Record<string, unknown> = {};

  for (const [key, allowedValues] of Object.entries(definition)) {
    const value = input[key];
    if (!allowedValues.includes(value)) {
      return null;
    }
    safeParams[key] = value;
  }

  return { name, params: safeParams } as AnalyticsEvent;
}
