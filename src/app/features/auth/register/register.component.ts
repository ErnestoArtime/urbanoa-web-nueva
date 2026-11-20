import { environment } from '../../../../environments/environment';
import { legalContentPath } from '../../../core/utils/legal-content-path';
import { WebContentComponent } from '../../account/web-content/web-content.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { TranslationService } from '../../../core/services/translation.service';
import { apkPasswordValidator } from '../../../shared/utils/password-validation';
import { Component, HostListener, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorMessage } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FOREIGN_PLATE_MAX_LENGTH, isValidPlate, normalizePlate } from '../../../shared/utils/plate-validation';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmation')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [AppIconComponent, WebContentComponent, ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, TranslatePipe],
  template: `
    <main class="auth-page register-page">
      <section class="register-panel">
        <img [src]="brand.logoPath" [alt]="brand.name" class="register-logo" />
        <header>
          <a routerLink="/auth/login" class="auth-back" [attr.aria-label]="'common.back' | translate"
            ><app-icon name="arrowBackBlack24" [size]="24" [stroke]="false"
          /></a>
          <div>
            <h1>{{ 'auth.register.title' | translate }}</h1>
            <p>{{ 'auth.register.subtitle' | translate: { brand: brand.name } }}</p>
          </div>
        </header>
        <form class="form-grid" [formGroup]="form" (ngSubmit)="onSubmit()">
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
          <label class="switch-row foreign-switch"
            ><span>{{ 'auth.register.foreignPlate' | translate }}</span
            ><input type="checkbox" formControlName="foreignPlate" /><span class="switch"></span
          ></label>
          <label class="terms-check"
            ><input type="checkbox" class="check" formControlName="privacy" /><span
              >{{ 'auth.register.acceptPrivacyPrefix' | translate }}
              <strong
                ><a href="#" (click)="openLegal('privacy', $event)">{{ 'auth.register.privacyLink' | translate }}</a></strong
              ></span
            ></label
          >
          @if (form.controls.privacy.touched && form.controls.privacy.invalid) {
            <p class="form-error">{{ 'auth.register.privacyRequired' | translate }}</p>
          }
          <label class="terms-check"
            ><input type="checkbox" class="check" formControlName="terms" /><span
              >{{ 'auth.register.acceptPrefix' | translate }}
              <strong
                ><a href="#" (click)="openLegal('terms', $event)">{{ 'auth.register.termsLink' | translate }}</a></strong
              ></span
            ></label
          >
          @if (form.controls.terms.touched && form.controls.terms.invalid) {
            <p class="form-error">{{ 'auth.register.termsRequired' | translate }}</p>
          }
          @if (errorKey()) {
            <p class="form-error" role="alert">{{ errorKey() }}</p>
          }
          <button type="submit" class="btn btn-primary btn-block continue-button" [disabled]="submitting()">
            {{ (submitting() ? 'auth.register.submitting' : 'auth.register.continue') | translate }}
          </button>
          <p class="login-link">
            {{ 'auth.register.haveAccount' | translate }} <a routerLink="/auth/login">{{ 'auth.register.login' | translate }}</a>
          </p>
        </form>
      </section>
      @if (legalModal(); as legal) {
        <div class="legal-overlay" role="dialog" aria-modal="true" [attr.aria-label]="legal.title | translate" (click)="closeLegal()">
          <div class="legal-modal" (click)="$event.stopPropagation()">
            <header class="legal-header">
              <h2>{{ legal.title | translate }}</h2>
              <button type="button" class="legal-close" [attr.aria-label]="'common.close' | translate" (click)="closeLegal()">
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <app-web-content class="legal-body" [title]="legal.title" [url]="legal.url" [hideHeader]="true" />
          </div>
        </div>
      }
    </main>
  `,
  styleUrls: ['../../../shared/styles/auth-flow.css', './register.component.css'],
})
export class RegisterComponent {
  private readonly errorTranslation = inject(TranslationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly submitting = signal(false);
  readonly errorKey = signal('');
  readonly legalModal = signal<{ title: string; url: string } | null>(null);
  readonly brand = APP_BRAND;
  readonly FOREIGN_PLATE_MAX_LENGTH = FOREIGN_PLATE_MAX_LENGTH;

  readonly form = this.formBuilder.nonNullable.group(
    {
      plate: ['', Validators.required],
      foreignPlate: [false],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, apkPasswordValidator]],
      confirmation: ['', Validators.required],
      privacy: [false, Validators.requiredTrue],
      terms: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  openLegal(type: 'terms' | 'privacy', event: Event): void {
    event.preventDefault();
    this.legalModal.set({
      title: type === 'privacy' ? 'account.menu.privacy' : 'account.menu.terms',
      url: `${environment.externalContentBaseUrl}${legalContentPath(type, this.errorTranslation.currentLang$())}`,
    });
  }

  @HostListener('document:keydown.escape')
  closeLegal(): void {
    this.legalModal.set(null);
  }

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
    this.form.controls.plate.setValue(normalizePlate(this.form.controls.plate.value));
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
      this.errorKey.set(apiErrorMessage(error, this.errorTranslation, { conflict: 'auth.register.emailTaken' }));
    } finally {
      this.submitting.set(false);
    }
  }
}
