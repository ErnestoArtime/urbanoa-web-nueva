import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingTicketsComponent } from './tickets.component';

describe('ParkingTicketsComponent', () => {
  it('reloads tariffs with the newly selected plate', async () => {
    const parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['tickets', 'opsDate', 'serverNow']);
    parkingApi.tickets.and.resolveTo({ data: [], source: 'remote' });
    parkingApi.serverNow.and.returnValue(new Date(2026, 7, 28, 12, 0));
    parkingApi.opsDate.and.returnValue('120000280826');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const store = TestBed.inject(ParkingFlowStore);
    store.update({
      cityId: '3',
      zoneId: '10002',
      street: 'Z_2_AZUL_03',
      streetId: '2401',
      sectorId: '22002',
      vehicleId: '1234567',
      plate: '1234567',
    });
    const component = TestBed.runInInjectionContext(() => new ParkingTicketsComponent());
    await component.ngOnInit();

    store.selectVehicle('56789AB', '56789AB');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(parkingApi.tickets).toHaveBeenCalledTimes(2);
    expect(parkingApi.tickets.calls.mostRecent().args[0].plate).toBe('56789AB');
  });
});
