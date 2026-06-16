import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ACCOUNT_MENU, MOCK_USER } from '../../../shared/mock-data';

@Component({
  selector: 'app-account-menu',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Mi cuenta</h1>
      <div class="card wallet-card mb-2">
        <p style="opacity:0.9">{{ user.name }} {{ user.surname }}</p>
        <p class="wallet-balance">{{ user.balance }} €</p>
        <p style="font-size:0.875rem;opacity:0.9">Saldo monedero</p>
      </div>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (item of menu; track item.path) {
          <a [routerLink]="item.path" class="list-item">
            <span>{{ item.icon }}</span>
            <div class="list-item-content"><div class="list-item-title">{{ item.label }}</div></div>
            <span class="list-item-chevron">›</span>
          </a>
        }
      </ul>
      <a routerLink="/auth/login" class="btn btn-ghost btn-block mt-2">Cerrar sesión</a>
    </div>
  `,
})
export class AccountMenuComponent {
  readonly menu = ACCOUNT_MENU;
  readonly user = MOCK_USER;
}
