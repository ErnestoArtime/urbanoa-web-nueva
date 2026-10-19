import { apkPasswordValidator } from '../../../shared/utils/password-validation';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FOREIGN_PLATE_MAX_LENGTH, isValidPlate } from '../../../shared/utils/plate-validation';

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
        <img [src]="brand.logoPath" [alt]="brand.name" class="register-logo" />
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
            ><input
              formControlName="plate"
              placeholder="1234 ABC"
              [attr.maxlength]="form.controls.foreignPlate.value ? FOREIGN_PLATE_MAX_LENGTH : null"
              (input)="clearPlateError()"
          /></label>
          @if (form.controls.plate.touched && form.controls.plate.invalid) {
            <p class="form-error">
              {{
                (form.controls.plate.hasError('plateInvalid') ? 'auth.register.plateInvalid' : 'auth.register.plateRequired') | translate
              }}
            </p>
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
              <strong
                ><a routerLink="/auth/web/terms">{{ 'auth.register.terms' | translate }}</a></strong
              >
              {{ 'auth.register.and' | translate }}
              <strong
                ><a routerLink="/auth/web/privacy">{{ 'auth.register.privacy' | translate }}</a></strong
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
  styleUrls: ['../../../shared/styles/auth-flow.css', './register.component.css'],
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
  readonly FOREIGN_PLATE_MAX_LENGTH = FOREIGN_PLATE_MAX_LENGTH;

  readonly form = this.formBuilder.nonNullable.group(
    {
      plate: ['', Validators.required],
      foreignPlate: [false],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, apkPasswordValidator]],
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

  clearPlateError(): void {
    const errors = this.form.controls.plate.errors;
    if (!errors?.['plateInvalid']) return;
    const remaining = { ...errors };
    delete remaining['plateInvalid'];
    this.form.controls.plate.setErrors(Object.keys(remaining).length > 0 ? remaining : null);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    const values = this.form.getRawValue();
    if (!isValidPlate(values.plate, values.foreignPlate)) {
      this.form.controls.plate.setErrors({ ...(this.form.controls.plate.errors ?? {}), plateInvalid: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set('');
    const { email, password, plate } = values;

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
