import { inject, Injectable } from '@angular/core';
import { postJson } from '../http/api-client';
import { AuthService } from './auth.service';

export type ResendMailType = 'register' | 'recover';

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly authService = inject(AuthService);

  async requestCode(email: string): Promise<void> {
    await postJson('/RecoverPasswordAPI', { email });
  }

  async verifyCode(email: string, code: string): Promise<void> {
    await postJson('/RecoverPasswordAPI', { email, code });
  }

  async resendMail(email: string, type: ResendMailType): Promise<void> {
    await postJson('/ResendMailAPI', { email, type });
  }

  async updatePassword(email: string, code: string, newPassword: string): Promise<void> {
    await postJson('/UpdatePasswordAPI', { email, code, newPassword });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await postJson('/ChangePasswordAPI', { currentPassword, newPassword }, { token: this.authService.token() });
  }
}
