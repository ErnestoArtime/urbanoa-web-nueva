import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register-confirm',
  imports: [RouterLink, TranslatePipe],
  template: `
    <main class="auth-page auth-page-centered">
      <section class="auth-panel">
        <h1 class="auth-flow-title">{{ 'auth.confirm.title' | translate }}</h1>
        @if (email()) {
          <p class="auth-flow-intro">{{ 'auth.confirm.subtitle' | translate: { email: email() } }}</p>
          @if (noticeKey()) {
            <p class="text-muted auth-flow-status" role="status">{{ noticeKey() | translate }}</p>
          }
          @if (errorKey()) {
            <p class="form-error auth-flow-status" role="alert">{{ errorKey() | translate }}</p>
          }
          <button type="button" class="btn-text auth-flow-secondary mb-2" (click)="onResend()" [disabled]="resending()">
            {{ (resending() ? 'auth.confirm.resending' : 'auth.confirm.resend') | translate }}
          </button>
          <a routerLink="/auth/login" class="btn btn-primary btn-block">{{ 'auth.confirm.goToLogin' | translate }}</a>
        } @else {
          <p class="form-error auth-flow-status" role="alert">{{ 'auth.confirm.missingEmail' | translate }}</p>
          <a routerLink="/auth/register" class="btn btn-primary btn-block">{{ 'auth.confirm.backToRegister' | translate }}</a>
        }
      </section>
    </main>
  `,
  styleUrls: ['../../../shared/styles/auth-panel.css', '../../../shared/styles/auth-flow.css'],
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
