import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OpsApiClient } from '../../core/api/ops-api-client.service';
import { DashboardApiService } from '../../core/services/dashboard-api.service';
import { NavigationToCarService } from '../../core/services/navigation-to-car.service';
import { OperationsService } from '../../core/services/operations.service';
import { ParkingSessionService } from '../../core/services/parking-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { UnpaidFinesService } from '../../core/services/unpaid-fines.service';
import { UserService } from '../../core/services/user.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { WalletService } from '../../core/services/wallet.service';
import { HomeComponent } from '../home/home.component';
import { OperationsLayoutComponent } from '../operations/operations-layout/operations-layout.component';

for (const component of [HomeComponent, OperationsLayoutComponent]) {
  describe(`${component.name} unparking failure`, () => {
    it('dismisses the confirmation and exposes the error without repeating the request', async () => {
      const error = signal<string | null>(null);
      const leave = jasmine.createSpy('leaveParking').and.callFake(async () => {
        error.set('OPS rejected the confirmation');
        return false;
      });
      TestBed.configureTestingModule({ providers: [
        provideZonelessChangeDetection(), provideRouter([]),
        { provide: OpsApiClient, useValue: {} },
        { provide: OperationsService, useValue: { operations: signal([]), activeLoading: signal(false), source: signal('remote') } },
        { provide: ParkingSessionService, useValue: { activeParkings: signal([]), unparkError: error, leaveParking: leave } },
        { provide: DashboardApiService, useValue: { source: signal('remote'), load: async () => {} } },
        { provide: NavigationToCarService, useValue: {} },
        { provide: UserService, useValue: { user: signal({}) } },
        { provide: VehicleService, useValue: { mainVehicle: signal(undefined) } },
        { provide: WalletService, useValue: {} },
        { provide: UnpaidFinesService, useValue: { fines: signal([]) } },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ] });
      const instance = TestBed.runInInjectionContext(() => component === HomeComponent ? new HomeComponent() : new OperationsLayoutComponent());
      instance.confirmUnpark.set(true);
      instance.pendingUnparkAmount.set(5.3);
      await instance.confirmUnparkAction();
      expect(instance.confirmUnpark()).toBeFalse();
      expect(instance.unparkError()).toBe('OPS rejected the confirmation');
      expect(instance.unparked()).toBeFalse();
      expect(instance.unparking()).toBeFalse();
      expect(instance.pendingUnparkAmount()).toBeNull();
      await instance.confirmUnparkAction();
      expect(leave).toHaveBeenCalledTimes(1);
    });
  });
}
