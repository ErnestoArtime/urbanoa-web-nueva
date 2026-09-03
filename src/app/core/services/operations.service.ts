import { Injectable, computed, inject, signal } from '@angular/core';
import { OperationType } from '../../shared/models/operation-type';
import type { Operation } from '../../shared/models/operation';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OpsSessionService } from '../api/ops-session.service';
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
  timePeriod?: number | null;
  refundable?: number | string | null;
  extension?: number | string | null;
  ticketId?: number | null;
  ticketDesc?: string | null;
  pstreet?: string | null;
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
  sectorColor?: string;
  operationDate?: string;
  /** Mirrors the APK parking-status `extension` flag. */
  canExtend?: boolean;
  /** Backend unpark option: only value 2 grants permission to unpark. */
  refundable?: 0 | 1 | 2;
}

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly _operations = signal<Operation[]>([]);
  private readonly _activeParkings = signal<ActiveParking[]>([]);
  private readonly _activeLoading = signal(false);
  private readonly operationsLoadsInFlight = new Map<string, Promise<void>>();
  private activeLoadingRequests = 0;

  readonly operations = this._operations.asReadonly();
  readonly activeParkings = this._activeParkings.asReadonly();
  readonly activeParkingsCount = computed(() => this._activeParkings().length);
  readonly hasActiveParkings = computed(() => this._activeParkings().length > 0);
  readonly activeParkingOperations = computed(() =>
    this._operations().filter(
      (operation) =>
        operation.timePeriod === 2 && (operation.type === OperationType.PARKING || operation.type === OperationType.PARKING_EXTENSION),
    ),
  );
  readonly hasActiveParkingOperations = computed(() => this.activeParkingOperations().length > 0);
  readonly activeLoading = this._activeLoading.asReadonly();
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');
  readonly activeSource = signal<'idle' | 'remote' | 'error'>('idle');
  readonly loading = signal(false);
  readonly lastError = signal<string | null>(null);

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
      this.lastError.set('No hay una sesión OPS activa');
      this.source.set('error');
      return;
    }
    const requestBody = {
      contractId: 0,
      dateStart: this.queryDate(effectiveStart, false),
      dateEnd: this.queryDate(effectiveEnd, true),
      operationTypeList,
    };
    this.loading.set(true);
    this.lastError.set(null);
    try {
      const response = await this.api.post<OperationResponseDto[]>(OPS_ENDPOINTS.user.operations, requestBody, { token });
      this._operations.set(response.map((item) => this.mapRemoteOperation(item)));
      this.source.set('remote');
    } catch (error) {
      this._operations.set([]);
      this.lastError.set(error instanceof Error ? error.message : 'Error desconocido al cargar las operaciones');
      const errorDetails =
        error instanceof OpsApiError
          ? { kind: error.kind, status: error.status, backendError: error.backendError }
          : { message: error instanceof Error ? error.message : String(error) };
      console.warn('[OPS API] No se pudieron cargar las operaciones', JSON.stringify({ requestBody, error: errorDetails }));
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
    this.beginActiveLoading();
    try {
      await this.load();
      this.syncActiveParkingsFromOperations(vehicles, contractId);
    } finally {
      this.endActiveLoading();
    }
  }

  loadDashboardParkingStatuses(vehicles: readonly { id: string; plate: string }[]): Promise<void> {
    this.syncActiveParkingsFromOperations(vehicles);
    return Promise.resolve();
  }

  syncActiveParkingsFromOperations(vehicles: readonly { id: string; plate: string }[], contractId?: number): void {
    if (this.source() !== 'remote') {
      this._activeParkings.set([]);
      this.activeSource.set('error');
      return;
    }

    const parkings = this.activeParkingOperations()
      .filter((operation) => contractId === undefined || operation.contractId === contractId)
      .sort((a, b) => this.operationTimestamp(b) - this.operationTimestamp(a))
      .map((operation) => this.activeParkingFromOperation(operation, vehicles));
    this._activeParkings.set(parkings);
    this.activeSource.set('remote');
  }

  private upsertActiveParking(parking: ActiveParking): void {
    const plate = this.normalizePlate(parking.plate);
    this._activeParkings.update((current) => [...current.filter((item) => this.normalizePlate(item.plate) !== plate), parking]);
  }

  private activeParkingFromOperation(operation: Operation, vehicles: readonly { id: string; plate: string }[]): ActiveParking {
    const plate = operation.plate ?? '';
    const vehicle = vehicles.find((item) => this.normalizePlate(item.plate) === this.normalizePlate(plate));
    const end = this.operationDateTime(operation.endDate ?? operation.date, operation.endTime);
    const remainingSeconds = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
    const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(remainingSeconds % 60).padStart(2, '0');
    return {
      id: `operation-${operation.id}`,
      plate,
      vehicleId: vehicle?.id ?? plate,
      zone: operation.sectorName || operation.zoneName || operation.zone || '',
      startTime: operation.startTime ?? '',
      durationLabel: operation.durationLabel ?? '0 min',
      timeRemaining: `${hours}:${minutes}:${seconds}`,
      endTime: operation.endTime ?? '',
      latitude: operation.latitude,
      longitude: operation.longitude,
      street: operation.street,
      operationId: operation.id,
      operationDate: operation.operationDate,
      paymentBreakdown: operation.paymentBreakdown,
      cardId: operation.cardId,
      cardLabel: operation.cardLabel,
      contractId: operation.contractId,
      tariffId: operation.ticketId,
      sectorId: operation.sectorId,
      sectorColor: operation.sectorColor,
      canExtend: operation.extension === 2,
      refundable: operation.refundable,
    };
  }

  private beginActiveLoading(): void {
    this.activeLoadingRequests += 1;
    this._activeLoading.set(true);
  }

  private endActiveLoading(): void {
    this.activeLoadingRequests = Math.max(0, this.activeLoadingRequests - 1);
    this._activeLoading.set(this.activeLoadingRequests > 0);
  }

  private operationTimestamp(operation: Operation): number {
    if (operation.operationDate) return parseOpsDate(operation.operationDate).getTime();
    return this.operationDateTime(operation.date, operation.startTime ?? operation.endTime).getTime();
  }

  private operationDateTime(date: string, time?: string): Date {
    const [day, month, year] = date.split('/').map(Number);
    const [hours = 0, minutes = 0] = (time ?? '').split(':').map(Number);
    const timestamp = new Date(year, month - 1, day, hours, minutes).getTime();
    return new Date(Number.isNaN(timestamp) ? 0 : timestamp);
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

  restoreActiveParking(parking: ActiveParking): void {
    this.upsertActiveParking(parking);
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

  private opsDate(date: Date): string {
    return formatOpsDate(date);
  }

  private queryDate(value: string, endOfDay: boolean): string {
    if (/^\d{12}$/.test(value)) return value;
    const parsed = parseOpsDate(`${endOfDay ? '235959' : '000000'}${value.slice(8, 10)}${value.slice(5, 7)}${value.slice(2, 4)}`);
    return this.opsDate(Number.isNaN(parsed.getTime()) ? (endOfDay ? new Date(2099, 11, 31, 23, 59, 59) : new Date(2000, 0, 1)) : parsed);
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
      operationDate: item.opDate,
      amount: [OperationType.TOP_UP, OperationType.REFUND].includes(item.operationType) ? amount : -Math.abs(amount),
      zone: item.sectorDesc ?? item.zoneDesc ?? null,
      startTime: start ?? this.dateTimePart(item.opDate),
      endTime: end,
      startDate: this.datePartOptional(item.parkingStartDate),
      endDate: this.datePartOptional(item.parkingEndDate),
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
      sectorColor: item.sectorColor ?? undefined,
      latitude: item.latitude ?? undefined,
      longitude: item.longitude ?? undefined,
      timePeriod: [1, 2, 3].includes(item.timePeriod ?? 0) ? (item.timePeriod as 1 | 2 | 3) : undefined,
      refundable: this.refundableOption(item.refundable),
      extension: this.refundableOption(item.extension),
      ticketId: item.ticketId ?? undefined,
      ticketName: item.ticketDesc ?? undefined,
      street: item.pstreet ?? undefined,
    };
  }

  private refundableOption(value: number | string | null | undefined): 0 | 1 | 2 | undefined {
    const normalized = Number(value);
    return normalized === 0 || normalized === 1 || normalized === 2 ? normalized : undefined;
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
