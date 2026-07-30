import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-confirm',
  imports: [RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">{{ 'auth.resetConfirm.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.resetConfirm.subtitle' | translate }}</p>
        <div class="form-group">
          <label class="form-label">{{ 'auth.resetConfirm.code' | translate }}</label>
          <input class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'auth.resetConfirm.newPassword' | translate }}</label>
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
        <div class="form-group">
          <label class="form-label">{{ 'auth.resetConfirm.confirmPassword' | translate }}</label>
          <div class="password-field">
            <input class="form-input" [type]="showConfirmation() ? 'text' : 'password'" /><button
              type="button"
              (click)="toggleConfirmation()"
              [attr.aria-label]="'auth.togglePassword' | translate"
            >
              @if (showConfirmation()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
        </div>
        <a routerLink="/auth/login" class="btn btn-primary btn-block">{{ 'auth.resetConfirm.save' | translate }}</a>
      </div>
    </div>
  `,
})
export class ResetPasswordConfirmComponent {
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
  toggleConfirmation(): void {
    this.showConfirmation.update((value) => !value);
  }
}
