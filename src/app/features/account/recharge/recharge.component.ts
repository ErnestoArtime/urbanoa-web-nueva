import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_USER } from '../../../shared/mock-data';

@Component({
  selector: 'app-account-recharge',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Recargar saldo</h1>
      <p class="page-subtitle">Saldo actual: {{ user.balance }} €</p>
      <div class="chip-row">
        @for (a of amounts; track a) {
          <button type="button" class="chip" [class.active]="a === selected" (click)="selected = a">{{ a }} €</button>
        }
      </div>
      <div class="form-group mt-2"><label class="form-label">Otro importe</label><input class="form-input" type="number" /></div>
      <p class="text-muted">Saldo tras la recarga: {{ user.balance + selected }} €</p>
      <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-block mt-2">Recargar</a>
    </div>
  `,
})
export class AccountRechargeComponent {
  readonly user = MOCK_USER;
  readonly amounts = [5, 10, 20, 50];
  selected = 20;
}
