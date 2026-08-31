import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AppEntryComponent } from './app-entry.component';

describe('AppEntryComponent', () => {
  it('navigates to home as soon as the first active parking is found', async () => {
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', ['load', 'findFirstActiveParking']);
    const vehicles = jasmine.createSpyObj<VehicleService>('VehicleService', ['load'], {
      vehicles: signal([
        { id: 'v1', plate: 'AAA111', isDefault: true },
        { id: 'v2', plate: 'BBB222', isDefault: false },
      ]).asReadonly(),
    });
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    operations.load.and.resolveTo();
    operations.findFirstActiveParking.and.resolveTo(true);
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

    expect(operations.findFirstActiveParking).toHaveBeenCalledOnceWith([
      jasmine.objectContaining({ id: 'v1', plate: 'AAA111' }),
      jasmine.objectContaining({ id: 'v2', plate: 'BBB222' }),
    ]);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/home'], { replaceUrl: true });
  });

  it('navigates directly to home without searching when there are no vehicles', async () => {
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', ['load', 'findFirstActiveParking']);
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

    expect(operations.findFirstActiveParking).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/home'], { replaceUrl: true });
  });
});
