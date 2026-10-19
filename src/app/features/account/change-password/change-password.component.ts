import { AuthService } from '../../../core/services/auth.service';
import { isValidApkPassword } from '../../../shared/utils/password-validation';
import { Component, inject, signal } from '@angular/core';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-change-password',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LucideEye, LucideEyeOff, LoaderComponent],
  template: `
    <app-loader [visible]="saving()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      <app-detail-panel-header [title]="'account.changePassword.title' | translate" backRoute="/app/account" />
      <div class="card">
        <div class="form-group">
          <label for="current-password">{{ 'account.changePassword.current' | translate }} <span class="text-error">*</span></label>
          <div class="password-field">
            <input
              id="current-password"
              class="form-input"
              autocomplete="current-password"
              [type]="showCurrent() ? 'text' : 'password'"
              [value]="current()"
              (input)="current.set(valueOf($event))"
            />
            <button
              type="button"
              (click)="toggleVisibility('current')"
              [attr.aria-label]="'account.changePassword.togglePassword' | translate"
            >
              @if (showCurrent()) {
                <svg lucideEyeOff size="21"></svg>
              } @else {
                <svg lucideEye size="21"></svg>
              }
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.new' | translate }} <span class="text-error">*</span></label>
          <div class="password-field">
            <input class="form-input" [type]="showNext() ? 'text' : 'password'" (input)="next.set(valueOf($event))" /><button
              type="button"
              (click)="toggleVisibility('next')"
              [attr.aria-label]="'account.changePassword.togglePassword' | translate"
            >
              @if (showNext()) {
                <svg lucideEyeOff size="21"></svg>
              } @else {
                <svg lucideEye size="21"></svg>
              }
            </button>
          </div>
          <small class="text-muted">{{ 'account.changePassword.minLength' | translate }}</small>
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.confirm' | translate }} <span class="text-error">*</span></label>
          <div class="password-field">
            <input
              class="form-input"
              [type]="showConfirmation() ? 'text' : 'password'"
              (input)="confirmation.set(valueOf($event))"
            /><button
              type="button"
              (click)="toggleVisibility('confirmation')"
              [attr.aria-label]="'account.changePassword.togglePassword' | translate"
            >
              @if (showConfirmation()) {
                <svg lucideEyeOff size="21"></svg>
              } @else {
                <svg lucideEye size="21"></svg>
              }
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-block" (click)="save()" [disabled]="saving()">
          {{ (saving() ? 'common.saving' : 'common.save') | translate }}
        </button>
      </div>
      @if (result(); as state) {
        <app-result-modal
          [type]="state"
          [title]="(state === 'success' ? 'account.changePassword.successTitle' : 'account.changePassword.errorTitle') | translate"
          [message]="(state === 'success' ? 'account.changePassword.successMessage' : errorKey()) | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="dismissResult()"
        />
      }
    </div>
  `,
  styleUrl: './change-password.component.css',
})
export class AccountChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly passwordService = inject(PasswordService);

  readonly current = signal('');
  readonly showCurrent = signal(false);
  readonly next = signal('');
  readonly confirmation = signal('');
  readonly showNext = signal(false);
  readonly showConfirmation = signal(false);
  readonly result = signal<'success' | 'error' | null>(null);
  readonly errorKey = signal('');
  readonly saving = signal(false);

  async dismissResult(): Promise<void> {
    if (this.result() === 'success') await this.authService.logout();
    else this.result.set(null);
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  toggleVisibility(field: 'current' | 'next' | 'confirmation'): void {
    const visibility = field === 'current' ? this.showCurrent : field === 'next' ? this.showNext : this.showConfirmation;
    visibility.update((value) => !value);
  }

  async save(): Promise<void> {
    if (this.saving() || this.result() === 'success') return;

    if (!this.current()) {
      this.errorKey.set('common.required');
      this.result.set('error');
      return;
    }
    if (!isValidApkPassword(this.next()) || this.next() !== this.confirmation()) {
      this.errorKey.set(this.next() !== this.confirmation() ? 'account.changePassword.mismatch' : 'account.changePassword.invalid');
      this.result.set('error');
      return;
    }

    this.saving.set(true);

    try {
      await this.passwordService.updatePassword(this.next(), this.current());
      this.result.set('success');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error, { unauthorized: 'auth.login.invalidCredentials' }));
      this.result.set('error');
    } finally {
      this.current.set('');
      this.saving.set(false);
    }
  }
}
