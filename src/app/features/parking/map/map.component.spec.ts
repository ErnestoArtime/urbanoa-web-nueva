import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { CitiesService } from '../../../core/services/cities.service';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingMapComponent } from './map.component';

describe('ParkingMapComponent', () => {
  it('does not expose a KML zone until the sector for the map position is confirmed', async () => {
    let resolveSectors!: (value: any[]) => void;
    const parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['sectors']);
    parkingApi.sectors.and.returnValue(new Promise((resolve) => (resolveSectors = resolve)));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: VehicleService, useValue: { vehicles: signal([]), source: signal<'idle' | 'remote'>('idle') } },
        { provide: LocationSettingsService, useValue: { settings: signal({ preferredCityId: '' }) } },
        { provide: TranslationService, useValue: { translateLabel: (value?: string) => value ?? '' } },
        { provide: CitiesService, useValue: {} },
        { provide: GoogleMapsLoaderService, useValue: {} },
        { provide: ParkingSessionService, useValue: { isVehicleParked: () => false } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const component: any = TestBed.runInInjectionContext(() => new ParkingMapComponent());
    component.selectedState.set({ id: 'zarautz', contractId: 3, nombre: 'Zarautz' });
    component.selectedVehicle.set({ id: 'TTT 12345', plate: 'TTT 12345' });
    component.mapCenter = () => ({ lat: 43.28, lng: -2.16 });
    component.setZoneStyle = () => undefined;

    component.selectZone({ zoneId: 10002, name: 'AZUL 01', color: '2196f3', points: [] });

    expect(component.selectedZone()).toBeNull();
    expect(component.canStartParking()).toBeFalse();

    // QuerySectorsAPI identifies the sector for the coordinates. Its zoneId can differ
    // from the polygon identifier supplied by QueryMapStretchesAPI.
    resolveSectors([{ zoneId: 2, sectorId: 22004, sector: 'Z2 RESIDENTES', sectorColor: 'ffffff' }]);
    await Promise.resolve();

    expect(component.selectedZone().name).toBe('Z2 RESIDENTES');
    expect(component.canStartParking()).toBeTrue();
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
        { provide: LocationSettingsService, useValue: { settings: signal({ preferredCityId: '' }) } },
        { provide: TranslationService, useValue: { translateLabel: (value?: string) => value ?? '' } },
        { provide: CitiesService, useValue: {} },
        { provide: GoogleMapsLoaderService, useValue: {} },
        { provide: ParkingSessionService, useValue: { isVehicleParked: () => false } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const component: any = TestBed.runInInjectionContext(() => new ParkingMapComponent());

    expect(component.vehiclesLoading()).toBeTrue();
    expect(component.vehiclePlaceholderKey()).toBe('parking.map.loadingVehicles');

    vehicleSource.set('remote');

    expect(component.vehiclePlaceholderKey()).toBe('parking.map.loadingVehicles');

    component.mapLoading.set(false);

    expect(component.vehiclesLoading()).toBeFalse();
    expect(component.vehiclePlaceholderKey()).toBe('parking.map.noVehicles');
  });
});
