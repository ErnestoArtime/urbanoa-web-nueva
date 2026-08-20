import { inject, Injectable } from '@angular/core';
import { postJson } from '../http/api-client';
import { AuthService } from './auth.service';

export type ResendMailType = 'register' | 'recover';

const RESEND_MAIL_TYPE: Record<ResendMailType, string> = {
  register: 'REGISTER',
  recover: 'recover',
};

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly authService = inject(AuthService);

  async requestCode(email: string): Promise<void> {
    await postJson('/RecoverPasswordAPI', { email });
  }

  async resendMail(email: string, type: ResendMailType): Promise<void> {
    await postJson('/ResendMailAPI', { contractId: 0, userName: email, email, type: RESEND_MAIL_TYPE[type] });
  }

  async updatePassword(newPassword: string): Promise<void> {
    await postJson('/UpdatePasswordAPI', { password: newPassword }, { token: this.authService.token() });
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    const token = await postJson<string>('/ChangePasswordAPI', { email, newPassword, recode: code });
    this.authService.adoptToken(token, email);
  }
}
