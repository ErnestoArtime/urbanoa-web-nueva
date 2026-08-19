import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register-confirm',
  imports: [ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">{{ 'auth.confirm.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.confirm.subtitle' | translate }}</p>
        @if (email()) {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">{{ 'auth.confirm.code' | translate }}</label>
              <input class="form-input" formControlName="code" placeholder="000000" inputmode="numeric" />
              @if (form.controls.code.touched && form.controls.code.invalid) {
                <p class="form-error">{{ 'auth.confirm.codeRequired' | translate }}</p>
              }
            </div>
            <div class="form-group">
              <label class="form-label">{{ 'auth.confirm.password' | translate }}</label>
              <div class="password-field">
                <input
                  class="form-input"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                /><button type="button" (click)="togglePassword()" [attr.aria-label]="'auth.confirm.togglePassword' | translate">
                  @if (showPassword()) {
                    <svg lucideEyeOff size="20"></svg>
                  } @else {
                    <svg lucideEye size="20"></svg>
                  }
                </button>
              </div>
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <p class="form-error">{{ 'auth.confirm.passwordRequired' | translate }}</p>
              }
            </div>
            <button type="button" class="btn-text mb-2" (click)="onResend()" [disabled]="resending()">
              {{ (resending() ? 'auth.confirm.resending' : 'auth.confirm.resend') | translate }}
            </button>
            @if (noticeKey()) {
              <p class="text-muted" role="status">{{ noticeKey() | translate }}</p>
            }
            @if (errorKey()) {
              <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
            }
            <button type="submit" class="btn btn-primary btn-block" [disabled]="submitting()">
              {{ (submitting() ? 'auth.confirm.submitting' : 'auth.confirm.submit') | translate }}
            </button>
          </form>
        } @else {
          <p class="form-error" role="alert">{{ 'auth.confirm.missingEmail' | translate }}</p>
          <a routerLink="/auth/register" class="btn btn-primary btn-block">{{ 'auth.confirm.backToRegister' | translate }}</a>
        }
      </div>
    </div>
  `,
})
export class RegisterConfirmComponent {
  private readonly authService = inject(AuthService);
  private readonly passwordService = inject(PasswordService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly email = input('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly resending = signal(false);
  readonly errorKey = signal('');
  readonly noticeKey = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    code: ['', Validators.required],
    password: ['', Validators.required],
  });

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  async onResend(): Promise<void> {
    if (this.resending()) return;

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

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set('');
    this.noticeKey.set('');
    const { code, password } = this.form.getRawValue();

    try {
      await this.passwordService.verifyCode(this.email(), code);
      await this.authService.login(this.email(), password);
      await this.router.navigateByUrl('/onboarding/user');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error, { invalidCode: 'auth.confirm.invalidCode', unauthorized: 'auth.confirm.invalidCode' }));
    } finally {
      this.submitting.set(false);
    }
  }
}
