import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-settings',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Ajustes</h1>
      <div class="card">
        <div class="switch-row"><span>Biometría</span><div class="switch on"></div></div>
        <div class="switch-row"><span>Recordar sesión</span><div class="switch on"></div></div>
      </div>
      <a routerLink="/app/account/change-password" class="list-item card mt-2" style="border-radius:var(--radius-md)">
        <div class="list-item-content"><div class="list-item-title">Cambiar contraseña</div></div>
        <span class="list-item-chevron">›</span>
      </a>
      <button type="button" class="btn btn-ghost btn-block mt-2" style="color:var(--color-error)">Eliminar cuenta</button>
    </div>
  `,
})
export class AccountSettingsComponent {}
