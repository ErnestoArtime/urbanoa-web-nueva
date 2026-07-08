import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
  selector: 'app-account-change-password',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LucideEye, LucideEyeOff],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.changePassword.title' | translate" backRoute="/app/account" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.changePassword.current' | translate }} <span class="text-error">*</span></label>
          <div class="password-field">
            <input class="form-input" [type]="showCurrent() ? 'text' : 'password'" (input)="current.set(valueOf($event))" /><button
              type="button"
              (click)="toggleVisibility('current')"
              [attr.aria-label]="showCurrent() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
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
              [attr.aria-label]="showNext() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
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
              [attr.aria-label]="showConfirmation() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              @if (showConfirmation()) {
                <svg lucideEyeOff size="21"></svg>
              } @else {
                <svg lucideEye size="21"></svg>
              }
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-block" (click)="save()">{{ 'common.save' | translate }}</button>
      </div>
      @if (result(); as state) {
        <app-result-modal
          [type]="state"
          [title]="state === 'success' ? 'Contraseña actualizada' : 'No se pudo actualizar la contraseña'"
          [message]="state === 'success' ? 'La contraseña se ha cambiado correctamente.' : errorMessage()"
          primaryText="Aceptar"
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
  readonly current = signal('');
  readonly next = signal('');
  readonly confirmation = signal('');
  readonly showCurrent = signal(false);
  readonly showNext = signal(false);
  readonly showConfirmation = signal(false);
  readonly result = signal<'success' | 'error' | null>(null);
  readonly errorMessage = signal('');

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  toggleVisibility(field: 'current' | 'next' | 'confirmation'): void {
    const visibility = field === 'current' ? this.showCurrent : field === 'next' ? this.showNext : this.showConfirmation;
    visibility.update((value) => !value);
  }

  save(): void {
    if (!this.current() || this.next().length < 8 || this.next() !== this.confirmation()) {
      this.errorMessage.set(
        this.next() !== this.confirmation() ? 'Las contraseñas nuevas no coinciden.' : 'Completa los campos y usa al menos 8 caracteres.',
      );
      this.result.set('error');
      return;
    }
    this.result.set('success');
  }
}
