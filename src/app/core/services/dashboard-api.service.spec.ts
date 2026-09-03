import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DashboardApiService } from './dashboard-api.service';
import { OperationsService } from './operations.service';
import { VehicleService } from './vehicle.service';
import { WalletService } from './wallet.service';
import { UserService } from './user.service';
import { OpsSessionService } from '../api/ops-session.service';

describe('DashboardApiService', () => {
  it('does not block dashboard data while parking statuses are still loading', async () => {
    const pendingParkingStatuses = new Promise<void>(() => undefined);
    const operations = {
      load: jasmine.createSpy('load').and.resolveTo(),
      loadDashboardParkingStatuses: jasmine.createSpy('loadDashboardParkingStatuses').and.returnValue(pendingParkingStatuses),
      source: signal<'remote'>('remote'),
      activeParkings: signal([]),
      operations: signal([]),
    };
    const vehicles = {
      load: jasmine.createSpy('load').and.resolveTo(),
      source: signal<'remote'>('remote'),
      vehicles: signal([{ id: 'a', plate: 'AAA111', isDefault: true }]),
    };
    const wallet = {
      load: jasmine.createSpy('load').and.resolveTo(),
      source: signal<'remote'>('remote'),
      balance: signal(10),
    };
    const user = {
      load: jasmine.createSpy('load').and.resolveTo(),
      source: signal<'remote'>('remote'),
      user: signal({
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        nif: '',
        phone: '',
        address: { street: '', city: '', postalCode: '' },
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OperationsService, useValue: operations },
        { provide: VehicleService, useValue: vehicles },
        { provide: WalletService, useValue: wallet },
        { provide: UserService, useValue: user },
        { provide: OpsSessionService, useValue: { token: () => 'session-token' } },
      ],
    });
    const service = TestBed.inject(DashboardApiService);

    await service.load();

    expect(service.source()).toBe('remote');
    expect(operations.loadDashboardParkingStatuses).toHaveBeenCalledOnceWith(vehicles.vehicles());
  });
});
