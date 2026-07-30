import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register-confirm',
  imports: [RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">{{ 'auth.registerConfirm.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.registerConfirm.subtitle' | translate }}</p>
        <div class="form-group">
          <label class="form-label">{{ 'auth.registerConfirm.code' | translate }}</label>
          <input class="form-input" placeholder="000000" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'auth.registerConfirm.confirmPassword' | translate }}</label>
          <div class="password-field">
            <input class="form-input" [type]="showPassword() ? 'text' : 'password'" /><button
              type="button"
              (click)="togglePassword()"
              [attr.aria-label]="'auth.togglePassword' | translate"
            >
              @if (showPassword()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
        </div>
        <button type="button" class="btn-text mb-2">{{ 'auth.registerConfirm.resend' | translate }}</button>
        <a routerLink="/onboarding/user" class="btn btn-primary btn-block">{{ 'auth.registerConfirm.submit' | translate }}</a>
      </div>
    </div>
  `,
})
export class RegisterConfirmComponent {
  readonly showPassword = signal(false);
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
}
