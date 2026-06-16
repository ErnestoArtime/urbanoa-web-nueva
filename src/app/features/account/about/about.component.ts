import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-about',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Sobre ArinPark</h1>
      <img src="assets/brand/login-logo.jpg" alt="ArinPark" style="max-width:160px;margin:1rem 0" />
      <p class="text-muted">Versión 3.2.0 (maqueta)</p>
      <p class="mt-2">Desarrollado por Gertek — gestión de aparcamiento regulado.</p>
      <a routerLink="/app/account/support" class="btn btn-secondary btn-block mt-2">Ayuda y soporte</a>
      <a routerLink="/auth/web/terms" class="btn btn-ghost btn-block mt-1">Términos y condiciones</a>
    </div>
  `,
})
export class AccountAboutComponent {}
