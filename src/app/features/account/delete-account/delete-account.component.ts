import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-delete-account',
  imports: [ReactiveFormsModule, TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.deleteAccount.title' | translate" backRoute="/app/account" />
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="card">
          <p class="text-error">{{ 'account.deleteAccount.warning' | translate }}</p>
          <div class="form-group">
            <label class="form-label">{{ 'account.deleteAccount.password' | translate }}</label>
            <input class="form-input" type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="form-error">{{ 'account.deleteAccount.passwordRequired' | translate }}</p>
            }
          </div>
          <div class="form-group">
            <label class="form-label">{{ 'account.deleteAccount.reason' | translate }}</label>
            <input class="form-input" formControlName="reason" />
          </div>
          @if (errorKey()) {
            <p class="form-error" role="alert">{{ errorKey() | translate }}</p>
          }
          <button type="submit" class="btn btn-danger btn-block" [disabled]="submitting()">
            {{ (submitting() ? 'account.deleteAccount.deleting' : 'account.deleteAccount.confirm') | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AccountDeleteAccountComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly errorKey = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    password: ['', Validators.required],
    reason: [''],
  });

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set('');
    const { password, reason } = this.form.getRawValue();

    try {
      await this.authService.cancelAccount(password, reason);
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error, { unauthorized: 'account.deleteAccount.wrongPassword' }));
    } finally {
      this.submitting.set(false);
    }
  }
}
