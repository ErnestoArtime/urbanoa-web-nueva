import { computed, Injectable, inject } from '@angular/core';
import { LocationSettingsService } from './location-settings.service';
import { UserService } from './user.service';
import { VehicleService } from './vehicle.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class AccountCompletionService {
  private readonly userService = inject(UserService);
  private readonly vehicleService = inject(VehicleService);
  private readonly walletService = inject(WalletService);
  private readonly locationSettingsService = inject(LocationSettingsService);

  readonly profileCompleted = computed(() => {
    const user = this.userService.user();
    return Boolean(user.name && user.surname && user.email && user.nif && user.phone);
  });
  readonly vehicleCompleted = computed(() => this.vehicleService.vehicles().length > 0);
  readonly paymentCompleted = computed(() => this.walletService.cards().length > 0);
  readonly locationCompleted = computed(() => this.locationSettingsService.isConfigured());

  readonly percent = computed(() => {
    const completed = [this.profileCompleted(), this.vehicleCompleted(), this.paymentCompleted(), this.locationCompleted()].filter(
      Boolean,
    ).length;

    return completed * 25;
  });

  readonly isComplete = computed(() => this.percent() === 100);
}
