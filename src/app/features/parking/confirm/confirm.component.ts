import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_TICKET_ACTIVE, MOCK_USER } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-confirm',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Confirmar aparcamiento</h1>
      <div class="card mt-2 stack">
        <p><strong>Ubicación:</strong> Gran Vía, 12</p>
        <p><strong>Vehículo:</strong> {{ ticket.plate }}</p>
        <p><strong>Duración:</strong> 1 hora</p>
        <p><strong>Importe:</strong> 1,20 €</p>
        <p><strong>Pago:</strong> Monedero ({{ user.balance }} €)</p>
      </div>
      <a routerLink="/app/parking/success" class="btn btn-primary btn-block mt-2">Pagar y aparcar</a>
      <a routerLink="/app/account/payment-methods" class="btn btn-ghost btn-block mt-1">Cambiar método de pago</a>
    </div>
  `,
})
export class ParkingConfirmComponent {
  readonly ticket = MOCK_TICKET_ACTIVE;
  readonly user = MOCK_USER;
}
