import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingApiService, ParkingTicketOption } from '../../../core/services/parking-api.service';

@Component({
  selector: 'app-parking-tickets',
  imports: [RouterLink, LoaderComponent, TranslatePipe],
  template: `
    <app-loader [visible]="loading()" [message]="'parking.tickets.loading' | translate" />
    <div class="page flow-page">
      <a routerLink="/app/parking" [queryParams]="{ city: query().city }" class="back-link">{{ 'parking.tickets.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.tickets.title' | translate }}</h1>
      <div class="selection-summary card">
        <span class="zone-color" [style.background]="'#' + query().sectorColor"></span>
        <div>
          <strong>{{ query().street }}</strong>
          <p>{{ query().zone }} · {{ query().cityName }}</p>
          <small>{{ 'parking.tickets.vehicle' | translate: { plate: query().plate } }}</small>
        </div>
      </div>
      <div class="tariff-list">
        @for (tariff of tariffs(); track tariff.id) {
          <article
            class="ticket-option"
            [class.ticket-option-information]="tariff.informationalOnly"
            [attr.aria-disabled]="tariff.informationalOnly ? 'true' : null"
            [attr.role]="tariff.informationalOnly ? 'status' : null"
          >
            <div
              class="ticket-zone-header"
              [style.background]="'#' + (tariff.sectorColor || query().sectorColor || '2b6767').replace('#', '')"
            >
              {{ query().zone || ('parking.tickets.defaultZone' | translate) }}
            </div>
            <div class="ticket-content">
              <div class="ticket-option-head">
                <h2>{{ tariff.name }}</h2>
                <strong>{{ tariff.free ? ('parking.tickets.free' | translate) : tariff.price }}</strong>
              </div>
              <div class="ticket-meta">
                <span
                  ><small>{{ 'parking.tickets.schedule' | translate }}</small
                  ><strong>{{ tariff.schedule || '—' }}</strong></span
                ><span
                  ><small>{{ 'parking.tickets.maximumTime' | translate }}</small
                  ><strong>{{ tariff.maxTime || '—' }}</strong></span
                ><span
                  ><small>{{ 'parking.tickets.amount' | translate }}</small
                  ><strong>{{ tariff.free ? ('parking.tickets.free' | translate) : tariff.minAmount || tariff.price || '—' }}</strong></span
                >
              </div>
              @if (tariff.informationalOnly) {
                <p class="ticket-behavior">{{ tariff.desc || tariff.name }}</p>
              } @else {
                <a
                  routerLink="/app/parking/time-steps"
                  [queryParams]="withTariff(tariff)"
                  (click)="onSelectTariff(tariff)"
                  class="ticket-action"
                >
                  {{ 'parking.tickets.getTicket' | translate }} <b>›</b>
                </a>
              }
            </div>
          </article>
        }
        @if (!loading() && !tariffs().length) {
          <p class="card" role="status">{{ error() ? 'No se pudieron cargar las tarifas.' : 'No hay tarifas disponibles.' }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .flow-page {
        max-width: 760px;
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
      }
      .selection-summary {
        display: flex;
        gap: 0.8rem;
        margin: 1rem 0;
      }
      .zone-color {
        width: 8px;
        border-radius: 99px;
      }
      .selection-summary p,
      .selection-summary small {
        color: var(--color-text-muted);
      }
      .tariff-list {
        display: grid;
        gap: 0.8rem;
      }
      .ticket-option {
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: 14px;
        background: var(--color-surface);
        color: inherit;
        box-shadow: var(--shadow-sm);
      }
      .ticket-zone-header {
        padding: 0.55rem 1rem;
        color: #fff;
        font-size: var(--text-sm);
        font-weight: var(--font-extra);
        text-align: center;
      }
      .ticket-content {
        display: grid;
        gap: 0.8rem;
        padding: 1rem;
      }
      .ticket-behavior {
        margin: 0;
        color: var(--color-text);
        font-size: var(--text-sm);
        line-height: 1.45;
      }
      .ticket-option-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .ticket-option-head h2 {
        margin: 0;
        font-size: var(--text-base);
      }
      .ticket-option-head > strong {
        align-self: center;
        color: var(--color-primary);
        white-space: nowrap;
      }
      .ticket-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        padding: 0.65rem 0;
        border-block: 1px dashed var(--color-border);
      }
      .ticket-meta span {
        display: flex;
        min-width: 0;
        flex-direction: column;
      }
      .ticket-meta small {
        color: var(--color-text-muted);
        font-size: var(--text-2xs);
      }
      .ticket-meta strong {
        font-size: var(--text-xs);
        overflow-wrap: anywhere;
      }
      .ticket-action {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        justify-self: end;
        padding: 0.55rem 1rem;
        border-radius: 999px;
        background: var(--color-primary);
        color: #fff;
        font-size: var(--text-sm);
        font-weight: var(--font-extra);
      }
      .ticket-action:hover {
        text-decoration: none;
      }
      .ticket-action b {
        font-size: var(--text-base);
      }
      @media (max-width: 600px) {
        .ticket-meta {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ParkingTicketsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ParkingFlowStore);
  private readonly parkingApi = inject(ParkingApiService);
  readonly tariffs = signal<ParkingTicketOption[]>([]);
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');
  readonly error = signal(false);
  private readonly initialQuery = readParkingFlowQuery(this.route);
  readonly query = computed(() =>
    this.store.hasMinimumParkingData() ? ({ ...this.initialQuery, ...this.store.fromStore() } as ParkingFlowQuery) : this.initialQuery,
  );
  readonly loading = signal(true);
  private currentlyLoadedPlate = '';
  private requestSequence = 0;

  async ngOnInit(): Promise<void> {
    this.currentlyLoadedPlate = this.query().plate;
    await this.loadTariffs();
  }

  private readonly reloadOnVehicleChange = effect(() => {
    const plate = this.query().plate;
    if (this.currentlyLoadedPlate && plate && plate !== this.currentlyLoadedPlate) {
      this.currentlyLoadedPlate = plate;
      void this.loadTariffs();
    }
  });

  private async loadTariffs(): Promise<void> {
    const requestId = ++this.requestSequence;
    const query = this.query();
    this.loading.set(true);
    this.error.set(false);
    try {
      const result = await this.parkingApi.tickets({
        contractId: Number(query.cityId || 0),
        plate: query.plate,
        zone: Number(query.sectorId || query.zoneId || 0),
        date: this.parkingApi.opsDate(this.parkingApi.serverNow()),
      });
      if (requestId !== this.requestSequence) return;
      this.tariffs.set(result.data);
      this.source.set('remote');
    } catch {
      if (requestId !== this.requestSequence) return;
      this.tariffs.set([]);
      this.source.set('error');
      this.error.set(true);
    } finally {
      if (requestId === this.requestSequence) this.loading.set(false);
    }
  }
  withTariff(tariff: ParkingTicketOption): Record<string, string> {
    return {
      ...this.query(),
      ticketId: tariff.id,
      tariffId: tariff.id,
      tariff: tariff.name,
      tariffPrice: tariff.price,
      ticketBehavior: String(tariff.ticketBehavior ?? 1),
      sectorColor: tariff.sectorColor || this.query().sectorColor,
    };
  }
  onSelectTariff(tariff: ParkingTicketOption): void {
    this.store.update({
      ticketId: tariff.id,
      ticketName: tariff.name,
      tariffId: tariff.id,
      tariffName: tariff.name,
      tariffPrice: tariff.price,
      ticketBehavior: String(tariff.ticketBehavior ?? 1),
      sectorColor: tariff.sectorColor || this.query().sectorColor,
    });
  }
}
