import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingSuccessComponent } from './success.component';
import { OperationType } from '../../../shared/models/operation-type';

describe('Parking success authoritative receipt', () => {
  it('uses the confirmed operation dates and values instead of query parameters', async () => {
    const operations = { source: signal('remote'), load: jasmine.createSpy().and.resolveTo(), syncActiveParkingsFromOperations: jasmine.createSpy(),
      operations: signal([{ id: '1-42', operationNumber: '42', type: OperationType.PARKING, plate: 'REAL', date: '10/09/2026', amount: -2,
        startDate: '10/09/2026', endDate: '11/09/2026', startTime: '23:30', endTime: '01:30', sectorColor: '#008800' }]) };
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ operationId: '42', plate: 'FAKE', amount: '99', mode: 'parking' }) } } },
      { provide: OperationsService, useValue: operations },
      { provide: WalletService, useValue: { load: jasmine.createSpy().and.resolveTo() } },
      { provide: VehicleService, useValue: { vehicles: signal([]) } },
    ] });
    TestBed.overrideComponent(ParkingSuccessComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(ParkingSuccessComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.query().plate).toBe('REAL');
    expect(fixture.componentInstance.startDayLabel()).not.toBe('parking.success.today');
    expect(fixture.componentInstance.query().amount).not.toBe('99');
    expect(fixture.componentInstance.sectorColor()).toBe('#008800');
    fixture.componentInstance.now.set(new Date('2026-09-10T21:30:00Z').getTime());
    expect(fixture.componentInstance.countdown()).toBe('02:00:00');
    fixture.componentInstance.now.update(value => value + 1000);
    expect(fixture.componentInstance.countdown()).toBe('01:59:59');
    fixture.componentInstance.now.set(new Date('2026-09-11T23:00:00Z').getTime());
    expect(fixture.componentInstance.countdown()).toBe('00:00:00');
    fixture.componentInstance.now.set(new Date('2026-09-09T23:00:00Z').getTime());
    expect(fixture.componentInstance.countdown()).toContain('parking.success.startsLater');
    operations.operations.set([]);
    await fixture.componentInstance.loadReceipt();
    expect(fixture.componentInstance.receipt()).toBeNull();
    expect(fixture.componentInstance.query().plate).toBe('');
    fixture.destroy();
  });
});
