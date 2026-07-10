import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCarFront, LucideNavigation, LucideTimerReset } from '@lucide/angular';
import type { ActiveParking } from '../../../core/services/operations.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type ParkingTicketCardVariant = 'dashboard' | 'operations-current' | 'detail';

@Component({
  selector: 'app-parking-ticket-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LucideCarFront, LucideNavigation, LucideTimerReset],
  template: `
    @if (parking(); as active) {
      <article class="parking-ticket-card card" [class.detail-variant]="variant() === 'detail'">
        <div class="ticket-main-row">
          <div class="ticket-main-icon" [style.--ticket-progress]="ticketProgress()">
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
            <small>{{ 'dashboard.ticket.zone' | translate }}</small>
            <strong>{{ active.zone }}</strong>
          </div>
          @if (active.operationId; as opId) {
            <span class="ticket-op-id">{{ operationReference(opId) }}</span>
          }
        </div>

        <div class="ticket-time-row">
          <div>
            <small>{{ 'dashboard.ticket.start' | translate }}</small>
            <strong>{{ active.startTime }}</strong>
          </div>
          <p>{{ active.durationLabel }}</p>
          <div>
            <small>{{ 'dashboard.ticket.end' | translate }}</small>
            <strong>{{ active.endTime }}</strong>
          </div>
        </div>

        @if (variant() !== 'detail') {
          <div class="ticket-divider"><div class="ticket-divider-line"></div></div>
          <div class="ticket-actions">
            <button type="button" class="btn btn-secondary btn-sm" [disabled]="!hasCoordinates()" (click)="goToCar.emit(active)">
              <svg lucideNavigation class="action-btn-icon" size="19" strokeWidth="2"></svg>
              {{ 'dashboard.howToGetThere' | translate }}
            </button>
            <button type="button" class="btn btn-danger btn-sm" (click)="leaveParking.emit(active)">
              {{ 'dashboard.unpark' | translate }}
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="extendTime.emit(active)">
              <svg lucideTimerReset class="action-btn-icon" size="19" strokeWidth="2"></svg>
              {{ 'dashboard.extendTime' | translate }}
            </button>
          </div>
        }
      </article>
    } @else {
      <div class="card empty-ticket-card">
        <p class="text-muted">{{ 'dashboard.noActiveTicket' | translate }}</p>
        <a routerLink="/app/parking" class="btn btn-primary btn-block mt-2">{{ 'parking.title' | translate }}</a>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        filter: drop-shadow(0 3px 8px rgba(28, 44, 39, 0.07));
      }
      .parking-ticket-card {
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
      .parking-ticket-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto;
        z-index: 0;
        height: var(--space-2);
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        background: linear-gradient(90deg, #8f84f3 0%, #7971de 48%, #7469d2 100%);
      }
      .parking-ticket-card > * {
        position: relative;
        z-index: 1;
      }
      .ticket-op-id {
        flex: 0 0 auto;
        align-self: flex-start;
        margin-left: auto;
        padding-top: 0.1rem;
        color: var(--color-text-muted);
        font-size: var(--text-2xs);
        font-weight: var(--font-extra);
        letter-spacing: 0.03em;
        line-height: 1;
        white-space: nowrap;
      }
      .ticket-main-row {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        margin-top: var(--space-3);
      }
      .ticket-main-icon {
        position: relative;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        flex: 0 0 auto;
        border-radius: 50%;
        background: var(--color-surface);
        color: var(--color-primary);
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
        stroke: var(--color-active);
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
      }
      .ticket-plate {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        letter-spacing: 0.04em;
        line-height: var(--line-tight);
      }
      .ticket-timer,
      .ticket-location small,
      .ticket-time-row small {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .ticket-location {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        margin-left: auto;
        padding-left: var(--space-2);
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
        margin-top: var(--space-2);
        text-align: center;
      }
      .ticket-time-row div {
        display: flex;
        flex-direction: column;
      }
      .ticket-time-row strong {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        line-height: var(--line-tight);
      }
      .ticket-time-row p {
        margin: 0 var(--space-1);
        padding: 0.28rem 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-surface);
        font-size: var(--text-md);
        font-weight: var(--font-bold);
        white-space: nowrap;
      }
      .ticket-divider {
        position: relative;
        display: flex;
        align-items: center;
        height: 20px;
        margin: 0.45rem -0.9rem 0.15rem;
      }
      .ticket-divider-line {
        flex: 1;
        height: 0;
        margin: 0 calc(var(--ticket-notch-r) + 5px);
        border-top: 3px dashed rgba(149, 156, 146, 0.62);
      }
      .ticket-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }
      .ticket-actions .btn-secondary {
        grid-column: 1 / -1;
      }
      .action-btn-icon {
        flex: none;
      }
      .detail-variant {
        padding: var(--space-5);
      }
    `,
  ],
})
export class ParkingTicketCardComponent {
  readonly variant = input<ParkingTicketCardVariant>('dashboard');
  readonly parking = input<ActiveParking | null>(null);
  readonly goToCar = output<ActiveParking>();
  readonly leaveParking = output<ActiveParking>();
  readonly extendTime = output<ActiveParking>();

  readonly ticketProgress = computed(() => {
    const active = this.parking();
    if (!active) return 28;
    const [hours = 0, minutes = 0, seconds = 0] = active.timeRemaining.split(':').map(Number);
    const remainingMinutes = Math.max(0, hours * 60 + minutes + seconds / 60);
    const durationMinutes = this.durationMinutes(active.durationLabel);
    return Math.max(8, Math.min(100, (remainingMinutes / durationMinutes) * 100));
  });

  operationReference(operationId: string): string {
    const id = String(operationId).trim();
    if (!id) return '';
    if (id.startsWith('#')) return id;
    return /^\d+$/.test(id) && id.length < 7 ? `#${id.padStart(7, '0')}` : `#${id}`;
  }

  hasCoordinates(): boolean {
    const active = this.parking();
    return Number.isFinite(active?.latitude) && Number.isFinite(active?.longitude);
  }

  private durationMinutes(label: string): number {
    const hourMatch = label.match(/(\d+)\s*h/);
    const minMatch = label.match(/(\d+)\s*min/);
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minMatch ? Number(minMatch[1]) : 0;
    return Math.max(1, hours * 60 + minutes);
  }
}
