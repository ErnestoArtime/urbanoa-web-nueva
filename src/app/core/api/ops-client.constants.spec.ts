import { OPS_OPERATING_SYSTEM, OPS_OPERATING_SYSTEMS, OPS_PARKING_SESSION_OPERATING_SYSTEM } from './ops-client.constants';

describe('OPS client constants', () => {
  it('keeps the web identifier while using the mobile compatibility value for parking sessions', () => {
    expect(OPS_OPERATING_SYSTEMS.web).toBe(3);
    expect(OPS_OPERATING_SYSTEM).toBe(3);
    expect(OPS_PARKING_SESSION_OPERATING_SYSTEM).toBe(1);
  });
});
