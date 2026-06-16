import { Component } from '@angular/core';

@Component({
  selector: 'app-account-notifications',
  template: `
    <div class="page">
      <h1 class="page-title">Notificaciones</h1>
      <div class="card">
        <div class="switch-row"><span>Aviso fin de aparcamiento</span><div class="switch on"></div></div>
        <div class="switch-row"><span>Saldo bajo</span><div class="switch on"></div></div>
        <div class="switch-row"><span>Promociones</span><div class="switch"></div></div>
      </div>
    </div>
  `,
})
export class AccountNotificationsComponent {}
