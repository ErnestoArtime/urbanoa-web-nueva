import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-onboarding-payment',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Método de pago</h1>
      <p class="page-subtitle">Añade una tarjeta para pagar al instante o recargar tu monedero ArinPark. Tus datos se guardan de forma encriptada y segura.</p>
      <div class="card mt-2">
        <p class="card-title">💳 Tarjeta bancaria</p>
        <p class="card-subtitle">Visa, Mastercard</p>
      </div>
      <a routerLink="/onboarding/location" class="btn btn-primary btn-block mt-2">Añadir tarjeta</a>
      <a routerLink="/onboarding/location" class="btn btn-ghost btn-block mt-1">Omitir por ahora</a>
    </div>
  `,
})
export class OnboardingPaymentComponent {}
