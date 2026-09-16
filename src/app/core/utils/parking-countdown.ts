/** Live countdown helpers mirroring the APK per-second ticket timer.
 *
 * The backend snapshot (`timeRemaining`, HH:MM:SS) is frozen at sync time, so
 * ticket cards keep a local baseline per parking and tick it down every second
 * instead of showing a stale value until the next sync.
 */

/** Parses an `HH:MM:SS` snapshot into total seconds. Returns 0 when invalid. */
export function parseCountdownToSeconds(value: string): number {
  const parts = value.trim().split(':').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [hours, minutes, seconds] = parts;
    return Math.max(0, hours * 3600 + minutes * 60 + seconds);
  }
  return 0;
}

/** Formats total seconds as `HH:MM:SS`, clamped at zero. */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = String(Math.floor(clamped / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((clamped % 3600) / 60)).padStart(2, '0');
  const seconds = String(clamped % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/** Ticks a synced snapshot down by the elapsed wall-clock time, clamped at zero. */
export function liveCountdownSeconds(syncedSeconds: number, syncedAtMs: number, nowMs: number): number {
  return Math.max(0, syncedSeconds - Math.max(0, Math.floor((nowMs - syncedAtMs) / 1000)));
}
