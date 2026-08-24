import { computed, Injectable, inject, signal } from '@angular/core';
import { OperationsService } from './operations.service';
import { VehicleService } from './vehicle.service';
import { WalletService } from './wallet.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly operations = inject(OperationsService);
  private readonly vehiclesService = inject(VehicleService);
  private readonly wallet = inject(WalletService);
  private readonly userService = inject(UserService);
  readonly source = signal<'remote' | 'mock'>('mock');
  readonly activeParkings = this.operations.activeParkings;
  readonly recentOperations = this.operations.operations;
  readonly vehicles = this.vehiclesService.vehicles;
  readonly balance = this.wallet.balance;
  readonly profileProgress = computed(() => {
    const user = this.userService.user();
    const values = [user.name, user.surname, user.email, user.nif, user.phone, user.street, user.city, user.postalCode];
    return Math.round((values.filter(Boolean).length / values.length) * 100);
  });

  async load(): Promise<void> {
    await Promise.all([this.operations.load(), this.vehiclesService.load(), this.wallet.load(), this.userService.load()]);
    await this.operations.loadParkingStatuses(this.vehiclesService.vehicles());
    const allRemote =
      this.operations.source() === 'remote' &&
      this.operations.activeSource() === 'remote' &&
      this.vehiclesService.source() === 'remote' &&
      this.wallet.source() === 'remote' &&
      this.userService.source() === 'remote';
    this.source.set(allRemote ? 'remote' : 'mock');
  }
}
