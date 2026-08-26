import { Injectable, inject } from '@angular/core';
import { OperationsService, type ActiveParking } from './operations.service';
import { ParkingApiService } from './parking-api.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class ParkingSessionService {
  private readonly operationsService = inject(OperationsService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly walletService = inject(WalletService);

  readonly activeParkings = this.operationsService.activeParkings;
  readonly activeParkingsCount = this.operationsService.activeParkingsCount;
  readonly hasActiveParkings = this.operationsService.hasActiveParkings;
  readonly activeSource = this.operationsService.activeSource;

  async leaveParking(parkingId: string): Promise<boolean> {
    const parking = this.operationsService.getActiveParking(parkingId);
    if (!parking?.contractId) return false;
    const result = await this.parkingApi.unpark({
      contractId: parking.contractId,
      plate: parking.plate,
      ticketId: parking.tariffId,
    });
    if (!result.success) return false;
    await Promise.all([
      this.operationsService.load(),
      this.walletService.load(),
      this.operationsService.loadParkingStatuses([{ id: parking.vehicleId, plate: parking.plate }], parking.contractId),
    ]);
    return true;
  }

  extendParking(parkingId: string, minutes: number): boolean {
    const parking = this.operationsService.getActiveParking(parkingId);
    return Boolean(parking && minutes > 0);
  }

  isVehicleParked(vehicleIdOrPlate: string): boolean {
    return this.operationsService.isVehicleParked(vehicleIdOrPlate) || this.operationsService.isPlateParked(vehicleIdOrPlate);
  }

  getByVehicle(vehicleIdOrPlate: string): ActiveParking | undefined {
    return this.activeParkings().find((parking) => parking.vehicleId === vehicleIdOrPlate || parking.plate === vehicleIdOrPlate);
  }

  async loadParkingStatuses(vehicles: readonly { id: string; plate: string }[]): Promise<void> {
    await this.operationsService.loadParkingStatuses(vehicles);
  }
}
