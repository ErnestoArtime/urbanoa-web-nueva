import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { ParkingTimeStepsService } from '../parking-time-steps.service';
import type { ParkingTimeStep } from '../models/parking-time-step.model';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LucideCarFront } from '@lucide/angular';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';

@Component({
  selector: 'app-parking-time-steps',
  imports: [RouterLink, LoaderComponent, TranslatePipe, LucideCarFront],
  template: `
    <app-loader [visible]="loading()" [message]="'parking.timeSteps.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
    <div class="page flow-page has-sticky-actions">
      <a routerLink="/app/parking/tickets" [queryParams]="query()" class="back-link">{{ 'parking.timeSteps.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.timeSteps.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'parking.timeSteps.subtitle' | translate }}</p>

      <div class="context-card card">
        <span class="sector-mark" [style.background]="sectorColor()"></span>
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

      <div class="time-line card">
        <div>
          <small>{{ 'parking.timeSteps.start' | translate }}</small
          ><strong>{{ startTime() }}</strong>
        </div>
        <span class="line"></span>
        <div class="duration-pill">{{ selectedStep().timeFormatted }}</div>
        <span class="line"></span>
        <div>
          <small>{{ 'parking.timeSteps.end' | translate }}</small
          ><strong>{{ endTime() }}</strong>
        </div>
      </div>

      @if (steps().length > 0) {
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
          <div class="time-wheel" [style.background]="wheelBackground()">
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
        <p class="card" role="alert">No se pudieron obtener los tramos de tiempo para esta tarifa.</p>
      }

      @if (steps().length > 0) {
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
  styles: [
    `
      .flow-page {
        max-width: 680px;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
      }
      .flow-step {
        color: var(--color-primary);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .page-subtitle {
        margin-top: 0.35rem;
      }
      .context-card {
        display: flex;
        gap: 0.8rem;
        margin: 1.2rem 0;
      }
      .sector-mark {
        width: 8px;
        border-radius: 99px;
        flex: none;
      }
      .context-card p,
      .context-card small {
        color: var(--color-text-muted);
      }
      .selected-vehicle {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-left: auto;
        padding-left: 1rem;
        color: var(--color-primary);
      }
      .selected-vehicle span {
        display: flex;
        flex-direction: column;
      }
      .selected-vehicle strong {
        color: var(--color-text);
        white-space: nowrap;
      }
      .time-line {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr auto;
        align-items: center;
        gap: 0.65rem;
        text-align: center;
      }
      .time-line div {
        display: flex;
        flex-direction: column;
      }
      .time-line small {
        color: var(--color-text-muted);
      }
      .time-line strong {
        font-size: var(--text-lg);
      }
      .line {
        height: 1px;
        background: var(--color-border);
      }
      .duration-pill {
        padding: 0.45rem 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: 10px;
        font-weight: var(--font-bold);
        background: var(--color-background);
      }
      .time-selector {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.25rem;
        margin: 1.5rem 0;
      }
      .time-wheel {
        width: 210px;
        height: 210px;
        padding: 11px;
        border-radius: 50%;
        box-shadow: 0 8px 26px rgba(34, 105, 105, 0.16);
        transition: background 0.25s ease;
      }
      .wheel-content {
        height: 100%;
        border-radius: 50%;
        background: var(--color-surface);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-border);
      }
      .wheel-content small {
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-weight: var(--font-bold);
      }
      .wheel-content strong {
        font-size: var(--text-display);
        color: var(--color-primary);
        margin: 0.2rem 0;
      }
      .wheel-content span {
        font-weight: var(--font-extra);
      }
      .step-control {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid var(--color-primary);
        background: var(--color-surface);
        color: var(--color-primary);
        font-size: var(--text-2xl);
        cursor: pointer;
      }
      .step-control:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .step-options {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
      }
      .step-options button {
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: var(--color-surface);
        padding: 0.45rem 0.75rem;
        cursor: pointer;
      }
      .step-options button.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #fff;
        font-weight: var(--font-bold);
      }
      .price-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .price-card span {
        color: var(--color-text-muted);
      }
      .price-card strong {
        font-size: var(--text-xl);
        color: var(--color-primary);
      }
      @media (min-width: 960px) and (max-height: 950px) {
        .flow-page {
          padding-top: 1rem;
          padding-bottom: 0.8rem;
        }
        .back-link {
          margin-bottom: 0.35rem;
        }
        .page-title {
          font-size: var(--text-xl);
        }
        .page-subtitle {
          font-size: var(--text-sm);
        }
        .context-card {
          margin: 0.65rem 0;
          padding: 0.75rem;
        }
        .time-line {
          padding: 0.65rem;
        }
        .time-selector {
          margin: 0.7rem 0;
        }
        .time-wheel {
          width: 168px;
          height: 168px;
          padding: 9px;
        }
        .wheel-content strong {
          font-size: var(--text-2xl);
        }
        .step-control {
          width: 40px;
          height: 40px;
        }
        .step-options {
          margin-bottom: 0.65rem;
        }
        .price-card {
          padding: 0.65rem;
          margin-bottom: 0.55rem;
        }
      }
      @media (max-width: 520px) {
        .time-wheel {
          width: 175px;
          height: 175px;
        }
        .time-selector {
          gap: 0.75rem;
        }
        .time-line {
          gap: 0.35rem;
        }
        .duration-pill {
          padding: 0.35rem;
        }
        .flow-page {
          padding-inline: 1rem;
        }
      }
    `,
  ],
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
    amount: 0,
  });
  readonly selectedIndex = computed(() => this.steps().findIndex((s) => s.time === this.selectedStep().time));
  readonly loading = signal(true);
  readonly error = signal(false);
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
    const hourlyPrice = this.parsePrice(q.tariffPrice);
    try {
      const generatedSteps = await this.timeStepsService.queryTimeSteps({
        tariffId: q.tariffId || '1',
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
    } catch {
      this.steps.set([]);
      this.error.set(true);
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
    return this.formatTime(this.startedAt);
  }
  endTime(): string {
    return this.formatTime(new Date(this.startedAt.getTime() + this.selectedStep().time * 60000));
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
      endTime: this.endTime(),
      tariffType: String(step.tariffType),
    };
  }

  onContinue(): void {
    const step = this.selectedStep();
    this.store.update({
      duration: step.timeFormatted,
      minutes: String(step.time),
      amount: this.amountFormatted(),
      endTime: this.endTime(),
      tariffType: String(step.tariffType),
    });
  }

  private parsePrice(tariffPrice: string | undefined): number {
    const parsed = Number((tariffPrice?.match(/[\d,.]+/)?.[0] ?? '0.60').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.6;
  }
  private isZarautz(): boolean {
    return [this.query().city, this.query().cityName].some((value) => value?.trim().toLocaleLowerCase('es') === 'zarautz');
  }
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
