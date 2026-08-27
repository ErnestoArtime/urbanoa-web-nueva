import { OPS_ENDPOINTS } from './ops-endpoints';

describe('OPS_ENDPOINTS', () => {
  it('routes the unified Swagger endpoints through OPSWebServicesAPI', () => {
    expect(OPS_ENDPOINTS.wallet.loadPaymentForm).toBe('OPSWebServicesAPI/LoadPaymentMethodFormAPI');
    expect(OPS_ENDPOINTS.wallet.addPaymentMethod).toBe('OPSWebServicesAPI/AddUserPaymentMethodAPI');
    expect(OPS_ENDPOINTS.fines.updateStatus).toBe('OPSWebServicesAPI/UpdateFineStatusAPI');
    expect(OPS_ENDPOINTS.support.add).toBe('OPSWebServicesAPI/AddUserFeedbackAPI');
    expect(OPS_ENDPOINTS.support.query).toBe('OPSWebServicesAPI/QueryUserFeedbackAPI');
    expect(OPS_ENDPOINTS.support.update).toBe('OPSWebServicesAPI/UpdateUserFeedbackAPI');
  });
});
