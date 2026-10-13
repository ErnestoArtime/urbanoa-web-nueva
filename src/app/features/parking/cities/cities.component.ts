import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { CitiesService, ParkingMunicipio } from '../../../core/services/cities.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

const EMPTY_CITY: ParkingMunicipio = {
  id: '',
  nombre: '',
  provincia: '',
  zonas: 0,
  imagen: '',
  contractId: 0,
  description1: '',
  address: '',
  email: '',
  imagePath: '',
  longitude: 0,
  latitude: 0,
  phone: '',
  radius: '',
  zones: [],
};

@Component({
  selector: 'app-parking-cities',
  imports: [RouterLink, TranslatePipe, LoaderComponent],
  template: `
    <div class="page has-sticky-actions">
      <app-loader
        [visible]="dataSource() === 'loading'"
        [message]="'parking.cities.loading' | translate"
        imageSrc="/assets/brand/login-logo.jpg"
      />
      <h1 class="page-title">{{ 'parking.selectMunicipio' | translate }}</h1>
      @if (dataSource() === 'error') {
        <p class="data-notice" role="alert">{{ 'parking.cities.loadError' | translate }}</p>
      }
      <label class="municipio-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          [placeholder]="'parking.cities.searchPlaceholder' | translate"
          [value]="search()"
          (input)="updateSearch($event)"
        />
      </label>
      <div class="municipios-layout mt-2">
        <div class="municipios-panel">
          <div class="municipios-grid">
            @for (m of filteredMunicipios(); track m.id) {
              <button type="button" class="municipio-card" [class.active]="selected().id === m.id" (click)="selectCity(m)">
                <div class="municipio-img">
                  @if (m.imagePath || m.imagen) {
                    <img [src]="'assets/municipios/' + m.imagen" [alt]="'parking.cities.viewOf' | translate: { name: m.nombre }" />
                  }
                  <span class="municipio-map-label">{{ m.nombre }}</span>
                </div>
                <div class="municipio-body">
                  <p class="municipio-name">{{ m.nombre }}</p>
                  <p class="municipio-provincia">{{ m.provincia }}</p>
                  <p class="municipio-zonas">{{ m.zonas }} {{ 'parking.zones' | translate }}</p>
                </div>
              </button>
            } @empty {
              <p class="empty-result">{{ 'parking.cities.empty' | translate }}</p>
            }
          </div>
        </div>
        <aside class="municipio-detail">
          <span class="detail-kicker">{{ 'parking.cities.selected' | translate }}</span>
          <h2>{{ selected().nombre }}</h2>
          <p>{{ 'parking.cities.zonesLabel' | translate: { count: '' + selected().zonas } }}</p>
          <h3>{{ 'parking.cities.streetsTitle' | translate }}</h3>
          <ul>
            @for (zone of selected().zones; track zone.id) {
              <li>
                <span>{{ zone.name }}</span
                ><strong>{{ 'parking.zones' | translate }}</strong>
              </li>
            } @empty {
              <li>
                <span>{{ 'parking.cities.noZones' | translate }}</span>
              </li>
            }
          </ul>
          <div class="sticky-actions">
            <a
              routerLink="/app/parking"
              [queryParams]="{
                city: selected().id,
                cityId: selected().contractId,
                cityName: selected().nombre,
                vehicleId: vehicleId,
                plate: vehiclePlate,
              }"
              class="btn btn-primary btn-block"
              >{{ 'parking.cities.viewMap' | translate }}</a
            >
            <a
              routerLink="/app/parking/streets"
              [queryParams]="{
                municipio: selected().id,
                city: selected().id,
                cityId: selected().contractId,
                cityName: selected().nombre,
                vehicleId: vehicleId,
                plate: vehiclePlate,
              }"
              class="btn btn-secondary btn-block"
              >{{ 'parking.cities.viewStreets' | translate }}</a
            >
          </div>
        </aside>
      </div>
    </div>
  `,
  styleUrl: './cities.component.css',
  standalone: true,
})
export class ParkingCitiesComponent implements OnInit {
  private readonly locationSettings = inject(LocationSettingsService);
  private readonly citiesService = inject(CitiesService);
  readonly flowStore = inject(ParkingFlowStore);
  readonly route = inject(ActivatedRoute);
  get vehicleId(): string {
    return this.flowStore.vm().vehicleId ?? this.route.snapshot.queryParamMap.get('vehicleId') ?? '';
  }
  get vehiclePlate(): string {
    return this.flowStore.vm().plate ?? this.route.snapshot.queryParamMap.get('plate') ?? '';
  }
  readonly municipios = signal<ParkingMunicipio[]>([]);
  readonly selected = signal(this.defaultCity());
  readonly dataSource = signal<'loading' | 'remote' | 'error'>('loading');

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.citiesService.getCities();
      this.municipios.set(this.citiesService.selectableCities(result.data));
      this.dataSource.set('remote');
      this.selected.set(this.defaultCity());
    } catch {
      this.municipios.set([]);
      this.dataSource.set('error');
    }
  }

  selectCity(city: ParkingMunicipio): void {
    this.selected.set(city);
    this.flowStore.update({ city: city.id, cityId: String(city.contractId), cityName: city.nombre });
  }

  private currentCityMatch(): ParkingMunicipio | null {
    const params = this.route.snapshot.queryParamMap;
    const store = this.flowStore.vm();
    const id = params.get('city') ?? params.get('municipio') ?? store.city ?? '';
    const contractId = params.get('cityId') ?? store.cityId ?? '';
    const name = params.get('cityName') ?? store.cityName ?? '';
    if (!id && !contractId && !name) return null;
    return (
      this.municipios().find(
        (m) => (id && m.id === id) || (contractId && String(m.contractId) === contractId) || (name && m.nombre === name),
      ) ?? null
    );
  }

  private defaultCity(): ParkingMunicipio {
    const current = this.currentCityMatch();
    if (current) return current;
    const preferredId = this.locationSettings.settings().preferredCityId;
    const preferredContractId = this.locationSettings.settings().preferredContractId;
    if (preferredId) {
      const match = this.municipios().find(
        (m) => m.contractId === preferredContractId || m.id === preferredId || String(m.contractId) === preferredId,
      );
      if (match) return match;
    }
    return this.municipios()[0] ?? EMPTY_CITY;
  }

  readonly search = signal('');
  readonly filteredMunicipios = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('es');
    if (!query) return this.municipios();
    return this.municipios().filter((municipio) => `${municipio.nombre} ${municipio.provincia}`.toLocaleLowerCase('es').includes(query));
  });

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
