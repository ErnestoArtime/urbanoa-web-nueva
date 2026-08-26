import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { CitiesService, ParkingMunicipio } from '../../../core/services/cities.service';

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
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page has-sticky-actions">
      <h1 class="page-title">{{ 'parking.selectMunicipio' | translate }}</h1>
      @if (dataSource() === 'error') {
        <p class="data-notice" role="alert">No se pudieron cargar los municipios.</p>
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
        <div class="municipios-grid">
          @for (m of filteredMunicipios(); track m.id) {
            <button type="button" class="municipio-card" [class.active]="selected().id === m.id"
                    (click)="selected.set(m)">
              <div class="municipio-img">
                @if (m.imagen) {
                  <img [src]="'assets/municipios/' + m.imagen"
                       [alt]="'parking.cities.viewOf' | translate: { name: m.nombre }" />
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
        <aside class="municipio-detail">
          <span class="detail-kicker">{{ 'parking.cities.selected' | translate }}</span>
          <h2>{{ selected().nombre }}</h2>
          <p>{{ 'parking.cities.zonesLabel' | translate: { count: '' + selected().zonas } }}</p>
          <h3>{{ 'parking.cities.streetsTitle' | translate }}</h3>
          <ul>
            @for (zone of selected().zones; track zone.id) {
              <li><span>{{ zone.name }}</span><strong>{{ 'parking.zones' | translate }}</strong></li>
            } @empty {
              <li><span>{{ 'parking.cities.noZones' | translate }}</span></li>
            }
          </ul>
          <div class="sticky-actions">
            <a
              routerLink="/app/parking"
              [queryParams]="{ city: selected().id, cityId: selected().contractId, cityName: selected().nombre, vehicleId: vehicleId, plate: vehiclePlate }"
              class="btn btn-primary btn-block"
            >{{ 'parking.cities.viewMap' | translate }}</a
            >
            <a
              routerLink="/app/parking/streets"
              [queryParams]="{ municipio: selected().id, vehicleId: vehicleId, plate: vehiclePlate }"
              class="btn btn-secondary btn-block"
            >{{ 'parking.cities.viewStreets' | translate }}</a
            >
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .municipios-layout {
        display: grid;
        gap: 1rem;
      }

      .data-notice {
        margin: 0.75rem 0 0;
        padding: 0.75rem 0.9rem;
        border: 1px solid #e5b85c;
        border-radius: var(--radius-md);
        background: #fff8e7;
        color: #714b00;
      }

      .municipio-search {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        width: min(100%, 520px);
        margin-top: 1rem;
        padding: 0.7rem 0.9rem;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: var(--color-surface);
        color: var(--color-primary);
      }

      .municipio-search:focus-within {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(43, 103, 103, 0.12);
      }

      .municipio-search input {
        width: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--color-text);
        font: inherit;
      }

      .municipios-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .municipio-card {
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius, 12px);
        background: var(--color-surface);
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: box-shadow 0.2s;
      }

      .municipio-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .municipio-card.active {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(43, 103, 103, 0.12);
      }

      .municipio-img {
        display: flex;
        position: relative;
        align-items: center;
        justify-content: center;
        min-height: 100px;
        overflow: hidden;
        background: linear-gradient(145deg, #dce9df, #cbdedb);
      }

      .municipio-img img {
        width: 100%;
        height: 118px;
        object-fit: cover;
        filter: saturate(0.72) contrast(0.94);
      }

      .municipio-map-label {
        position: absolute;
        left: 0.6rem;
        bottom: 0.55rem;
        padding: 0.2rem 0.45rem;
        border-radius: 4px;
        background: rgba(249, 250, 239, 0.9);
        color: var(--color-primary-dark);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
      }

      .municipio-body {
        padding: 0.75rem;
      }

      .municipio-name {
        margin: 0;
        font-size: var(--text-base);
        font-weight: var(--font-bold);
      }

      .municipio-provincia {
        margin: 0.125rem 0 0;
        color: var(--color-muted, #6b7280);
        font-size: var(--text-sm);
      }

      .municipio-zonas {
        margin: 0.25rem 0 0;
        color: var(--color-primary);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
      }

      .municipio-detail {
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }

      .detail-kicker {
        color: var(--color-primary);
        font-size: var(--text-2xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .municipio-detail h2 {
        margin: 0.2rem 0;
        font-size: var(--text-xl);
      }

      .municipio-detail > p {
        color: var(--color-text-muted);
      }

      .municipio-detail h3 {
        margin: 1.2rem 0 0.4rem;
        font-size: var(--text-sm);
      }

      .municipio-detail ul {
        margin: 0 0 1rem;
        padding: 0;
        list-style: none;
      }

      .municipio-detail li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 0;
        border-bottom: 1px solid var(--color-border);
        font-size: var(--text-sm);
      }

      .municipio-detail li strong {
        color: var(--color-primary);
      }

      .municipio-detail .btn + .btn {
        margin-top: 0.65rem;
      }

      .empty-result {
        grid-column: 1/-1;
        padding: 2rem;
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
        text-align: center;
      }

      @media (min-width: 640px) {
        .municipios-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .municipios-layout {
          grid-template-columns: minmax(0, 1fr) 320px;
          align-items: start;
        }

        .municipio-detail {
          position: sticky;
          top: 1rem;
        }

        .sticky-actions {
          display: grid;
          gap: 0.65rem;
        }
      }
    `,
  ],
  standalone: true,
})
export class ParkingCitiesComponent implements OnInit {
  private readonly locationSettings = inject(LocationSettingsService);
  private readonly citiesService = inject(CitiesService);
  readonly flowStore = inject(ParkingFlowStore);
  readonly route = inject(ActivatedRoute);
  readonly vehicleId = this.route.snapshot.queryParamMap.get('vehicleId') ?? this.flowStore.vm().vehicleId ?? '';
  readonly vehiclePlate = this.route.snapshot.queryParamMap.get('plate') ?? this.flowStore.vm().plate ?? '';
  readonly municipios = signal<ParkingMunicipio[]>([]);
  readonly selected = signal(this.defaultCity());
  readonly dataSource = signal<'loading' | 'remote' | 'error'>('loading');

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.citiesService.getCities();
      this.municipios.set(result.data);
      this.dataSource.set('remote');
      this.selected.set(this.defaultCity());
    } catch {
      this.municipios.set([]);
      this.dataSource.set('error');
    }
  }

  private defaultCity(): ParkingMunicipio {
    const preferredId = this.locationSettings.settings().preferredCityId;
    if (preferredId) {
      const match = this.municipios().find((m) => m.id === preferredId);
      if (match) return match;
    }
    return this.municipios().find((city) => city.id === 'zarautz') ?? this.municipios()[0] ?? EMPTY_CITY;
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
