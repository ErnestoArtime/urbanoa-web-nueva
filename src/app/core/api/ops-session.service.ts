import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OpsSessionService {
  private readonly authToken = signal<string | null>(null);

  constructor() {
    try {
      const stored = JSON.parse(localStorage.getItem('urbanoa.auth.user') ?? 'null') as { token?: string } | null;
      if (stored?.token) this.authToken.set(stored.token);
    } catch {
      // La sesión de demo sigue funcionando en memoria.
    }
  }

  readonly token = this.authToken.asReadonly();
  readonly hasSession = (): boolean => Boolean(this.authToken());

  setToken(token: string): void {
    this.authToken.set(token.trim() || null);
  }

  clear(): void {
    this.authToken.set(null);
  }
}
