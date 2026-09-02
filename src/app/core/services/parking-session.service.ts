import { Injectable, inject, signal } from '@angular/core';
import { OperationsService, type ActiveParking } from './operations.service';
import { ParkingApiService, type UnparkingQuoteResult } from './parking-api.service';
import { ParkingTicketStoreService } from './parking-ticket-store.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class ParkingSessionService {
  private readonly operationsService = inject(OperationsService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly ticketStore = inject(ParkingTicketStoreService);
  private readonly walletService = inject(WalletService);

  readonly activeParkings = this.operationsService.activeParkings;
  readonly activeParkingsCount = this.operationsService.activeParkingsCount;
  readonly hasActiveParkings = this.operationsService.hasActiveParkings;
  readonly activeSource = this.operationsService.activeSource;
  readonly unparkError = signal<string | null>(null);

  async quoteUnparking(parkingId: string): Promise<UnparkingQuoteResult> {
    const parking = this.operationsService.getActiveParking(parkingId);
    if (!parking?.contractId) {
      return { success: false, source: 'remote', error: new Error('No se encontró el aparcamiento activo.') };
    }
    const storedTicket = this.ticketStore.getByPlate(parking.plate)?.ticketId;
    return this.parkingApi.queryUnparking({
      contractId: parking.contractId,
      plate: parking.plate,
      ...(parking.sectorId ? { groupId: parking.sectorId } : {}),
      ticketId: storedTicket && storedTicket > 0 ? storedTicket : parking.tariffId,
    });
  }

  async leaveParking(parkingId: string, preparedQuote?: UnparkingQuoteResult): Promise<boolean> {
    this.unparkError.set(null);
    const parking = this.operationsService.getActiveParking(parkingId);
    if (!parking?.contractId) {
      this.unparkError.set('No se encontró el aparcamiento activo.');
      return false;
    }
    const storedTicket = this.ticketStore.getByPlate(parking.plate)?.ticketId;
    const input = {
      contractId: parking.contractId,
      plate: parking.plate,
      ...(parking.sectorId ? { groupId: parking.sectorId } : {}),
      ticketId: storedTicket && storedTicket > 0 ? storedTicket : parking.tariffId,
      ...(parking.operationDate ? { datetime: parking.operationDate } : {}),
    };
    const result = preparedQuote ? await this.parkingApi.unpark(input, preparedQuote) : await this.parkingApi.unpark(input);
    if (!result.success) {
      this.operationsService.restoreActiveParking(parking);
      const error = result.error;
      this.unparkError.set(error instanceof Error ? error.message : 'No se pudo completar el desaparcar.');
      return false;
    }
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

  async loadParkingStatuses(vehicles: readonly { id: string; plate: string }[], contractId?: number): Promise<void> {
    await this.operationsService.loadParkingStatuses(vehicles, contractId);
  }
}
