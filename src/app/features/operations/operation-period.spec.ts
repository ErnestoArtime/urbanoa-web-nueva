import { operationPeriod } from './operation-period';

describe('APK operation periods', () => {
  it('groups the screenshot dates with the same precedence as the APK', () => {
    const now = new Date('2026-09-14T10:10:00Z');
    expect(['14/09/2026', '13/09/2026', '07/09/2026', '03/09/2026', '31/08/2026', '09/07/2026', '31/12/2025']
      .map(date => operationPeriod(date, now))).toEqual([
        'ops.today', 'ops.yesterday', 'ops.lastWeek', 'ops.thisMonth', 'ops.lastMonth', 'ops.thisYear', 'ops.previous',
      ]);
  });
  it('handles the previous month across a year boundary and Madrid midnight', () => {
    expect(operationPeriod('15/12/2025', new Date('2026-01-14T12:00:00Z'))).toBe('ops.lastMonth');
    expect(operationPeriod('15/09/2026', new Date('2026-09-14T22:30:00Z'))).toBe('ops.today');
    expect(operationPeriod('14/09/2026', new Date('2026-09-16T12:00:00Z'))).toBe('ops.thisWeek');
  });
});
