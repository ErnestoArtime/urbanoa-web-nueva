import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import type { TicketActive } from '../../../shared/mock-data';

@Component({
  selector: 'app-active-ticket-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  template: `
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
          <button type="button" class="btn btn-danger btn-sm" (click)="unpark.emit()">{{ 'dashboard.unpark' | translate }}</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="extend.emit()">
            <app-icon name="extend" class="action-btn-icon" />
            {{ 'dashboard.extendTime' | translate }}
          </button>
        </div>
      </div>
    } @else {
      <div class="card">
        <p class="text-muted">{{ 'dashboard.noActiveTicket' | translate }}</p>
        <a routerLink="/app/parking" class="btn btn-primary btn-block mt-2">{{ 'parking.title' | translate }}</a>
      </div>
    }
  `,
  styles: [`
    .card {
      border-radius: 12px;
      border: 1px solid #d4d9cd;
      box-shadow: 0 1px 0 rgba(28, 44, 39, 0.04), 0 3px 8px rgba(28, 44, 39, 0.07);
      background: #f8f9f2;
      padding: 0.8rem 0.9rem;
    }
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
    .ticket-plate { font-size: var(--text-lg); font-weight: var(--font-bold); letter-spacing:.04em; line-height: var(--line-tight); }
    .ticket-timer { color:var(--color-text-muted); font-size: var(--text-xs); margin-top:.22rem; }
    .ticket-location { display:flex; min-width:0; flex:1; flex-direction:column; margin-left:auto; padding-left:.5rem; }
    .ticket-location small { color:var(--color-text-muted); font-size: var(--text-xs); }
    .ticket-location strong { overflow:hidden; margin-top:.1rem; font-size: var(--text-sm); text-overflow:ellipsis; white-space:nowrap; }
    .ticket-time-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-top:.55rem;
      text-align:center;
    }
    .ticket-time-row div { display:flex; flex-direction:column; }
    .ticket-time-row small { font-size: var(--text-sm); color:var(--color-text-muted); }
    .ticket-time-row strong { font-size: var(--text-lg); font-weight: var(--font-bold); line-height: var(--line-tight); }
    .ticket-time-row p {
      margin:0 .35rem;
      border:1px solid #bfc8bb;
      border-radius:10px;
      padding:.28rem .7rem;
      color:#4d5b52;
      font-weight: var(--font-bold);
      font-size: var(--text-md);
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
      font-weight: var(--font-bold);
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
  `],
})
export class ActiveTicketCardComponent {
  readonly ticket = input<TicketActive | null>(null);
  readonly unpark = output<void>();
  readonly extend = output<void>();
}
