import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LucideCarFront, LucideNavigation, LucideTimerReset } from '@lucide/angular';
import type { ActiveParking } from '../../../core/services/operations.service';
import { normalizeSectorColor } from '../../../shared/utils/sector-color';
import { formatCountdown, liveCountdownSeconds, parseCountdownToSeconds } from '../../../core/utils/parking-countdown';

@Component({
  selector: 'app-active-ticket-card',
  standalone: true,
  imports: [RuntimeStyleDirective, RouterLink, TranslatePipe, LucideCarFront, LucideNavigation, LucideTimerReset],
  template: `
    @if (ticket(); as active) {
      <div class="active-ticket-shell">
        <div class="card active-ticket-card" [appRuntimeStyle]="{ '--ticket-header-color': ticketHeaderColor() }">
          <div class="ticket-main-row">
            <div class="ticket-main-icon" [appRuntimeStyle]="{ '--ticket-progress': ticketProgress(active) }">
              <svg class="ticket-progress-ring" viewBox="0 0 44 44" aria-hidden="true">
                <circle class="ticket-progress-track" cx="22" cy="22" r="18" pathLength="100"></circle>
                <circle class="ticket-progress-value" cx="22" cy="22" r="18" pathLength="100"></circle>
              </svg>
              <svg lucideCarFront class="ticket-car-icon" size="19" strokeWidth="2.45"></svg>
            </div>
            <div>
              <p class="ticket-plate">{{ active.plate }}</p>
              <p class="ticket-timer">{{ liveTimeRemaining(active) }}</p>
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
              (click)="$event.stopPropagation(); goToCar.emit(active)"
            >
              <svg lucideNavigation class="action-btn-icon" size="19" strokeWidth="2"></svg>
              {{ 'dashboard.howToGetThere' | translate }}
            </button>
            <button type="button" class="btn btn-danger btn-sm" (click)="$event.stopPropagation(); unpark.emit()">
              {{ 'dashboard.unpark' | translate }}
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="$event.stopPropagation(); extend.emit()">
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
  styleUrls: ['../../../shared/styles/parking-ticket.css', './active-ticket-card.component.css'],
})
export class ActiveTicketCardComponent implements OnDestroy {
  readonly ticket = input<ActiveParking | null>(null);
  readonly unpark = output<void>();
  readonly extend = output<void>();
  readonly goToCar = output<ActiveParking>();
  readonly ticketHeaderColor = computed(() => normalizeSectorColor(this.ticket()?.sectorColor));
  /** Ticks every second so the countdown stays live like the APK timer. */
  private readonly tick = signal(0);
  private readonly timer = setInterval(() => this.tick.update((value) => value + 1), 1000);
  private baseline: { id: string; seconds: number; at: number } | null = null;

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  /** Live seconds left, rebased whenever the backend snapshot moves. */
  liveRemainingSeconds(ticket: ActiveParking): number {
    this.tick();
    const now = Date.now();
    const snapshot = parseCountdownToSeconds(ticket.timeRemaining);
    const base = this.baseline;
    if (!base || base.id !== ticket.id || Math.abs(snapshot - liveCountdownSeconds(base.seconds, base.at, now)) > 2) {
      this.baseline = { id: ticket.id, seconds: snapshot, at: now };
      return snapshot;
    }
    return liveCountdownSeconds(base.seconds, base.at, now);
  }

  liveTimeRemaining(ticket: ActiveParking): string {
    return formatCountdown(this.liveRemainingSeconds(ticket));
  }

  hasCoordinates(ticket: ActiveParking): boolean {
    return Number.isFinite(ticket.latitude) && Number.isFinite(ticket.longitude);
  }

  ticketProgress(ticket: ActiveParking): string {
    const remaining = this.liveRemainingSeconds(ticket);
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
