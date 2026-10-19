import { formatEuro, formatEuroNumber } from './euro-format';
import { EuroPipe } from '../../shared/pipes/euro.pipe';

describe('APK regional EUR formatting', () => {
  it('uses Spanish currency spacing and decimals instead of concatenating EUR', () => {
    expect(formatEuro(0.6, 'es-ES')).toBe('0,60\u00a0€');
    expect(formatEuro(12345.6, 'es-ES')).toBe('12.345,60\u00a0€');
  });
  it('follows the device region independently of the catalogue language', () => {
    expect(formatEuro(0.6, 'en-US')).toBe('€0.60');
    expect(formatEuro(12345.6, 'en-US')).toBe('€12,345.60');
    expect(new EuroPipe().transform(0.6)).toBe(new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(0.6));
  });
  it('preserves debits and does not show a minus sign for zero', () => {
    expect(formatEuro(-0.6, 'es-ES')).toBe('-0,60\u00a0€');
    expect(formatEuro(-0, 'es-ES')).toBe('0,00\u00a0€');
  });
  it('does not duplicate the symbol in catalogue messages that already contain it', () => {
    expect(formatEuroNumber(12345.6, 'es-ES')).toBe('12.345,60');
    expect(formatEuroNumber(12345.6, 'en-US')).toBe('12,345.60');
  });
});
