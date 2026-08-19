import { Injectable, signal } from '@angular/core';

export interface PendingPaymentCard {
  brand: 'Visa' | 'Mastercard' | 'Amex';
  last4: string;
  expiryDate: string;
  cardholderName: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentChallengeService {
  readonly pendingCard = signal<PendingPaymentCard | null>(null);
  begin(card: PendingPaymentCard): void {
    this.pendingCard.set(card);
  }
  clear(): void {
    this.pendingCard.set(null);
  }
}
