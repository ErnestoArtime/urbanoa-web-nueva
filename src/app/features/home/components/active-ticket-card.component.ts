import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LucideCarFront, LucideNavigation, LucideTimerReset } from '@lucide/angular';
import type { ActiveOperation } from '../../../core/services/operations.service';

@Component({
  selector: 'app-active-ticket-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LucideCarFront, LucideNavigation, LucideTimerReset],
  template: `
    @if (ticket(); as active) {
      <div class="active-ticket-shell">
        <div class="card active-ticket-card">
          <div class="ticket-main-row">
            <div class="ticket-main-icon" [style.--ticket-progress]="ticketProgress(active)">
              <svg class="ticket-progress-ring" viewBox="0 0 44 44" aria-hidden="true">
                <circle class="ticket-progress-track" cx="22" cy="22" r="18" pathLength="100"></circle>
                <circle class="ticket-progress-value" cx="22" cy="22" r="18" pathLength="100"></circle>
              </svg>
              <svg lucideCarFront class="ticket-car-icon" size="19" strokeWidth="2.45"></svg>
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
            <button type="button" class="btn btn-secondary btn-sm" [disabled]="!hasCoordinates(active)" (click)="goToCar.emit(active)">
              <svg lucideNavigation class="action-btn-icon" size="19" strokeWidth="2"></svg>
              {{ 'dashboard.howToGetThere' | translate }}
            </button>
            <button type="button" class="btn btn-danger btn-sm" (click)="unpark.emit()">{{ 'dashboard.unpark' | translate }}</button>
            <button type="button" class="btn btn-primary btn-sm" (click)="extend.emit()">
              <svg lucideTimerReset class="action-btn-icon" size="19" strokeWidth="2"></svg>
              {{ 'dashboard.extendTime' | translate }}
            </button>
          </div>
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
      .active-ticket-shell {
        border-radius: var(--radius-md);
        filter: drop-shadow(0 3px 8px rgba(28, 44, 39, 0.07));
      }
      .active-ticket-card {
        --ticket-notch-r: 10px;
        --ticket-cut-y: 120px;
        position: relative;
        overflow: hidden;
        box-shadow: none;
        -webkit-mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
        mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
      }
      .active-ticket-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 8px;
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        background: linear-gradient(90deg, #8f84f3 0%, #7971de 48%, #7469d2 100%);
      }
      .ticket-main-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-top: 0.25rem;
      }
      .ticket-main-icon {
        position: relative;
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--color-surface);
        color: var(--color-primary);
        flex: 0 0 auto;
      }
      .ticket-progress-ring {
        position: absolute;
        inset: 0;
        width: 44px;
        height: 44px;
        overflow: visible;
        transform: rotate(-88deg);
      }
      .ticket-progress-ring circle {
        fill: none;
        stroke-width: 5.2;
        stroke-linecap: round;
      }
      .ticket-progress-track {
        stroke: #f7dda5;
        stroke-dasharray: 83 17;
        stroke-dashoffset: -8;
      }
      .ticket-progress-value {
        stroke: var(--color-primary);
        stroke-dasharray: var(--ticket-progress, 28) 100;
        stroke-dashoffset: -8;
      }
      .ticket-car-icon {
        position: relative;
        z-index: 1;
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
        height: 20px;
        margin: 0.45rem -0.9rem 0.15rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ticket-divider-line {
        flex: 1;
        height: 0;
        border-top: 3px dashed rgba(149, 156, 146, 0.62);
        margin: 0 calc(var(--ticket-notch-r) + 5px);
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
  readonly ticket = input<ActiveOperation | null>(null);
  readonly unpark = output<void>();
  readonly extend = output<void>();
  readonly goToCar = output<ActiveOperation>();

  hasCoordinates(ticket: ActiveOperation): boolean {
    return Number.isFinite(ticket.latitude) && Number.isFinite(ticket.longitude);
  }

  ticketProgress(ticket: ActiveOperation): string {
    const remaining = this.parseDurationSeconds(ticket.timeRemaining);
    const total = this.parseDurationSeconds(ticket.durationLabel);
    if (!remaining || !total || remaining > total) return '28';
    const percent = Math.round((remaining / total) * 100);
    return String(Math.min(84, Math.max(8, percent)));
  }

  private parseDurationSeconds(value: string): number {
    const normalized = value.trim().toLowerCase();
    const timeParts = normalized.split(':').map(Number);
    if (timeParts.length === 3 && timeParts.every(Number.isFinite)) {
      const [hours, minutes, seconds] = timeParts;
      return hours * 3600 + minutes * 60 + seconds;
    }
    const hoursMatch = normalized.match(/(\d+)\s*h/);
    const minutesMatch = normalized.match(/(\d+)\s*m/);
    const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
    return hours * 3600 + minutes * 60;
  }
}
