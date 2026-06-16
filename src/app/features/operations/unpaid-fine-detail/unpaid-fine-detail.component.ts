import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unpaid-fine-detail',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Detalle de multa</h1>
      <div class="card mt-2">
        <p><strong>Matrícula:</strong> 1234 ABC</p>
        <p class="mt-1"><strong>Ubicación:</strong> Gran Vía</p>
        <p class="mt-1"><strong>Fecha:</strong> 05/06/2026</p>
        <p class="mt-1"><strong>Importe:</strong> 35,00 €</p>
      </div>
      <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-block mt-2">Pagar multa</a>
    </div>
  `,
})
export class UnpaidFineDetailComponent {}
