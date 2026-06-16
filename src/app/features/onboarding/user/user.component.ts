import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-onboarding-user',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Tu perfil</h1>
      <p class="page-subtitle">Solo te tomará un minuto. Necesitamos estos datos para gestionar tus aparcamientos con seguridad.</p>
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">Primer apellido</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">Segundo apellido</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">NIF</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" type="tel" /></div>
      <a routerLink="/onboarding/payment" class="btn btn-primary btn-block mt-2">Siguiente</a>
      <a routerLink="/auth/login" class="btn btn-ghost btn-block mt-1">Cancelar</a>
    </div>
  `,
})
export class OnboardingUserComponent {}
