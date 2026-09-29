import { ANALYTICS_EVENT_CATALOG, ANALYTICS_SCREENS, createAnalyticsEvent } from './analytics.catalog';

describe('analytics catalog', () => {
  it('keeps screen and event names unique', () => {
    expect(new Set(ANALYTICS_SCREENS).size).toBe(ANALYTICS_SCREENS.length);

    const eventNames = Object.keys(ANALYTICS_EVENT_CATALOG);
    expect(new Set(eventNames).size).toBe(eventNames.length);
  });

  it('creates an event using only catalogued parameters', () => {
    const event = createAnalyticsEvent('parking_flow_started', {
      flow: 'new_parking',
      paymentMethod: 'card',
      email: 'person@example.com',
    } as never);

    expect(event).toEqual({
      name: 'parking_flow_started',
      params: { flow: 'new_parking', paymentMethod: 'card' },
    });
  });

  it('rejects values outside the finite catalog instead of sending free text', () => {
    const event = createAnalyticsEvent('operation_error', {
      area: 'payments',
      category: 'person@example.com',
    } as never);

    expect(event).toBeNull();
  });
});
