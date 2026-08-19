import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-code',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page auth-page">
      <h1 class="page-title">{{ 'auth.resetCode.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'auth.resetCode.subtitle' | translate }}</p>
      @if (noticeKey()) {
        <p class="text-muted" role="status">{{ noticeKey() | translate }}</p>
      }
      @if (errorKey()) {
        <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
      }
      <a [routerLink]="['/auth/reset-password-confirm']" [queryParams]="{ email: email() }" class="btn btn-primary btn-block mt-2">{{
        'auth.resetCode.enterCode' | translate
      }}</a>
      <button type="button" class="btn-text mt-2" (click)="onResend()" [disabled]="resending() || !email()">
        {{ (resending() ? 'auth.confirm.resending' : 'auth.confirm.resend') | translate }}
      </button>
    </div>
  `,
})
export class ResetPasswordCodeComponent {
  private readonly passwordService = inject(PasswordService);

  readonly email = input('');
  readonly resending = signal(false);
  readonly errorKey = signal('');
  readonly noticeKey = signal('');

  async onResend(): Promise<void> {
    if (this.resending()) return;

    this.resending.set(true);
    this.errorKey.set('');
    this.noticeKey.set('');

    try {
      await this.passwordService.resendMail(this.email(), 'recover');
      this.noticeKey.set('auth.confirm.resent');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error));
    } finally {
      this.resending.set(false);
    }
  }
}
