import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <main class="auth-page apk-auth-page">
      <section class="auth-panel">
        <img src="/assets/brand/arinpark-logo.png" [alt]="brand.name" class="apk-auth-logo" />
        <h1>Iniciar sesión</h1>
        <p class="auth-intro">Accede a tu cuenta para gestionar tus estacionamientos.</p>
        <label class="outlined-field"
          ><span>Correo electrónico</span><input type="email" placeholder="xxx@yyy.zzz" autocomplete="email"
        /></label>
        <label class="outlined-field"
          ><span>Contraseña</span><input type="password" placeholder="••••••••" autocomplete="current-password"
        /></label>
        <a routerLink="/auth/reset-password" class="recover-link">¿Olvidaste tu contraseña?</a>
        <a routerLink="/app/home" class="btn btn-primary btn-block login-button">Iniciar sesión</a>
        <p class="register-link">¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a></p>
      </section>
    </main>
  `,
  styles: [
    `
      .apk-auth-page {
        justify-content: center;
        background: var(--color-background);
      }
      .auth-panel {
        width: min(100%, 420px);
        padding: 2rem 2.2rem;
        border: 1px solid var(--color-border);
        border-radius: 22px;
        background: var(--color-surface);
        box-shadow: var(--shadow-md);
      }
      .apk-auth-logo {
        display: block;
        width: 230px;
        max-width: 75%;
        height: auto;
        margin: 0 auto 2rem;
      }
      .auth-panel h1 {
        text-align: center;
        font-size: var(--text-2xl);
      }
      .auth-intro {
        text-align: center;
        color: var(--color-text-muted);
        margin: 0.35rem 0 1.5rem;
      }
      .outlined-field {
        position: relative;
        display: block;
        margin: 1rem 0;
      }
      .outlined-field span {
        position: absolute;
        z-index: 1;
        top: -0.55rem;
        left: 0.8rem;
        padding: 0 0.35rem;
        background: var(--color-surface);
        color: var(--color-primary);
        font-size: var(--text-xs);
      }
      .outlined-field input {
        width: 100%;
        min-height: 54px;
        padding: 0.85rem 1rem;
        border: 1px solid var(--color-primary);
        border-radius: 6px;
        background: transparent;
        font: inherit;
      }
      .outlined-field input:focus {
        outline: 2px solid rgba(43, 103, 103, 0.15);
      }
      .recover-link {
        display: block;
        text-align: right;
        margin: 0.2rem 0 1.2rem;
        font-size: var(--text-sm);
      }
      .login-button {
        min-height: 50px;
      }
      .register-link {
        text-align: center;
        margin-top: 1.2rem;
        color: var(--color-text-muted);
      }
      @media (max-width: 520px) {
        .auth-panel {
          padding: 1.5rem;
          border: 0;
          box-shadow: none;
          background: transparent;
        }
        .outlined-field span {
          background: var(--color-background);
        }
      }
    `,
  ],
})
export class LoginComponent {
  readonly brand = APP_BRAND;
}
