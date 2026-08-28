import { inject, Injectable, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { AuthService, ResendMailType } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly authService = inject(AuthService);
  private readonly opsApi = inject(OpsApiClient);
  private readonly opsSession = inject(OpsSessionService);
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');

  async requestCode(email: string): Promise<void> {
    await this.authService.requestPasswordReset(email);
    this.source.set(this.authService.source());
  }

  async resendMail(email: string, type: ResendMailType): Promise<void> {
    await this.authService.resendMail(email, type);
    this.source.set(this.authService.source());
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      await this.opsApi.post(OPS_ENDPOINTS.user.updatePassword, { password: newPassword }, { token: this.opsSession.token() });
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  async verifyRecoveryCode(email: string, code: string): Promise<void> {
    await this.authService.verifyResetCode(email, code);
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    await this.authService.changeResetPassword(email, code, newPassword);
    this.source.set(this.authService.source());
  }
}
