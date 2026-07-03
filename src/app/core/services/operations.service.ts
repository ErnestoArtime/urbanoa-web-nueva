import { Injectable, computed, signal } from '@angular/core';
import { MOCK_OPERATIONS, MOCK_TICKET_ACTIVE } from '../../shared/mock-data';
import { OperationType } from '../../shared/models/operation-type';
import type { Operation } from '../../shared/models/operation';

export interface ActiveOperation {
  plate: string;
  zone: string;
  timeRemaining: string;
  endTime: string;
}

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly _operations = signal<Operation[]>([...MOCK_OPERATIONS]);
  private readonly _activeOperation = signal<ActiveOperation | null>({
    plate: MOCK_TICKET_ACTIVE.plate,
    zone: MOCK_TICKET_ACTIVE.zone,
    timeRemaining: MOCK_TICKET_ACTIVE.timeRemaining,
    endTime: MOCK_TICKET_ACTIVE.endTime,
  });

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
      type: OperationType.BALANCE_REFUND,
      plate: active.plate,
      date: today,
      amount: 0.4,
      zone: active.zone,
    };

    this._operations.update((list) => [finishParking, parkingClosed, ...list]);
    this._activeOperation.set(null);
    return true;
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
