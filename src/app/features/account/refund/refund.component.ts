import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_USER } from '../../../shared/mock-data';

@Component({
  selector: 'app-account-refund',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Retirar saldo</h1>
      <p class="page-subtitle">Saldo disponible: {{ user.balance }} €</p>
      <div class="form-group"><label class="form-label">Importe a retirar</label><input class="form-input" type="number" [value]="user.balance" /></div>
      <p class="text-muted">Saldo tras la devolución: 0,00 €</p>
      <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-block mt-2">Confirmar devolución</a>
    </div>
  `,
})
export class AccountRefundComponent {
  readonly user = MOCK_USER;
}
