import { Injectable, inject } from '@angular/core';
import { CitiesService } from './cities.service';
import { LocationSettingsService } from './location-settings.service';
import { OperationsService, type ActiveParking } from './operations.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { ParkingApiService } from './parking-api.service';

export type StartParkingInput = ActiveParking & { amount: number };

export interface RemoteParkingStatus {
  isParked: boolean;
  zone?: string;
  sector?: string;
  startTime?: string;
  endTime?: string;
}

interface ParkingStatusApiValue {
  zonename?: string | null;
  zone?: string | null;
  sectorname?: string | null;
  sector?: string | null;
  dateInitial?: string | null;
  dateEnd?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ParkingSessionService {
  private readonly operationsService = inject(OperationsService);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly citiesService = inject(CitiesService);
  private readonly locationSettings = inject(LocationSettingsService);
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

  async queryParkingStatus(plate: string): Promise<RemoteParkingStatus> {
    const token = this.session.token();
    if (!token) return { isParked: false };

    for (const contractId of this.contractIdsToCheck()) {
      try {
        const value = await this.api.post<ParkingStatusApiValue>(
          OPS_ENDPOINTS.parking.parkingStatus,
          { contractId, plate, date: this.todayDateString() },
          { token },
        );
        if (!value || typeof value !== 'object') continue;
        return {
          isParked: true,
          zone: value.zonename ?? value.zone ?? undefined,
          sector: value.sectorname ?? value.sector ?? undefined,
          startTime: value.dateInitial ?? undefined,
          endTime: value.dateEnd ?? undefined,
        };
      } catch {
        // Sin aparcamiento activo en este contrato o respuesta inválida: se prueba el siguiente.
      }
    }
    return { isParked: false };
  }

  private contractIdsToCheck(): number[] {
    const all = this.citiesService.knownContractIds();
    const preferredCityId = this.locationSettings.settings().preferredCityId;
    if (!preferredCityId) return all;
    const preferred = this.citiesService.contractIdFor(preferredCityId);
    return [preferred, ...all.filter((id) => id !== preferred)];
  }

  private todayDateString(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${now.getFullYear()}`;
  }
}
