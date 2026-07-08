import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
  selector: 'app-register-confirm',
  imports: [RouterLink, LucideEye, LucideEyeOff],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">Confirmar registro</h1>
        <p class="page-subtitle">Introduce el código recibido por correo</p>
        <div class="form-group">
          <label class="form-label">Código</label>
          <input class="form-input" placeholder="000000" />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
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
        <button type="button" class="btn-text mb-2">Reenviar código</button>
        <a routerLink="/onboarding/user" class="btn btn-primary btn-block">Confirmar e iniciar sesión</a>
      </div>
    </div>
  `,
})
export class RegisterConfirmComponent {
  readonly showPassword = signal(false);
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
}
