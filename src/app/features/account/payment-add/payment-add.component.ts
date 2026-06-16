import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-add',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Añadir tarjeta</h1>
      <p class="page-subtitle">Tus datos se guardan de forma encriptada y segura.</p>
      <div class="form-group"><label class="form-label">Número de tarjeta</label><input class="form-input" placeholder="0000 0000 0000 0000" /></div>
      <div class="row">
        <div class="form-group" style="flex:1"><label class="form-label">Caducidad</label><input class="form-input" placeholder="MM/AA" /></div>
        <div class="form-group" style="flex:1"><label class="form-label">CVV</label><input class="form-input" placeholder="123" /></div>
      </div>
      <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-block mt-2">Añadir tarjeta</a>
    </div>
  `,
})
export class PaymentAddComponent {}
