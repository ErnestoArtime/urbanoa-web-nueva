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
    const owner = crypto.randomUUID();
    // Fail closed if coordination storage is unavailable; never fall back to persistent auth.
    localStorage.setItem(this.key, owner);
    this.owner = owner;
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
