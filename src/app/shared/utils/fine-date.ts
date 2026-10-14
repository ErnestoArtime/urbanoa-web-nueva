export function formatFineDate(value: string, language = 'es'): string {
  const [datePart, timePart] = value.split('|').map((part) => part.trim());
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(datePart);
  if (!match) return value;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return value;
  const locale = language === 'uk' ? 'en-GB' : language;
  // Keep numeric dates when this browser lacks the selected locale instead of showing a different language.
  if (!Intl.DateTimeFormat.supportedLocalesOf([locale]).length) return value;
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date);
  return `${Number(day)} ${monthLabel} ${year}${timePart ? ` | ${timePart}` : ''}`;
}
