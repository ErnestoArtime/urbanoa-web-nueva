import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password-confirm',
  imports: [RouterLink],
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
          <input class="form-input" type="password" />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
          <input class="form-input" type="password" />
        </div>
        <a routerLink="/auth/login" class="btn btn-primary btn-block">Guardar contraseña</a>
      </div>
    </div>
  `,
})
export class ResetPasswordConfirmComponent {}
