import { provideZonelessChangeDetection } from '@angular/core';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { VehicleEditComponent } from './vehicle-edit.component';
import { VehicleService, type VehicleMutationResult } from '../../../core/services/vehicle.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { OpsApiError } from '../../../core/api/ops-api.types';

describe('VehicleEditComponent', () => {
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let parkingSessionService: jasmine.SpyObj<{ isVehicleParked: (idOrPlate: string) => boolean }>;
  let vehicleService: { getById: jasmine.Spy; update: jasmine.Spy; remove: jasmine.Spy };

  function mount(): ReturnType<typeof createFixture> {
    return createFixture();
  }

  function createFixture() {
    const fixture = TestBed.createComponent(VehicleEditComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.clear();
    const vehicles = [
      { id: '1', plate: '1234 BCD', isDefault: true },
      { id: '2', plate: '5678 XYZ', isDefault: false },
    ];
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: '1' }));
    parkingSessionService = jasmine.createSpyObj('ParkingSessionService', ['isVehicleParked', 'loadParkingStatuses']);
    parkingSessionService.isVehicleParked.and.returnValue(false);
    vehicleService = {
      getById: jasmine.createSpy('getById').and.callFake((id: string) => vehicles.find((vehicle) => vehicle.id === id)),
      update: jasmine.createSpy('update'),
      remove: jasmine.createSpy('remove').and.resolveTo({ success: true, source: 'remote' } satisfies VehicleMutationResult),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: VehicleService, useValue: vehicleService },
        { provide: ParkingSessionService, useValue: parkingSessionService },
        { provide: ActivatedRoute, useValue: { snapshot: paramMap$.value, paramMap: paramMap$.asObservable() } },
      ],
    });
  });

  it('shows the vehicle from the route parameter', () => {
    const fixture = mount();

    expect(fixture.componentInstance.id()).toBe('1');
    expect(fixture.componentInstance.plate()).toBe('1234 BCD');
  });

  it('shows a read-only plate input', () => {
    const fixture = mount();

    const plateInput = fixture.nativeElement.querySelector('.form-input') as HTMLInputElement;
    expect(plateInput.value).toBe('1234 BCD');
    expect(plateInput.readOnly).toBeTrue();
  });

  it('updates the panel when the route parameter changes to another vehicle', () => {
    const fixture = mount();

    paramMap$.next(convertToParamMap({ id: '2' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.id()).toBe('2');
    expect(fixture.componentInstance.plate()).toBe('5678 XYZ');
  });

  it('allows deletion when the plate has no active parking', () => {
    const fixture = mount();
    parkingSessionService.isVehicleParked.and.returnValue(false);

    fixture.componentInstance.remove();

    expect(fixture.componentInstance.confirmDelete()).toBeTrue();
    expect(fixture.componentInstance.blockedDelete()).toBeFalse();
  });

  it('blocks deletion when the plate has an active parking', () => {
    const fixture = mount();
    parkingSessionService.isVehicleParked.and.returnValue(true);

    fixture.componentInstance.remove();

    expect(fixture.componentInstance.confirmDelete()).toBeFalse();
    expect(fixture.componentInstance.blockedDelete()).toBeTrue();
  });

  it('hides the edit form and reports success when the vehicle is deleted', async () => {
    const fixture = mount();
    vehicleService.remove.and.resolveTo({ success: true, source: 'remote' } as VehicleMutationResult);

    await fixture.componentInstance.confirmRemove();
    fixture.detectChanges();

    expect(fixture.componentInstance.result()).toBe('deleted');
    expect(fixture.componentInstance.deleteFailed()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.card')).toBeNull();
  });

  it('shows the localized backend error message when the API fails', async () => {
    const fixture = mount();
    const error = new OpsApiError('backend', 'OPSWebServicesAPI/RemovePlateAPI', 'Error genérico', 200, {
      code: -9,
      type: 2,
      message_EN: 'Generic error',
      message_ES: 'Error genérico',
      message_EU: 'Errore generikoa',
      message_FR: 'Erreur générique',
    });
    vehicleService.remove.and.resolveTo({ success: false, source: 'error', error } as VehicleMutationResult);

    await fixture.componentInstance.confirmRemove();

    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.componentInstance.deleteFailed()).toBeTrue();
    expect(fixture.componentInstance.deleteErrorMessage()).toBe('Error genérico');
  });

  it('shows the generic fallback message when the API error is not parseable', async () => {
    const fixture = mount();
    const error = new OpsApiError('transport', 'OPSWebServicesAPI/RemovePlateAPI', 'Network error', 0);
    vehicleService.remove.and.resolveTo({ success: false, source: 'error', error } as VehicleMutationResult);

    await fixture.componentInstance.confirmRemove();

    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.componentInstance.deleteFailed()).toBeTrue();
    expect(fixture.componentInstance.deleteErrorMessage()).toBeNull();
  });
});
