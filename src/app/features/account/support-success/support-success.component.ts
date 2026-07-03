import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-support-success',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page text-center support-success">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 15-4-4 1.5-1.5L11 14l4.5-4.5L17 11l-6 6z"/></svg>
      </div>
      <h1 class="page-title">¡Gracias por tu mensaje!</h1>
      <p class="page-subtitle">Hemos recibido tu comentario. Nuestro equipo lo revisará y nos pondremos en contacto contigo a través de tu email.</p>
      <a routerLink="/app/account" class="btn btn-primary btn-block mt-2">Entendido</a>
    </div>
  `,
  styles: [
    `
    .support-success { padding-top:1.5rem; }
    .success-icon { width:56px; height:56px; border-radius:50%; background:var(--color-accent-soft); display:grid; place-items:center; margin:0 auto 1rem; }
    .success-icon svg { width:30px; height:30px; fill:var(--color-primary); }
    .page-subtitle { color:var(--color-text-muted); line-height:1.5; }
  `,
  ],
})
export class AccountSupportSuccessComponent {}
