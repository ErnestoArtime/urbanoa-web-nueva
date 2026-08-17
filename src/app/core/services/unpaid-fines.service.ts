import { Injectable, inject, signal } from '@angular/core';
import { OperationsService } from './operations.service';
import { WalletService } from './wallet.service';
import { readStorage, writeStorage } from '../storage/signal-storage';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';

export interface UnpaidFine {
  id: string;
  plate: string;
  date: string;
  amount: string;
  location: string;
  originalAmount?: string;
  earlyPaymentDeadline?: string;
  discountPercent?: number;
}

const INITIAL_FINES: UnpaidFine[] = [
  {
    id: '1',
    plate: '1234 ABC',
    date: '05/06/2026',
    amount: '35,00 €',
    originalAmount: '70,00 €',
    earlyPaymentDeadline: '25/08/2026',
    discountPercent: 50,
    location: 'Nagusia Kalea',
  },
  { id: '2', plate: '1234 ABC', date: '28/05/2026', amount: '20,00 €', location: 'Nafarroa Kalea' },
];

@Injectable({ providedIn: 'root' })
export class UnpaidFinesService {
  private readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly storageKey = 'urbanoa.unpaid-fines';

  readonly fines = signal<UnpaidFine[]>(
    readStorage(
      this.storageKey,
      INITIAL_FINES.map((fine) => ({ ...fine })),
    ),
  );
  readonly source = signal<'remote' | 'mock'>('mock');

  async payFine(id: string, cardId?: string): Promise<boolean> {
    const fine = this.fines().find((f) => f.id === id);
    if (!fine) return false;

    const numericAmount = Number.parseFloat(fine.amount.replace(',', '.').replace(/[^0-9.,]/g, ''));
    const walletAmount = Math.min(this.walletService.balance(), numericAmount);
    const cardAmount = numericAmount - walletAmount;
    if (cardAmount > 0 && !this.walletService.cards().some((card) => card.id === cardId)) return false;
    const token = this.session.token();
    const payMethodId = Number(cardId || 0);
    if (token) {
      try {
        await this.api.post<string>(
          OPS_ENDPOINTS.fines.confirmPayment,
          {
            contractId: 0,
            fine: fine.id,
            quantity: Math.round(numericAmount * 100),
            cloudToken: '',
            operatingSystem: 1,
            payMethodId: Number.isInteger(payMethodId) ? payMethodId : 0,
          },
          { token },
        );
        this.source.set('remote');
      } catch (error) {
        console.warn('[OPS API] Pago de multa utiliza fallback mock', error);
        this.source.set('mock');
      }
    } else {
      this.source.set('mock');
    }
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
