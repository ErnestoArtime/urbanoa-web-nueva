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
            <app-icon name="vehicle" [stroke]="false" />
          </div>
          <div>
            <p class="ticket-plate">{{ active.plate }}</p>
            <p class="ticket-timer">{{ active.timeRemaining }}</p>
          </div>
          <div class="ticket-location">
            <small>{{ 'dashboard.ticket.zone' | translate }}</small
            ><strong>{{ active.zone }}</strong>
          </div>
        </div>
        <div class="ticket-time-row">
          <div>
            <small>{{ 'dashboard.ticket.start' | translate }}</small
            ><strong>{{ active.startTime }}</strong>
          </div>
          <p>{{ active.durationLabel }}</p>
          <div>
            <small>{{ 'dashboard.ticket.end' | translate }}</small
            ><strong>{{ active.endTime }}</strong>
          </div>
        </div>
        <div class="ticket-divider">
          <div class="ticket-divider-line"></div>
        </div>
        <div class="row mt-2 action-row">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            [disabled]="!hasCoordinates(active)"
            (click)="goToCar.emit(active)"
          >
            <app-icon name="goToCar" class="action-btn-icon" [stroke]="false" />
            {{ 'dashboard.howToGetThere' | translate }}
          </button>
          <button type="button" class="btn btn-danger btn-sm" (click)="unpark.emit()">{{ 'dashboard.unpark' | translate }}</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="extend.emit()">
            <app-icon name="extend" class="action-btn-icon" [stroke]="false" />
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
  styles: [
    `
      .active-ticket-card {
        position: relative;
        overflow: hidden;
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
      .ticket-main-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-top: 0.25rem;
      }
      .ticket-main-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        color: var(--color-primary);
      }
      .ticket-plate {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        letter-spacing: 0.04em;
        line-height: var(--line-tight);
      }
      .ticket-timer {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        margin-top: 0.22rem;
      }
      .ticket-location {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        margin-left: auto;
        padding-left: 0.5rem;
      }
      .ticket-location small {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .ticket-location strong {
        overflow: hidden;
        margin-top: 0.1rem;
        font-size: var(--text-sm);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ticket-time-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.55rem;
        text-align: center;
      }
      .ticket-time-row div {
        display: flex;
        flex-direction: column;
      }
      .ticket-time-row small {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
      }
      .ticket-time-row strong {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        line-height: var(--line-tight);
      }
      .ticket-time-row p {
        margin: 0 0.35rem;
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 0.28rem 0.7rem;
        color: var(--color-text-secondary);
        font-weight: var(--font-bold);
        font-size: var(--text-md);
        white-space: nowrap;
        background: var(--color-surface);
      }
      .ticket-divider {
        position: relative;
        height: 14px;
        margin: 0.55rem -0.9rem 0.25rem;
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
      .ticket-divider::before {
        left: -9px;
      }
      .ticket-divider::after {
        right: -9px;
      }
      .ticket-divider-line {
        flex: 1;
        height: 0;
        border-top: 2px dashed var(--color-border);
        margin: 0 8px;
      }
      .action-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .action-row .btn-secondary {
        grid-column: 1/-1;
      }
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
        background: var(--color-surface);
        color: var(--color-text);
        border-color: var(--color-border);
      }
      .action-row .btn-danger {
        background: #f4d79f;
        color: #4c3a1d;
        border-color: #e2c48b;
      }
      .action-row .btn-primary {
        background: var(--color-primary);
        color: #fff;
      }
    `,
  ],
})
export class ActiveTicketCardComponent {
  readonly ticket = input<TicketActive | null>(null);
  readonly unpark = output<void>();
  readonly extend = output<void>();
  readonly goToCar = output<TicketActive>();

  hasCoordinates(ticket: TicketActive): boolean {
    return Number.isFinite(ticket.latitude) && Number.isFinite(ticket.longitude);
  }
}
