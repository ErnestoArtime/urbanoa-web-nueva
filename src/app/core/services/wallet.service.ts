import { Injectable, signal } from '@angular/core';

export interface MainCard {
  brand: string;
  last4: string;
  expiryDate: string;
  cardholderName: string;
}

export type WalletMovementType = 'top-up' | 'parking-payment' | 'fine-payment' | 'parking-refund' | 'balance-refund';

export interface WalletMovement {
  id: string;
  type: WalletMovementType;
  amount: number;
  date: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  readonly balance = signal(12.5);
  readonly movements = signal<WalletMovement[]>([]);
  readonly mainCard: MainCard = {
    brand: 'Visa',
    last4: '1234',
    expiryDate: '12/28',
    cardholderName: 'Juan García',
  };

  addBalance(amount: number): void {
    this.balance.update((b) => b + amount);
  }

  credit(amount: number, description: string, type: WalletMovementType): void {
    const value = Math.abs(amount);
    this.balance.update((b) => b + value);
    this.movements.update((list) => [
      { id: crypto.randomUUID(), type, amount: value, date: new Date().toISOString(), description },
      ...list,
    ]);
  }

  debit(amount: number, description: string, type: WalletMovementType): boolean {
    const value = Math.abs(amount);
    if (this.balance() < value) return false;
    this.balance.update((b) => b - value);
    this.movements.update((list) => [
      { id: crypto.randomUUID(), type, amount: -value, date: new Date().toISOString(), description },
      ...list,
    ]);
    return true;
  }
}
