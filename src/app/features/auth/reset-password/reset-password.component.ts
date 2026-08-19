import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page auth-page">
      <h1 class="page-title">{{ 'auth.reset.title' | translate }}</h1>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">{{ 'account.profile.email' | translate }}</label>
          <input class="form-input" type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="form-error">
              {{ (form.controls.email.hasError('email') ? 'auth.reset.emailInvalid' : 'auth.reset.emailRequired') | translate }}
            </p>
          }
        </div>
        @if (errorKey()) {
          <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
        }
        <button type="submit" class="btn btn-primary btn-block" [disabled]="submitting()">
          {{ (submitting() ? 'auth.reset.sending' : 'auth.reset.generateCode') | translate }}
        </button>
      </form>
      <p class="text-center mt-2">
        <a routerLink="/auth/login">{{ 'auth.reset.backToLogin' | translate }}</a>
      </p>
    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly passwordService = inject(PasswordService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly errorKey = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set('');
    const { email } = this.form.getRawValue();

    try {
      await this.passwordService.requestCode(email);
      await this.router.navigate(['/auth/reset-password-code'], { queryParams: { email } });
    } catch (error) {
      this.errorKey.set(apiErrorKey(error, { unauthorized: 'auth.reset.unknownEmail' }));
    } finally {
      this.submitting.set(false);
    }
  }
}
