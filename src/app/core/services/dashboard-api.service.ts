import { Injectable, inject, signal } from '@angular/core';
import { OperationsService } from './operations.service';
import { VehicleService } from './vehicle.service';
import { WalletService } from './wallet.service';
import { AppApiClient } from '../api/app-api-client.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly operations = inject(OperationsService);
  private readonly vehiclesService = inject(VehicleService);
  private readonly wallet = inject(WalletService);

  private readonly api = inject(AppApiClient);
  readonly source = signal<'remote' | 'mock'>('mock');
  readonly activeParkings = signal<unknown[]>([]);
  readonly recentOperations = signal<unknown[]>([]);
  readonly vehicles = signal<unknown[]>([]);
  readonly balance = signal<unknown | null>(null);
  readonly profileProgress = signal<unknown | null>(null);

  async load(): Promise<void> {
    try {
      const [active, operations, vehicles, balance, progress] = await Promise.all([
        this.api.get<unknown[]>('/parkings/active'),
        this.api.get<unknown[]>('/operations/recent'),
        this.api.get<unknown[]>('/vehicles'),
        this.api.get<unknown>('/wallet/balance'),
        this.api.get<unknown>('/users/profile/progress'),
      ]);
      this.activeParkings.set(active);
      this.recentOperations.set(operations);
      this.vehicles.set(vehicles);
      this.balance.set(balance);
      this.profileProgress.set(progress);
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Dashboard usa datos mock', error);
      this.source.set('mock');
    }
  }
}
