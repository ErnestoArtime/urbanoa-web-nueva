import { provideZonelessChangeDetection } from '@angular/core';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { VehicleEditComponent } from './vehicle-edit.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';

describe('VehicleEditComponent', () => {
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let parkingSessionService: jasmine.SpyObj<{ isVehicleParked: (idOrPlate: string) => boolean }>;

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
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: VehicleService, useValue: { getById: (id: string) => vehicles.find((vehicle) => vehicle.id === id), update: jasmine.createSpy() } },
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
});
