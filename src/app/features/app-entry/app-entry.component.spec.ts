import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AppEntryComponent } from './app-entry.component';

describe('AppEntryComponent', () => {
  it('navigates to home when QueryUserOperationsAPI reports an active parking', async () => {
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', ['load'], {
      hasActiveParkingOperations: signal(true).asReadonly(),
    });
    const vehicles = jasmine.createSpyObj<VehicleService>('VehicleService', ['load'], {
      vehicles: signal([
        { id: 'v1', plate: 'AAA111', isDefault: true },
        { id: 'v2', plate: 'BBB222', isDefault: false },
      ]).asReadonly(),
    });
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    operations.load.and.resolveTo();
    vehicles.load.and.resolveTo();
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AppEntryComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: OperationsService, useValue: operations },
        { provide: VehicleService, useValue: vehicles },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(AppEntryComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    const fixture = TestBed.createComponent(AppEntryComponent);
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/home'], { replaceUrl: true });
  });

  it('navigates directly to home when there are no vehicles', async () => {
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', ['load'], {
      hasActiveParkingOperations: signal(false).asReadonly(),
    });
    const vehicles = jasmine.createSpyObj<VehicleService>('VehicleService', ['load'], {
      vehicles: signal([]).asReadonly(),
    });
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    operations.load.and.resolveTo();
    vehicles.load.and.resolveTo();
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AppEntryComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: OperationsService, useValue: operations },
        { provide: VehicleService, useValue: vehicles },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(AppEntryComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    const fixture = TestBed.createComponent(AppEntryComponent);
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/home'], { replaceUrl: true });
  });

  it('navigates to the parking map when there are vehicles and no active parking', async () => {
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', ['load'], {
      hasActiveParkingOperations: signal(false).asReadonly(),
    });
    const vehicles = jasmine.createSpyObj<VehicleService>('VehicleService', ['load'], {
      vehicles: signal([{ id: 'v1', plate: 'AAA111', isDefault: true }]).asReadonly(),
    });
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    operations.load.and.resolveTo();
    vehicles.load.and.resolveTo();
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AppEntryComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: OperationsService, useValue: operations },
        { provide: VehicleService, useValue: vehicles },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(AppEntryComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    const fixture = TestBed.createComponent(AppEntryComponent);
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/parking'], { replaceUrl: true });
  });
});
