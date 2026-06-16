import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MOCK_OPERATIONS, MOCK_TICKET_ACTIVE, MOCK_USER } from '../../shared/mock-data';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="page-title">Hola, {{ user.name }}</h1>
      <p class="page-subtitle">Resumen de tu cuenta</p>

      <div class="dashboard-grid mt-2">
        @if (hasActiveTicket()) {
          <div class="card card-highlight card-span-2">
            <p class="badge badge-primary">Aparcamiento activo</p>
            <p class="card-title mt-1">{{ ticket.zone }}</p>
            <p class="text-muted">{{ ticket.plate }}</p>
            <p class="ticket-timer mt-2">{{ ticket.timeRemaining }}</p>
            <p class="text-muted">Finaliza a las {{ ticket.endTime }}</p>
            <div class="row mt-2">
              <a routerLink="/app/parking/time-steps" class="btn btn-primary btn-sm">Ampliar</a>
              <a routerLink="/app/operations/detail/parking" class="btn btn-secondary btn-sm">Finalizar</a>
            </div>
          </div>
        } @else {
          <a routerLink="/app/parking" class="card" style="text-decoration:none;color:inherit">
            <p class="card-title">🅿️ Aparcar ahora</p>
            <p class="card-subtitle">La forma más fácil de aparcar</p>
          </a>
          <div class="card wallet-card">
            <p style="opacity:0.9;font-size:0.875rem">Saldo monedero</p>
            <p class="wallet-balance">{{ user.balance | number:'1.2-2' }} €</p>
            <a routerLink="/app/account/recharge" class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:#fff;margin-top:0.5rem">Recargar</a>
          </div>
        }

        @if (showProfileCard()) {
          <div class="card card-span-2">
            <p class="card-title">Completa tu perfil</p>
            <p class="card-subtitle">Concede permiso de ubicación para mostrarte las zonas de parkings más cercanas automáticamente.</p>
            <a routerLink="/app/account/profile" class="btn btn-primary btn-sm mt-1">Completar perfil</a>
          </div>
        }

        <div class="card card-span-2">
          <p class="card-title">Últimos movimientos</p>
          <ul class="list" style="margin-top:0.5rem;border-radius:var(--radius-sm);overflow:hidden">
            @for (op of recentOps; track op.id) {
              <a [routerLink]="['/app/operations/detail', op.type]" class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">{{ op.title }}</div>
                  <div class="list-item-subtitle">{{ op.date }}</div>
                </div>
                <span [class]="op.amount.startsWith('+') ? 'badge badge-success' : ''">{{ op.amount }}</span>
              </a>
            }
          </ul>
          <a routerLink="/app/operations" class="btn-text mt-1">Ver todas las operaciones</a>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {
  readonly user = MOCK_USER;
  readonly ticket = MOCK_TICKET_ACTIVE;
  readonly recentOps = MOCK_OPERATIONS.slice(0, 3);
  readonly hasActiveTicket = signal(true);
  readonly showProfileCard = signal(true);
}
