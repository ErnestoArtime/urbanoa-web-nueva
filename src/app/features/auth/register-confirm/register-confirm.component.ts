import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register-confirm',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">{{ 'auth.confirm.title' | translate }}</h1>
        @if (email()) {
          <p class="page-subtitle">{{ 'auth.confirm.subtitle' | translate: { email: email() } }}</p>
          @if (noticeKey()) {
            <p class="text-muted" role="status">{{ noticeKey() | translate }}</p>
          }
          @if (errorKey()) {
            <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
          }
          <button type="button" class="btn-text mb-2" (click)="onResend()" [disabled]="resending()">
            {{ (resending() ? 'auth.confirm.resending' : 'auth.confirm.resend') | translate }}
          </button>
          <a routerLink="/auth/login" class="btn btn-primary btn-block">{{ 'auth.confirm.goToLogin' | translate }}</a>
        } @else {
          <p class="form-error" role="alert">{{ 'auth.confirm.missingEmail' | translate }}</p>
          <a routerLink="/auth/register" class="btn btn-primary btn-block">{{ 'auth.confirm.backToRegister' | translate }}</a>
        }
      </div>
    </div>
  `,
})
export class RegisterConfirmComponent {
  private readonly passwordService = inject(PasswordService);

  readonly email = input('');
  readonly resending = signal(false);
  readonly errorKey = signal('');
  readonly noticeKey = signal('');

  async onResend(): Promise<void> {
    if (this.resending() || !this.email()) return;

    this.resending.set(true);
    this.errorKey.set('');
    this.noticeKey.set('');

    try {
      await this.passwordService.resendMail(this.email(), 'register');
      this.noticeKey.set('auth.confirm.resent');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error));
    } finally {
      this.resending.set(false);
    }
  }
}
