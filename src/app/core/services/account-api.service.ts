import { Injectable, inject, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  readonly source = signal<'remote' | 'mock'>('mock');

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    void currentPassword;
    try {
      await this.api.post(OPS_ENDPOINTS.user.updatePassword, { password: newPassword }, { token: this.session.token() });
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Cambio de contraseña usa fallback mock', error);
      this.source.set('mock');
    }
  }

  async cancelAccount(): Promise<void> {
    try {
      await this.api.get(OPS_ENDPOINTS.user.cancel, { token: this.session.token() });
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Baja de cuenta usa fallback mock', error);
      this.source.set('mock');
    }
  }

  async complete3ds(payload: unknown): Promise<void> {
    void payload;
    console.info('[OPS API] 3DS no tiene endpoint propio en Swagger; se mantiene el flujo WebView/local.');
    this.source.set('mock');
  }
}
