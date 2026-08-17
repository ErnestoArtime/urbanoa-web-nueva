import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideEye, LucideEyeOff, LucideKeyRound } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password-confirm',
  imports: [ReactiveFormsModule, LucideEye, LucideEyeOff, LucideKeyRound, TranslatePipe],
  template: `
    <div class="auth-page">
      <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="auth-icon" aria-hidden="true"><svg lucideKeyRound size="28"></svg></div>
        <h1 class="page-title">{{ 'auth.resetConfirm.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.resetConfirm.subtitle' | translate }}</p>

        <div class="form-group">
          <label class="form-label" for="reset-code">{{ 'auth.resetConfirm.code' | translate }}</label>
          <input id="reset-code" class="form-input" inputmode="numeric" autocomplete="one-time-code" formControlName="code" />
          @if (invalid('code')) {
            <p class="form-error">{{ 'auth.resetConfirm.codeRequired' | translate }}</p>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="new-password">{{ 'auth.resetConfirm.newPassword' | translate }}</label>
          <div class="password-field">
            <input
              id="new-password"
              class="form-input"
              [type]="showPassword() ? 'text' : 'password'"
              autocomplete="new-password"
              formControlName="password"
            />
            <button type="button" (click)="togglePassword()" [attr.aria-label]="'auth.togglePassword' | translate">
              @if (showPassword()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
          @if (invalid('password')) {
            <p class="form-error">{{ 'auth.resetConfirm.passwordHint' | translate }}</p>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="confirm-password">{{ 'auth.resetConfirm.confirmPassword' | translate }}</label>
          <div class="password-field">
            <input
              id="confirm-password"
              class="form-input"
              [type]="showConfirmation() ? 'text' : 'password'"
              autocomplete="new-password"
              formControlName="confirmation"
            />
            <button type="button" (click)="toggleConfirmation()" [attr.aria-label]="'auth.togglePassword' | translate">
              @if (showConfirmation()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
          @if (submitted() && form.controls.confirmation.value !== form.controls.password.value) {
            <p class="form-error">{{ 'auth.resetConfirm.passwordMismatch' | translate }}</p>
          }
        </div>

        <button type="submit" class="btn btn-primary btn-block">{{ 'auth.resetConfirm.save' | translate }}</button>
      </form>
    </div>
  `,
  styles: [
    `
      .auth-icon {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        margin: 0 auto 1rem;
        border-radius: 18px;
        color: var(--color-primary);
        background: var(--color-active);
      }
      .form-error {
        margin-top: 0.35rem;
        color: var(--color-error);
        font-size: var(--text-xs);
      }
    `,
  ],
})
export class ResetPasswordConfirmComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly submitted = signal(false);
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', Validators.required],
  });

  invalid(control: 'code' | 'password'): boolean {
    return this.submitted() && this.form.controls[control].invalid;
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
  toggleConfirmation(): void {
    this.showConfirmation.update((value) => !value);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid || this.form.controls.password.value !== this.form.controls.confirmation.value) return;
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const code = this.route.snapshot.queryParamMap.get('code') ?? this.form.controls.code.value;
    await this.auth.changeResetPassword(email, code, this.form.controls.password.value);
    await this.router.navigate(['/auth/reset-password-success']);
  }
}
