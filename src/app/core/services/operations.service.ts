import { Injectable, computed, inject, signal } from '@angular/core';
import { MOCK_OPERATIONS, MOCK_TICKET_ACTIVE } from '../../shared/mock-data';
import { OperationType } from '../../shared/models/operation-type';
import { WalletService } from './wallet.service';
import type { Operation } from '../../shared/models/operation';

export interface ActiveOperation {
  plate: string;
  zone: string;
  startTime: string;
  durationLabel: string;
  timeRemaining: string;
  endTime: string;
  latitude?: number;
  longitude?: number;
  street?: string;
}

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly walletService = inject(WalletService);
  private readonly storageKey = 'urbanoa.operations';
  private readonly activeKey = 'urbanoa.operations.active';
  private readonly _operations = signal<Operation[]>(this.readOps());
  private readonly _activeOperation = signal<ActiveOperation | null>(this.readActive());

  readonly operations = this._operations.asReadonly();
  readonly activeOperation = this._activeOperation.asReadonly();
  readonly hasActiveOperation = computed(() => this._activeOperation() !== null);

  getOperationById(id: string): Operation | undefined {
    return this._operations().find((op) => op.id === id);
  }

  registerFinePayment(input: { plate: string; location: string; amount: number }): void {
    const amount = Math.abs(input.amount);
    const operation: Operation = {
      id: this.nextId(),
      type: OperationType.FINE_PAYMENT,
      plate: input.plate,
      date: this.todayDateString(),
      amount: -amount,
      zone: input.location,
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

  registerBalanceRefund(amount: number, destination: string): void {
    this._operations.update((list) => [
      {
        id: this.nextId(),
        type: OperationType.BALANCE_REFUND,
        plate: null,
        date: this.todayDateString(),
        amount: -Math.abs(amount),
        zone: destination,
      },
      ...list,
    ]);
    this.persistOps();
  }

  startParking(input: ActiveOperation & { amount: number }): boolean {
    if (this._activeOperation()) return false;

    this._activeOperation.set({
      plate: input.plate,
      zone: input.zone,
      startTime: input.startTime,
      durationLabel: input.durationLabel,
      timeRemaining: input.timeRemaining,
      endTime: input.endTime,
      latitude: input.latitude,
      longitude: input.longitude,
      street: input.street,
    });

    this._operations.update((list) => [
      {
        id: this.nextId(),
        type: OperationType.PARKING,
        plate: input.plate,
        date: this.todayDateString(),
        amount: -Math.abs(input.amount),
        zone: input.zone,
      },
      ...list,
    ]);
    this.persistOps();
    this.persistActive();
    return true;
  }

  unparkActiveOperation(): boolean {
    const active = this._activeOperation();
    if (!active) return false;

    const today = this.todayDateString();
    const parkingClosed: Operation = {
      id: this.nextId(),
      type: OperationType.PARKING,
      plate: active.plate,
      date: today,
      amount: -1.01,
      zone: active.zone,
    };

    const finishParking: Operation = {
      id: this.nextId(),
      type: OperationType.PARKING_END,
      plate: active.plate,
      date: today,
      amount: 0.4,
      zone: active.zone,
    };

    this.walletService.credit(0.4, 'Devolución de saldo', 'parking-refund');
    this._operations.update((list) => [finishParking, parkingClosed, ...list]);
    this._activeOperation.set(null);
    this.persistOps();
    this.persistActive();
    return true;
  }

  private readOps(): Operation[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null') as Operation[] | null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* fall through */
    }
    return MOCK_OPERATIONS.map((op) => ({ ...op }));
  }

  private readActive(): ActiveOperation | null {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.activeKey) ?? 'null') as ActiveOperation | null;
      if (parsed && typeof parsed.plate === 'string') return parsed;
    } catch {
      /* fall through */
    }
    return MOCK_TICKET_ACTIVE
      ? {
          plate: MOCK_TICKET_ACTIVE.plate,
          zone: MOCK_TICKET_ACTIVE.zone,
          startTime: MOCK_TICKET_ACTIVE.startTime,
          durationLabel: MOCK_TICKET_ACTIVE.durationLabel,
          timeRemaining: MOCK_TICKET_ACTIVE.timeRemaining,
          endTime: MOCK_TICKET_ACTIVE.endTime,
          latitude: MOCK_TICKET_ACTIVE.latitude,
          longitude: MOCK_TICKET_ACTIVE.longitude,
          street: MOCK_TICKET_ACTIVE.street,
        }
      : null;
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
      const val = this._activeOperation();
      if (val) {
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
}
