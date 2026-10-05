import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OpsSessionService {
  private readonly authToken = signal<string | null>(null);
  private readonly activeRequests = new Set<AbortController>();
  private readonly changeListeners = new Set<() => void>();

  readonly token = this.authToken.asReadonly();
  readonly hasSession = (): boolean => Boolean(this.authToken());

  setToken(token: string): void {
    const next = token.trim() || null;
    if (next === this.authToken()) return;
    this.invalidate();
    this.authToken.set(next);
  }

  clear(): void {
    this.authToken.set(null);
    this.invalidate();
  }

  onChange(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private invalidate(): void {
    for (const controller of this.activeRequests) controller.abort();
    this.activeRequests.clear();
    for (const listener of this.changeListeners) listener();
  }

  registerRequest(controller: AbortController): void {
    this.activeRequests.add(controller);
  }

  unregisterRequest(controller: AbortController): void {
    this.activeRequests.delete(controller);
  }
}
