import { formatCountdown, liveCountdownSeconds, parseCountdownToSeconds } from './parking-countdown';

describe('parking-countdown', () => {
  it('parses HH:MM:SS snapshots into seconds', () => {
    expect(parseCountdownToSeconds('01:24:35')).toBe(5075);
    expect(parseCountdownToSeconds('00:00:00')).toBe(0);
    expect(parseCountdownToSeconds('not-a-time')).toBe(0);
  });

  it('formats seconds as HH:MM:SS clamped at zero', () => {
    expect(formatCountdown(5075)).toBe('01:24:35');
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-10)).toBe('00:00:00');
  });

  it('ticks the synced snapshot down by elapsed seconds', () => {
    expect(liveCountdownSeconds(5075, 1_000, 6_000)).toBe(5070);
    expect(liveCountdownSeconds(3, 1_000, 10_000)).toBe(0);
    expect(liveCountdownSeconds(100, 5_000, 1_000)).toBe(100);
  });
});
