import { OPS_OPERATING_SYSTEM, OPS_OPERATING_SYSTEMS, OPS_PARKING_SESSION_OPERATING_SYSTEM, OPS_UNVERIFIED_OPERATING_SYSTEM } from './ops-client.constants';

describe('OPS client constants', () => {
  it('uses the verified web identifier for parking sessions', () => {
    expect(OPS_OPERATING_SYSTEMS.web).toBe(3);
    expect(OPS_OPERATING_SYSTEM).toBe(3);
    expect(OPS_PARKING_SESSION_OPERATING_SYSTEM).toBe(3);
    expect(OPS_UNVERIFIED_OPERATING_SYSTEM).toBe(1);
  });
});
