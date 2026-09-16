export function formatFineDate(value: string): string {
  const [datePart, timePart] = value.split('|').map((part) => part.trim());
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(datePart);
  if (!match) return value;
  const [, day, month, year] = match;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  return `${Number(day)} ${months[Number(month) - 1] ?? month} ${year}${timePart ? ` | ${timePart}` : ''}`;
}
