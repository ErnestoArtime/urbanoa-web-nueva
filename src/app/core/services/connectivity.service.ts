import { Injectable, signal } from '@angular/core';

const PROBE_TIMEOUT_MS = 4_000;
const PROBE_INTERVAL_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly onlineState = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  private readonly restoredCount = signal(0);
  private readonly checkingState = signal(false);
  private probing: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly online = this.onlineState.asReadonly();
  readonly restored = this.restoredCount.asReadonly();
  readonly checking = this.checkingState.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('offline', () => this.markOffline());
    window.addEventListener('online', () => void this.verify());
  }

  reportTransportFailure(): void {
    void this.verify();
  }

  reportSuccess(): void {
    if (!this.onlineState()) this.markOnline();
  }

  verify(): Promise<boolean> {
    if (this.probing) return this.probing;
    this.checkingState.set(true);
    this.probing = this.probe()
      .then((reachable) => {
        if (reachable) this.markOnline();
        else this.markOffline();
        return reachable;
      })
      .finally(() => {
        this.probing = null;
        this.checkingState.set(false);
      });
    return this.probing;
  }

  private async probe(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      await fetch(`/?connectivity=${Date.now()}`, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private markOnline(): void {
    this.clearTimer();
    if (this.onlineState()) return;
    this.onlineState.set(true);
    this.restoredCount.update((count) => count + 1);
  }

  private markOffline(): void {
    this.onlineState.set(false);
    this.clearTimer();
    this.timer = setTimeout(() => void this.verify(), PROBE_INTERVAL_MS);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
