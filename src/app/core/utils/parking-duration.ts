export function formatParkingDuration(minutes: number | null | undefined): string {
  const totalMinutes = Math.max(0, Math.trunc(Number(minutes) || 0));
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes} min`;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}
