import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password-code',
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-form text-center">
        <div class="success-icon">✉</div>
        <h1 class="page-title">Código enviado</h1>
        <p class="page-subtitle">Hemos enviado un correo para restablecer tu contraseña.</p>
        <a routerLink="/auth/reset-password-confirm" class="btn btn-primary btn-block mt-2">Introducir código</a>
      </div>
    </div>
  `,
})
export class ResetPasswordCodeComponent {}
