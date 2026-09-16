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

  it('allows foreign plates with letters, numbers and hyphens from four to ten characters', () => {
    expect(isValidPlate('ABCD', true)).toBeTrue();
    expect(isValidPlate('ABC-0001', true)).toBeTrue();
    expect(isValidPlate('AB-12-CD', true)).toBeTrue();
    expect(isValidPlate('1234567890', true)).toBeTrue();
  });

  it('rejects foreign plates under four characters, over ten or with other symbols', () => {
    expect(isValidPlate('ABC', true)).toBeFalse();
    expect(isValidPlate('12345678901', true)).toBeFalse();
    expect(isValidPlate('ABCD-1234-5', true)).toBeFalse();
    expect(isValidPlate('ABC_123', true)).toBeFalse();
    expect(isValidPlate('ABC/0001', true)).toBeFalse();
    expect(isValidPlate('ABC!0001', true)).toBeFalse();
  });
});
