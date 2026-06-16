import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_USER } from '../../../shared/mock-data';

@Component({
  selector: 'app-account-profile',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Mi perfil</h1>
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" [value]="user.name" /></div>
      <div class="form-group"><label class="form-label">Primer apellido</label><input class="form-input" [value]="user.surname" /></div>
      <div class="form-group"><label class="form-label">NIF</label><input class="form-input" [value]="user.nif" /></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" [value]="user.phone" /></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" [value]="user.email" /></div>
      <button type="button" class="btn btn-primary btn-block">Guardar</button>
      <a routerLink="/app/account/change-password" class="btn btn-ghost btn-block mt-1">Cambiar contraseña</a>
    </div>
  `,
})
export class AccountProfileComponent {
  readonly user = MOCK_USER;
}
