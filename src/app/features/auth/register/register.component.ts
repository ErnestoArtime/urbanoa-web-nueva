import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <img src="assets/brand/login-logo.jpg" alt="ArinPark" class="auth-logo" />
      <div class="auth-form">
        <h1 class="page-title">Registro</h1>
        <p class="page-subtitle">Crea tu cuenta</p>
        <div class="form-group">
          <label class="form-label">Matrícula</label>
          <input class="form-input" placeholder="1234 ABC" />
        </div>
        <div class="form-group">
          <label class="form-label"><input type="checkbox" /> Matrícula extranjera</label>
        </div>
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input class="form-input" type="email" />
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input class="form-input" type="password" />
        </div>
        <p class="text-muted" style="font-size:0.8125rem">
          Al continuar aceptas los <a routerLink="/auth/web/terms">términos y condiciones</a>
          y la <a routerLink="/auth/web/privacy">política de privacidad</a>.
        </p>
        <a routerLink="/auth/register-confirm" class="btn btn-primary btn-block mt-2">Continuar</a>
        <p class="text-center mt-2"><a routerLink="/auth/login">¿Ya tienes cuenta? Iniciar sesión</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {}
