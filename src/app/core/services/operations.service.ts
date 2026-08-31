import { Injectable, computed, inject, signal } from '@angular/core';
import { OperationType } from '../../shared/models/operation-type';
import type { Operation } from '../../shared/models/operation';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { CitiesService } from './cities.service';
import { LocationSettingsService } from './location-settings.service';
import { formatOpsCalendarDate, formatOpsDate, formatOpsTime, parseOpsDate } from '../utils/ops-date';

interface OperationResponseDto {
  contractId?: number;
  contractName?: string | null;
  operationNumber?: number | string | null;
  operationType: number;
  paymentAmount?: number | null;
  opDate: string;
  plate?: string | null;
  zoneDesc?: string | null;
  sectorDesc?: string | null;
  parkingStartDate?: string | null;
  parkingEndDate?: string | null;
  duration?: number;
  parkingDuration?: number;
  opBaseId?: number | string | null;
  idPaymentMethod1?: number;
  descPaymentMethod1?: string;
  amountPaymentMethod1?: number;
  idPaymentMethod2?: number | null;
  descPaymentMethod2?: string | null;
  amountPaymentMethod2?: number | null;
  zoneId?: number;
  sectorId?: number;
  sectorColor?: string | null;
  cityId?: number;
  cityName?: string | null;
  fineNumber?: string | null;
  fineProcessingDate?: string | null;
  farticle?: string | null;
  fineArticle?: string | null;
  fcolor?: string | null;
  fmake?: string | null;
  fineStatus?: number | null;
  fstreet?: string | null;
  fineStreet?: string | null;
  fstrnum?: string | null;
  fineStreetNumber?: string | null;
  fineValidDate?: string | null;
  fineAmount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ActiveParking {
  id: string;
  plate: string;
  vehicleId: string;
  zone: string;
  startTime: string;
  durationLabel: string;
  timeRemaining: string;
  endTime: string;
  latitude?: number;
  longitude?: number;
  street?: string;
  operationId?: string;
  paymentBreakdown?: Operation['paymentBreakdown'];
  cardId?: string;
  cardLabel?: string;
  contractId?: number;
  tariffId?: number;
  sectorId?: number;
}

interface ParkingStatusResponseDto {
  status: number;
  extension: number;
  tariffId: number;
  dateInitial: string;
  dateEnd: string;
  accumulatedTime: number;
  sector?: string;
  sectorname?: string;
  zonename?: string;
  latitude?: number;
  longitude?: number;
  operationDate?: string;
  streetname?: string;
}

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly citiesService = inject(CitiesService);
  private readonly locationSettings = inject(LocationSettingsService);
  private readonly _operations = signal<Operation[]>([]);
  private readonly _activeParkings = signal<ActiveParking[]>([]);
  private readonly operationsLoadsInFlight = new Map<string, Promise<void>>();
  private dashboardParkingStatusesInFlight: Promise<void> | null = null;

  readonly operations = this._operations.asReadonly();
  readonly activeParkings = this._activeParkings.asReadonly();
  readonly activeParkingsCount = computed(() => this._activeParkings().length);
  readonly hasActiveParkings = computed(() => this._activeParkings().length > 0);
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');
  readonly activeSource = signal<'idle' | 'remote' | 'error'>('idle');
  readonly loading = signal(false);

  load(dateStart?: string, dateEnd?: string, operationTypeList = [1, 2, 3, 4, 5, 7, 101, 102, 103, 104]): Promise<void> {
    const year = new Date().getFullYear();
    const effectiveStart = dateStart ?? `${year}-01-01`;
    const effectiveEnd = dateEnd ?? `${year}-12-31`;
    const requestKey = JSON.stringify([effectiveStart, effectiveEnd, operationTypeList]);
    const inFlight = this.operationsLoadsInFlight.get(requestKey);
    if (inFlight) return inFlight;

    const request = this.loadRemote(effectiveStart, effectiveEnd, operationTypeList);
    const tracked = request.finally(() => {
      if (this.operationsLoadsInFlight.get(requestKey) === tracked) this.operationsLoadsInFlight.delete(requestKey);
    });
    this.operationsLoadsInFlight.set(requestKey, tracked);
    return tracked;
  }

  private async loadRemote(effectiveStart: string, effectiveEnd: string, operationTypeList: number[]): Promise<void> {
    const token = this.session.token();
    if (!token) {
      this._operations.set([]);
      this.source.set('error');
      return;
    }
    this.loading.set(true);
    try {
      const response = await this.api.post<OperationResponseDto[]>(
        OPS_ENDPOINTS.user.operations,
        {
          contractId: 0,
          dateStart: this.queryDate(effectiveStart, false),
          dateEnd: this.queryDate(effectiveEnd, true),
          operationTypeList,
        },
        { token },
      );
      this._operations.set(response.map((item) => this.mapRemoteOperation(item)));
      this.source.set('remote');
    } catch (error) {
      this._operations.set([]);
      this.source.set('error');
    } finally {
      this.loading.set(false);
    }
  }

  async loadDetail(id: string): Promise<Operation | undefined> {
    const cached = this.getOperationById(id);
    if (cached) return cached;
    await this.load();
    return this.getOperationById(id);
  }

  async loadParkingStatuses(vehicles: readonly { id: string; plate: string }[], contractId?: number): Promise<void> {
    await this.loadParkingStatusesFromContracts(vehicles, () => (contractId ? [contractId] : this.contractIdsToCheck()), contractId);
  }

  loadDashboardParkingStatuses(vehicles: readonly { id: string; plate: string }[]): Promise<void> {
    if (this.dashboardParkingStatusesInFlight) return this.dashboardParkingStatusesInFlight;
    const preferredCityId = this.locationSettings.settings().preferredCityId;
    const preferredContractId = preferredCityId ? this.citiesService.contractIdFor(preferredCityId) : 0;
    const request = this.loadParkingStatusesFromContracts(vehicles, (vehicle) => {
      const recentContractId = this.latestParkingContractId(vehicle.plate);
      const allContracts = this.contractIdsToCheck();
      return [recentContractId ?? 0, preferredContractId, ...allContracts].filter((id) => id > 0);
    });
    const tracked = request.finally(() => {
      if (this.dashboardParkingStatusesInFlight === tracked) this.dashboardParkingStatusesInFlight = null;
    });
    this.dashboardParkingStatusesInFlight = tracked;
    return tracked;
  }

  private async loadParkingStatusesFromContracts(
    vehicles: readonly { id: string; plate: string }[],
    contractsFor: (vehicle: { id: string; plate: string }) => readonly number[],
    scopedContractId?: number,
  ): Promise<void> {
    const token = this.session.token();
    if (!token) {
      this._activeParkings.set([]);
      this.activeSource.set('error');
      return;
    }
    if (vehicles.length === 0) {
      this._activeParkings.set([]);
      this.activeSource.set('remote');
      return;
    }

    const date = this.opsDate(this.api.serverNow ? this.api.serverNow() : new Date());
    const results = await Promise.allSettled(
      vehicles.map(async (vehicle) => {
        const contractIds = [...new Set(contractsFor(vehicle).filter((id) => id > 0))];
        let answered = contractIds.length === 0;
        for (const id of contractIds) {
          try {
            const status = await this.api.postOrNull<ParkingStatusResponseDto>(
              OPS_ENDPOINTS.parking.parkingStatus,
              { contractId: id, plate: vehicle.plate, date },
              { token },
            );
            answered = true;
            if (status?.status === 2) {
              const parking = this.mapParkingStatus(vehicle, id, status);
              this.upsertActiveParking(parking);
              this.activeSource.set('remote');
              return parking;
            }
          } catch {
            // Error de red/backend para este contrato: se prueba el siguiente.
          }
        }
        if (!answered) throw new Error(`${vehicle.plate}: sin respuesta de ningún contrato`);
        return null;
      }),
    );

    // Un fallo total de red no significa que los aparcamientos hayan terminado.
    // Conservamos el último estado confirmado para que un refresco no lo borre.
    if (results.every((result) => result.status === 'rejected')) {
      this.activeSource.set('error');
      return;
    }

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value === null) {
        this.removeActiveParking(vehicles[index].plate, scopedContractId);
      }
    });
    const failedPlates = new Set(results.flatMap((result, index) => (result.status === 'rejected' ? [vehicles[index].plate] : [])));

    this.activeSource.set(failedPlates.size === 0 ? 'remote' : 'error');
  }

  private upsertActiveParking(parking: ActiveParking): void {
    const plate = this.normalizePlate(parking.plate);
    this._activeParkings.update((current) => [...current.filter((item) => this.normalizePlate(item.plate) !== plate), parking]);
  }

  private removeActiveParking(plate: string, contractId?: number): void {
    const normalized = this.normalizePlate(plate);
    this._activeParkings.update((current) =>
      current.filter(
        (parking) => this.normalizePlate(parking.plate) !== normalized || (contractId !== undefined && parking.contractId !== contractId),
      ),
    );
  }

  private latestParkingContractId(plate: string): number | undefined {
    const normalizedPlate = plate.replace(/\s+/g, '').toLocaleUpperCase('es');
    const parkingTypes = new Set([OperationType.PARKING, OperationType.PARKING_EXTENSION, OperationType.REFUND]);
    return this._operations()
      .filter(
        (operation) =>
          parkingTypes.has(operation.type) &&
          operation.contractId != null &&
          operation.contractId > 0 &&
          operation.plate?.replace(/\s+/g, '').toLocaleUpperCase('es') === normalizedPlate,
      )
      .sort((a, b) => this.operationTimestamp(b) - this.operationTimestamp(a))[0]?.contractId;
  }

  private operationTimestamp(operation: Operation): number {
    const [day, month, year] = operation.date.split('/').map(Number);
    const [hours = 0, minutes = 0] = (operation.startTime ?? operation.endTime ?? '').split(':').map(Number);
    const timestamp = new Date(year, month - 1, day, hours, minutes).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private contractIdsToCheck(): number[] {
    const loaded = this.citiesService
      .cities()
      .map((city) => city.contractId)
      .filter((id) => id > 0);
    const all = loaded.length > 0 ? [...new Set(loaded)] : this.citiesService.knownContractIds();
    const preferredCityId = this.locationSettings.settings().preferredCityId;
    if (!preferredCityId) return all;
    const preferred = this.citiesService.contractIdFor(preferredCityId);
    return [preferred, ...all.filter((id) => id !== preferred)];
  }

  async loadReceipt(id: string): Promise<unknown | null> {
    const operation = await this.loadDetail(id);
    return operation ?? null;
  }

  isVehicleParked(vehicleId: string): boolean {
    return this._activeParkings().some((p) => p.vehicleId === vehicleId);
  }

  isPlateParked(plate: string): boolean {
    const normalizedPlate = this.normalizePlate(plate);
    return this._activeParkings().some((p) => this.normalizePlate(p.plate) === normalizedPlate);
  }

  getActiveParking(id: string): ActiveParking | undefined {
    return this._activeParkings().find((p) => p.id === id);
  }

  getOperationById(id: string): Operation | undefined {
    return this._operations().find((op) => op.id === id);
  }

  private todayDateString(): string {
    const d = this.api.serverNow ? this.api.serverNow() : new Date();
    return formatOpsCalendarDate(d);
  }

  private normalizePlate(plate: string): string {
    return plate.replace(/\s+/g, '').toLocaleUpperCase('es');
  }

  private mapParkingStatus(vehicle: { id: string; plate: string }, contractId: number, status: ParkingStatusResponseDto): ActiveParking {
    const start = this.parseOpsDate(status.dateInitial);
    const end = this.parseOpsDate(status.dateEnd);
    const remainingMs = Math.max(0, end.getTime() - Date.now());
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(remainingSeconds % 60).padStart(2, '0');
    return {
      id: `remote-${vehicle.plate}`,
      plate: vehicle.plate,
      vehicleId: vehicle.id,
      zone: status.sectorname || status.zonename || status.sector || '',
      startTime: this.timeLabel(start),
      durationLabel: `${status.accumulatedTime ?? 0} min`,
      timeRemaining: `${hours}:${minutes}:${seconds}`,
      endTime: this.timeLabel(end),
      latitude: status.latitude,
      longitude: status.longitude,
      street: status.streetname,
      operationId: status.operationDate || status.dateInitial,
      contractId,
      tariffId: status.tariffId,
      sectorId: Number(status.sector ?? 0) || undefined,
    };
  }

  private opsDate(date: Date): string {
    return formatOpsDate(date);
  }

  private queryDate(value: string, endOfDay: boolean): string {
    if (/^\d{12}$/.test(value)) return value;
    const parsed = parseOpsDate(`${endOfDay ? '23:59:59' : '00:00:00'}${value.slice(8, 10)}${value.slice(5, 7)}${value.slice(2, 4)}`);
    return this.opsDate(Number.isNaN(parsed.getTime()) ? (endOfDay ? new Date(2099, 11, 31, 23, 59, 59) : new Date(2000, 0, 1)) : parsed);
  }

  private parseOpsDate(value: string): Date {
    if (/^\d{12}$/.test(value)) {
      return parseOpsDate(value);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private timeLabel(date: Date): string {
    return formatOpsTime(date);
  }

  private mapRemoteOperation(item: OperationResponseDto): Operation {
    const remoteAmount =
      item.operationType === OperationType.UNPAID_FINES && !item.paymentAmount ? (item.fineAmount ?? 0) : (item.paymentAmount ?? 0);
    const amount = remoteAmount / 100;
    const start = this.dateTimePart(item.parkingStartDate);
    const end = this.dateTimePart(item.parkingEndDate);
    const duration = item.parkingDuration ?? item.duration;
    const fineStatus = [1, 2, 3].includes(item.fineStatus ?? 0) ? (item.fineStatus as 1 | 2 | 3) : undefined;
    return {
      id: String(item.operationNumber ?? item.opBaseId ?? `${item.operationType}-${item.opDate}-${item.plate ?? ''}`),
      type: (Object.values(OperationType).includes(item.operationType) ? item.operationType : OperationType.PARKING) as OperationType,
      plate: item.plate ?? null,
      date: this.datePart(item.opDate),
      amount: [OperationType.TOP_UP, OperationType.REFUND].includes(item.operationType) ? amount : -Math.abs(amount),
      zone: item.sectorDesc ?? item.zoneDesc ?? null,
      startTime: start ?? this.dateTimePart(item.opDate),
      endTime: end,
      durationLabel: duration ? `${duration} min` : undefined,
      relatedOperationId: item.opBaseId ? String(item.opBaseId) : undefined,
      cardId: item.idPaymentMethod2 ? String(item.idPaymentMethod2) : undefined,
      cardLabel: item.descPaymentMethod2 ?? undefined,
      paymentBreakdown: {
        walletAmount: Math.abs(item.amountPaymentMethod1 ?? 0) / 100,
        cardAmount: Math.abs(item.amountPaymentMethod2 ?? 0) / 100,
        cardLabel: item.descPaymentMethod2 ?? undefined,
      },
      contractId: item.contractId,
      contractName: item.contractName ?? undefined,
      fineNumber: item.fineNumber ?? undefined,
      fineProcessingDate: this.dateTimeLabel(item.fineProcessingDate),
      fineArticle: item.fineArticle ?? item.farticle ?? undefined,
      fineVehicleColor: item.fcolor ?? undefined,
      fineVehicleMake: item.fmake ?? undefined,
      fineStatus,
      fineStreet: item.fineStreet ?? item.fstreet ?? undefined,
      fineStreetNumber: item.fineStreetNumber ?? item.fstrnum ?? undefined,
      fineValidDate: this.datePartOptional(item.fineValidDate),
      fineAmount: item.fineAmount == null ? undefined : Math.abs(item.fineAmount) / 100,
      cityId: item.cityId,
      cityName: item.cityName ?? undefined,
      zoneId: item.zoneId,
      zoneName: item.zoneDesc ?? undefined,
      sectorId: item.sectorId,
      sectorName: item.sectorDesc ?? undefined,
      latitude: item.latitude ?? undefined,
      longitude: item.longitude ?? undefined,
    };
  }

  private datePartOptional(value: string | null | undefined): string | undefined {
    return value ? this.datePart(value) : undefined;
  }

  private dateTimeLabel(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const date = this.datePart(value);
    const time = this.dateTimePart(value);
    return time ? `${date} | ${time}` : date;
  }

  private datePart(value: string | null | undefined): string {
    if (!value) return this.todayDateString();
    const parsed = this.parseBackendDate(value);
    return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : formatOpsCalendarDate(parsed);
  }

  private dateTimePart(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const parsed = this.parseBackendDate(value);
    return Number.isNaN(parsed.getTime()) ? value.slice(11, 16) : formatOpsTime(parsed);
  }

  private parseBackendDate(value: string): Date {
    if (/^\d{12}$/.test(value)) {
      return parseOpsDate(value);
    }
    return new Date(value);
  }
}
