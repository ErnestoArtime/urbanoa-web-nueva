import { formatOpsCalendarDate } from '../../core/utils/ops-date';

export const OPERATION_PERIODS = [
  'ops.today', 'ops.yesterday', 'ops.thisWeek', 'ops.lastWeek',
  'ops.thisMonth', 'ops.lastMonth', 'ops.thisYear', 'ops.previous',
] as const;

export function operationPeriod(date: string, now: Date): string {
  const [day, month, year] = formatOpsCalendarDate(now).split('/').map(Number);
  const today = Date.UTC(year, month - 1, day);
  const [d, m, y] = date.split('/').map(Number);
  const value = Date.UTC(y, m - 1, d);
  const week = today - ((new Date(today).getUTCDay() + 6) % 7) * 86_400_000;
  if (value === today) return 'ops.today';
  if (value === today - 86_400_000) return 'ops.yesterday';
  if (value >= week) return 'ops.thisWeek';
  if (value >= week - 7 * 86_400_000) return 'ops.lastWeek';
  if (y === year && m === month) return 'ops.thisMonth';
  if (value >= Date.UTC(year, month - 2, 1) && value < Date.UTC(year, month - 1, 1)) return 'ops.lastMonth';
  if (y === year) return 'ops.thisYear';
  return 'ops.previous';
}
