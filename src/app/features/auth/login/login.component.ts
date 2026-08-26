import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <main class="auth-page apk-auth-page">
      <section class="auth-panel">
        <img src="/assets/brand/arinpark-logo.png" [alt]="brand.name" class="apk-auth-logo" />
        <h1>{{ 'auth.login.title' | translate }}</h1>
        <p class="auth-intro">{{ 'auth.login.subtitle' | translate }}</p>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="outlined-field"
            ><span>{{ 'auth.login.email' | translate }}</span
            ><input type="email" formControlName="email" placeholder="xxx@yyy.zzz" autocomplete="email"
          /></label>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="form-error">
              {{ (form.controls.email.hasError('email') ? 'auth.login.emailInvalid' : 'auth.login.emailRequired') | translate }}
            </p>
          }
          <label class="outlined-field"
            ><span>{{ 'auth.login.password' | translate }}</span>
            <div class="password-field">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              /><button type="button" (click)="togglePassword()" [attr.aria-label]="'auth.login.togglePassword' | translate">
                @if (showPassword()) {
                  <svg lucideEyeOff size="20"></svg>
                } @else {
                  <svg lucideEye size="20"></svg>
                }
              </button></div
          ></label>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="form-error">{{ 'auth.login.passwordRequired' | translate }}</p>
          }
          <a routerLink="/auth/reset-password" class="recover-link">{{ 'auth.login.forgotPassword' | translate }}</a>
          @if (errorMessage()) {
            <p class="form-error login-error" role="alert">{{ errorMessage() }}</p>
          }
          <button type="submit" class="btn btn-primary btn-block login-button" [disabled]="submitting()">
            {{ (submitting() ? 'auth.login.submitting' : 'auth.login.submit') | translate }}
          </button>
        </form>
        <p class="register-link">
          {{ 'auth.login.noAccount' | translate }} <a routerLink="/auth/register">{{ 'auth.login.register' | translate }}</a>
        </p>
      </section>
    </main>
  `,
  styles: [
    `
      .apk-auth-page {
        justify-content: center;
        background: var(--color-background);
      }
      .auth-panel {
        width: min(100%, 420px);
        padding: 2rem 2.2rem;
        border: 1px solid var(--color-border);
        border-radius: 22px;
        background: var(--color-surface);
        box-shadow: var(--shadow-md);
      }
      .apk-auth-logo {
        display: block;
        width: 230px;
        max-width: 75%;
        height: auto;
        margin: 0 auto 2rem;
      }
      .auth-panel h1 {
        text-align: center;
        font-size: var(--text-2xl);
      }
      .auth-intro {
        text-align: center;
        color: var(--color-text-muted);
        margin: 0.35rem 0 1.5rem;
      }
      .outlined-field {
        position: relative;
        display: block;
        margin: 1rem 0;
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
        min-height: 54px;
        padding: 0.85rem 1rem;
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
      .outlined-field input:focus {
        outline: 2px solid rgba(43, 103, 103, 0.15);
      }
      .recover-link {
        display: block;
        text-align: right;
        margin: 0.2rem 0 1.2rem;
        font-size: var(--text-sm);
      }
      .login-button {
        min-height: 50px;
      }
      .login-error {
        display: flex;
        align-items: center;
        min-height: 2.75rem;
        margin: 1rem 0 1.25rem;
        padding: 0.65rem 0.8rem;
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-error) 8%, transparent);
        line-height: 1.35;
      }
      .register-link {
        text-align: center;
        margin-top: 1.2rem;
        color: var(--color-text-muted);
      }
      @media (max-width: 520px) {
        .auth-panel {
          padding: 1.5rem;
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
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly translationService = inject(TranslationService);

  readonly returnUrl = input('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly brand = APP_BRAND;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    const { email, password } = this.form.getRawValue();

    try {
      await this.authService.login(email, password);
      await this.router.navigateByUrl(this.returnUrl() || '/app');
    } catch (error) {
      this.errorMessage.set(
        this.backendErrorMessage(error) ??
          this.translationService.translate(
            apiErrorKey(error, { unauthorized: 'auth.login.invalidCredentials', notActivated: 'auth.login.accountNotActivated' }),
          ),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private backendErrorMessage(error: unknown): string | null {
    if (!(error instanceof OpsApiError) || !error.backendError) return null;
    const messages: Record<string, string | undefined> = {
      es: error.backendError.message_ES,
      eu: error.backendError.message_EU,
      fr: error.backendError.message_FR,
      uk: error.backendError.message_EN,
    };
    return messages[this.translationService.currentLang$()] ?? error.backendError.message_ES ?? error.backendError.message_EN ?? null;
  }
}
