import { Component, inject, OnInit, signal } from '@angular/core';
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
      <a routerLink="/app/parking" [queryParams]="{ city: query.city }" class="back-link">{{ 'parking.tickets.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.tickets.title' | translate }}</h1>
      <div class="selection-summary card">
        <span class="zone-color" [style.background]="'#' + query.sectorColor"></span>
        <div>
          <strong>{{ query.street }}</strong>
          <p>{{ query.zone }} · {{ query.cityName }}</p>
          <small>{{ 'parking.tickets.vehicle' | translate: { plate: query.plate } }}</small>
        </div>
      </div>
      <div class="tariff-list">
        @for (tariff of tariffs(); track tariff.id) {
          <a routerLink="/app/parking/time-steps" [queryParams]="withTariff(tariff)" (click)="onSelectTariff(tariff)" class="ticket-option">
            <span class="ticket-color" [style.background]="'#' + (query.sectorColor || '2b6767')"></span>
            <div class="ticket-option-head">
              <div>
                <small>{{ query.zone || ('parking.tickets.defaultZone' | translate) }}</small>
                <h2>{{ tariff.name }}</h2>
                <p>{{ tariff.desc }}</p>
              </div>
              <strong>{{ tariff.price }}</strong>
            </div>
            <div class="ticket-meta">
              <span
                ><small>{{ 'parking.tickets.sector' | translate }}</small
                ><strong>{{ query.sector || query.street }}</strong></span
              ><span
                ><small>{{ 'parking.tickets.schedule' | translate }}</small
                ><strong>{{ tariff.schedule || '—' }}</strong></span
              ><span
                ><small>{{ 'parking.tickets.minimum' | translate }}</small
                ><strong>{{ tariff.minAmount || '—' }}</strong></span
              >
            </div>
            <span class="ticket-action">{{ 'parking.tickets.getTicket' | translate }} <b>›</b></span>
          </a>
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
        position: relative;
        display: grid;
        gap: 0.8rem;
        overflow: hidden;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 14px;
        background: var(--color-surface);
        color: inherit;
        box-shadow: var(--shadow-sm);
      }
      .ticket-option:hover {
        text-decoration: none;
        box-shadow: var(--shadow-md);
      }
      .ticket-color {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 6px;
      }
      .ticket-option-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 0.2rem;
      }
      .ticket-option-head small,
      .ticket-option-head p {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .ticket-option-head h2 {
        margin: 0.12rem 0;
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
        overflow: hidden;
        font-size: var(--text-xs);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ticket-action {
        justify-self: end;
        color: var(--color-primary);
        font-size: var(--text-sm);
        font-weight: var(--font-extra);
      }
      .ticket-action b {
        font-size: var(--text-base);
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
  readonly query: ParkingFlowQuery = this.store.hasMinimumParkingData() ? this.store.fromStore() : readParkingFlowQuery(this.route);
  readonly loading = signal(true);
  async ngOnInit(): Promise<void> {
    try {
      const result = await this.parkingApi.tickets({
        contractId: Number(this.query.cityId || 0),
        plate: this.query.plate,
        zone: Number(this.query.sectorId || this.query.zoneId || 0),
        street: Number(this.query.streetId || 0),
        date: this.parkingApi.opsDate(new Date()),
      });
      this.tariffs.set(result.data);
      this.source.set('remote');
    } catch {
      this.tariffs.set([]);
      this.source.set('error');
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  withTariff(tariff: ParkingTicketOption): Record<string, string> {
    return { ...this.query, ticketId: tariff.id, tariffId: tariff.id, tariff: tariff.name, tariffPrice: tariff.price };
  }
  onSelectTariff(tariff: ParkingTicketOption): void {
    this.store.update({ ticketId: tariff.id, ticketName: tariff.name, tariffId: tariff.id, tariffName: tariff.name, tariffPrice: tariff.price });
  }
}
