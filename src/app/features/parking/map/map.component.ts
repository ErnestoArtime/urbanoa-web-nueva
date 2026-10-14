import { readDesignToken } from '../../../shared/styles/design-token';
import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { LucideCarFront, LucideStar } from '@lucide/angular';
import { preferredVehicle, type Vehicle } from '../../../shared/models/vehicle';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { VehicleService } from '../../../core/services/vehicle.service';
import { UserService } from '../../../core/services/user.service';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import { MapLocationControlComponent, type MapLocationState } from './map-location-control.component';
import { CitiesService, type ParkingMunicipio } from '../../../core/services/cities.service';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { createGoogleMapStyle } from '../../../shared/maps/google-map-style';

interface MapPoint {
  lat: number;
  lng: number;
}

interface MapParkingZone {
  zoneId: number;
  sectorId?: number;
  name: string;
  color: string;
  points: L.LatLngTuple[];
  leafletLayer?: L.Polygon;
  googleLayer?: google.maps.Polygon;
}

@Component({
  selector: 'app-parking-map',
  imports: [RuntimeStyleDirective, RouterLink, LoaderComponent, TranslatePipe, MapLocationControlComponent, LucideCarFront, LucideStar],
  template: `
    <app-loader [visible]="mapLoading()" [message]="'parking.map.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
    <section class="parking-map-page">
      <header class="map-heading">
        <div>
          <p>{{ 'parking.map.kicker' | translate }}</p>
          <h1>{{ 'parking.map.title' | translate }}</h1>
          <span>{{ 'parking.map.subtitle' | translate }}</span>
        </div>
        <a routerLink="/app/parking/cities" [queryParams]="vehicleQueryParams()" class="btn btn-secondary">{{
          'parking.map.searchMunicipio' | translate
        }}</a>
      </header>
      @if (flowError()) {
        <p class="flow-warning">{{ 'parking.flow.missingData' | translate }}</p>
      }

      <div class="map-frame">
        <div #mapContainer class="leaflet-map" [attr.aria-label]="'parking.map.ariaLabel' | translate"></div>
        <div class="map-target" aria-hidden="true"><span></span></div>
        @if (zoneLabelVisible()) {
          @if (selectedZone(); as zone) {
            <div class="map-zone-label" role="status" aria-live="polite">
              <span>{{ zone.name }}</span>
              <button type="button" [attr.aria-label]="'common.close' | translate" (click)="closeZoneLabel()">×</button>
            </div>
          }
        }
        <app-map-location-control [state]="locationState()" (locate)="locateUser()" />

        <section class="parking-controls">
          <div class="municipio-control">
            <a routerLink="/app/parking/cities" [queryParams]="vehicleQueryParams()" class="search-control"
              ><span>⌕</span
              ><span
                ><small>{{ 'parking.map.municipio' | translate }}</small
                ><strong>{{ selected.nombre }}</strong></span
              ><b>›</b></a
            >
            <a
              routerLink="/app/parking/city-info"
              [queryParams]="{
                city: selected.id,
                cityId: selected.contractId,
                vehicleId: selectedVehicle()?.id,
                plate: selectedVehicle()?.plate,
              }"
              class="municipio-info"
              [attr.aria-label]="'parking.map.municipioInfo' | translate"
              >i</a
            >
          </div>

          <div class="vehicle-control-wrapper" [class.selector-open]="showVehicleSelector()">
            <button type="button" class="vehicle-control" [disabled]="!hasAvailableVehicles()" (click)="toggleVehicleSelector()">
              <span class="vehicle-control-icon"><svg lucideCarFront size="20" strokeWidth="2.2"></svg></span>
              <span
                ><small>{{ 'parking.map.vehicle' | translate }}</small
                ><strong>{{ selectedVehicle()?.plate ?? (vehiclePlaceholderKey() | translate) }}</strong></span
              >
              <b class="vehicle-control-chevron" aria-hidden="true"></b>
            </button>

            @if (selectedVehicle() && isParkedIn(selectedVehicle()!)) {
              <button
                type="button"
                class="parking-behavior-help-trigger"
                [class.active]="showParkingBehaviorHelp()"
                [attr.aria-expanded]="showParkingBehaviorHelp()"
                aria-controls="parking-behavior-help"
                [attr.aria-label]="'parking.map.activeParkingHelpLabel' | translate"
                (click)="toggleParkingBehaviorHelp()"
              >
                i
              </button>
              @if (showParkingBehaviorHelp()) {
                <p id="parking-behavior-help" class="parking-behavior-help" role="status">
                  {{ 'parking.map.activeParkingHelp' | translate }}
                </p>
              }
            }

            @if (hasAvailableVehicles()) {
              <div class="vehicle-selector-dropdown" [class.is-open]="showVehicleSelector()" role="listbox">
                @for (v of vehicles(); track v.id) {
                  <button
                    type="button"
                    class="vehicle-option"
                    [class.selected]="v === selectedVehicle()"
                    [class.parked]="isParkedIn(v)"
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
              <span [appRuntimeStyle]="{ background: '#' + zone.color }"></span>
              <div>
                <small>{{ 'parking.map.selectedZone' | translate }}</small
                ><strong>{{ zone.name }}</strong>
              </div>
            </div>
          } @else if (sectorResolving()) {
            <p class="select-hint" role="status">{{ 'parking.map.resolvingSector' | translate }}</p>
          } @else if (sectorError()) {
            <p class="select-hint select-hint-error" role="status">{{ 'parking.map.sectorNotFound' | translate }}</p>
          } @else {
            <p class="select-hint">{{ 'parking.map.selectHint' | translate }}</p>
          }
          <button type="button" class="btn btn-primary btn-block" [disabled]="!canStartParking()" (click)="startParking()">
            {{ 'parking.map.parkHere' | translate }}
          </button>
          @if (!hasAvailableVehicles() && !initialDataLoading()) {
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
  styleUrls: ['./map.component.css', './parking-controls.css'],
})
export class ParkingMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) private readonly mapContainer!: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  private readonly vehicleService = inject(VehicleService);
  private readonly userService = inject(UserService);
  private readonly locationSettings = inject(LocationSettingsService);
  private readonly translationService = inject(TranslationService);
  private readonly citiesService = inject(CitiesService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);
  private readonly query: ParkingFlowQuery = readParkingFlowQuery(this.route);
  private leafletMap?: L.Map;
  private googleMap?: google.maps.Map;
  private zoneLayer?: L.FeatureGroup;
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private leafletLocationMarker?: L.CircleMarker;
  private googleLocationMarker?: google.maps.Circle;
  private destroyed = false;
  private readonly zones: MapParkingZone[] = [];
  private highlightedZone?: MapParkingZone;
  private sectorRequestVersion = 0;
  private readonly selectedState = signal<ParkingMunicipio>(EMPTY_CITY);
  get selected(): ParkingMunicipio {
    return this.selectedState();
  }
  readonly mapLoading = signal(true);
  readonly flowError = signal(this.route.snapshot.queryParamMap.get('flowError') === 'missingData');
  readonly mapError = signal(false);
  readonly sectorResolving = signal(false);
  readonly sectorError = signal(false);
  readonly locationState = signal<MapLocationState>('idle');
  readonly zoneCount = signal(0);
  readonly selectedZone = signal<MapParkingZone | null>(null);
  readonly zoneLabelVisible = signal(false);
  readonly vehicles = this.vehicleService.vehicles;
  private readonly parkingSessionService = inject(ParkingSessionService);
  readonly isParkedIn = (vehicle: Vehicle) =>
    this.parkingSessionService.isVehicleParked(vehicle.id) || this.parkingSessionService.isVehicleParked(vehicle.plate);

  translateLabel(value?: string): string {
    return this.translationService.translateLabel(value);
  }
  readonly availableVehicles = computed(() => this.vehicles());
  readonly hasAvailableVehicles = computed(() => this.availableVehicles().length > 0);
  readonly vehiclesLoading = computed(() => this.vehicleService.source() === 'idle');
  readonly initialDataLoading = computed(() => this.mapLoading() || this.vehiclesLoading());
  readonly vehiclePlaceholderKey = computed(() => (this.initialDataLoading() ? 'parking.map.loadingVehicles' : 'parking.map.noVehicles'));
  readonly selectedVehicle = signal<Vehicle | null>(
    this.availableVehicles().find((vehicle) => vehicle.id === this.query.vehicleId || vehicle.plate === this.query.plate) ??
      preferredVehicle(this.availableVehicles()),
  );
  readonly canStartParking = computed(() => {
    const zone = this.selectedZone();
    const vehicle = this.selectedVehicle();
    return Boolean(zone?.sectorId && vehicle && !this.sectorResolving());
  });
  readonly showVehicleSelector = signal(false);
  readonly showParkingBehaviorHelp = signal(false);
  private readonly syncSelectedVehicle = effect(() => {
    const vehicleId = this.store.vm().vehicleId;
    const vehicle = this.availableVehicles().find((item) => item.id === vehicleId);
    if (vehicle && this.selectedVehicle()?.id !== vehicle.id) this.selectedVehicle.set(vehicle);
  });

  // Clear selected vehicle and selector when the vehicle is removed from the list
  private readonly clearSelectedVehicleOnRemoval = effect(() => {
    const vehicle = this.selectedVehicle();
    if (vehicle && !this.vehicles().some((v) => v.id === vehicle.id)) {
      this.selectedVehicle.set(null);
      this.showVehicleSelector.set(false);
    }
  });

  toggleVehicleSelector(): void {
    if (!this.hasAvailableVehicles()) return;
    const willOpen = !this.showVehicleSelector();
    this.showVehicleSelector.set(willOpen);
    if (willOpen) this.showParkingBehaviorHelp.set(false);
  }

  toggleParkingBehaviorHelp(): void {
    const willOpen = !this.showParkingBehaviorHelp();
    this.showParkingBehaviorHelp.set(willOpen);
    if (willOpen) this.showVehicleSelector.set(false);
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.store.selectVehicle(vehicle.id, vehicle.plate);
    this.showVehicleSelector.set(false);
    this.showParkingBehaviorHelp.set(false);
  }

  closeZoneLabel(): void {
    this.zoneLabelVisible.set(false);
  }

  vehicleQueryParams(): Record<string, string> {
    const vehicle = this.selectedVehicle();
    const params: Record<string, string> = {};
    if (this.selected.id) {
      params['city'] = this.selected.id;
      params['cityId'] = String(this.selected.contractId);
      params['cityName'] = this.selected.nombre;
    }
    if (vehicle) {
      params['vehicleId'] = vehicle.id;
      params['plate'] = vehicle.plate;
    }
    return params;
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.vehicleService.load();
      const { data } = await this.citiesService.getCities();
      const selectableCities = this.citiesService.selectableCities(data);
      const requestedContractId = Number(this.query.cityId);
      const preferredId = this.locationSettings.settings().preferredCityId;
      const preferredContractId = this.locationSettings.settings().preferredContractId;
      // A locally saved choice takes priority while OPS synchronization is pending.
      const remotePreferredContractId = this.locationSettings.settings().preferredCitySyncPending
        ? undefined
        : this.userService.user().preferredContractId;
      const selected =
        selectableCities.find((city) => city.contractId === requestedContractId) ??
        selectableCities.find((city) => city.id === this.query.city) ??
        selectableCities.find((city) => city.contractId === remotePreferredContractId) ??
        selectableCities.find((city) => city.contractId === preferredContractId) ??
        selectableCities.find((city) => city.id === preferredId || String(city.contractId) === preferredId) ??
        selectableCities[0];
      if (!selected) throw new Error('No hay contratos de aparcamiento disponibles');
      this.selectedState.set(selected);
      if (remotePreferredContractId === selected.contractId) {
        this.locationSettings.setPreferredCity(selected.id, selected.nombre, selected.contractId);
      }
      await this.parkingSessionService.loadParkingStatuses(this.vehicles());
      this.selectedVehicle.set(
        this.availableVehicles().find((vehicle) => vehicle.id === this.query.vehicleId || vehicle.plate === this.query.plate) ??
          preferredVehicle(this.availableVehicles()),
      );
    } catch {
      this.mapError.set(true);
      this.mapLoading.set(false);
      return;
    }
    const vehicle = this.selectedVehicle();
    if (vehicle) this.store.startNewParking(vehicle.id, vehicle.plate);
    const center = this.cityCenter();
    if (!center) {
      this.mapError.set(true);
      this.mapLoading.set(false);
      return;
    }
    const googleMaps = await this.googleMapsLoader.load();
    if (this.destroyed) return;
    if (googleMaps) this.initializeGoogleMap(googleMaps, center);
    else this.initializeLeafletMap(center);
    this.resizeObserver = new ResizeObserver(() => this.scheduleMapResize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
    this.scheduleMapResize();
    void this.loadRealZones();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.leafletMap?.remove();
    this.googleLocationMarker?.setMap(null);
    if (this.googleMap) google.maps.event.clearInstanceListeners(this.googleMap);
    for (const zone of this.zones) if (zone.googleLayer) google.maps.event.clearInstanceListeners(zone.googleLayer);
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
    if (lastLatitude === undefined || lastLongitude === undefined || (!this.leafletMap && !this.googleMap)) {
      this.locationState.set('unavailable');
      return;
    }
    if (this.leafletMap) {
      const point: L.LatLngExpression = [lastLatitude, lastLongitude];
      this.leafletLocationMarker?.remove();
      this.leafletLocationMarker = L.circleMarker(point, {
        radius: 9,
        color: readDesignToken('--color-on-primary'),
        weight: 3,
        fillColor: readDesignToken('--color-map-location'),
        fillOpacity: 1,
      }).addTo(this.leafletMap);
      this.leafletMap.flyTo(point, 17, { duration: 0.8 });
    } else if (this.googleMap) {
      const center = { lat: lastLatitude, lng: lastLongitude };
      this.googleLocationMarker?.setMap(null);
      this.googleLocationMarker = new google.maps.Circle({
        map: this.googleMap,
        center,
        radius: 7,
        strokeColor: readDesignToken('--color-on-primary'),
        strokeWeight: 3,
        fillColor: readDesignToken('--color-map-location'),
        fillOpacity: 1,
      });
      this.googleMap.panTo(center);
      this.googleMap.setZoom(17);
    }
    this.locationState.set('located');
  }

  private scheduleMapResize(): void {
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.leafletMap?.invalidateSize({ pan: false });
      if (this.googleMap) google.maps.event.trigger(this.googleMap, 'resize');
    });
  }

  startParking(): void {
    const zone = this.selectedZone();
    const center = this.mapCenter();
    const vehicle = this.selectedVehicle();
    if (!zone || !center || !vehicle || !this.canStartParking()) return;
    this.store.update({
      city: this.selected.id,
      cityId: String(this.selected.contractId),
      cityName: this.selected.nombre,
      plate: vehicle.plate,
      vehicleId: vehicle.id,
      zoneId: String(zone.zoneId),
      zoneName: zone.name,
      sectorId: String(zone.sectorId),
      sectorName: zone.name,
      street: '',
      sectorColor: zone.color,
      latitude: center.lat.toFixed(7),
      longitude: center.lng.toFixed(7),
    });
    void this.router.navigate(['/app/parking/tickets'], {
      queryParams: {
        selectionOrigin: 'map',
        city: this.selected.id,
        cityName: this.selected.nombre,
        cityId: this.selected.contractId,
        plate: vehicle.plate,
        vehicleId: vehicle.id,
        zoneId: zone.zoneId,
        zone: zone.name,
        sectorId: zone.sectorId,
        sector: zone.name,
        street: '',
        sectorColor: zone.color,
        latitude: center.lat.toFixed(7),
        longitude: center.lng.toFixed(7),
      },
    });
  }

  private cityCenter(): L.LatLngExpression | null {
    const coordinates = this.citiesService.coordinatesFor(this.selected);
    return coordinates ? [coordinates.latitude, coordinates.longitude] : null;
  }

  private initializeLeafletMap(center: L.LatLngExpression): void {
    this.leafletMap = L.map(this.mapContainer.nativeElement, { zoomControl: false }).setView(center, 15);
    this.leafletMap.on('movestart', () => this.handleMapMoveStart());
    L.control.zoom({ position: 'topright' }).addTo(this.leafletMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.leafletMap);
    this.leafletMap.on('moveend', () => this.selectZoneAtMapCenter());
  }

  private initializeGoogleMap(googleMaps: typeof google.maps, center: L.LatLngExpression): void {
    const [lat, lng] = center as L.LatLngTuple;
    this.googleMap = new googleMaps.Map(this.mapContainer.nativeElement, {
      center: { lat, lng },
      zoom: 15,
      styles: createGoogleMapStyle(),
      zoomControl: true,
      zoomControlOptions: { position: googleMaps.ControlPosition.RIGHT_TOP },
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    this.googleMap.addListener('dragstart', () => this.handleMapMoveStart());
    this.googleMap.addListener('idle', () => this.selectZoneAtMapCenter());
  }

  private mapCenter(): MapPoint | null {
    const leafletCenter = this.leafletMap?.getCenter();
    if (leafletCenter) return { lat: leafletCenter.lat, lng: leafletCenter.lng };
    const googleCenter = this.googleMap?.getCenter();
    return googleCenter ? { lat: googleCenter.lat(), lng: googleCenter.lng() } : null;
  }

  private handleMapMoveStart(): void {
    this.showParkingBehaviorHelp.set(false);
    this.zoneLabelVisible.set(false);
  }

  private async loadRealZones(): Promise<void> {
    try {
      const response = await this.parkingApi.mapStretches(this.selected.contractId);
      if (!response.data?.trim()) throw new Error('QueryMapStretchesAPI no devolvió KML');
      const xml = new DOMParser().parseFromString(response.data, 'application/xml');
      const leafletLayers: L.Polygon[] = [];
      let renderedZones = 0;
      for (const placemark of Array.from(xml.getElementsByTagName('Placemark'))) {
        const name = placemark.getElementsByTagName('name')[0]?.textContent?.trim() || 'Zona';
        const description = placemark.getElementsByTagName('description')[0]?.textContent?.trim() || '';
        const color =
          placemark.querySelector('ExtendedData zoneColor')?.textContent?.trim() ||
          readDesignToken('--color-map-zone-fallback').replace('#', '');
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
          const zone: MapParkingZone = {
            zoneId,
            name: description || this.readableZoneName(name),
            color,
            points,
          };
          if (this.leafletMap) {
            zone.leafletLayer = L.polygon(points, {
              color: `#${color}`,
              fillColor: `#${color}`,
              fillOpacity: 0.28,
              weight: 2,
            });
            zone.leafletLayer.on('click', (event: L.LeafletMouseEvent) => {
              this.leafletMap?.panTo(event.latlng);
            });
            leafletLayers.push(zone.leafletLayer);
          } else if (this.googleMap) {
            const path = points.map(([lat, lng]) => ({ lat, lng }));
            zone.googleLayer = new google.maps.Polygon({
              map: this.googleMap,
              paths: path,
              strokeColor: `#${color}`,
              strokeWeight: 2,
              fillColor: `#${color}`,
              fillOpacity: 0.28,
            });
            zone.googleLayer.addListener('click', (event: google.maps.PolyMouseEvent) => {
              if (event.latLng) {
                this.googleMap?.panTo(event.latLng);
              }
            });
          }
          this.zones.push(zone);
          renderedZones += 1;
        }
      }
      if (this.leafletMap) this.zoneLayer = L.featureGroup(leafletLayers).addTo(this.leafletMap);
      this.zoneCount.set(renderedZones);
      if (renderedZones) {
        // The city coordinates are the authoritative initial viewport. Fitting the
        // union of all polygons here moves the map after it has already been
        // initialized and makes the map center depend on the distribution of zones.
        this.selectZoneAtMapCenter();
      }
    } catch {
      this.mapError.set(true);
    } finally {
      this.mapLoading.set(false);
    }
  }

  private selectZoneAtMapCenter(): void {
    const center = this.mapCenter();
    if (!center || !this.zones.length) return;
    this.selectZone(this.zones.find((zone) => this.containsPoint(center, zone.points)) ?? null);
  }

  private selectZone(zone: MapParkingZone | null): void {
    const sameZoneIsAlreadyResolved =
      zone !== null && this.highlightedZone === zone && this.selectedZone()?.zoneId === zone.zoneId && !this.sectorResolving();
    if (sameZoneIsAlreadyResolved) {
      this.zoneLabelVisible.set(true);
      return;
    }

    const requestVersion = ++this.sectorRequestVersion;
    this.zoneLabelVisible.set(false);
    this.sectorError.set(false);
    this.sectorResolving.set(Boolean(zone));
    if (this.highlightedZone && this.highlightedZone !== zone) {
      this.setZoneStyle(this.highlightedZone, false);
    }
    if (zone) {
      this.setZoneStyle(zone, true);
      this.highlightedZone = zone;
    } else {
      this.highlightedZone = undefined;
    }
    this.selectedZone.set(null);
    const center = this.mapCenter();
    if (zone && center) void this.resolveSector(zone, center, requestVersion);
    else this.sectorResolving.set(false);
  }

  private setZoneStyle(zone: MapParkingZone, highlighted: boolean): void {
    zone.leafletLayer?.setStyle({ weight: highlighted ? 4 : 2, fillOpacity: highlighted ? 0.42 : 0.28 });
    if (highlighted) zone.leafletLayer?.bringToFront();
    zone.googleLayer?.setOptions({
      strokeWeight: highlighted ? 4 : 2,
      fillOpacity: highlighted ? 0.42 : 0.28,
      zIndex: highlighted ? 2 : 1,
    });
  }

  private async resolveSector(zone: MapParkingZone, point: MapPoint, requestVersion: number): Promise<void> {
    try {
      const sectors = await this.parkingApi.sectors({
        contractId: this.selected.contractId,
        latitude: point.lat,
        longitude: point.lng,
      });
      if (requestVersion !== this.sectorRequestVersion) return;
      // QueryMapStretchesAPI and QuerySectorsAPI do not use the same zone identifiers
      // in every municipality. The sector response is authoritative for these coordinates.
      const match = sectors.find((sector) => sector.zoneId === zone.zoneId) ?? sectors[0];
      if (!match) {
        this.sectorError.set(true);
        return;
      }
      const resolved = {
        ...zone,
        sectorId: match.sectorId,
        name: match.sector || match.zone || zone.name,
        color: (match.sectorColor || match.zoneColor || zone.color).replace('#', ''),
      };
      this.selectedZone.set(resolved);
      this.zoneLabelVisible.set(true);
    } catch {
      if (requestVersion === this.sectorRequestVersion) this.sectorError.set(true);
    } finally {
      if (requestVersion === this.sectorRequestVersion) this.sectorResolving.set(false);
    }
  }

  private containsPoint(point: MapPoint, polygon: L.LatLngTuple[]): boolean {
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
