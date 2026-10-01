import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OpsSessionService {
  private readonly authToken = signal<string | null>(null);
  private readonly activeRequests = new Set<AbortController>();

  readonly token = this.authToken.asReadonly();
  readonly hasSession = (): boolean => Boolean(this.authToken());

  setToken(token: string): void {
    this.authToken.set(token.trim() || null);
  }

  clear(): void {
    this.authToken.set(null);
    for (const controller of this.activeRequests) controller.abort();
    this.activeRequests.clear();
  }

  registerRequest(controller: AbortController): void {
    this.activeRequests.add(controller);
  }

  unregisterRequest(controller: AbortController): void {
    this.activeRequests.delete(controller);
  }
}
