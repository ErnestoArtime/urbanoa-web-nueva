import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingStreet, StreetsService } from '../../../core/services/streets.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { CitiesService } from '../../../core/services/cities.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-parking-streets',
  imports: [RouterLink, TranslatePipe, LoaderComponent],
  template: `
    <div class="page">
      <app-loader [visible]="loading()" [message]="'parking.streets.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
      <a [routerLink]="['/app/parking/city-info']" [queryParams]="{ id: cityId }" class="back-link">{{
        'parking.streets.back' | translate
      }}</a>
      <h1 class="page-title">{{ 'parking.selectStreet' | translate }}</h1>
      <div class="selected-city card" aria-live="polite">
        <small>{{ 'parking.cities.selected' | translate }}</small>
        <strong>{{ selectedCityName }}</strong>
      </div>
      @if (dataSource() === 'error') {
        <div class="data-notice" role="alert">
          <span>{{ 'parking.streets.loadError' | translate }}</span>
          <button type="button" class="btn btn-secondary btn-sm" (click)="loadStreets()">{{ 'common.retry' | translate }}</button>
        </div>
      }
      <div class="form-group">
        <input
          class="form-input"
          type="search"
          [placeholder]="'parking.selectStreet' | translate"
          [value]="search()"
          (input)="updateSearch($event)"
        />
      </div>
      <ul class="list card streets-list">
        @for (street of filteredStreets(); track street.id) {
          <a [routerLink]="['/app/parking/tickets']" [queryParams]="streetParams(street)" class="list-item">
            <span class="street-icon" aria-hidden="true"><i></i></span>
            <div class="list-item-content">
              <div class="list-item-title">{{ street.name }}</div>
              <div class="list-item-subtitle">{{ street.zoneDescription }}{{ street.tariff ? ' · ' + street.tariff : '' }}</div>
            </div>
            <span class="list-item-chevron">›</span>
          </a>
        } @empty {
          @if (!loading() && dataSource() !== 'error') {
            <li class="list-item empty-streets">{{ 'parking.streets.empty' | translate }}</li>
          }
        }
      </ul>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
      }
      .selected-city {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        margin: 0.75rem 0 1rem;
        border-left: 4px solid var(--color-primary);
      }
      .selected-city small {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .selected-city strong {
        color: var(--color-primary-dark);
        font-size: var(--text-lg);
      }
      .street-icon {
        position: relative;
        width: 28px;
        height: 30px;
        flex: 0 0 28px;
        border-left: 3px solid currentColor;
        border-right: 3px solid currentColor;
        color: var(--color-text-muted);
      }
      .street-icon::before,
      .street-icon::after,
      .street-icon i {
        content: '';
        position: absolute;
        left: 50%;
        width: 3px;
        height: 6px;
        background: currentColor;
        transform: translateX(-50%);
      }
      .street-icon::before {
        top: 0;
      }
      .street-icon i {
        top: 12px;
      }
      .street-icon::after {
        bottom: 0;
      }
      .empty-streets {
        justify-content: center;
        color: var(--color-text-muted);
      }
      .data-notice {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin: 0 0 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid #e5b85c;
        border-radius: var(--radius-md);
        background: #fff8e7;
        color: #714b00;
      }
      @media (min-width: 1024px) {
        .page {
          display: flex;
          flex-direction: column;
        }
        .streets-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          box-sizing: border-box;
        }
      }
    `,
  ],
})
export class ParkingStreetsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly streetsService = inject(StreetsService);
  private readonly citiesService = inject(CitiesService);
  private readonly flowStore = inject(ParkingFlowStore);
  readonly streets = signal<ParkingStreet[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly dataSource = signal<'loading' | 'remote' | 'error'>('loading');
  readonly cityId = this.route.snapshot.queryParamMap.get('city') ?? this.route.snapshot.queryParamMap.get('municipio') ?? '';
  readonly cityName = this.route.snapshot.queryParamMap.get('cityName') ?? '';
  readonly selectedCityName = this.cityName || this.cityLabel(this.cityId);
  readonly plate = this.route.snapshot.queryParamMap.get('plate') ?? this.flowStore.vm().plate ?? '';
  readonly vehicleId = this.route.snapshot.queryParamMap.get('vehicleId') ?? this.flowStore.vm().vehicleId ?? '';
  readonly filteredStreets = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('es');
    return term
      ? this.streets().filter(
          (street) => street.name.toLocaleLowerCase('es').includes(term) || street.zoneDescription.toLocaleLowerCase('es').includes(term),
        )
      : this.streets();
  });

  async ngOnInit(): Promise<void> {
    await this.loadStreets();
  }

  async loadStreets(): Promise<void> {
    const contractId = this.citiesService.contractIdFor(this.cityId);
    this.loading.set(true);
    this.dataSource.set('loading');
    try {
      const result = await this.streetsService.getStreets(contractId);
      this.streets.set(result.data);
      this.dataSource.set('remote');
    } catch {
      this.streets.set([]);
      this.dataSource.set('error');
    } finally {
      this.loading.set(false);
    }
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  streetParams(street: ParkingStreet): Record<string, string> {
    return {
      city: this.cityId,
      cityName: this.selectedCityName,
      cityId: String(this.citiesService.contractIdFor(this.cityId)),
      plate: this.plate,
      vehicleId: this.vehicleId,
      zoneId: String(street.zoneId),
      zone: street.zoneDescription,
      street: street.name,
      streetId: String(street.id),
      sector: street.zoneDescription,
      sectorColor: '',
      sectorId: String(street.zoneId),
      ticketId: '',
      latitude: this.route.snapshot.queryParamMap.get('latitude') ?? '',
      longitude: this.route.snapshot.queryParamMap.get('longitude') ?? '',
    };
  }

  private cityLabel(identifier: string): string {
    const labels: Record<string, string> = {
      '1': 'Durango',
      '3': 'Zarautz',
      '5': 'Tolosa',
      '23': 'Bergara',
      '61': 'Arrasate',
      '73': 'Soria',
      '79': 'Deba',
      '81': 'Mutriku',
      arrasate: 'Arrasate',
      bergara: 'Bergara',
      deba: 'Deba',
      durango: 'Durango',
      mutriku: 'Mutriku',
      soria: 'Soria',
      tolosa: 'Tolosa',
      zarautz: 'Zarautz',
    };
    return labels[identifier.toLocaleLowerCase('es')] ?? identifier;
  }
}
