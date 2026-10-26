import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingStreet, StreetsService } from '../../../core/services/streets.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { CitiesService } from '../../../core/services/cities.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-parking-streets',
  imports: [ApiErrorPipe, RouterLink, TranslatePipe, LoaderComponent],
  template: `
    <div class="page">
      <app-loader [visible]="loading()" [message]="'parking.streets.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
      <a [routerLink]="['/app/parking/cities']" [queryParams]="{ city: cityId, cityName, vehicleId, plate }" class="back-link">{{
        'parking.streets.back' | translate
      }}</a>
      <h1 class="page-title">{{ 'parking.selectStreet' | translate }}</h1>
      <div class="selected-city card" aria-live="polite">
        <small>{{ 'parking.cities.selected' | translate }}</small>
        <strong>{{ selectedCityName }}</strong>
      </div>
      @if (dataSource() === 'error') {
        <div class="data-notice" role="alert">
          <span>{{ requestError() | apiError: 'parking.streets.loadError' }}</span>
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
  styleUrl: './streets.component.css',
})
export class ParkingStreetsComponent implements OnInit {
  readonly requestError = signal<unknown>(null);
  private readonly route = inject(ActivatedRoute);
  private readonly streetsService = inject(StreetsService);
  private readonly citiesService = inject(CitiesService);
  private readonly flowStore = inject(ParkingFlowStore);
  readonly streets = signal<ParkingStreet[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly dataSource = signal<'loading' | 'remote' | 'error'>('loading');
  get cityId(): string {
    return (
      this.route.snapshot.queryParamMap.get('city') ??
      this.route.snapshot.queryParamMap.get('municipio') ??
      this.flowStore.vm().city ??
      this.flowStore.vm().cityId ??
      ''
    );
  }
  get cityName(): string {
    return this.route.snapshot.queryParamMap.get('cityName') ?? this.flowStore.vm().cityName ?? '';
  }
  get selectedCityName(): string {
    return this.cityName;
  }
  get plate(): string {
    return this.flowStore.vm().plate ?? this.route.snapshot.queryParamMap.get('plate') ?? '';
  }
  get vehicleId(): string {
    return this.flowStore.vm().vehicleId ?? this.route.snapshot.queryParamMap.get('vehicleId') ?? '';
  }
  readonly filteredStreets = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('es');
    return term
      ? this.streets().filter(
          (street) => street.name.toLocaleLowerCase('es').includes(term) || street.zoneDescription.toLocaleLowerCase('es').includes(term),
        )
      : this.streets();
  });

  async ngOnInit(): Promise<void> {
    if (this.cityId || this.cityName) {
      this.flowStore.update({
        city: this.cityId,
        cityId: String(this.citiesService.contractIdFor(this.cityId) || ''),
        cityName: this.cityName,
      });
    }
    await this.loadStreets();
  }

  async loadStreets(): Promise<void> {
    const contractId = this.citiesService.contractIdFor(this.cityId);
    this.requestError.set(null);
    this.loading.set(true);
    this.dataSource.set('loading');
    try {
      const result = await this.streetsService.getStreets(contractId);
      this.streets.set(result.data);
      this.dataSource.set('remote');
    } catch (error) {
      this.requestError.set(error);
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
      selectionOrigin: 'streets',
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
}
