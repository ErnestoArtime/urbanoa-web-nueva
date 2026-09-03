import { isValidPlate } from './plate-validation';

describe('plate validation', () => {
  it('accepts the current and old national formats', () => {
    expect(isValidPlate('1234 BCD', false)).toBeTrue();
    expect(isValidPlate('M 1234 AB', false)).toBeTrue();
    expect(isValidPlate('M 123456', false)).toBeTrue();
  });

  it('rejects national plates that do not match either state format', () => {
    expect(isValidPlate('1234567', false)).toBeFalse();
    expect(isValidPlate('ABC-0001', false)).toBeFalse();
  });

  it('allows free-form foreign plates up to ten characters', () => {
    expect(isValidPlate('ABC', true)).toBeFalse();
    expect(isValidPlate('ABC-0001', true)).toBeTrue();
    expect(isValidPlate('1234567890', true)).toBeTrue();
    expect(isValidPlate('12345678901', true)).toBeFalse();
  });
});
