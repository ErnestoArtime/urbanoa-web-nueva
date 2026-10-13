import { OpsApiError } from '../api/ops-api.types';
import { isPaymentOutcomeUnknown } from './payment-error';

describe('isPaymentOutcomeUnknown', () => {
  it('keeps missing responses and generic server failures uncertain', () => {
    for (const kind of ['transport', 'timeout', 'abort', 'invalid-response'] as const) {
      expect(isPaymentOutcomeUnknown(new OpsApiError(kind, 'payment', 'failure'))).toBeTrue();
    }
    for (const code of [-9, -12, -13]) {
      expect(isPaymentOutcomeUnknown(new OpsApiError('backend', 'payment', 'failure', 200, { code, type: 1 }))).toBeTrue();
    }
    expect(isPaymentOutcomeUnknown(new OpsApiError('http', 'payment', 'failure', 503))).toBeTrue();
  });

  it('keeps business rejection and invalid credentials separate from uncertain writes', () => {
    expect(isPaymentOutcomeUnknown(new OpsApiError('backend', 'payment', 'rejected', 200, { code: -21, type: 1 }))).toBeFalse();
    expect(isPaymentOutcomeUnknown(new OpsApiError('http', 'payment', 'unauthorized', 401))).toBeFalse();
  });
});
