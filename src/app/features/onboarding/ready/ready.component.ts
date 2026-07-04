import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-onboarding-ready',
  imports: [RouterLink],
  template: `
    <div class="page text-center">
      <div class="success-icon">✓</div>
      <h1 class="page-title">¡Todo listo!</h1>
      <p class="page-subtitle">Hemos configurado tu perfil, tu vehículo y tu método de pago. Ahora {{ brand.name }} hará el trabajo duro por ti.</p>
      <a routerLink="/app/home" class="btn btn-primary btn-block mt-2">Empezar</a>
    </div>
  `,
})
export class OnboardingReadyComponent {
  readonly brand = APP_BRAND;
}
