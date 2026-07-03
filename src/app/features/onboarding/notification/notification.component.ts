import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-onboarding-notification',
  imports: [RouterLink],
  template: `
    <div class="page">
      <p class="page-subtitle">Recibe avisos cuando tu aparcamiento esté a punto de expirar o haya novedades en tu cuenta.</p>
      <a routerLink="/onboarding/ready" class="btn btn-primary btn-block mt-2">Activar notificaciones</a>
      <a routerLink="/onboarding/ready" class="btn btn-ghost btn-block mt-1">Cancelar</a>
    </div>
  `,
})
export class OnboardingNotificationComponent {}
