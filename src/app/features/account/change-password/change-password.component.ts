import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-change-password',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Cambiar contraseña</h1>
      <div class="form-group"><label class="form-label">Contraseña actual</label><input class="form-input" type="password" /></div>
      <div class="form-group"><label class="form-label">Nueva contraseña</label><input class="form-input" type="password" /></div>
      <div class="form-group"><label class="form-label">Confirmar contraseña</label><input class="form-input" type="password" /></div>
      <a routerLink="/app/account/profile" class="btn btn-primary btn-block">Guardar</a>
    </div>
  `,
})
export class AccountChangePasswordComponent {}
