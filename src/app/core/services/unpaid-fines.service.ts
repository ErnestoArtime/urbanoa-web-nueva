import { Injectable, inject, signal } from '@angular/core';
import { OperationsService } from './operations.service';
import { WalletService } from './wallet.service';
import { readStorage, writeStorage } from '../storage/signal-storage';

export interface UnpaidFine {
  id: string;
  plate: string;
  date: string;
  amount: string;
  location: string;
}

const INITIAL_FINES: UnpaidFine[] = [
  { id: '1', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', location: 'Nagusia Kalea' },
  { id: '2', plate: '1234 ABC', date: '28/05/2026', amount: '20,00 €', location: 'Nafarroa Kalea' },
];

@Injectable({ providedIn: 'root' })
export class UnpaidFinesService {
  private readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly storageKey = 'urbanoa.unpaid-fines';

  readonly fines = signal<UnpaidFine[]>(
    readStorage(
      this.storageKey,
      INITIAL_FINES.map((fine) => ({ ...fine })),
    ),
  );

  payFine(id: string, cardId?: string): boolean {
    const fine = this.fines().find((f) => f.id === id);
    if (!fine) return false;

    const numericAmount = Number.parseFloat(fine.amount.replace(',', '.').replace(/[^0-9.,]/g, ''));
    const walletAmount = Math.min(this.walletService.balance(), numericAmount);
    const cardAmount = numericAmount - walletAmount;
    if (cardAmount > 0 && !this.walletService.cards().some((card) => card.id === cardId)) return false;
    if (walletAmount > 0) this.walletService.debit(walletAmount, 'Pago de denuncia', 'fine-payment');
    this.fines.update((list) => list.filter((f) => f.id !== id));
    this.persist();
    this.operationsService.registerFinePayment({
      plate: fine.plate,
      location: fine.location,
      amount: numericAmount,
      paymentBreakdown: {
        walletAmount,
        cardAmount,
        cardLabel: cardId
          ? (() => {
              const card = this.walletService.cards().find((item) => item.id === cardId);
              return card ? `${card.brand} •••• ${card.last4}` : undefined;
            })()
          : undefined,
      },
    });
    return true;
  }

  getFine(id: string): UnpaidFine | undefined {
    return this.fines().find((f) => f.id === id);
  }

  private persist(): void {
    writeStorage(this.storageKey, this.fines());
  }
}
