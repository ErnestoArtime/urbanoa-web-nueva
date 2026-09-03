const OPS_TIME_ZONE = 'Europe/Madrid';

function parts(date: Date): Record<string, number> {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: OPS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .filter((part) => part.type !== 'literal')
    .reduce<Record<string, number>>((result, part) => {
      result[part.type] = Number(part.value);
      return result;
    }, {});
  return values;
}

/** Formats an instant using the timezone expected by the operations API. */
export function formatOpsDate(date: Date): string {
  const value = parts(date);
  const two = (part: number): string => String(part).padStart(2, '0');
  return `${two(value['hour'])}${two(value['minute'])}${two(value['second'])}${two(value['day'])}${two(value['month'])}${two(value['year'] % 100)}`;
}

/** Parses the API's timezone-less operation timestamp as Europe/Madrid time. */
export function parseOpsDate(value: string): Date {
  if (!/^\d{12}$/.test(value)) return new Date(value);

  const year = 2000 + Number(value.slice(10, 12));
  const month = Number(value.slice(8, 10));
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(0, 2));
  const minute = Number(value.slice(2, 4));
  const second = Number(value.slice(4, 6));
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const zoneParts = parts(new Date(wallClockAsUtc));
  const zoneClockAsUtc = Date.UTC(
    zoneParts['year'],
    zoneParts['month'] - 1,
    zoneParts['day'],
    zoneParts['hour'],
    zoneParts['minute'],
    zoneParts['second'],
  );
  return new Date(wallClockAsUtc - (zoneClockAsUtc - wallClockAsUtc));
}

export function formatOpsTime(date: Date): string {
  const value = parts(date);
  return `${String(value['hour']).padStart(2, '0')}:${String(value['minute']).padStart(2, '0')}`;
}

export function formatOpsCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { timeZone: OPS_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
