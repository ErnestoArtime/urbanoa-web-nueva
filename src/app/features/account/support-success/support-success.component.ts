import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-support-success',
  imports: [RouterLink],
  template: `
    <div class="page text-center">
      <div class="success-icon">✓</div>
      <h1 class="page-title">Mensaje enviado</h1>
      <p class="page-subtitle">Nuestro equipo te responderá lo antes posible.</p>
      <a routerLink="/app/account" class="btn btn-primary btn-block mt-2">Volver a mi cuenta</a>
    </div>
  `,
})
export class AccountSupportSuccessComponent {}
