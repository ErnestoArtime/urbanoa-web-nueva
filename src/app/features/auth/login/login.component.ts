import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorMessage } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <main class="auth-page auth-page-centered">
      <section class="auth-panel">
        <img [src]="brand.logoPath" [alt]="brand.name" class="apk-auth-logo" />
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
  styleUrls: ['../../../shared/styles/auth-panel.css', '../../../shared/styles/auth-flow.css', './login.component.css'],
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
      const user = await this.authService.login(email, password);
      await this.router.navigateByUrl(user.firstLogin ? '/onboarding/user' : this.returnUrl() || '/app');
    } catch (error) {
      this.errorMessage.set(
        apiErrorMessage(error, this.translationService, {
          unauthorized: 'auth.login.invalidCredentials',
          notActivated: 'auth.login.accountNotActivated',
        }),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
