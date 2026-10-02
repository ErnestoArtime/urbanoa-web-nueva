import { DestroyRef, inject, Injectable } from '@angular/core';

/** Coordinates ownership only. This marker contains no token, identity or credentials. */
@Injectable({ providedIn: 'root' })
export class WindowSessionService {
  private readonly key = 'urbanoa.auth.active-window';
  private owner: string | null = null;
  private readonly invalidationListeners = new Set<() => void>();

  constructor() {
    const check = () => this.ensureActive();
    const storage = (event: StorageEvent) => {
      if (event.key === this.key || event.key === null) check();
    };
    window.addEventListener('storage', storage);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('storage', storage);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      this.release();
      this.invalidationListeners.clear();
    });
  }

  activate(): void {
    const owner = this.createOwner();
    // Fail closed if coordination storage is unavailable; never fall back to persistent auth.
    localStorage.setItem(this.key, owner);
    this.owner = owner;
  }

  paymentOwner(): string | null {
    return this.ensureActive() ? this.owner : null;
  }

  resumePayment(owner: string): boolean {
    try {
      if (!owner || localStorage.getItem(this.key) !== owner) return false;
      this.activate();
      return true;
    } catch {
      return false;
    }
  }

  private createOwner(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // HTTP network origins still support secure random bytes for this non-secret marker.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  ensureActive(): boolean {
    if (!this.owner) return false;
    try {
      if (localStorage.getItem(this.key) === this.owner) return true;
    } catch {
      // Losing the ability to verify ownership must invalidate this window.
    }
    this.owner = null;
    for (const listener of this.invalidationListeners) listener();
    return false;
  }

  onInvalidated(listener: () => void): () => void {
    this.invalidationListeners.add(listener);
    return () => this.invalidationListeners.delete(listener);
  }

  release(): void {
    try {
      if (this.owner && localStorage.getItem(this.key) === this.owner) localStorage.removeItem(this.key);
    } catch {
      // A stale non-secret marker cannot restore a session.
    }
    this.owner = null;
  }
}
