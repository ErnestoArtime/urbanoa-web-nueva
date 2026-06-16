import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-confirm',
  imports: [RouterLink],
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
          <input class="form-input" type="password" />
        </div>
        <button type="button" class="btn-text mb-2">Reenviar código</button>
        <a routerLink="/onboarding/user" class="btn btn-primary btn-block">Confirmar e iniciar sesión</a>
      </div>
    </div>
  `,
})
export class RegisterConfirmComponent {}
