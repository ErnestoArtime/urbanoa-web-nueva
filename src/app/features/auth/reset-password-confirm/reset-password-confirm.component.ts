import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmation')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password-confirm',
  imports: [ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">{{ 'auth.newPassword.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.newPassword.subtitle' | translate }}</p>
        @if (email()) {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">{{ 'auth.newPassword.code' | translate }}</label>
              <input class="form-input" formControlName="code" inputmode="numeric" />
              @if (form.controls.code.touched && form.controls.code.invalid) {
                <p class="form-error">{{ 'auth.newPassword.codeRequired' | translate }}</p>
              }
            </div>
            <div class="form-group">
              <label class="form-label">{{ 'auth.newPassword.password' | translate }}</label>
              <div class="password-field">
                <input
                  class="form-input"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                /><button type="button" (click)="togglePassword()" [attr.aria-label]="'auth.newPassword.togglePassword' | translate">
                  @if (showPassword()) {
                    <svg lucideEyeOff size="20"></svg>
                  } @else {
                    <svg lucideEye size="20"></svg>
                  }
                </button>
              </div>
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <p class="form-error">{{ 'auth.newPassword.passwordTooShort' | translate }}</p>
              }
            </div>
            <div class="form-group">
              <label class="form-label">{{ 'auth.newPassword.confirmation' | translate }}</label>
              <div class="password-field">
                <input
                  class="form-input"
                  [type]="showConfirmation() ? 'text' : 'password'"
                  formControlName="confirmation"
                  autocomplete="new-password"
                /><button type="button" (click)="toggleConfirmation()" [attr.aria-label]="'auth.newPassword.togglePassword' | translate">
                  @if (showConfirmation()) {
                    <svg lucideEyeOff size="20"></svg>
                  } @else {
                    <svg lucideEye size="20"></svg>
                  }
                </button>
              </div>
              @if (form.controls.confirmation.touched && form.hasError('passwordMismatch')) {
                <p class="form-error">{{ 'auth.newPassword.passwordMismatch' | translate }}</p>
              }
            </div>
            @if (errorKey()) {
              <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
            }
            <button type="submit" class="btn btn-primary btn-block" [disabled]="submitting()">
              {{ (submitting() ? 'auth.newPassword.saving' : 'auth.newPassword.save') | translate }}
            </button>
          </form>
        } @else {
          <p class="form-error" role="alert">{{ 'auth.newPassword.missingEmail' | translate }}</p>
          <a routerLink="/auth/reset-password" class="btn btn-primary btn-block">{{ 'auth.reset.title' | translate }}</a>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordConfirmComponent {
  private readonly passwordService = inject(PasswordService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly email = input('');
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly submitting = signal(false);
  readonly errorKey = signal('');

  readonly form = this.formBuilder.nonNullable.group(
    {
      code: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmation: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmation(): void {
    this.showConfirmation.update((value) => !value);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set('');
    const { code, password } = this.form.getRawValue();

    try {
      await this.passwordService.updatePassword(this.email(), code, password);
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error, { invalidCode: 'auth.newPassword.invalidCode' }));
    } finally {
      this.submitting.set(false);
    }
  }
}
