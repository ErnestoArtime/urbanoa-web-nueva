import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { CitiesService, ParkingMunicipio } from '../../../core/services/cities.service';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../core/services/user.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingMapComponent } from './map.component';
import { Vehicle } from '../../../shared/models/vehicle';

interface TestZone {
  zoneId: number;
  name: string;
  localizedNames?: string[];
  color: string;
  points: [number, number][];
}
type TestedParkingMap = Pick<ParkingMapComponent, keyof ParkingMapComponent> & {
  selectedState: WritableSignal<Partial<ParkingMunicipio>>;
  selectedVehicle: WritableSignal<Vehicle | undefined>;
  mapCenter: () => { lat: number; lng: number };
  setZoneStyle: () => void;
  zones: TestZone[];
  selectZone: (zone: TestZone, center: { lat: number; lng: number }) => void;
  handleMapMoveStart: () => void;
  handleMapMoveEnd: () => void;
};

describe('ParkingMapComponent', () => {
  it('enables parking from the polygon and consults OPS only when the button is pressed', async () => {
    let resolveSectors!: (value: Awaited<ReturnType<ParkingApiService['sectors']>>) => void;
    const parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['sectors']);
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    parkingApi.sectors.and.returnValue(new Promise((resolve) => (resolveSectors = resolve)));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: VehicleService, useValue: { vehicles: signal([]), source: signal<'idle' | 'remote'>('idle') } },
        {
          provide: LocationSettingsService,
          useValue: { settings: signal({ preferredCityId: '' }), setPreferredCity: jasmine.createSpy() },
        },
        { provide: UserService, useValue: { user: signal({ preferredContractId: undefined }) } },
        { provide: TranslationService, useValue: { translateLabel: (value?: string) => value ?? '' } },
        { provide: CitiesService, useValue: {} },
        { provide: GoogleMapsLoaderService, useValue: {} },
        { provide: ParkingSessionService, useValue: { isVehicleParked: () => false } },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingMapComponent()) as unknown as TestedParkingMap;
    component.selectedState.set({ id: 'zarautz', contractId: 3, nombre: 'Zarautz' });
    component.selectedVehicle.set({ id: 'TTT 12345', plate: 'TTT 12345', isDefault: false });
    component.mapCenter = () => ({ lat: 43.28, lng: -2.16 });
    component.setZoneStyle = () => undefined;

    component.selectZone({ zoneId: 10002, name: 'AZUL 01', color: '2196f3', points: [] }, component.mapCenter());

    expect(component.markerZone()?.name).toBe('AZUL 01');
    expect(component.canStartParking()).toBeTrue();
    expect(parkingApi.sectors).not.toHaveBeenCalled();

    const started = component.startParking();
    await component.startParking();

    expect(component.canStartParking()).toBeFalse();
    expect(parkingApi.sectors).toHaveBeenCalledOnceWith({ contractId: 3, latitude: 43.28, longitude: -2.16 });
    expect(navigate).not.toHaveBeenCalled();

    // QuerySectorsAPI identifies the sector for the coordinates. Its zoneId can differ
    // from the polygon identifier supplied by QueryMapStretchesAPI.
    resolveSectors([{ zoneId: 2, sectorId: 22004, zone: 'Z2', zoneColor: 'ffffff', sector: 'Z2 RESIDENTES', sectorColor: 'ffffff' }]);
    await started;

    expect(navigate).toHaveBeenCalledOnceWith(['/app/parking/tickets'], {
      queryParams: jasmine.objectContaining({
        zoneId: 2,
        sectorId: 22004,
        sector: 'Z2 RESIDENTES',
        latitude: '43.2800000',
        longitude: '-2.1600000',
      }),
    });
  });

  it('does not report that there are no vehicles while they are still loading', () => {
    const vehicleSource = signal<'idle' | 'remote'>('idle');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: ParkingApiService, useValue: {} },
        { provide: VehicleService, useValue: { vehicles: signal([]), source: vehicleSource } },
        {
          provide: LocationSettingsService,
          useValue: { settings: signal({ preferredCityId: '' }), setPreferredCity: jasmine.createSpy() },
        },
        { provide: UserService, useValue: { user: signal({ preferredContractId: undefined }) } },
        { provide: TranslationService, useValue: { translateLabel: (value?: string) => value ?? '' } },
        { provide: CitiesService, useValue: {} },
        { provide: GoogleMapsLoaderService, useValue: {} },
        { provide: ParkingSessionService, useValue: { isVehicleParked: () => false } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingMapComponent()) as unknown as TestedParkingMap;

    expect(component.vehiclesLoading()).toBeTrue();
    expect(component.vehiclePlaceholderKey()).toBe('parking.map.loadingVehicles');

    vehicleSource.set('remote');

    expect(component.vehiclePlaceholderKey()).toBe('parking.map.loadingVehicles');

    component.mapLoading.set(false);

    expect(component.vehiclesLoading()).toBeFalse();
    expect(component.vehiclePlaceholderKey()).toBe('parking.map.noVehicles');
  });

  it('keeps the marker while moving and discards a stale response after leaving the zone', async () => {
    const parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['sectors']);
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    parkingApi.sectors.and.resolveTo([]);
    const language = signal<'es' | 'eu' | 'uk' | 'fr'>('es');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: VehicleService, useValue: { vehicles: signal([]), source: signal<'idle' | 'remote'>('remote') } },
        {
          provide: LocationSettingsService,
          useValue: { settings: signal({ preferredCityId: '' }), setPreferredCity: jasmine.createSpy() },
        },
        { provide: UserService, useValue: { user: signal({ preferredContractId: undefined }) } },
        { provide: TranslationService, useValue: { currentLang$: language, translateLabel: (value?: string) => value ?? '' } },
        { provide: CitiesService, useValue: {} },
        { provide: GoogleMapsLoaderService, useValue: {} },
        { provide: ParkingSessionService, useValue: { isVehicleParked: () => false } },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingMapComponent()) as unknown as TestedParkingMap;
    component.zones.push({
      zoneId: 22004,
      name: 'Z2',
      localizedNames: ['Zona 2 - Residentes', '2.gunea - Egoiliarrak', 'Zone 2 - Residents', 'Zone 2 - Résidents'],
      color: '707974',
      points: [
        [43.27, -2.17],
        [43.29, -2.17],
        [43.29, -2.15],
        [43.27, -2.15],
      ],
    });
    component.selectedState.set({ id: 'zarautz', contractId: 3, nombre: 'Zarautz' });
    component.selectedVehicle.set({ id: 'TTT 12345', plate: 'TTT 12345', isDefault: false });
    let center = { lat: 43.28, lng: -2.16 };
    component.mapCenter = () => center;
    const highlight = jasmine.createSpy('setZoneStyle');
    component.setZoneStyle = highlight;

    component.handleMapMoveEnd();
    component.handleMapMoveEnd();

    expect(parkingApi.sectors).not.toHaveBeenCalled();
    expect(component.canStartParking()).toBeTrue();
    expect(component.markerName()).toBe('Zona 2 - Residentes');
    expect(component.markerIconStyle()['--map-marker-sector-color']).toBe('#707974');
    language.set('eu');
    expect(component.markerName()).toBe('2.gunea - Egoiliarrak');
    component.handleMapMoveStart();

    expect(component.markerName()).toBe('2.gunea - Egoiliarrak');
    expect(component.canStartParking()).toBeFalse();
    expect(highlight).toHaveBeenCalledWith(component.zones[0], false);
    highlight.calls.reset();

    center = { lat: 43.2801, lng: -2.16 };
    component.handleMapMoveEnd();

    expect(component.canStartParking()).toBeTrue();
    expect(parkingApi.sectors).not.toHaveBeenCalled();
    await component.startParking();
    expect(component.sectorError()).toBeTrue();
    expect(component.canStartParking()).toBeTrue();
    expect(parkingApi.sectors).toHaveBeenCalledOnceWith({ contractId: 3, latitude: 43.2801, longitude: -2.16 });

    parkingApi.sectors.and.resolveTo([
      { zoneId: 2, sectorId: 22004, zone: 'Z2', zoneColor: 'ffffff', sector: 'Z2 RESIDENTES', sectorColor: 'ffffff' },
    ]);
    const staleRequest = component.startParking();
    component.handleMapMoveStart();
    center = { lat: 43.3, lng: -2.16 };
    component.handleMapMoveEnd();
    await staleRequest;

    expect(component.selectedZone()).toBeNull();
    expect(component.markerZone()).toBeNull();
    expect(component.canStartParking()).toBeFalse();
    expect(parkingApi.sectors.calls.count()).toBe(2);
    expect(navigate).not.toHaveBeenCalled();
    expect(highlight.calls.allArgs()).toEqual([
      [component.zones[0], true],
      [component.zones[0], false],
    ]);
  });
});
