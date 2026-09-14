import { OPS_OPERATING_SYSTEM, OPS_OPERATING_SYSTEMS } from './ops-client.constants';

describe('OPS client constants', () => {
  it('identifies as the app (Android = 1) because payment confirms only accept 1/2', () => {
    expect(OPS_OPERATING_SYSTEMS.web).toBe(3);
    expect(OPS_OPERATING_SYSTEM).toBe(1);
  });
});
