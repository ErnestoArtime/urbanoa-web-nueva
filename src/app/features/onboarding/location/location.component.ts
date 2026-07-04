import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-onboarding-location',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Ubicación</h1>
      <p class="page-subtitle">Activa la ubicación para que {{ brand.name }} sepa exactamente en qué sector estás. Te ahorramos buscar el nombre de la calle y evitamos errores en tu ticket.</p>
      <div class="card card-highlight mt-2">
        <p>📍 Permiso de ubicación</p>
        <p class="card-subtitle mt-1">Mostrarte las zonas de parkings más cercanas automáticamente</p>
      </div>
      <a routerLink="/onboarding/notification" class="btn btn-primary btn-block mt-2">Conceder permiso</a>
      <a routerLink="/onboarding/notification" class="btn btn-ghost btn-block mt-1">Ahora no</a>
    </div>
  `,
})
export class OnboardingLocationComponent {
  readonly brand = APP_BRAND;
}
