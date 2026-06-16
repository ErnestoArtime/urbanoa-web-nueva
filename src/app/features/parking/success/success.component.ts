import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-parking-success',
  imports: [RouterLink],
  template: `
    <div class="page text-center">
      <div class="success-icon">✓</div>
      <h1 class="page-title">¡Aparcamiento iniciado!</h1>
      <p class="page-subtitle">Tu ticket está activo. Puedes ampliarlo o finalizarlo cuando quieras.</p>
      <p class="ticket-timer mt-2">01:00:00</p>
      <a routerLink="/app/home" class="btn btn-primary btn-block mt-2">Ir al inicio</a>
      <a routerLink="/app/parking" class="btn btn-ghost btn-block mt-1">Ver mapa</a>
    </div>
  `,
})
export class ParkingSuccessComponent {}
