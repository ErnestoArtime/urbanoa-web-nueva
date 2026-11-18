import { OPS_ENDPOINTS } from './ops-endpoints';

describe('OPS_ENDPOINTS', () => {
  it('routes the unified Swagger endpoints through OPSWebServicesUrbAPI', () => {
    expect(OPS_ENDPOINTS.wallet.loadPaymentForm).toBe('OPSWebServicesUrbAPI/LoadPaymentMethodFormAPI');
    expect(OPS_ENDPOINTS.wallet.addPaymentMethod).toBe('OPSWebServicesUrbAPI/AddUserPaymentMethodAPI');
    expect(OPS_ENDPOINTS.fines.updateStatus).toBe('OPSWebServicesUrbAPI/UpdateFineStatusAPI');
    expect(OPS_ENDPOINTS.support.add).toBe('OPSWebServicesUrbAPI/AddUserFeedbackAPI');
    expect(OPS_ENDPOINTS.support.query).toBe('OPSWebServicesUrbAPI/QueryUserFeedbackAPI');
    expect(OPS_ENDPOINTS.support.update).toBe('OPSWebServicesUrbAPI/UpdateUserFeedbackAPI');
  });
});
