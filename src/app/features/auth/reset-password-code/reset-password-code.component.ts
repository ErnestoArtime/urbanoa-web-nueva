import { TranslationService } from '../../../core/services/translation.service';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-code',
  imports: [RouterLink, TranslatePipe],
  template: `
    <main class="auth-page auth-page-centered">
      <section class="auth-panel">
        <h1 class="auth-flow-title">{{ 'auth.resetCode.title' | translate }}</h1>
        <p class="auth-flow-intro">{{ 'auth.resetCode.subtitle' | translate }}</p>
        @if (noticeKey()) {
          <p class="text-muted auth-flow-status" role="status">{{ noticeKey() | translate }}</p>
        }
        @if (errorKey()) {
          <p class="form-error auth-flow-status" role="alert">{{ errorKey() }}</p>
        }
        <a [routerLink]="['/auth/reset-password-confirm']" [queryParams]="{ email: email() }" class="btn btn-primary btn-block mt-2">{{
          'auth.resetCode.enterCode' | translate
        }}</a>
        <button type="button" class="btn-text auth-flow-secondary" (click)="onResend()" [disabled]="resending() || !email()">
          {{ (resending() ? 'auth.confirm.resending' : 'auth.resetCode.resend') | translate }}
        </button>
      </section>
    </main>
  `,
  styleUrls: ['../../../shared/styles/auth-panel.css', '../../../shared/styles/auth-flow.css'],
})
export class ResetPasswordCodeComponent {
  private readonly errorTranslation = inject(TranslationService);
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
      this.errorKey.set(apiErrorMessage(error, this.errorTranslation));
    } finally {
      this.resending.set(false);
    }
  }
}
