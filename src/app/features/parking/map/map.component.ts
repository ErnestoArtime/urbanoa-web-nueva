import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { LucideStar } from '@lucide/angular';
import type { Vehicle } from '../../../shared/models/vehicle';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { VehicleService } from '../../../core/services/vehicle.service';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import { MapLocationControlComponent, type MapLocationState } from './map-location-control.component';
import { CitiesService, type ParkingMunicipio } from '../../../core/services/cities.service';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { StreetsService } from '../../../core/services/streets.service';

interface MapParkingZone {
  zoneId: number;
  streetId?: number;
  sectorId?: number;
  name: string;
  street: string;
  color: string;
  points: L.LatLngTuple[];
  layer: L.Polygon;
}

@Component({
  selector: 'app-parking-map',
  imports: [RouterLink, LoaderComponent, TranslatePipe, MapLocationControlComponent, LucideStar],
  template: `
    <app-loader [visible]="mapLoading()" [message]="'parking.map.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
    <section class="parking-map-page">
      <header class="map-heading">
        <div>
          <p>{{ 'parking.map.kicker' | translate }}</p>
          <h1>{{ 'parking.map.title' | translate }}</h1>
          <span>{{ 'parking.map.subtitle' | translate }}</span>
        </div>
        <a routerLink="/app/parking/cities" class="btn btn-secondary">{{ 'parking.map.searchMunicipio' | translate }}</a>
      </header>
      @if (flowError()) {
        <p class="flow-warning">{{ 'parking.flow.missingData' | translate }}</p>
      }

      <div class="map-frame">
        <div #mapContainer class="leaflet-map" [attr.aria-label]="'parking.map.ariaLabel' | translate"></div>
        <div class="map-target" aria-hidden="true"><span></span></div>
        <app-map-location-control [state]="locationState()" (locate)="locateUser()" />

        <section class="parking-controls">
          <a routerLink="/app/parking/cities" [queryParams]="vehicleQueryParams()" class="search-control"
            ><span>⌕</span
            ><span
              ><small>{{ 'parking.map.municipio' | translate }}</small
              ><strong>{{ selected.nombre }}</strong></span
            ><b>›</b></a
          >

          <div class="vehicle-control-wrapper" [class.selector-open]="showVehicleSelector()">
            <button type="button" class="vehicle-control" [disabled]="!hasAvailableVehicles()" (click)="toggleVehicleSelector()">
              <span>▣</span>
              <span
                ><small>{{ 'parking.map.vehicle' | translate }}</small
                ><strong>{{ selectedVehicle()?.plate ?? ('parking.map.noVehicles' | translate) }}</strong></span
              >
              <b>▼</b>
            </button>

            @if (hasAvailableVehicles()) {
              <div class="vehicle-selector-dropdown" [class.is-open]="showVehicleSelector()" role="listbox">
                @for (v of vehicles(); track v.id) {
                  <button
                    type="button"
                    class="vehicle-option"
                    [class.selected]="v === selectedVehicle()"
                    [class.parked]="isParkedIn(v)"
                    [disabled]="isParkedIn(v)"
                    (click)="selectVehicle(v)"
                  >
                    <span>{{ v.plate }}</span>
                    <span class="vehicle-label">{{ translateLabel(v.label) }}</span>
                    @if (isParkedIn(v)) {
                      <span class="badge badge-warning">{{ 'account.vehicle.alreadyParked' | translate }}</span>
                    } @else if (v.isDefault) {
                      <span class="badge badge-primary"><svg lucideStar size="12" strokeWidth="2.5"></svg></span>
                    }
                  </button>
                }
              </div>
            }
          </div>

          @if (selectedZone(); as zone) {
            <div class="selected-zone">
              <span [style.background]="'#' + zone.color"></span>
              <div>
                <small>{{ 'parking.map.selectedZone' | translate }}</small
                ><strong>{{ zone.street }}</strong
                ><em>{{ zone.name }}</em>
              </div>
            </div>
          } @else {
            <p class="select-hint">{{ 'parking.map.selectHint' | translate }}</p>
          }
          <button type="button" class="btn btn-primary btn-block" [disabled]="!canStartParking()" (click)="startParking()">
            {{ 'parking.map.parkHere' | translate }}
          </button>
          @if (!hasAvailableVehicles()) {
            <p class="flow-warning">{{ 'parking.map.noVehiclesAvailable' | translate }}</p>
          }
        </section>

        <div class="map-status" [class.error]="mapError()">
          @if (mapLoading()) {
            {{ 'parking.map.loadingZones' | translate: { city: selected.nombre } }}
          } @else if (mapError()) {
            {{ 'parking.map.errorZones' | translate }}
          } @else {
            {{ 'parking.map.zonesCount' | translate: { count: '' + zoneCount(), city: selected.nombre } }}
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .parking-map-page {
        min-height: 100%;
        padding: 1rem;
      }
      .map-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .map-heading p {
        color: var(--color-primary);
        font-size: var(--text-2xs);
        font-weight: var(--font-extra);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .map-heading h1 {
        margin: 0.15rem 0;
        font-size: var(--text-2xl);
      }
      .map-heading span {
        color: var(--color-text-muted);
      }
      .flow-warning {
        margin: 0.75rem 0 0;
        padding: 0.65rem 0.8rem;
        border: 1px solid var(--color-warning);
        border-radius: var(--radius-sm);
        background: #fff7e8;
        color: var(--color-warning);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
      }

      .map-frame {
        position: relative;
        min-height: 540px;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: #dce7dc;
      }
      .leaflet-map {
        width: 100%;
        min-height: 540px;
      }
      .parking-controls {
        position: absolute;
        z-index: 500;
        top: 1rem;
        left: 1rem;
        display: grid;
        gap: 0.5rem;
        width: min(330px, calc(100% - 2rem));
        padding: 0.8rem;
        border-radius: 20px;
        background: rgba(249, 250, 239, 0.96);
        box-shadow: var(--shadow-md);
      }
      .vehicle-control-wrapper {
        position: relative;
      }
      .search-control {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        min-height: 52px;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--color-border);
        border-radius: 15px;
        background: #fff;
        color: inherit;
        width: 100%;
        text-align: left;
      }
      .vehicle-control {
        width: 100%;
        border: 0;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        min-height: 52px;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--color-border);
        border-radius: 15px;
        background: #fff;
        color: inherit;
        cursor: pointer;
        width: 100%;
        text-align: left;
      }
      .vehicle-control b {
        transition: transform 180ms ease;
      }
      .vehicle-control-wrapper.selector-open .vehicle-control b {
        transform: rotate(180deg);
      }
      .search-control > span:nth-child(2),
      .vehicle-control > span:nth-child(2) {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }
      .search-control small,
      .vehicle-control small {
        color: var(--color-text-muted);
        line-height: var(--line-tight);
      }
      .search-control strong,
      .vehicle-control strong {
        line-height: var(--line-tight);
      }
      .search-control b,
      .vehicle-control b {
        flex-shrink: 0;
      }
      .vehicle-selector-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 0.5rem;
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
        transition:
          max-height 180ms ease,
          opacity 140ms ease;
      }
      .vehicle-selector-dropdown.is-open {
        max-height: 18rem;
        opacity: 1;
        pointer-events: auto;
      }
      .vehicle-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        background: #fff;
        text-align: left;
        cursor: pointer;
        transition: background 150ms ease;
      }
      .vehicle-option:hover {
        background: var(--color-background);
      }
      .vehicle-option.selected {
        background: rgba(93, 154, 150, 0.1);
      }
      .vehicle-option span:first-child {
        font-weight: var(--font-medium);
        font-size: var(--text-base);
      }
      .vehicle-label {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .vehicle-option .badge {
        flex-shrink: 0;
      }
      @media (max-width: 600px) {
        .vehicle-selector-dropdown {
          top: auto;
          bottom: 100%;
          margin-top: 0;
          margin-bottom: 0.35rem;
          left: -0.5rem;
          right: -0.5rem;
        }
      }
      .map-target {
        position: absolute;
        z-index: 450;
        top: 50%;
        left: 50%;
        width: 30px;
        height: 38px;
        transform: translate(-50%, -100%);
        pointer-events: none;
      }
      .map-target::before {
        content: '';
        position: absolute;
        left: 6px;
        top: 0;
        width: 18px;
        height: 18px;
        border: 4px solid #fff;
        border-radius: 50% 50% 50% 0;
        background: var(--color-primary);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
        transform: rotate(-45deg);
      }
      .map-target span {
        position: absolute;
        left: 12px;
        top: 6px;
        z-index: 1;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #fff;
      }
      .selected-zone {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0.7rem;
        border-radius: 12px;
        background: #fff;
      }
      .selected-zone > span {
        width: 8px;
        align-self: stretch;
        border-radius: 999px;
      }
      .selected-zone div {
        display: flex;
        min-width: 0;
        flex-direction: column;
      }
      .selected-zone small,
      .selected-zone em {
        overflow: hidden;
        color: var(--color-text-muted);
        font-size: var(--text-2xs);
        font-style: normal;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .selected-zone strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .select-hint {
        padding: 0.25rem 0.4rem;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        text-align: center;
      }
      .btn:disabled,
      .vehicle-control:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .map-status {
        position: absolute;
        z-index: 500;
        right: 1rem;
        bottom: 1rem;
        padding: 0.45rem 0.7rem;
        border-radius: 999px;
        background: rgba(249, 250, 239, 0.94);
        color: var(--color-primary-dark);
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
        box-shadow: var(--shadow-sm);
      }
      .map-status.error {
        color: var(--color-error);
      }
      :host ::ng-deep .leaflet-popup-content {
        margin: 0.7rem 0.85rem;
      }
      :host ::ng-deep .zone-popup strong {
        color: var(--color-primary-dark);
      }
      @media (min-width: 900px) {
        .parking-map-page,
        .map-frame,
        .leaflet-map {
          height: calc(100dvh - 34px);
          min-height: 100%;
        }
        .parking-map-page {
          padding: 0;
        }
        .map-heading {
          display: none;
        }
        .flow-warning {
          margin: 0.75rem 0 0;
          padding: 0.65rem 0.8rem;
          border: 1px solid var(--color-warning);
          border-radius: var(--radius-sm);
          background: #fff7e8;
          color: var(--color-warning);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
        }

        .map-frame {
          border: 0;
          border-radius: 0;
        }
        .parking-controls {
          top: 3rem;
          left: 3rem;
        }
        :host-context(app-parking-wizard-layout) .parking-map-page,
        :host-context(app-parking-wizard-layout) .map-frame,
        :host-context(app-parking-wizard-layout) .leaflet-map {
          height: 100%;
          min-height: 100%;
        }
        :host-context(app-parking-wizard-layout) .parking-controls {
          top: 1rem;
          left: 1rem;
        }
      }
      @media (max-width: 600px) {
        .parking-map-page {
          padding: 0.65rem;
          padding-bottom: 14rem;
        }
        .map-heading {
          align-items: start;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.65rem;
        }
        .map-heading h1 {
          font-size: var(--text-lg);
        }
        .map-heading p {
          margin: 0;
          font-size: var(--text-2xs);
        }
        .map-heading span {
          font-size: var(--text-xs);
        }
        .map-heading .btn {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: var(--text-sm);
        }
        .map-frame,
        .leaflet-map {
          min-height: 320px;
        }
        .parking-controls {
          position: fixed;
          z-index: 1000;
          top: auto;
          left: 0;
          bottom: 58px;
          width: 100%;
          padding: 0.65rem 0.75rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
          gap: 0.4rem;
          border-radius: 20px 20px 0 0;
          background: rgba(249, 250, 239, 0.98);
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
        }
        .parking-controls .search-control,
        .parking-controls .vehicle-control {
          width: 100%;
          border: 0;
          text-align: left;
          min-height: 44px;
          padding: 0.45rem 0.7rem;
        }
        .parking-controls .btn {
          padding: 0.65rem;
          font-size: var(--text-md);
        }
        .map-status {
          right: 0.5rem;
          bottom: 0.5rem;
          font-size: var(--text-2xs);
          padding: 0.35rem 0.55rem;
        }
      }
    `,
  ],
})
export class ParkingMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) private readonly mapContainer!: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  private readonly vehicleService = inject(VehicleService);
  private readonly locationSettings = inject(LocationSettingsService);
  private readonly translationService = inject(TranslationService);
  private readonly citiesService = inject(CitiesService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly streetsService = inject(StreetsService);
  private readonly streetIdByZone = new Map<number, number>();
  private readonly query: ParkingFlowQuery = readParkingFlowQuery(this.route);
  private map?: L.Map;
  private zoneLayer?: L.FeatureGroup;
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private locationMarker?: L.CircleMarker;
  private readonly zones: MapParkingZone[] = [];
  private highlightedZone?: MapParkingZone;
  private readonly selectedState = signal<ParkingMunicipio>(EMPTY_CITY);
  get selected(): ParkingMunicipio { return this.selectedState(); }
  readonly mapLoading = signal(true);
  readonly flowError = signal(this.route.snapshot.queryParamMap.get('flowError') === 'missingData');
  readonly mapError = signal(false);
  readonly locationState = signal<MapLocationState>('idle');
  readonly zoneCount = signal(0);
  readonly selectedZone = signal<MapParkingZone | null>(null);
  readonly vehicles = this.vehicleService.vehicles;
  private readonly parkingSessionService = inject(ParkingSessionService);
  readonly isParkedIn = (vehicle: Vehicle) => this.parkingSessionService.isVehicleParked(vehicle.id);

  translateLabel(value?: string): string {
    return this.translationService.translateLabel(value);
  }
  readonly availableVehicles = computed(() => this.vehicles().filter((vehicle) => !this.isParkedIn(vehicle)));
  readonly hasAvailableVehicles = computed(() => this.availableVehicles().length > 0);
  readonly selectedVehicle = signal<Vehicle | null>(
    this.availableVehicles().find((vehicle) => vehicle.id === this.query.vehicleId || vehicle.plate === this.query.plate) ??
      this.availableVehicles()[0] ??
      null,
  );
  readonly canStartParking = computed(() => {
    const zone = this.selectedZone();
    const vehicle = this.selectedVehicle();
    return Boolean(zone?.sectorId && vehicle && !this.isParkedIn(vehicle));
  });
  readonly showVehicleSelector = signal(false);

  toggleVehicleSelector(): void {
    if (!this.hasAvailableVehicles()) return;
    this.showVehicleSelector.update((value) => !value);
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.store.update({ vehicleId: vehicle.id, plate: vehicle.plate });
    this.showVehicleSelector.set(false);
  }

  vehicleQueryParams(): Record<string, string> {
    const vehicle = this.selectedVehicle();
    return vehicle ? { vehicleId: vehicle.id, plate: vehicle.plate } : {};
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.vehicleService.load();
      const { data } = await this.citiesService.getCities();
      const requestedContractId = Number(this.query.cityId);
      const preferredId = this.locationSettings.settings().preferredCityId;
      const selected =
        data.find((city) => city.contractId === requestedContractId) ??
        data.find((city) => city.id === this.query.city) ??
        data.find((city) => city.id === preferredId) ??
        data[0];
      if (!selected) throw new Error('No hay contratos de aparcamiento disponibles');
      this.selectedState.set(selected);
      await this.parkingSessionService.loadParkingStatuses(this.vehicles(), selected.contractId);
      this.selectedVehicle.set(
        this.availableVehicles().find((vehicle) => vehicle.id === this.query.vehicleId || vehicle.plate === this.query.plate) ??
          this.availableVehicles()[0] ??
          null,
      );
    } catch {
      this.mapError.set(true);
      this.mapLoading.set(false);
      return;
    }
    const vehicle = this.selectedVehicle();
    if (vehicle) this.store.update({ vehicleId: vehicle.id, plate: vehicle.plate });
    this.map = L.map(this.mapContainer.nativeElement, { zoomControl: false }).setView(this.cityCenter(), 15);
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.resizeObserver = new ResizeObserver(() => this.scheduleMapResize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
    this.map.on('moveend', () => this.selectZoneAtMapCenter());
    this.scheduleMapResize();
    void this.loadRealZones();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.map?.remove();
  }

  async locateUser(): Promise<void> {
    if (this.locationState() === 'locating') return;
    this.locationState.set('locating');
    const result = await this.locationSettings.requestCurrentLocation();
    if (!result.ok) {
      this.locationState.set(result.status === 'denied' ? 'denied' : 'unavailable');
      return;
    }
    const { lastLatitude, lastLongitude } = this.locationSettings.settings();
    if (lastLatitude === undefined || lastLongitude === undefined || !this.map) {
      this.locationState.set('unavailable');
      return;
    }
    const point: L.LatLngExpression = [lastLatitude, lastLongitude];
    this.locationMarker?.remove();
    this.locationMarker = L.circleMarker(point, { radius: 9, color: '#fff', weight: 3, fillColor: '#16765d', fillOpacity: 1 }).addTo(
      this.map,
    );
    this.map.flyTo(point, 17, { duration: 0.8 });
    this.locationState.set('located');
  }

  private scheduleMapResize(): void {
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.map?.invalidateSize({ pan: false });
    });
  }

  startParking(): void {
    const zone = this.selectedZone();
    const center = this.map?.getCenter();
    const vehicle = this.selectedVehicle();
    if (!zone || !center || !vehicle || !this.canStartParking()) return;
    this.store.update({
      city: this.selected.id,
      cityId: String(this.selected.contractId),
      cityName: this.selected.nombre,
      plate: vehicle.plate,
      vehicleId: vehicle.id,
      zoneId: String(zone.zoneId),
      streetId: String(zone.streetId ?? this.streetIdByZone.get(zone.zoneId) ?? 0),
      zoneName: zone.name,
        sectorId: String(zone.sectorId),
      sectorName: zone.name,
      street: zone.street,
      sectorColor: zone.color,
      latitude: center.lat.toFixed(7),
      longitude: center.lng.toFixed(7),
    });
    void this.router.navigate(['/app/parking/tickets'], {
      queryParams: {
        city: this.selected.id,
        cityName: this.selected.nombre,
        cityId: this.selected.contractId,
        plate: vehicle.plate,
        vehicleId: vehicle.id,
        zoneId: zone.zoneId,
        streetId: this.streetIdByZone.get(zone.zoneId),
        zone: zone.name,
          sectorId: zone.sectorId,
        sector: zone.name,
        street: zone.street,
        sectorColor: zone.color,
        latitude: center.lat.toFixed(7),
        longitude: center.lng.toFixed(7),
      },
    });
  }

  private cityCenter(): L.LatLngExpression {
    const centers: Record<string, [number, number]> = {
      durango: [43.168126, -2.632122],
      zarautz: [43.283891, -2.168643],
      tolosa: [43.136874, -2.07578],
      bergara: [43.119115, -2.414244],
      arrasate: [43.065894125, -2.490005041],
      soria: [41.766359417, -2.47352316],
      deba: [43.29448, -2.35403],
      mutriku: [43.3060587, -2.3872368],
    };
    if (this.selected.latitude && this.selected.longitude) return [this.selected.latitude, this.selected.longitude];
    return centers[this.selected.id] ?? [43.283891, -2.168643];
  }

  private async loadRealZones(): Promise<void> {
    try {
      try {
        const streets = await this.streetsService.getStreets(this.selected.contractId);
        this.streetIdByZone.clear();
        for (const street of streets.data) {
          if (street.zoneId > 0 && !this.streetIdByZone.has(street.zoneId)) this.streetIdByZone.set(street.zoneId, street.id);
        }
      } catch {
        this.streetIdByZone.clear();
      }
      const response = await this.parkingApi.mapStretches(this.selected.contractId);
      if (!response.data?.trim()) throw new Error('QueryMapStretchesAPI no devolvió KML');
      const xml = new DOMParser().parseFromString(response.data, 'application/xml');
      const layers: L.Polygon[] = [];
      for (const placemark of Array.from(xml.getElementsByTagName('Placemark'))) {
        const name = placemark.getElementsByTagName('name')[0]?.textContent?.trim() || 'Zona';
        const description = placemark.getElementsByTagName('description')[0]?.textContent?.trim() || '';
        const color = placemark.querySelector('ExtendedData zoneColor')?.textContent?.trim() || '3f51b5';
        const zoneId = Number(placemark.querySelector('ExtendedData zoneId')?.textContent?.trim()) || 0;
        for (const polygon of Array.from(placemark.getElementsByTagName('Polygon'))) {
          const coordinates = polygon.getElementsByTagName('coordinates')[0]?.textContent;
          if (!coordinates) continue;
          const points = coordinates
            .trim()
            .split(/\s+/)
            .map((value) => {
              const [lng, lat] = value.split(',').map(Number);
              return [lat, lng] as L.LatLngTuple;
            })
            .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
          if (points.length < 3) continue;
          const popupHtml = `<div class="zone-popup"><strong>${this.escapeHtml(name)}</strong>${description ? '<br>' + this.escapeHtml(description) : ''}</div>`;
          const layer = L.polygon(points, { color: `#${color}`, fillColor: `#${color}`, fillOpacity: 0.28, weight: 2 }).bindPopup(
            popupHtml,
          );
          const zone: MapParkingZone = {
            zoneId,
            streetId: this.streetIdByZone.get(zoneId),
            name: description || this.readableZoneName(name),
            street: this.cleanLocationName(name),
            color,
            points,
            layer,
          };
          layer.on('click', (event: L.LeafletMouseEvent) => {
            this.map?.panTo(event.latlng);
            this.selectZone(zone);
          });
          this.zones.push(zone);
          layers.push(layer);
        }
      }
      this.zoneLayer = L.featureGroup(layers).addTo(this.map!);
      this.zoneCount.set(layers.length);
      if (layers.length) {
        this.map!.fitBounds(this.zoneLayer.getBounds(), { padding: [28, 28] });
        this.selectZoneAtMapCenter();
      }
    } catch {
      this.mapError.set(true);
    } finally {
      this.mapLoading.set(false);
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
  }

  private selectZoneAtMapCenter(): void {
    const center = this.map?.getCenter();
    if (!center || !this.zones.length) return;
    this.selectZone(this.zones.find((zone) => this.containsPoint(center, zone.points)) ?? null);
  }

  private selectZone(zone: MapParkingZone | null): void {
    if (this.highlightedZone && this.highlightedZone !== zone) {
      this.highlightedZone.layer.setStyle({ weight: 2, fillOpacity: 0.28 });
    }
    if (zone) {
      zone.layer.setStyle({ weight: 4, fillOpacity: 0.42 });
      zone.layer.bringToFront();
      this.highlightedZone = zone;
    } else {
      this.highlightedZone = undefined;
    }
    this.selectedZone.set(zone);
    if (zone && this.map) void this.resolveSector(zone, this.map.getCenter());
  }

  private async resolveSector(zone: MapParkingZone, point: L.LatLng): Promise<void> {
    try {
      const streetId = this.streetIdByZone.get(zone.zoneId);
      if (!streetId) return;
      const sectors = await this.parkingApi.sectors({
        contractId: this.selected.contractId,
        streetId,
        latitude: point.lat,
        longitude: point.lng,
      });
      const match = sectors.find((sector) => sector.zoneId === zone.zoneId) ?? sectors[0];
      if (!match || this.selectedZone() !== zone) return;
      const resolved = {
        ...zone,
        zoneId: match.zoneId || zone.zoneId,
        sectorId: match.sectorId,
        name: match.sector || match.zone || zone.name,
        color: (match.sectorColor || match.zoneColor || zone.color).replace('#', ''),
      };
      this.selectedZone.set(resolved);
    } catch {
      this.mapError.set(true);
    }
  }

  private containsPoint(point: L.LatLng, polygon: L.LatLngTuple[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [yi, xi] = polygon[i];
      const [yj, xj] = polygon[j];
      if (yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  private readableZoneName(name: string): string {
    return (
      this.cleanLocationName(name)
        .replace(/^Z_\d+_/i, '')
        .replaceAll('_', ' ')
        .trim() || this.translationService.translate('parking.map.defaultZoneName')
    );
  }

  private cleanLocationName(name: string): string {
    return name
      .replace(/\s*\(\d+\)\s*#[0-9a-f]{6}\s*$/i, '')
      .replace(/\s*#[0-9a-f]{6}\s*$/i, '')
      .trim();
  }

}

const EMPTY_CITY: ParkingMunicipio = {
  id: '', nombre: '', provincia: '', zonas: 0, imagen: '', contractId: 0, description1: '', address: '', email: '', imagePath: '',
  longitude: 0, latitude: 0, phone: '', radius: '', zones: [],
};
