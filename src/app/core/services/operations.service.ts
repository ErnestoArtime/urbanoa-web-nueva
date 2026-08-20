import { Injectable, computed, inject, signal } from '@angular/core';
import { MOCK_OPERATIONS, MOCK_TICKET_ACTIVE } from '../../shared/mock-data';
import { OperationType } from '../../shared/models/operation-type';
import { WalletService } from './wallet.service';
import type { Operation } from '../../shared/models/operation';
import { generateUuid } from '../utils/generate-uuid';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { AppApiClient } from '../api/app-api-client.service';

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
}

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly walletService = inject(WalletService);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly restApi = inject(AppApiClient);
  private readonly storageKey = 'urbanoa.operations';
  private readonly activeKey = 'urbanoa.operations.active';
  private readonly _operations = signal<Operation[]>(this.readOps());
  private readonly _activeParkings = signal<ActiveParking[]>(this.readActive());

  readonly operations = this._operations.asReadonly();
  readonly activeParkings = this._activeParkings.asReadonly();
  readonly activeParkingsCount = computed(() => this._activeParkings().length);
  readonly hasActiveParkings = computed(() => this._activeParkings().length > 0);
  readonly source = signal<'remote' | 'mock'>('mock');
  readonly loading = signal(false);

  async load(
    dateStart = '2000-01-01',
    dateEnd = '2100-12-31',
    operationTypeList = Object.values(OperationType).filter(Number.isInteger),
  ): Promise<void> {
    const token = this.session.token();
    if (!token) {
      this.source.set('mock');
      return;
    }
    this.loading.set(true);
    try {
      const response = await this.api.post<OperationResponseDto[]>(
        OPS_ENDPOINTS.user.operations,
        { contractId: 0, dateStart, dateEnd, operationTypeList },
        { token },
      );
      this._operations.set(response.map((item) => this.mapRemoteOperation(item)));
      this.source.set('remote');
      this.persistOps();
    } catch (error) {
      console.warn('[OPS API] Operaciones utiliza fallback mock', error);
      this.source.set('mock');
    } finally {
      this.loading.set(false);
    }
  }

  async loadDetail(id: string): Promise<Operation | undefined> {
    try {
      const response = await this.restApi.get<OperationResponseDto>(`/operations/${encodeURIComponent(id)}`);
      const operation = this.mapRemoteOperation(response);
      this._operations.update((items) => [operation, ...items.filter((item) => item.id !== operation.id)]);
      this.source.set('remote');
      return operation;
    } catch (error) {
      console.warn('[API] Detalle de operación usa fallback local', error);
      this.source.set('mock');
      return this.getOperationById(id);
    }
  }

  async loadReceipt(id: string): Promise<unknown | null> {
    try { this.source.set('remote'); return await this.restApi.get(`/operations/${encodeURIComponent(id)}/receipt`); }
    catch (error) { console.warn('[API] Recibo usa fallback local', error); this.source.set('mock'); return null; }
  }

  isVehicleParked(vehicleId: string): boolean {
    return this._activeParkings().some((p) => p.vehicleId === vehicleId);
  }

  isPlateParked(plate: string): boolean {
    return this._activeParkings().some((p) => p.plate === plate);
  }

  getActiveParking(id: string): ActiveParking | undefined {
    return this._activeParkings().find((p) => p.id === id);
  }

  getOperationById(id: string): Operation | undefined {
    return this._operations().find((op) => op.id === id);
  }

  removeOperation(id: string): void {
    this._operations.update((operations) => operations.filter((operation) => operation.id !== id));
    this.persistOps();
  }

  registerFinePayment(input: {
    plate: string;
    location: string;
    amount: number;
    paymentBreakdown?: Operation['paymentBreakdown'];
    fineNumber?: string;
    fineArticle?: string;
    zoneName?: string;
    sectorName?: string;
    cityName?: string;
    latitude?: number;
    longitude?: number;
  }): void {
    const amount = Math.abs(input.amount);
    const operation: Operation = {
      id: this.nextId(),
      type: OperationType.FINE_PAYMENT,
      plate: input.plate,
      date: this.todayDateString(),
      amount: -amount,
      zone: input.location,
      paymentBreakdown: input.paymentBreakdown,
      fineNumber: input.fineNumber,
      fineArticle: input.fineArticle,
      zoneName: input.zoneName,
      sectorName: input.sectorName,
      cityName: input.cityName,
      latitude: input.latitude,
      longitude: input.longitude,
      startTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };
    this._operations.update((list) => [operation, ...list]);
    this.persistOps();
  }

  registerTopUp(amount: number): void {
    this._operations.update((list) => [
      {
        id: this.nextId(),
        type: OperationType.TOP_UP,
        plate: null,
        date: this.todayDateString(),
        amount: Math.abs(amount),
        zone: null,
      },
      ...list,
    ]);
    this.persistOps();
  }

  registerBalanceRefund(amount: number, destination: string, cardId?: string, cardLabel?: string): void {
    this._operations.update((list) => [
      {
        id: this.nextId(),
        type: OperationType.BALANCE_REFUND,
        plate: null,
        date: this.todayDateString(),
        amount: -Math.abs(amount),
        zone: destination,
        cardId,
        cardLabel,
      },
      ...list,
    ]);
    this.persistOps();
  }

  startParking(input: ActiveParking & { amount: number }): boolean {
    if (this.isVehicleParked(input.vehicleId)) return false;

    const operationId = this.nextId();
    const parking: ActiveParking = {
      id: input.id || generateUuid(),
      plate: input.plate,
      vehicleId: input.vehicleId,
      zone: input.zone,
      startTime: input.startTime,
      durationLabel: input.durationLabel,
      timeRemaining: input.timeRemaining,
      endTime: input.endTime,
      latitude: input.latitude,
      longitude: input.longitude,
      street: input.street,
      operationId,
      paymentBreakdown: input.paymentBreakdown,
      cardId: input.cardId,
      cardLabel: input.cardLabel,
    };

    this._activeParkings.update((list) => [parking, ...list]);

    this._operations.update((list) => [
      {
        id: operationId,
        type: OperationType.PARKING,
        plate: input.plate,
        date: this.todayDateString(),
        amount: -Math.abs(input.amount),
        zone: input.zone,
        startTime: input.startTime,
        endTime: input.endTime,
        durationLabel: input.durationLabel,
        paymentBreakdown: input.paymentBreakdown,
        cardId: input.cardId,
        cardLabel: input.cardLabel,
      },
      ...list,
    ]);
    this.persistOps();
    this.persistActive();
    return true;
  }

  unpark(parkingId: string): boolean {
    const active = this._activeParkings().find((p) => p.id === parkingId);
    if (!active) return false;

    const today = this.todayDateString();
    const [parkingClosedId, finishParkingId] = this.nextIds(2);
    const parkingClosed: Operation = {
      id: parkingClosedId,
      type: OperationType.PARKING,
      plate: active.plate,
      date: today,
      amount: -1.01,
      zone: active.zone,
      startTime: active.startTime,
      endTime: active.endTime,
      durationLabel: active.durationLabel,
      paymentBreakdown: active.paymentBreakdown,
      cardId: active.cardId,
      cardLabel: active.cardLabel,
    };

    const finishParking: Operation = {
      id: finishParkingId,
      type: OperationType.REFUND,
      plate: active.plate,
      date: today,
      amount: 0.4,
      zone: active.zone,
      relatedOperationId: active.operationId,
      startTime: active.startTime,
      endTime: active.endTime,
      durationLabel: active.durationLabel,
    };

    this.walletService.credit(0.4, 'Devolución de saldo', 'parking-refund');
    this._operations.update((list) => [finishParking, parkingClosed, ...list]);
    this._activeParkings.update((list) => list.filter((p) => p.id !== parkingId));
    this.persistOps();
    this.persistActive();
    return true;
  }

  private readOps(): Operation[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null') as Operation[] | null;
      if (Array.isArray(parsed) && parsed.length) return this.normalizeOperationIds(parsed);
    } catch {
      /* fall through */
    }
    return MOCK_OPERATIONS.map((op) => ({ ...op }));
  }

  private readActive(): ActiveParking[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.activeKey) ?? 'null');
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p: ActiveParking) => p.id && p.plate)
          .map((p: ActiveParking) => ({ ...p, operationId: p.operationId || MOCK_TICKET_ACTIVE?.operationId || this.nextId() }));
      }
    } catch {
      /* fall through */
    }
    if (MOCK_TICKET_ACTIVE) {
      const now = new Date();
      const [h, m] = MOCK_TICKET_ACTIVE.endTime.split(':').map(Number);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      const totalSeconds = Math.round((end.getTime() - now.getTime()) / 1000);
      const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      return [
        {
          id: 'mock-1',
          plate: MOCK_TICKET_ACTIVE.plate,
          vehicleId: '1',
          zone: MOCK_TICKET_ACTIVE.zone,
          startTime: MOCK_TICKET_ACTIVE.startTime,
          durationLabel: MOCK_TICKET_ACTIVE.durationLabel,
          timeRemaining: totalSeconds > 0 ? `${hh}:${mm}:${ss}` : '00:00:00',
          endTime: MOCK_TICKET_ACTIVE.endTime,
          latitude: MOCK_TICKET_ACTIVE.latitude,
          longitude: MOCK_TICKET_ACTIVE.longitude,
          street: MOCK_TICKET_ACTIVE.street,
          operationId: MOCK_TICKET_ACTIVE.operationId,
        },
      ];
    }
    return [];
  }

  private persistOps(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this._operations()));
    } catch {
      /* storage unavailable */
    }
  }

  private persistActive(): void {
    try {
      const val = this._activeParkings();
      if (val.length > 0) {
        localStorage.setItem(this.activeKey, JSON.stringify(val));
      } else {
        localStorage.removeItem(this.activeKey);
      }
    } catch {
      /* storage unavailable */
    }
  }

  private todayDateString(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private nextId(): string {
    const max = this._operations().reduce((acc, op) => {
      const n = Number(op.id);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    return String(max + 1);
  }

  private nextIds(count: number): string[] {
    const start = Number(this.nextId());
    return Array.from({ length: count }, (_, index) => String(start + index));
  }

  private normalizeOperationIds(list: Operation[]): Operation[] {
    const normalized = list.map((operation) => ({
      ...operation,
      type: this.normalizeStoredOperationType(operation.type),
    }));
    const used = new Set<string>();
    let max = normalized.reduce((acc, op) => {
      const n = Number(op.id);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);

    return normalized.map((op) => {
      if (op.id && !used.has(op.id)) {
        used.add(op.id);
        return op;
      }
      max += 1;
      const id = String(max);
      used.add(id);
      return { ...op, id };
    });
  }

  private normalizeStoredOperationType(type: number): OperationType {
    if (type === 6) return OperationType.REFUND;
    return Object.values(OperationType).includes(type) ? (type as OperationType) : OperationType.PARKING;
  }

  private mapRemoteOperation(item: OperationResponseDto): Operation {
    const remoteAmount = item.operationType === OperationType.UNPAID_FINES && !item.paymentAmount
      ? item.fineAmount ?? 0
      : item.paymentAmount ?? 0;
    const amount = remoteAmount / 100;
    const start = this.dateTimePart(item.parkingStartDate);
    const end = this.dateTimePart(item.parkingEndDate);
    const duration = item.parkingDuration ?? item.duration;
    const fineStatus = [1, 2, 3].includes(item.fineStatus ?? 0) ? (item.fineStatus as 1 | 2 | 3) : undefined;
    return {
      id: String(item.operationNumber ?? item.opBaseId),
      type: (Object.values(OperationType).includes(item.operationType) ? item.operationType : OperationType.PARKING) as OperationType,
      plate: item.plate ?? null,
      date: this.datePart(item.opDate),
      amount: [OperationType.TOP_UP, OperationType.REFUND].includes(item.operationType)
        ? amount
        : -Math.abs(amount),
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
    return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : parsed.toLocaleDateString('es-ES');
  }

  private dateTimePart(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const parsed = this.parseBackendDate(value);
    return Number.isNaN(parsed.getTime())
      ? value.slice(11, 16)
      : parsed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  private parseBackendDate(value: string): Date {
    if (/^\d{12}$/.test(value)) {
      const hour = Number(value.slice(0, 2));
      const minute = Number(value.slice(2, 4));
      const second = Number(value.slice(4, 6));
      const day = Number(value.slice(6, 8));
      const month = Number(value.slice(8, 10)) - 1;
      const year = 2000 + Number(value.slice(10, 12));
      return new Date(year, month, day, hour, minute, second);
    }
    return new Date(value);
  }
}
