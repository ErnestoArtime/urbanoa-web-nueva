import { Injectable, computed, inject, signal } from '@angular/core';
import { OperationType } from '../../shared/models/operation-type';
import type { Operation } from '../../shared/models/operation';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { readStorage, writeStorage } from '../storage/signal-storage';
import { OperationsService } from './operations.service';
import { WalletService } from './wallet.service';

export enum FineStatus {
  PAYABLE = 1,
  EXPIRED = 2,
  NOT_PAYABLE = 3,
}

export interface UnpaidFine {
  id: string;
  fineNumber: string;
  plate: string;
  date: string;
  processingDate?: string;
  amount: string;
  amountValue: number;
  originalAmount?: string;
  originalAmountValue?: number;
  earlyPaymentDeadline?: string;
  discountPercent?: number;
  status: FineStatus;
  article?: string;
  vehicleColor?: string;
  vehicleMake?: string;
  street?: string;
  streetNumber?: string;
  location: string;
  contractId: number;
  contractName?: string;
  cityId?: number;
  cityName?: string;
  zoneId?: number;
  zoneName?: string;
  sectorId?: number;
  sectorName?: string;
  latitude?: number;
  longitude?: number;
}

const INITIAL_FINES: UnpaidFine[] = [
  {
    id: '1', fineNumber: '910022', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', amountValue: 35,
    originalAmount: '70,00 €', originalAmountValue: 70, earlyPaymentDeadline: '25/08/2026', discountPercent: 50,
    status: FineStatus.PAYABLE, location: 'Nagusia Kalea', street: 'Nagusia Kalea', contractId: 0,
  },
  {
    id: '2', fineNumber: '910023', plate: '1234 ABC', date: '28/05/2026', amount: '20,00 €', amountValue: 20,
    status: FineStatus.PAYABLE, location: 'Nafarroa Kalea', street: 'Nafarroa Kalea', contractId: 0,
  },
];

@Injectable({ providedIn: 'root' })
export class UnpaidFinesService {
  private readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly storageKey = 'urbanoa.unpaid-fines';
  private readonly mockFines = signal<UnpaidFine[]>(this.readMockFines());

  readonly fines = computed(() => this.operationsService.source() === 'remote'
    ? this.operationsService.operations()
        .filter((operation) => operation.type === OperationType.UNPAID_FINES)
        .map((operation) => this.mapOperation(operation))
    : this.mockFines());
  readonly source = computed<'remote' | 'mock'>(() => this.operationsService.source());

  async payFine(id: string, cardId?: string): Promise<boolean> {
    const fine = this.fines().find((item) => item.id === id);
    if (!fine || fine.status !== FineStatus.PAYABLE) return false;

    const numericAmount = fine.amountValue;
    const walletAmount = Math.min(this.walletService.balance(), numericAmount);
    const cardAmount = numericAmount - walletAmount;
    if (cardAmount > 0 && !this.walletService.cards().some((card) => card.id === cardId)) return false;

    const token = this.session.token();
    const payMethodId = Number(cardId || 0);
    if (token) {
      try {
        await this.api.post<string>(OPS_ENDPOINTS.fines.confirmPayment, {
          contractId: fine.contractId,
          fine: fine.fineNumber,
          quantity: Math.round(numericAmount * 100),
          cloudToken: '',
          operatingSystem: 3,
          payMethodId: Number.isInteger(payMethodId) ? payMethodId : 0,
        }, { token });
      } catch (error) {
        console.warn('[OPS API] Pago de sanción utiliza fallback mock', error);
      }
    }

    if (walletAmount > 0) this.walletService.debit(walletAmount, 'Pago de denuncia', 'fine-payment');
    if (this.operationsService.source() === 'remote') {
      this.operationsService.removeOperation(id);
    } else {
      this.mockFines.update((list) => list.filter((item) => item.id !== id));
      this.persist();
    }
    this.operationsService.registerFinePayment({
      plate: fine.plate,
      location: fine.location,
      amount: numericAmount,
      fineNumber: fine.fineNumber,
      fineArticle: fine.article,
      zoneName: fine.zoneName,
      sectorName: fine.sectorName,
      cityName: fine.cityName,
      latitude: fine.latitude,
      longitude: fine.longitude,
      paymentBreakdown: {
        walletAmount,
        cardAmount,
        cardLabel: cardId ? this.cardLabel(cardId) : undefined,
      },
    });
    return true;
  }

  getFine(id: string): UnpaidFine | undefined {
    return this.fines().find((fine) => fine.id === id);
  }

  private readMockFines(): UnpaidFine[] {
    const stored = readStorage<Partial<UnpaidFine>[]>(this.storageKey, INITIAL_FINES.map((fine) => ({ ...fine })));
    if (!Array.isArray(stored)) return INITIAL_FINES.map((fine) => ({ ...fine }));
    return stored.flatMap((fine) => {
      const normalized = this.normalizeStoredFine(fine);
      return normalized ? [normalized] : [];
    });
  }

  private normalizeStoredFine(fine: Partial<UnpaidFine>): UnpaidFine | undefined {
    const id = fine.id == null ? '' : String(fine.id);
    if (!id) return undefined;
    const amountValue = Number.isFinite(fine.amountValue) ? Math.abs(fine.amountValue!) : 0;
    const status = [FineStatus.PAYABLE, FineStatus.EXPIRED, FineStatus.NOT_PAYABLE].includes(fine.status as FineStatus)
      ? (fine.status as FineStatus)
      : FineStatus.PAYABLE;
    return {
      ...fine,
      id,
      fineNumber: fine.fineNumber || id,
      plate: fine.plate ?? '',
      date: fine.date ?? '',
      amount: fine.amount || this.formatCurrency(amountValue),
      amountValue,
      status,
      location: fine.location ?? fine.street ?? '',
      contractId: Number.isFinite(fine.contractId) ? fine.contractId! : 0,
    };
  }

  private mapOperation(operation: Operation): UnpaidFine {
    const amountValue = Math.abs(operation.amount);
    const originalAmountValue = operation.fineAmount;
    const discountPercent = originalAmountValue && originalAmountValue > amountValue
      ? Math.round(((originalAmountValue - amountValue) / originalAmountValue) * 100)
      : undefined;
    const street = [operation.fineStreet, operation.fineStreetNumber].filter(Boolean).join(' ');
    const location = [operation.zoneName ?? operation.zone, operation.sectorName, street].filter(Boolean).join(' · ');
    return {
      id: operation.id,
      fineNumber: operation.fineNumber ?? operation.id,
      plate: operation.plate ?? '',
      date: operation.date,
      processingDate: operation.fineProcessingDate,
      amount: this.formatCurrency(amountValue),
      amountValue,
      originalAmount: originalAmountValue == null ? undefined : this.formatCurrency(originalAmountValue),
      originalAmountValue,
      earlyPaymentDeadline: operation.fineValidDate,
      discountPercent,
      status: operation.fineStatus ?? FineStatus.NOT_PAYABLE,
      article: operation.fineArticle,
      vehicleColor: operation.fineVehicleColor,
      vehicleMake: operation.fineVehicleMake,
      street: operation.fineStreet,
      streetNumber: operation.fineStreetNumber,
      location: location || operation.contractName || '',
      contractId: operation.contractId ?? 0,
      contractName: operation.contractName,
      cityId: operation.cityId,
      cityName: operation.cityName,
      zoneId: operation.zoneId,
      zoneName: operation.zoneName,
      sectorId: operation.sectorId,
      sectorName: operation.sectorName,
      latitude: operation.latitude,
      longitude: operation.longitude,
    };
  }

  private cardLabel(cardId: string): string | undefined {
    const card = this.walletService.cards().find((item) => item.id === cardId);
    return card ? `${card.brand} •••• ${card.last4}` : undefined;
  }

  private formatCurrency(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
  }

  private persist(): void {
    writeStorage(this.storageKey, this.mockFines());
  }
}
