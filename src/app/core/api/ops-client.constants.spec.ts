import { OPS_OPERATING_SYSTEM, OPS_OPERATING_SYSTEMS } from './ops-client.constants';

describe('OPS client constants', () => {
  it('identifies the web client with the Swagger value 3', () => {
    expect(OPS_OPERATING_SYSTEMS.web).toBe(3);
    expect(OPS_OPERATING_SYSTEM).toBe(3);
  });
});
