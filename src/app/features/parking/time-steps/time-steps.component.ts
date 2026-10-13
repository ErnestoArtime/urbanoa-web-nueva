import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { NoParkingTimeAvailableError, ParkingTimeStepsService } from '../parking-time-steps.service';
import type { ParkingTimeStep } from '../models/parking-time-step.model';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LucideCarFront } from '@lucide/angular';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { opsRelativeDayLabel, formatOpsTime, parseOpsDate } from '../../../core/utils/ops-date';

@Component({
  selector: 'app-parking-time-steps',
  imports: [RuntimeStyleDirective, RouterLink, LoaderComponent, TranslatePipe, LucideCarFront],
  template: `
    <app-loader [visible]="loading()" [message]="'parking.timeSteps.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
    <div class="page flow-page has-sticky-actions">
      <a routerLink="/app/parking/tickets" [queryParams]="query()" class="back-link">{{ 'parking.timeSteps.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.timeSteps.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'parking.timeSteps.subtitle' | translate }}</p>

      <div class="context-card card">
        <span class="sector-mark" [appRuntimeStyle]="{ background: sectorColor() }"></span>
        <div>
          <strong>{{ context().zone }}</strong>
          <p>{{ context().street }}{{ context().cityName ? ' · ' + context().cityName : '' }}</p>
          <small>{{ context().plate }}{{ context().tariff ? ' · ' + context().tariff : '' }}</small>
        </div>
        <div class="selected-vehicle">
          <svg lucideCarFront size="22" strokeWidth="2.2"></svg>
          <span
            ><small>{{ 'parking.timeSteps.vehicle' | translate }}</small
            ><strong>{{ context().plate }}</strong></span
          >
        </div>
      </div>

      @if (steps().length > 0) {
        <div class="time-line card">
          <div>
            <small>{{ 'parking.timeSteps.start' | translate }}</small
            ><strong>{{ startTime() }}</strong>
            <span class="time-day-label">{{ startDayLabel() | translate }}</span>
          </div>
          <span class="line"></span>
          <div class="duration-pill">{{ selectedStep().timeFormatted }}</div>
          <span class="line"></span>
          <div>
            <small>{{ 'parking.timeSteps.end' | translate }}</small
            ><strong>{{ endTime() }}</strong>
            <span class="time-day-label">{{ endDayLabel() | translate }}</span>
          </div>
        </div>

        <section class="time-selector" [attr.aria-label]="'parking.timeSteps.title' | translate">
          <button
            type="button"
            class="step-control"
            [attr.aria-label]="'parking.timeSteps.decreaseDuration' | translate"
            (click)="changeTime(-1)"
            [disabled]="selectedIndex() === 0"
          >
            −
          </button>
          <div class="time-wheel" [appRuntimeStyle]="{ background: wheelBackground() }">
            <div class="wheel-content">
              <small>{{ 'parking.timeSteps.time' | translate }}</small>
              <strong>{{ selectedStep().timeFormatted }}</strong>
              <span>{{ amountFormatted() }}</span>
            </div>
          </div>
          <button
            type="button"
            class="step-control"
            [attr.aria-label]="'parking.timeSteps.increaseDuration' | translate"
            (click)="changeTime(1)"
            [disabled]="selectedIndex() === steps().length - 1"
          >
            +
          </button>
        </section>

        <div class="step-options" [attr.aria-label]="'parking.timeSteps.title' | translate">
          @for (step of milestoneSteps(); track step.time) {
            <button type="button" [class.active]="step.time === selectedStep().time" (click)="selectStep(step)">
              {{ step.timeFormatted }}
            </button>
          }
        </div>
      }
      @if (!loading() && error()) {
        <p class="card" role="alert">{{ 'parking.timeSteps.loadError' | translate }}</p>
      }
      @if (!loading() && noExtensionAvailable()) {
        <p class="card no-extension-message" role="status">{{ 'parking.timeSteps.noExtensionAvailable' | translate }}</p>
      }
      @if (!loading() && invalidTicketBehavior()) {
        <p class="card no-extension-message" role="status">{{ 'parking.timeSteps.ticketUnavailable' | translate }}</p>
      }

      @if (canContinue()) {
        <div class="price-card card">
          <span>{{ 'parking.timeSteps.estimatedPrice' | translate }}</span>
          <strong>{{ amountFormatted() }}</strong>
        </div>
        <div class="sticky-actions">
          <a
            routerLink="/app/parking/confirm"
            [queryParams]="confirmationParams()"
            (click)="onContinue()"
            class="btn btn-primary btn-block"
            >{{ 'parking.timeSteps.continue' | translate }}</a
          >
        </div>
      }
    </div>
  `,
  styleUrl: './time-steps.component.css',
})
export class ParkingTimeStepsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ParkingFlowStore);
  private readonly timeStepsService = inject(ParkingTimeStepsService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly api = inject(OpsApiClient);
  private readonly initialQuery: ParkingFlowQuery = readParkingFlowQuery(this.route);
  readonly query = computed(() =>
    this.store.hasMinimumParkingData()
      ? ({ ...this.initialQuery, ...this.store.fromStore() } as ParkingFlowQuery)
      : (this.initialQuery as ParkingFlowQuery),
  );
  readonly hasFlowData = computed(() => !!this.query().plate);
  readonly context = computed(() => {
    const q = this.query();
    if (this.hasFlowData()) return q;
    const parkings = this.parkingSessionService.activeParkings();
    const first = parkings[0];
    if (!first) return q;
    return {
      ...q,
      zone: q.zone || first.zone,
      street: q.street || first.street || '',
      plate: q.plate || first.plate,
      cityName: q.cityName || '',
      tariff: q.tariff || '',
    } as ParkingFlowQuery;
  });

  readonly steps = signal<ParkingTimeStep[]>([]);
  readonly milestoneSteps = computed(() => this.steps().filter((s) => s.time % 30 === 0));
  readonly selectedStep = signal<ParkingTimeStep>({
    tariffType: 0,
    time: 60,
    quantity: 1,
    timeFormatted: '1 h',
    hourMinute: '1:00',
    dayDescriptor: 'hoy',
    datetimeRaw: '',
    startDatetimeRaw: '',
    amount: 0,
  });
  readonly selectedIndex = computed(() => this.steps().findIndex((s) => s.time === this.selectedStep().time));
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly noExtensionAvailable = signal(false);
  readonly invalidTicketBehavior = computed(() => {
    const behavior = this.query().ticketBehavior;
    return behavior !== undefined && behavior !== '' && [0, 2, 3].includes(Number(behavior));
  });
  readonly canContinue = computed(() => {
    return this.steps().length > 0 && this.selectedStep().time > 0 && !this.invalidTicketBehavior();
  });
  private readonly startedAt = this.api.serverNow();

  private currentlyLoadedPlate = '';

  async ngOnInit(): Promise<void> {
    this.currentlyLoadedPlate = this.query().plate;
    await this.loadSteps();
  }

  private readonly reloadOnVehicleChange = effect(() => {
    const plate = this.query().plate;
    if (this.store.hasTicketData() && this.currentlyLoadedPlate && plate && plate !== this.currentlyLoadedPlate) {
      this.currentlyLoadedPlate = plate;
      void this.loadSteps();
    }
  });

  private async loadSteps(): Promise<void> {
    const q = this.query();
    this.loading.set(true);
    this.error.set(false);
    this.noExtensionAvailable.set(false);
    if (this.invalidTicketBehavior()) {
      this.steps.set([]);
      this.loading.set(false);
      return;
    }
    // Extensions carry the ticket identifier; OPS supplies their durations and prices.
    if (!q.tariffId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    const hourlyPrice = this.parsePrice(q.tariffPrice);
    try {
      const generatedSteps = await this.timeStepsService.queryTimeSteps({
        tariffId: q.tariffId,
        tariffPrice: hourlyPrice,
        contractId: Number(q.cityId || 0),
        sectorId: Number(q.sectorId || 0),
        ticketId: Number(q.ticketId || 0),
        plate: q.plate,
        startDate: this.startedAt,
        stepMinutes: this.isZarautz() ? 3 : 5,
      });
      this.steps.set(generatedSteps);
      const oneHourIndex = generatedSteps.findIndex((step) => step.time === 60);
      const defaultIndex = oneHourIndex >= 0 ? oneHourIndex : 0;
      if (generatedSteps[defaultIndex]) this.selectedStep.set(generatedSteps[defaultIndex]);
    } catch (error) {
      this.steps.set([]);
      if (error instanceof NoParkingTimeAvailableError) this.noExtensionAvailable.set(true);
      else this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  selectStep(step: ParkingTimeStep): void {
    this.selectedStep.set(step);
  }

  changeTime(direction: -1 | 1): void {
    const nextIndex = Math.max(0, Math.min(this.steps().length - 1, this.selectedIndex() + direction));
    this.selectedStep.set(this.steps()[nextIndex]);
  }

  startTime(): string {
    return this.stepTime(this.selectedStep().startDatetimeRaw, this.startedAt);
  }
  startDayLabel(): string {
    const start = this.stepDate(this.selectedStep().startDatetimeRaw, this.startedAt);
    return opsRelativeDayLabel(start, this.api.serverNow());
  }
  endTime(): string {
    const step = this.selectedStep();
    const fallback = new Date(this.startedAt.getTime() + step.time * 60_000);
    return this.stepTime(step.datetimeRaw, fallback);
  }
  endDayLabel(): string {
    const step = this.selectedStep();
    const fallback = new Date(this.startedAt.getTime() + step.time * 60_000);
    return opsRelativeDayLabel(this.stepDate(step.datetimeRaw, fallback), this.api.serverNow());
  }
  amountFormatted(): string {
    return `${this.selectedStep().amount.toFixed(2).replace('.', ',')} €`;
  }
  sectorColor(): string {
    return this.query().sectorColor ? `#${this.query().sectorColor.replace('#', '')}` : 'var(--color-primary)';
  }
  wheelBackground(): string {
    const progress = ((this.selectedIndex() + 1) / this.steps().length) * 360;
    return `conic-gradient(var(--color-primary) 0deg ${progress}deg, var(--color-border) ${progress}deg 360deg)`;
  }
  confirmationParams(): Record<string, string> {
    const step = this.selectedStep();
    return {
      ...this.query(),
      duration: step.timeFormatted,
      minutes: String(step.time),
      amount: this.amountFormatted(),
      startTime: this.startTime(),
      startDayLabel: this.startDayLabel(),
      endTime: this.endTime(),
      endDayLabel: this.endDayLabel(),
      tariffType: String(step.tariffType),
    };
  }

  onContinue(): void {
    if (!this.canContinue()) return;
    const step = this.selectedStep();
    this.store.update({
      duration: step.timeFormatted,
      minutes: String(step.time),
      amount: this.amountFormatted(),
      startTime: this.startTime(),
      startDayLabel: this.startDayLabel(),
      endTime: this.endTime(),
      endDayLabel: this.endDayLabel(),
      tariffType: String(step.tariffType),
    });
  }

  private parsePrice(tariffPrice: string | undefined): number {
    const parsed = Number((tariffPrice?.match(/[\d,.]+/)?.[0] ?? '').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  private isZarautz(): boolean {
    return [this.query().city, this.query().cityName].some((value) => value?.trim().toLocaleLowerCase('es') === 'zarautz');
  }
  private formatTime(date: Date): string {
    return formatOpsTime(date);
  }

  private stepTime(raw: string, fallback: Date): string {
    return this.formatTime(this.stepDate(raw, fallback));
  }

  private stepDate(raw: string, fallback: Date): Date {
    return /^\d{12}$/.test(raw) ? parseOpsDate(raw) : fallback;
  }
}
