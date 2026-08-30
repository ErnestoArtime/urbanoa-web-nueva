import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NEVER } from 'rxjs';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import type { Vehicle } from '../../../shared/models/vehicle';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingWizardLayoutComponent } from './parking-wizard-layout.component';

describe('ParkingWizardLayoutComponent', () => {
  it('returns to tariffs and removes stale tariff data when the vehicle changes in a later step', () => {
    const vehicles: Vehicle[] = [
      { id: '1234567', plate: '1234567', isDefault: true },
      { id: '56789AB', plate: '56789AB', isDefault: false },
    ];
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    const router = {
      events: NEVER,
      url: '/app/parking/time-steps',
      parseUrl: () => ({ queryParams: {} }),
      navigate,
    };
    const vehicleService = {
      vehicles: signal(vehicles).asReadonly(),
      source: signal<'remote'>('remote').asReadonly(),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
        { provide: VehicleService, useValue: vehicleService },
        { provide: ParkingSessionService, useValue: { isVehicleParked: () => false } },
      ],
    });
    const store = TestBed.inject(ParkingFlowStore);
    store.update({
      cityId: '3',
      zoneId: '10002',
      street: 'Z_2_AZUL_03',
      vehicleId: '1234567',
      plate: '1234567',
      ticketId: '4',
      tariffId: '4',
      tariffName: 'Rotación',
      minutes: '60',
      amount: '1,50 €',
    });
    const component = TestBed.runInInjectionContext(() => new ParkingWizardLayoutComponent());

    component.selectVehicle(vehicles[1]);

    expect(navigate).toHaveBeenCalledWith(['/app/parking/tickets'], {
      relativeTo: undefined,
      queryParams: jasmine.objectContaining({ cityId: '3', plate: '56789AB', vehicleId: '56789AB' }),
    });
    const queryParams = navigate.calls.mostRecent().args[1].queryParams as Record<string, string>;
    expect(queryParams['tariffId']).toBeUndefined();
    expect(queryParams['minutes']).toBeUndefined();
    expect(queryParams['amount']).toBeUndefined();
  });
});
