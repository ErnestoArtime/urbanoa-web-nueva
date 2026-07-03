import { Injectable, signal } from '@angular/core';

export interface MainCard {
  brand: string;
  last4: string;
  expiryDate: string;
  cardholderName: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  readonly balance = signal(12.5);
  readonly mainCard: MainCard = {
    brand: 'Visa',
    last4: '1234',
    expiryDate: '12/28',
    cardholderName: 'Juan García',
  };

  addBalance(amount: number): void {
    this.balance.update(b => b + amount);
  }
}
