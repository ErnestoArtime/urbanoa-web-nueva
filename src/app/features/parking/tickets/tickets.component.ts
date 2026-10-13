import { normalizeSectorColor } from '../../../shared/utils/sector-color';
import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingApiService, ParkingTicketOption } from '../../../core/services/parking-api.service';

@Component({
  selector: 'app-parking-tickets',
  imports: [RuntimeStyleDirective, RouterLink, LoaderComponent, TranslatePipe],
  template: `
    <app-loader [visible]="loading()" [message]="'parking.tickets.loading' | translate" />
    <div class="page flow-page">
      <a routerLink="/app/parking" [queryParams]="{ city: query().city }" class="back-link">{{ 'parking.tickets.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.tickets.title' | translate }}</h1>
      <div class="selection-summary card">
        <span class="zone-color" [appRuntimeStyle]="{ background: '#' + query().sectorColor }"></span>
        <div>
          <strong>{{ query().street }}</strong>
          <p>{{ query().zone }} · {{ query().cityName }}</p>
          <small>{{ 'parking.tickets.vehicle' | translate }} {{ query().plate }}</small>
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
              aria-hidden="true"
              [appRuntimeStyle]="{
                background: normalizeSectorColor(tariff.sectorColor || query().sectorColor) || 'var(--color-parking-fallback)',
              }"
            ></div>
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
  styleUrl: './tickets.component.css',
})
export class ParkingTicketsComponent implements OnInit {
  readonly normalizeSectorColor = normalizeSectorColor;
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
