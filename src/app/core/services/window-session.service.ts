import { DestroyRef, inject, Injectable } from '@angular/core';

/** Coordinates ownership only. This marker contains no token, identity or credentials. */
@Injectable({ providedIn: 'root' })
export class WindowSessionService {
  private readonly keyPrefix = 'urbanoa.auth.active-window.';
  private owner: string | null = null;
  private scope: string | null = null;
  private readonly invalidationListeners = new Set<() => void>();

  constructor() {
    const check = () => this.ensureActive();
    const storage = (event: StorageEvent) => {
      if (event.key === null || (this.scope && event.key === this.keyFor(this.scope))) check();
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

  activate(identity = 'anonymous'): void {
    const scope = this.normalize(identity);
    if (!scope) throw new Error('Window identity is required');
    this.release();
    const owner = this.createOwner();
    // Fail closed if coordination storage is unavailable; never fall back to persistent auth.
    localStorage.setItem(this.keyFor(scope), owner);
    this.owner = owner;
    this.scope = scope;
  }

  paymentOwner(): string | null {
    return this.ensureActive() ? this.owner : null;
  }

  resumePayment(owner: string, identity = 'anonymous'): boolean {
    try {
      const scope = this.normalize(identity);
      if (!owner || !scope || localStorage.getItem(this.keyFor(scope)) !== owner) return false;
      this.owner = owner;
      this.scope = scope;
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
    if (!this.owner || !this.scope) return false;
    try {
      if (localStorage.getItem(this.keyFor(this.scope)) === this.owner) return true;
    } catch {
      // Losing the ability to verify ownership must invalidate this window.
    }
    this.owner = null;
    this.scope = null;
    for (const listener of this.invalidationListeners) listener();
    return false;
  }

  onInvalidated(listener: () => void): () => void {
    this.invalidationListeners.add(listener);
    return () => this.invalidationListeners.delete(listener);
  }

  release(): void {
    try {
      if (this.owner && this.scope && localStorage.getItem(this.keyFor(this.scope)) === this.owner) {
        localStorage.removeItem(this.keyFor(this.scope));
      }
    } catch {
      // A stale non-secret marker cannot restore a session.
    }
    this.owner = null;
    this.scope = null;
  }

  private normalize(identity: string): string {
    return identity.trim().toLowerCase();
  }

  private keyFor(scope: string): string {
    // Keep the user identifier out of localStorage. This marker is only for
    // coordination, never an authentication boundary.
    let first = 2166136261;
    let second = 16777619;
    for (const character of scope) {
      const code = character.codePointAt(0) ?? 0;
      first = Math.imul(first ^ code, 16777619);
      second = Math.imul(second ^ (code + 31), 2166136261);
    }
    return `${this.keyPrefix}${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
  }
}
