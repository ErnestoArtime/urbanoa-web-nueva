import { Injectable, inject, signal } from '@angular/core';
import { OperationsService } from './operations.service';
import { VehicleService } from './vehicle.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly operations = inject(OperationsService);
  private readonly vehiclesService = inject(VehicleService);
  private readonly wallet = inject(WalletService);

  readonly source = signal<'remote' | 'mock'>('mock');
  readonly activeParkings = signal<unknown[]>([]);
  readonly recentOperations = signal<unknown[]>([]);
  readonly vehicles = signal<unknown[]>([]);
  readonly balance = signal<unknown | null>(null);
  readonly profileProgress = signal<unknown | null>(null);

  async load(): Promise<void> {
    try {
      await Promise.all([this.operations.load(), this.vehiclesService.load(), this.wallet.load()]);
      this.activeParkings.set(this.operations.activeParkings());
      this.recentOperations.set(this.operations.operations().slice(0, 5));
      this.vehicles.set(this.vehiclesService.vehicles());
      this.balance.set(this.wallet.balance());
      this.profileProgress.set(null);
      this.source.set([this.operations.source(), this.vehiclesService.source(), this.wallet.source()].includes('remote') ? 'remote' : 'mock');
    } catch (error) {
      console.warn('[OPS API] Dashboard usa datos mock', error);
      this.source.set('mock');
    }
  }
}
