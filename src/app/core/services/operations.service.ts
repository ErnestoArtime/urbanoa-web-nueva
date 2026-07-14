import { Injectable, computed, inject, signal } from '@angular/core';
import { MOCK_OPERATIONS, MOCK_TICKET_ACTIVE } from '../../shared/mock-data';
import { OperationType } from '../../shared/models/operation-type';
import { WalletService } from './wallet.service';
import type { Operation } from '../../shared/models/operation';

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
  private readonly storageKey = 'urbanoa.operations';
  private readonly activeKey = 'urbanoa.operations.active';
  private readonly _operations = signal<Operation[]>(this.readOps());
  private readonly _activeParkings = signal<ActiveParking[]>(this.readActive());

  readonly operations = this._operations.asReadonly();
  readonly activeParkings = this._activeParkings.asReadonly();
  readonly activeParkingsCount = computed(() => this._activeParkings().length);
  readonly hasActiveParkings = computed(() => this._activeParkings().length > 0);

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

  registerFinePayment(input: { plate: string; location: string; amount: number; paymentBreakdown?: Operation['paymentBreakdown'] }): void {
    const amount = Math.abs(input.amount);
    const operation: Operation = {
      id: this.nextId(),
      type: OperationType.FINE_PAYMENT,
      plate: input.plate,
      date: this.todayDateString(),
      amount: -amount,
      zone: input.location,
      paymentBreakdown: input.paymentBreakdown,
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
      id: input.id || crypto.randomUUID(),
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
      type: OperationType.PARKING_END,
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
    const used = new Set<string>();
    let max = list.reduce((acc, op) => {
      const n = Number(op.id);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);

    return list.map((op) => {
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
}
