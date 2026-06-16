import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <img src="assets/brand/login-logo.jpg" alt="ArinPark" class="auth-logo" />
      <div class="auth-form">
        <h1 class="page-title text-center">Iniciar sesión</h1>
        <p class="page-subtitle text-center">La forma más fácil de aparcar</p>
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input class="form-input" type="email" placeholder="tu@email.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input class="form-input" type="password" placeholder="••••••••" />
        </div>
        <a routerLink="/auth/reset-password" class="btn-text mb-2" style="display:block">Recuperar contraseña</a>
        <a routerLink="/app/home" class="btn btn-primary btn-block">Iniciar sesión</a>
        <p class="text-center mt-2 text-muted">
          ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a>
        </p>
        <p class="text-center mt-1">
          <a routerLink="/onboarding/user" class="text-muted" style="font-size:0.875rem">Primera vez — completar perfil</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {}
