import { Injectable, inject } from '@angular/core';
import { OperationsService, type ActiveParking } from './operations.service';
import { ParkingApiService } from './parking-api.service';

export type StartParkingInput = ActiveParking & { amount: number };

@Injectable({ providedIn: 'root' })
export class ParkingSessionService {
  private readonly operationsService = inject(OperationsService);
  private readonly parkingApi = inject(ParkingApiService);

  readonly activeParkings = this.operationsService.activeParkings;
  readonly activeParkingsCount = this.operationsService.activeParkingsCount;
  readonly hasActiveParkings = this.operationsService.hasActiveParkings;

  startParking(input: StartParkingInput): ActiveParking | null {
    const started = this.operationsService.startParking(input);
    return started ? (this.operationsService.getActiveParking(input.id) ?? null) : null;
  }

  async leaveParking(parkingId: string): Promise<boolean> {
    const parking = this.operationsService.getActiveParking(parkingId);
    if (!parking) return false;
    const result = await this.parkingApi.unpark({
      contractId: parking.contractId ?? 0,
      plate: parking.plate,
      ticketId: parking.tariffId,
    });
    return result.success ? this.operationsService.unpark(parkingId, result.refundAmount) : false;
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
}
