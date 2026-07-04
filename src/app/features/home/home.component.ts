import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { WalletService } from '../../core/services/wallet.service';
import { UserService } from '../../core/services/user.service';
import { MOCK_VEHICLE_PRINCIPAL } from '../../shared/mock-data';
import { OperationType, OPERATION_TYPE_LABELS } from '../../shared/models/operation-type';
import { OperationsService } from '../../core/services/operations.service';
import { OperationIconComponent } from '../../shared/components/operation-icon/operation-icon.component';
import { AppIconComponent } from '../../shared/icons/app-icon.component';
import { APP_BRAND } from '../../shared/constants/app-brand';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe, TranslatePipe, OperationIconComponent, AppIconComponent],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'dashboard.greeting' | translate:{ name: fullName() } }}</h1>
      <p class="page-subtitle">{{ user().email }}</p>

      <div class="dashboard-grid mt-2">
        <div class="dashboard-col-left">
          @if (ticket(); as active) {
            <div class="card active-ticket-card">
              <div class="ticket-main-row">
                <div class="ticket-main-icon">
                  <app-icon name="vehicle" />
                </div>
                <div>
                  <p class="ticket-plate">{{ active.plate }}</p>
                  <p class="ticket-timer">{{ active.timeRemaining }}</p>
                </div>
                <div class="ticket-location"><small>Zona de estacionamiento</small><strong>{{ active.zone }}</strong></div>
              </div>
              <div class="ticket-time-row">
                <div><small>Inicio</small><strong>18:36</strong></div>
                <p>1h 4min</p>
                <div><small>Fin</small><strong>{{ active.endTime }}</strong></div>
              </div>
              <div class="ticket-divider">
                <div class="ticket-divider-line"></div>
              </div>
              <div class="row mt-2 action-row" style="gap:0.5rem;flex-wrap:wrap">
                <a class="btn btn-secondary btn-sm">
                  <app-icon name="goToCar" class="action-btn-icon" />
                  {{ 'dashboard.howToGetThere' | translate }}
                </a>
                <button type="button" class="btn btn-danger btn-sm" (click)="unparkFromDashboard()">{{ 'dashboard.unpark' | translate }}</button>
                <a routerLink="/app/parking/time-steps" class="btn btn-primary btn-sm">
                  <app-icon name="extend" class="action-btn-icon" />
                  {{ 'dashboard.extendTime' | translate }}
                </a>
              </div>
            </div>
          } @else {
            <div class="card">
              <p class="text-muted">{{ 'dashboard.noActiveTicket' | translate }}</p>
              <a routerLink="/app/parking" class="btn btn-primary btn-block mt-2">{{ 'parking.title' | translate }}</a>
            </div>
          }

          <div class="card operation-history-card">
            <p class="card-title">Historial de operaciones</p>
            <ul class="list" style="margin-top:0.5rem;border-radius:var(--radius-sm);overflow:hidden">
              @for (op of recentOps(); track op.id) {
                <a [routerLink]="['/app/operations/detail', op.id]" class="list-item">
                  <app-operation-icon [type]="op.type" />
                  <div class="list-item-content">
                    @if (isFinishParking(op)) {
                      <div class="list-item-title">Fin de estacionamiento</div>
                    } @else {
                      <div class="list-item-title">{{ OPERATION_TYPE_LABELS[op.type] | translate }}</div>
                    }
                    <div class="list-item-subtitle">{{ op.date }}{{ op.zone ? ' — ' + op.zone : '' }}</div>
                  </div>
                  <span [class]="op.amount > 0 ? 'badge badge-success' : 'badge'">
                    {{ op.amount > 0 ? '+' : '' }}{{ op.amount | number:'1.2-2' }} €
                  </span>
                </a>
              }
            </ul>
            <a routerLink="/app/operations" class="btn-text view-all-link">{{ 'dashboard.viewAll' | translate }}</a>
          </div>
        </div>

        <div class="dashboard-col-right">
          <div class="card compact-card vehicle-summary-card">
            <app-icon name="vehicle" class="vehicle-summary-icon" />
            <div>
              <p class="vehicle-summary-label">Vehículo principal</p>
              <p class="vehicle-plate">{{ vehicle.plate }}</p>
            </div>
          </div>

          <div class="card wallet-shell-card">
            <div class="wallet-card-inline">
              <p class="wallet-inline-title">Mi monedero</p>
              <p class="wallet-inline-balance">{{ walletService.balance() | number:'1.2-2' }} €</p>
              <span class="wallet-inline-brand">ap</span>
              <span class="wallet-inline-mark" aria-hidden="true">{{ brand.name }}</span>
            </div>
            <div class="wallet-main-card-row">
              <app-icon name="card" class="wallet-card-icon" />
              <div>
                <p class="wallet-main-label">Tarjeta principal</p>
                <p class="wallet-main-value">{{ walletService.mainCard.brand }} Debit ·{{ walletService.mainCard.last4 }}</p>
                <p class="wallet-main-expiry">{{ walletService.mainCard.cardholderName }} {{ walletService.mainCard.expiryDate }}</p>
              </div>
            </div>
            <div class="row mt-2 wallet-actions" style="gap:0.5rem;flex-wrap:wrap">
              <a routerLink="/app/account/recharge" class="btn btn-secondary btn-sm">{{ 'dashboard.recharge' | translate }}</a>
              <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-sm">{{ 'dashboard.manageCards' | translate }}</a>
            </div>
          </div>

          @if (showProfileCard()) {
            <div class="card profile-progress-card">
              <div class="profile-progress-head"><span>Configuración de la cuenta</span><strong>75%</strong></div>
              <div class="profile-progress"><span></span></div>
              <p class="card-title">Completa tu perfil</p>
              <p class="card-subtitle">Revisa tus datos y activa la ubicación para mostrar automáticamente las zonas de estacionamiento más cercanas.</p>
              <div class="row mt-1">
                <a routerLink="/app/account/profile" class="btn btn-primary btn-sm">Revisar perfil</a>
                <a routerLink="/onboarding/location" class="btn btn-secondary btn-sm">Ubicación</a>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .card {
      border-radius: 12px;
      border: 1px solid #d4d9cd;
      box-shadow: 0 1px 0 rgba(28, 44, 39, 0.04), 0 3px 8px rgba(28, 44, 39, 0.07);
      background: #f8f9f2;
      padding: 0.8rem 0.9rem;
    }
    .card-title { font-size: 1.02rem; margin-bottom: 0.15rem; }
    .compact-card { min-height: 76px; }
    .active-ticket-card {
      position: relative;
      overflow: hidden;
      border-color: #cfd7c9;
    }
    .active-ticket-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #8f84f3 0%, #7971de 48%, #7469d2 100%);
    }
    .ticket-main-row { display:flex; align-items:center; gap:.65rem; margin-top:.25rem; }
    .ticket-main-icon {
      width:34px;
      height:34px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:#f3ebd5;
      border:1px solid #e6d9ba;
      color:var(--color-primary);
    }
    .ticket-main-icon svg {
      width:19px;
      height:19px;
      fill:currentColor;
    }
    .ticket-plate { font-size:1.12rem; font-weight:700; letter-spacing:.04em; line-height:1; }
    .ticket-timer { color:var(--color-text-muted); font-size:.78rem; margin-top:.22rem; }
    .ticket-location { display:flex; min-width:0; flex:1; flex-direction:column; margin-left:auto; padding-left:.5rem; }
    .ticket-location small { color:var(--color-text-muted); font-size:.72rem; }
    .ticket-location strong { overflow:hidden; margin-top:.1rem; font-size:.82rem; text-overflow:ellipsis; white-space:nowrap; }
    .ticket-time-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-top:.55rem;
      text-align:center;
    }
    .ticket-time-row div { display:flex; flex-direction:column; }
    .ticket-time-row small { font-size:.8rem; color:var(--color-text-muted); }
    .ticket-time-row strong { font-size:1.12rem; font-weight:700; line-height:1.1; }
    .ticket-time-row p {
      margin:0 .35rem;
      border:1px solid #bfc8bb;
      border-radius:10px;
      padding:.28rem .7rem;
      color:#4d5b52;
      font-weight:700;
      font-size:.95rem;
      white-space:nowrap;
      background:#f3f6ed;
    }
    .ticket-divider {
      position: relative;
      height: 14px;
      margin: .55rem -0.9rem .25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .ticket-divider::before,
    .ticket-divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 18px;
      height: 18px;
      background: var(--color-background);
      border-radius: 50%;
      transform: translateY(-50%);
      z-index: 2;
    }
    .ticket-divider::before { left: -9px; }
    .ticket-divider::after { right: -9px; }
    .ticket-divider-line {
      flex: 1;
      height: 0;
      border-top: 2px dashed #c8cfc3;
      margin: 0 8px;
    }
    .action-row { display:grid!important; grid-template-columns:1fr 1fr; }
    .action-row .btn-secondary { grid-column:1/-1; }
    .action-row .btn {
      border-radius: 999px;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .action-btn-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
      flex-shrink: 0;
    }
    .action-row .btn-secondary {
      background: #eef1e6;
      color: #3b4b42;
      border-color: #ced6c8;
    }
    .action-row .btn-danger {
      background: #f4d79f;
      color: #4c3a1d;
      border-color: #e2c48b;
    }
    .action-row .btn-primary {
      background: #2f6f71;
      color: #fff;
    }
    .operation-history-card .list-item {
      display: flex;
      align-items: center;
      background: #fbfcf6;
      border-bottom-color:#e1e6d9;
    }
    .operation-history-card .list-item:hover {
      background: #f1f4ea;
    }
    .operation-history-card .card-title { margin-bottom:.35rem; }
    .view-all-link { display:block; margin-top:1rem; text-align:right; }
    .vehicle-summary-card {
      display:flex;
      align-items:center;
      gap:.75rem;
      min-height:74px;
    }
    .vehicle-summary-icon {
      width:20px;
      height:20px;
      color:var(--color-primary);
      flex-shrink:0;
    }
    .vehicle-summary-icon svg { width:100%; height:100%; fill:currentColor; }
    .vehicle-summary-label { color:#465149; font-size:.78rem; font-weight:700; }
    .vehicle-plate {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      color: #1f2b27;
      line-height: 1.05;
      margin-top: 0.15rem;
    }
    .wallet-shell-card { background:#f8f9f2; }
    .wallet-card-inline {
      position:relative;
      width: 100%;
      max-width: 225px;
      border-radius: 10px;
      padding: .95rem 1rem .75rem;
      color:#fff;
      background: linear-gradient(135deg, #4fa6a0 0%, #3f8f8b 55%, #357e7b 100%);
      box-shadow: 0 6px 14px rgba(40, 105, 103, 0.25);
      margin-bottom: .8rem;
      overflow:hidden;
    }
    .wallet-inline-title { font-size: .9rem; font-weight:700; opacity:.95; }
    .wallet-inline-balance { font-size: 2.15rem; font-weight: 700; letter-spacing: .01em; margin-top: .22rem; }
    .wallet-inline-mark {
      position:absolute;
      right:.85rem;
      top:.35rem;
      font-size:2rem;
      font-weight:800;
      opacity:.09;
      transform:rotate(-19deg);
      pointer-events:none;
      white-space:nowrap;
    }
    .wallet-inline-brand {
      position:absolute;
      right:.55rem;
      bottom:.42rem;
      font-size:.95rem;
      font-weight:700;
      opacity:.82;
      text-transform:lowercase;
    }
    .wallet-main-card-row { display:flex; align-items:center; gap:.65rem; }
    .wallet-card-icon {
      width:20px;
      height:20px;
      color:var(--color-primary);
      flex-shrink:0;
    }
    .wallet-card-icon svg { width:100%; height:100%; fill:currentColor; }
    .wallet-main-label { color:#49544c; font-size:.86rem; font-weight:700; }
    .wallet-main-value { font-size:1.05rem; font-weight:700; line-height:1.08; margin-top:.1rem; }
    .wallet-main-expiry { color:var(--color-text-muted); font-size:.9rem; margin-top:.14rem; }
    .wallet-actions .btn { min-width: 136px; }
    .wallet-actions .btn-secondary { background:#f3f6ed; border-color:#c5cec1; color:#3c4a41; }
    .wallet-actions .btn-primary { background:#2f6f71; }
    .profile-progress-card {
      background:#f7f8f1;
    }
    .profile-progress-head { display:flex; justify-content:space-between; color:var(--color-text-muted); font-size:.72rem; }
    .profile-progress { height:6px; margin:.45rem 0 .8rem; overflow:hidden; border-radius:999px; background:var(--color-border); }
    .profile-progress span { display:block; width:75%; height:100%; background:var(--color-primary-light); }
    @media (min-width: 960px) {
      :host > .page {
        max-width: 1120px;
        margin: 0 auto;
        padding: 2.5rem 1.5rem 2rem;
      }
      .page-title, .page-subtitle { display:none; }
      .dashboard-grid {
        display:grid;
        grid-template-columns:minmax(300px, .82fr) minmax(410px, 1.18fr);
        align-items: start;
        gap:.75rem;
      }
      .dashboard-col-left {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .dashboard-col-right {
        display: flex;
        flex-direction: column;
        gap: 0.78rem;
      }
      .profile-progress-card { display:none; }
    }
  `],
})
export class HomeComponent {
  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly userService = inject(UserService);
  readonly user = this.userService.user;
  readonly fullName = computed(() => `${this.user().name} ${this.user().surname}`);
  readonly ticket = computed(() => this.operationsService.activeOperation());
  readonly vehicle = MOCK_VEHICLE_PRINCIPAL;
  readonly recentOps = computed(() => {
    const list = this.operationsService.operations()
      .filter((op) => op.type !== OperationType.UNPAID_FINES)
      .sort((a, b) => this.toDateValue(b.date) - this.toDateValue(a.date));
    return list.slice(0, 3);
  });
  readonly hasActiveTicket = computed(() => this.ticket() !== null);
  readonly showProfileCard = signal(true);
  readonly OperationType = OperationType;
  readonly brand = APP_BRAND;
  readonly OPERATION_TYPE_LABELS = OPERATION_TYPE_LABELS;

  isFinishParking(op: { type: OperationType; plate: string | null }): boolean {
    return op.type === OperationType.BALANCE_REFUND && !!op.plate;
  }

  unparkFromDashboard(): void {
    this.operationsService.unparkActiveOperation();
  }

  private toDateValue(d: string): number {
    if (d.includes('/')) {
      const [day, month, year] = d.split('/').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
    }
    const [year, month, day] = d.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
  }
}
