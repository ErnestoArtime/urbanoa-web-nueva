import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">Recuperar contraseña</h1>
        <p class="page-subtitle">Introduzca su cuenta de correo de ArinPark y pulse generar código.</p>
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input class="form-input" type="email" />
        </div>
        <a routerLink="/auth/reset-password-code" class="btn btn-primary btn-block">Generar código</a>
        <p class="text-center mt-2"><a routerLink="/auth/login">Volver al inicio de sesión</a></p>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {}
