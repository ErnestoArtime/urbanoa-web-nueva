import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_TICKET_ACTIVE, MOCK_USER } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-ticket-detail',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Detalle del ticket</h1>
      <div class="card mt-2">
        <p><strong>Vehículo:</strong> {{ ticket.plate }}</p>
        <p class="mt-1"><strong>Zona:</strong> {{ ticket.zone }}</p>
        <p class="mt-1"><strong>Tiempo restante:</strong> {{ ticket.timeRemaining }}</p>
      </div>
      <div class="timeline mt-2">
        <div class="timeline-item"><strong>Inicio</strong><br><span class="text-muted">14:30</span></div>
        <div class="timeline-item"><strong>Fin previsto</strong><br><span class="text-muted">{{ ticket.endTime }}</span></div>
      </div>
      <p class="section-title">Método de pago</p>
      <div class="card">Monedero — {{ user.balance }} €</div>
      <a routerLink="/app/parking/time-steps" class="btn btn-primary btn-block mt-2">Ampliar aparcamiento</a>
      <a routerLink="/app/operations/detail/unpark" class="btn btn-secondary btn-block mt-1">Desaparcar</a>
    </div>
  `,
})
export class ParkingTicketDetailComponent {
  readonly ticket = MOCK_TICKET_ACTIVE;
  readonly user = MOCK_USER;
}
