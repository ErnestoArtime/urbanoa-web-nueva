import { Injectable, inject, signal } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly api = inject(AppApiClient);
  readonly source = signal<'remote' | 'mock'>('mock');

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try { await this.api.put('/users/password', { currentPassword, newPassword }); this.source.set('remote'); }
    catch (e) { console.warn('[API] Cambio de contraseña usa fallback mock', this.api.errorMessage(e)); this.source.set('mock'); }
  }
  async cancelAccount(): Promise<void> {
    try { await this.api.delete('/users/account'); this.source.set('remote'); }
    catch (e) { console.warn('[API] Baja de cuenta usa fallback mock', this.api.errorMessage(e)); this.source.set('mock'); }
  }
  async complete3ds(payload: unknown): Promise<void> {
    try { await this.api.post('/payments/3ds-complete', payload); this.source.set('remote'); }
    catch (e) { console.warn('[API] 3DS usa fallback mock', this.api.errorMessage(e)); this.source.set('mock'); }
  }
}
