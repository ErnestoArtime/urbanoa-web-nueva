import { formatFineDate } from './fine-date';

describe('fine dates', () => {
  it('formats the month in the selected language while preserving the time', () => {
    expect(formatFineDate('02/09/2026 | 09:10', 'es')).toBe('2 sept 2026 | 09:10');
    expect(formatFineDate('02/09/2026 | 09:10', 'fr')).toBe('2 sept. 2026 | 09:10');
    expect(formatFineDate('02/09/2026 | 09:10', 'uk')).toBe('2 Sept 2026 | 09:10');
    const basqueMonth = new Intl.DateTimeFormat('eu', { month: 'short', timeZone: 'UTC' }).format(new Date('2026-09-02T12:00:00Z'));
    expect(formatFineDate('02/09/2026', 'eu')).toBe(
      Intl.DateTimeFormat.supportedLocalesOf(['eu']).length ? `2 ${basqueMonth} 2026` : '02/09/2026',
    );
  });

  it('leaves invalid calendar values unchanged', () => {
    expect(formatFineDate('31/02/2026')).toBe('31/02/2026');
    expect(formatFineDate('Sin fecha')).toBe('Sin fecha');
  });
});
