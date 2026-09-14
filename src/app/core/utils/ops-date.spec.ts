import { formatOpsDate, formatOpsTime, parseOpsDate, opsRelativeDayLabel } from './ops-date';

describe('operations date helpers', () => {
  it('identifies tomorrow across both daylight saving transitions', () => {
    expect(opsRelativeDayLabel(parseOpsDate('100000290326'), parseOpsDate('233000280326'))).toBe('ops.tomorrow');
    expect(opsRelativeDayLabel(parseOpsDate('100000261026'), parseOpsDate('003000251026'))).toBe('ops.tomorrow');
    expect(opsRelativeDayLabel(parseOpsDate('100000010127'), parseOpsDate('233000311226'))).toBe('ops.tomorrow');
  });
  it('formats an instant in Spain time independently of the browser timezone', () => {
    const instant = new Date('2026-08-27T00:30:45.000Z');

    expect(formatOpsDate(instant)).toBe('023045270826');
    expect(formatOpsTime(instant)).toBe('02:30');
  });

  it('parses the API timestamp as Spain local time', () => {
    expect(parseOpsDate('023045270826').toISOString()).toBe('2026-08-27T00:30:45.000Z');
  });
});
