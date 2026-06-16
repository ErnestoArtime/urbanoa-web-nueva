import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MOCK_TICKET_ACTIVE } from '../../../shared/mock-data';

const DETAIL_COPY: Record<string, { title: string; body: string }> = {
  parking: { title: 'Detalle de aparcamiento', body: 'Aparcamiento en zona azul — Gran Vía, 12' },
  extend: { title: 'Ampliación de aparcamiento', body: 'Se amplió 30 minutos el ticket activo.' },
  unpark: { title: 'Desaparcar', body: 'Al dejar el aparcamiento recibirás un reembolso de 0,40 €.' },
  'top-up': { title: 'Ingreso de saldo', body: 'Recarga de 20,00 € al monedero ArinPark.' },
  refund: { title: 'Devolución de saldo', body: 'Retirada de saldo a tarjeta terminada en 4242.' },
  fine: { title: 'Pago de multa', body: 'Multa por estacionamiento irregular — Gran Vía.' },
};

@Component({
  selector: 'app-operations-detail',
  template: `
    <div class="page">
      <h1 class="page-title">{{ detail.title }}</h1>
      <div class="card mt-2">
        <p>{{ detail.body }}</p>
        @if (type === 'parking' || type === 'extend') {
          <p class="mt-2"><strong>Vehículo:</strong> {{ ticket.plate }}</p>
          <p class="mt-1"><strong>Zona:</strong> {{ ticket.zone }}</p>
        }
        <p class="mt-2 text-muted">16/06/2026 — 14:30</p>
      </div>
    </div>
  `,
})
export class OperationsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly type = this.route.snapshot.paramMap.get('type') ?? 'parking';
  readonly detail = DETAIL_COPY[this.type] ?? DETAIL_COPY['parking'];
  readonly ticket = MOCK_TICKET_ACTIVE;
}
