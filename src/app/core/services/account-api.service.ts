import { Injectable, inject, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.api.post(OPS_ENDPOINTS.user.updatePassword, { password: newPassword }, { token: this.session.token() });
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }
  async cancelAccount(): Promise<void> {
    try {
      await this.api.get(OPS_ENDPOINTS.user.cancel, { token: this.session.token() });
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Baja de cuenta rechazada por la API', error);
      this.source.set('error');
      throw error;
    }
  }
}
