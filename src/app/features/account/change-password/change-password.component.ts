import { Component, inject, signal } from '@angular/core';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { PasswordService } from '../../../core/services/password.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-change-password',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LucideEye, LucideEyeOff],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.changePassword.title' | translate" backRoute="/app/account" />
      <div class="card">
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
          (primaryAction)="result.set(null)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .password-field {
        position: relative;
      }
      .password-field input {
        padding-right: 3rem;
      }
      .password-field button {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        translate: none;
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
      .password-field button:hover {
        background: #fde0a4;
        color: var(--color-primary);
      }
      .password-field button svg {
        width: 22px;
        height: 22px;
      }
    `,
  ],
})
export class AccountChangePasswordComponent {
  private readonly passwordService = inject(PasswordService);

  readonly next = signal('');
  readonly confirmation = signal('');
  readonly showNext = signal(false);
  readonly showConfirmation = signal(false);
  readonly result = signal<'success' | 'error' | null>(null);
  readonly errorKey = signal('');
  readonly saving = signal(false);

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  toggleVisibility(field: 'next' | 'confirmation'): void {
    const visibility = field === 'next' ? this.showNext : this.showConfirmation;
    visibility.update((value) => !value);
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    if (this.next().length < 8 || this.next() !== this.confirmation()) {
      this.errorKey.set(this.next() !== this.confirmation() ? 'account.changePassword.mismatch' : 'account.changePassword.invalid');
      this.result.set('error');
      return;
    }

    this.saving.set(true);

    try {
      await this.passwordService.updatePassword(this.next());
      this.result.set('success');
    } catch (error) {
      this.errorKey.set(apiErrorKey(error));
      this.result.set('error');
    } finally {
      this.saving.set(false);
    }
  }
}
