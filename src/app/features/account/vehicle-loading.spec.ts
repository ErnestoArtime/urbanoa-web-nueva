import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VehicleService } from '../../core/services/vehicle.service';
import { OperationsService } from '../../core/services/operations.service';
import { ParkingSessionService } from '../../core/services/parking-session.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { VehicleAddComponent } from './vehicle-add/vehicle-add.component';
import { VehicleEditComponent } from './vehicle-edit/vehicle-edit.component';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('Vehicle action loading', () => {
  let vehicles: { add: jasmine.Spy; update: jasmine.Spy; remove: jasmine.Spy; hasPlate: jasmine.Spy; getById: jasmine.Spy };
  let operations: { load: jasmine.Spy };
  beforeEach(() => {
    vehicles = {
      add: jasmine.createSpy().and.resolveTo({ success: true }),
      update: jasmine.createSpy().and.resolveTo({ success: true }),
      remove: jasmine.createSpy().and.resolveTo({ success: true }),
      hasPlate: jasmine.createSpy().and.returnValue(false),
      getById: jasmine.createSpy().and.returnValue({ id: '1234ZZZ', plate: '1234ZZZ', isDefault: false }),
    };
    operations = { load: jasmine.createSpy().and.resolveTo() };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: VehicleService, useValue: vehicles },
        { provide: OperationsService, useValue: operations },
        { provide: ParkingSessionService, useValue: { loadParkingStatuses: () => Promise.resolve(), isVehicleParked: () => false } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1234ZZZ' })), snapshot: { paramMap: convertToParamMap({ id: '1234ZZZ' }) } },
        },
      ],
    });
    TestBed.overrideComponent(LoaderComponent, { set: { template: '', styles: [] } });
    spyOn(LoaderComponent.prototype, 'ngAfterViewInit').and.stub();
  });

  for (const action of ['add', 'update', 'remove'] as const) {
    it(`shows loading throughout ${action} and refresh, rejecting duplicate submissions`, async () => {
      const mutation = deferred<{ success: boolean }>();
      const refresh = deferred<void>();
      vehicles[action].and.returnValue(mutation.promise);
      operations.load.and.returnValue(refresh.promise);
      const fixture = action === 'add' ? TestBed.createComponent(VehicleAddComponent) : TestBed.createComponent(VehicleEditComponent);
      await fixture.whenStable();
      const component = fixture.componentInstance;
      component.plate.set('1234ZZZ');
      const submit = () => (action === 'remove' ? (component as VehicleEditComponent).confirmRemove() : component.save());
      const pending = submit();
      await fixture.whenStable();
      const loader = () => fixture.debugElement.query(By.directive(LoaderComponent))?.componentInstance as LoaderComponent | undefined;
      expect(loader()?.visible()).toBeTrue();
      expect(component.saving()).toBeTrue();
      const duplicate = submit();
      expect(vehicles[action]).toHaveBeenCalledTimes(1);
      mutation.resolve({ success: true });
      await Promise.resolve();
      expect(component.saving()).toBeTrue();
      refresh.resolve();
      await pending;
      await duplicate;
      await fixture.whenStable();
      expect(component.saving()).toBeFalse();
      expect(loader()?.visible()).toBeFalse();
    });

    it(`releases loading and shows failure if ${action} rejects`, async () => {
      vehicles[action].and.rejectWith(new Error('network'));
      const fixture = action === 'add' ? TestBed.createComponent(VehicleAddComponent) : TestBed.createComponent(VehicleEditComponent);
      await fixture.whenStable();
      const component = fixture.componentInstance;
      component.plate.set('1234ZZZ');
      await (action === 'remove' ? (component as VehicleEditComponent).confirmRemove() : component.save());
      expect(component.saving()).toBeFalse();
      expect(
        action === 'add' ? (component as VehicleAddComponent).addFailed() : (component as VehicleEditComponent).deleteFailed(),
      ).toBeTrue();
    });
  }

  it('does not start loading for an invalid plate', async () => {
    const component = TestBed.createComponent(VehicleAddComponent).componentInstance;
    await component.save();
    expect(component.saving()).toBeFalse();
    expect(vehicles.add).not.toHaveBeenCalled();
  });
});
