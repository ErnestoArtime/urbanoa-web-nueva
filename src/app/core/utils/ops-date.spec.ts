import { formatOpsDate, formatOpsTime, parseOpsDate } from './ops-date';

describe('operations date helpers', () => {
  it('formats an instant in Spain time independently of the browser timezone', () => {
    const instant = new Date('2026-08-27T00:30:45.000Z');

    expect(formatOpsDate(instant)).toBe('023045270826');
    expect(formatOpsTime(instant)).toBe('02:30');
  });

  it('parses the API timestamp as Spain local time', () => {
    expect(parseOpsDate('023045270826').toISOString()).toBe('2026-08-27T00:30:45.000Z');
  });
});
