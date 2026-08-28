import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmation')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <main class="auth-page register-page">
      <section class="register-panel">
        <img src="/assets/brand/arinpark-logo.png" [alt]="brand.name" class="register-logo" />
        <header>
          <a routerLink="/auth/login" [attr.aria-label]="'common.back' | translate">←</a>
          <div>
            <h1>{{ 'auth.register.title' | translate }}</h1>
            <p>{{ 'auth.register.subtitle' | translate: { brand: brand.name } }}</p>
          </div>
        </header>
        <form class="form-grid" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="outlined-field"
            ><span>{{ 'auth.register.plate' | translate }}</span
            ><input formControlName="plate" placeholder="1234 ABC"
          /></label>
          @if (form.controls.plate.touched && form.controls.plate.invalid) {
            <p class="form-error">{{ 'auth.register.plateRequired' | translate }}</p>
          }
          <label class="foreign-check"
            ><input type="checkbox" formControlName="foreignPlate" /> {{ 'auth.register.foreignPlate' | translate }}</label
          >
          <label class="outlined-field"
            ><span>{{ 'auth.register.email' | translate }}</span
            ><input type="email" formControlName="email" placeholder="xxx@yyy.zzz" autocomplete="email"
          /></label>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="form-error">
              {{ (form.controls.email.hasError('email') ? 'auth.register.emailInvalid' : 'auth.register.emailRequired') | translate }}
            </p>
          }
          <label class="outlined-field"
            ><span>{{ 'auth.register.password' | translate }}</span>
            <div class="password-field">
              <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" /><button
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="'auth.register.togglePassword' | translate"
              >
                @if (showPassword()) {
                  <svg lucideEyeOff size="20"></svg>
                } @else {
                  <svg lucideEye size="20"></svg>
                }
              </button></div
          ></label>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="form-error">{{ 'auth.register.passwordTooShort' | translate }}</p>
          }
          <label class="outlined-field"
            ><span>{{ 'auth.register.repeatPassword' | translate }}</span>
            <div class="password-field">
              <input [type]="showConfirmation() ? 'text' : 'password'" formControlName="confirmation" autocomplete="new-password" /><button
                type="button"
                (click)="toggleConfirmation()"
                [attr.aria-label]="'auth.register.togglePassword' | translate"
              >
                @if (showConfirmation()) {
                  <svg lucideEyeOff size="20"></svg>
                } @else {
                  <svg lucideEye size="20"></svg>
                }
              </button></div
          ></label>
          @if (form.controls.confirmation.touched && form.hasError('passwordMismatch')) {
            <p class="form-error">{{ 'auth.register.passwordMismatch' | translate }}</p>
          }
          <label class="terms-check"
            ><input type="checkbox" formControlName="terms" /><span
              >{{ 'auth.register.acceptPrefix' | translate }}
              <a routerLink="/auth/web/terms">{{ 'auth.register.terms' | translate }}</a>
              {{ 'auth.register.and' | translate }}
              <a routerLink="/auth/web/privacy">{{ 'auth.register.privacy' | translate }}</a
              >.</span
            ></label
          >
          @if (form.controls.terms.touched && form.controls.terms.invalid) {
            <p class="form-error">{{ 'auth.register.termsRequired' | translate }}</p>
          }
          @if (errorKey()) {
            <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
          }
          <button type="submit" class="btn btn-primary btn-block continue-button" [disabled]="submitting()">
            {{ (submitting() ? 'auth.register.submitting' : 'auth.register.continue') | translate }}
          </button>
          <p class="login-link">
            {{ 'auth.register.haveAccount' | translate }} <a routerLink="/auth/login">{{ 'auth.register.login' | translate }}</a>
          </p>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      .register-page {
        justify-content: center;
        background: var(--color-background);
      }
      .register-panel {
        width: min(100%, 520px);
        padding: 1.7rem 2.2rem;
        border: 1px solid var(--color-border);
        border-radius: 22px;
        background: var(--color-surface);
        box-shadow: var(--shadow-md);
      }
      .register-logo {
        display: block;
        width: 190px;
        max-width: 60%;
        margin: 0 auto 1.25rem;
      }
      .register-panel header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .register-panel header > a {
        font-size: var(--text-2xl);
      }
      .register-panel h1 {
        font-size: var(--text-2xl);
      }
      .register-panel header p {
        color: var(--color-text-muted);
      }
      .outlined-field {
        position: relative;
        display: block;
        margin: 0.85rem 0;
      }
      .outlined-field span {
        position: absolute;
        z-index: 1;
        top: -0.55rem;
        left: 0.8rem;
        padding: 0 0.35rem;
        background: var(--color-surface);
        color: var(--color-primary);
        font-size: var(--text-xs);
      }
      .outlined-field input {
        width: 100%;
        min-height: 52px;
        padding: 0.8rem 1rem;
        border: 1px solid var(--color-primary);
        border-radius: 6px;
        background: transparent;
        font: inherit;
      }
      .password-field {
        position: relative;
        width: 100%;
      }
      .password-field input {
        width: 100%;
        padding-right: 44px;
        box-sizing: border-box;
      }
      .password-field button {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0;
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
        padding: 0;
      }
      .password-field button svg {
        width: 22px;
        height: 22px;
      }
      .foreign-check,
      .terms-check {
        display: flex;
        align-items: flex-start;
        gap: 0.55rem;
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .foreign-check {
        margin-top: -0.25rem;
      }
      .terms-check {
        margin: 1rem 0;
      }
      .terms-check input {
        margin-top: 0.2rem;
      }
      .continue-button {
        min-height: 50px;
      }
      .login-link {
        text-align: center;
        margin-top: 1rem;
        color: var(--color-text-muted);
      }
      @media (max-width: 560px) {
        .register-panel {
          padding: 1rem;
          border: 0;
          box-shadow: none;
          background: transparent;
        }
        .outlined-field span {
          background: var(--color-background);
        }
      }
    `,
  ],
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly submitting = signal(false);
  readonly errorKey = signal('');
  readonly brand = APP_BRAND;

  readonly form = this.formBuilder.nonNullable.group(
    {
      plate: ['', Validators.required],
      foreignPlate: [false],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmation: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
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
    const { email, password, plate } = this.form.getRawValue();

    try {
      await this.authService.register({ email, password, plates: [plate] });
      await this.router.navigate(['/auth/register-confirm'], { queryParams: { email } });
    } catch (error) {
      this.errorKey.set(apiErrorKey(error, { conflict: 'auth.register.emailTaken' }));
    } finally {
      this.submitting.set(false);
    }
  }
}
