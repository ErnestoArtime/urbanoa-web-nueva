import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
  selector: 'app-reset-password-confirm',
  imports: [RouterLink, LucideEye, LucideEyeOff],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">Nueva contraseña</h1>
        <p class="page-subtitle">Escriba el código recibido e introduzca una nueva contraseña.</p>
        <div class="form-group">
          <label class="form-label">Código</label>
          <input class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Nueva contraseña</label>
          <div class="password-field">
            <input class="form-input" [type]="showPassword() ? 'text' : 'password'" /><button
              type="button"
              (click)="togglePassword()"
              aria-label="Mostrar u ocultar contraseña"
            >
              @if (showPassword()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
          <div class="password-field">
            <input class="form-input" [type]="showConfirmation() ? 'text' : 'password'" /><button
              type="button"
              (click)="toggleConfirmation()"
              aria-label="Mostrar u ocultar contraseña"
            >
              @if (showConfirmation()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
        </div>
        <a routerLink="/auth/login" class="btn btn-primary btn-block">Guardar contraseña</a>
      </div>
    </div>
  `,
})
export class ResetPasswordConfirmComponent {
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
  toggleConfirmation(): void {
    this.showConfirmation.update((value) => !value);
  }
}
