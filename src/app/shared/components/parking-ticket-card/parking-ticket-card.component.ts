import { formatEuro } from '../../../core/utils/euro-format';
import { RuntimeStyleDirective } from '../../directives/runtime-style.directive';
import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCarFront, LucideMapPin, LucideTimerReset } from '@lucide/angular';
import type { ActiveParking } from '../../../core/services/operations.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { normalizeSectorColor } from '../../utils/sector-color';
import { formatCountdown, liveCountdownSeconds, parseCountdownToSeconds } from '../../../core/utils/parking-countdown';
import { TicketCutAlignDirective } from '../../directives/ticket-cut-align.directive';

export type ParkingTicketCardVariant = 'dashboard' | 'operations-current' | 'detail';

@Component({
  selector: 'app-parking-ticket-card',
  standalone: true,
  imports: [RuntimeStyleDirective, RouterLink, TranslatePipe, LucideCarFront, LucideMapPin, LucideTimerReset, TicketCutAlignDirective],
  template: `
    @if (parking(); as active) {
      <article
        appTicketCutAlign
        class="parking-ticket-card card"
        [class.detail-variant]="variant() === 'detail'"
        [appRuntimeStyle]="{ '--ticket-header-color': ticketHeaderColor() }"
      >
        <div class="ticket-header">{{ ticketHeaderLabel(active) }}</div>
        <div class="ticket-main-row">
          <div class="ticket-main-icon" [appRuntimeStyle]="{ '--ticket-progress': ticketProgress() }">
            <svg class="ticket-progress-ring" viewBox="0 0 44 44" aria-hidden="true">
              <circle class="ticket-progress-track" cx="22" cy="22" r="18" pathLength="100"></circle>
              <circle class="ticket-progress-value" cx="22" cy="22" r="18" pathLength="100"></circle>
            </svg>
            <svg lucideCarFront class="ticket-car-icon" size="19" strokeWidth="2.45"></svg>
          </div>
          <div>
            <p class="ticket-plate">{{ active.plate }}</p>
            <p class="ticket-timer">{{ liveTimeRemaining(active) }}</p>
            @if (active.street) {
              <span class="ticket-street"><svg lucideMapPin aria-hidden="true" size="13" strokeWidth="2"></svg>{{ active.street }}</span>
            }
          </div>
          <div class="ticket-summary">
            @if (active.amount !== undefined) {
              <strong class="ticket-amount">{{ formattedAmount(active.amount) }}</strong>
            }
            @if (active.operationId; as opId) {
              <span class="ticket-op-id">{{ operationReference(opId) }}</span>
            }
          </div>
        </div>

        <div class="ticket-time-row">
          <div>
            <small>{{ 'dashboard.ticket.start' | translate }}</small>
            <strong>{{ active.startTime }}</strong>
            @if (active.startDayLabel; as startDayLabel) {
              <span class="ticket-day-label">{{ startDayLabel | translate }}</span>
            }
          </div>
          <p>{{ active.durationLabel }}</p>
          <div>
            <small>{{ 'dashboard.ticket.end' | translate }}</small>
            <strong>{{ active.endTime }}</strong>
            @if (active.endDayLabel; as endDayLabel) {
              <span class="ticket-day-label">{{ endDayLabel | translate }}</span>
            }
          </div>
        </div>

        @if (variant() !== 'detail') {
          <div class="ticket-divider" data-ticket-cut><div class="ticket-divider-line"></div></div>
          <div class="ticket-actions">
            @if (active.refundable === 1 || active.refundable === 2) {
              <button type="button" class="btn btn-danger btn-sm" [disabled]="active.refundable !== 2" (click)="leaveParking.emit(active)">
                {{ 'dashboard.unpark' | translate }}
              </button>
            }
            @if (active.extension === 1 || active.extension === 2) {
              <button
                type="button"
                class="btn btn-primary btn-sm"
                [disabled]="active.extension !== 2"
                (click)="active.extension === 2 && extendTime.emit(active)"
              >
                <svg lucideTimerReset class="action-btn-icon" size="19" strokeWidth="2"></svg>
                {{ 'dashboard.extend' | translate }}
              </button>
            }
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
  styleUrls: ['../../styles/parking-ticket.css', './parking-ticket-card.component.css'],
})
export class ParkingTicketCardComponent implements OnDestroy {
  readonly variant = input<ParkingTicketCardVariant>('dashboard');
  readonly parking = input<ActiveParking | null>(null);
  readonly goToCar = output<ActiveParking>();
  readonly leaveParking = output<ActiveParking>();
  readonly extendTime = output<ActiveParking>();
  readonly ticketHeaderColor = computed(() => normalizeSectorColor(this.parking()?.sectorColor));
  /** Ticks every second so the countdown stays live like the APK timer. */
  private readonly tick = signal(0);
  private readonly timer = setInterval(() => this.tick.update((value) => value + 1), 1000);
  private baseline: { id: string; snapshot: number; seconds: number; at: number } | null = null;

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  /** Live seconds left, rebased whenever the backend snapshot moves. */
  liveRemainingSeconds(active: ActiveParking): number {
    this.tick();
    const now = Date.now();
    const snapshot = parseCountdownToSeconds(active.timeRemaining);
    const base = this.baseline;
    const startsAt = active.countdownStartsAt;
    if (startsAt !== undefined && Number.isFinite(startsAt) && now < startsAt) {
      this.baseline = { id: active.id, snapshot, seconds: snapshot, at: startsAt };
      return snapshot;
    }
    if (!base || base.id !== active.id || base.snapshot !== snapshot) {
      this.baseline = { id: active.id, snapshot, seconds: snapshot, at: now };
      return snapshot;
    }
    return liveCountdownSeconds(base.seconds, base.at, now);
  }

  liveTimeRemaining(active: ActiveParking): string {
    return formatCountdown(this.liveRemainingSeconds(active));
  }

  readonly ticketProgress = computed(() => {
    const active = this.parking();
    if (!active) return 28;
    const remainingMinutes = this.liveRemainingSeconds(active) / 60;
    const durationMinutes = this.durationMinutes(active.durationLabel);
    return Math.max(8, Math.min(100, (remainingMinutes / durationMinutes) * 100));
  });

  operationReference(operationId: string): string {
    const id = String(operationId).trim();
    if (!id) return '';
    if (id.startsWith('#')) return id;
    return /^\d+$/.test(id) && id.length < 7 ? `#${id.padStart(7, '0')}` : `#${id}`;
  }

  ticketHeaderLabel(active: ActiveParking): string {
    return active.cityName ? `${active.cityName} · ${active.zone}` : active.zone;
  }

  formattedAmount(amount: number): string {
    return formatEuro(Math.abs(amount));
  }

  private durationMinutes(label: string): number {
    const hourMatch = label.match(/(\d+)\s*h/);
    const minMatch = label.match(/(\d+)\s*min/);
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minMatch ? Number(minMatch[1]) : 0;
    return Math.max(1, hours * 60 + minutes);
  }
}
