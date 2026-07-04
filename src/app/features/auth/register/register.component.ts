import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector:'app-register', imports:[RouterLink],
  template:`
    <main class="auth-page register-page">
      <section class="register-panel">
        <img src="/assets/brand/arinpark-logo.png" [alt]="brand.name" class="register-logo" />
        <header><a routerLink="/auth/login" aria-label="Volver">←</a><div><h1>Registro</h1><p>Crea tu cuenta {{ brand.name }}</p></div></header>
        <div class="form-grid">
          <label class="outlined-field"><span>Matrícula</span><input placeholder="1234 ABC" /></label>
          <label class="foreign-check"><input type="checkbox" /> Matrícula extranjera</label>
          <label class="outlined-field"><span>Correo electrónico</span><input type="email" placeholder="xxx@yyy.zzz" /></label>
          <label class="outlined-field"><span>Contraseña</span><input type="password" /></label>
          <label class="outlined-field"><span>Repetir contraseña</span><input type="password" /></label>
          <label class="terms-check"><input type="checkbox" /><span>Acepto los <a routerLink="/auth/web/terms">términos y condiciones</a> y la <a routerLink="/auth/web/privacy">política de privacidad</a>.</span></label>
          <a routerLink="/auth/register-confirm" class="btn btn-primary btn-block continue-button">Continuar</a>
          <p class="login-link">¿Ya tienes cuenta? <a routerLink="/auth/login">Iniciar sesión</a></p>
        </div>
      </section>
    </main>
  `,
  styles:[`
    .register-page{justify-content:center;background:var(--color-background)}.register-panel{width:min(100%,520px);padding:1.7rem 2.2rem;border:1px solid var(--color-border);border-radius:22px;background:var(--color-surface);box-shadow:var(--shadow-md)}.register-logo{display:block;width:190px;max-width:60%;margin:0 auto 1.25rem}.register-panel header{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.register-panel header>a{font-size:1.6rem}.register-panel h1{font-size:1.55rem}.register-panel header p{color:var(--color-text-muted)}.outlined-field{position:relative;display:block;margin:.85rem 0}.outlined-field span{position:absolute;z-index:1;top:-.55rem;left:.8rem;padding:0 .35rem;background:var(--color-surface);color:var(--color-primary);font-size:.78rem}.outlined-field input{width:100%;min-height:52px;padding:.8rem 1rem;border:1px solid var(--color-primary);border-radius:6px;background:transparent;font:inherit}.foreign-check,.terms-check{display:flex;align-items:flex-start;gap:.55rem;color:var(--color-text-muted);font-size:.85rem}.foreign-check{margin-top:-.25rem}.terms-check{margin:1rem 0}.terms-check input{margin-top:.2rem}.continue-button{min-height:50px}.login-link{text-align:center;margin-top:1rem;color:var(--color-text-muted)}@media(max-width:560px){.register-panel{padding:1rem;border:0;box-shadow:none;background:transparent}.outlined-field span{background:var(--color-background)}}
  `],
})
export class RegisterComponent {
  readonly brand = APP_BRAND;
}
