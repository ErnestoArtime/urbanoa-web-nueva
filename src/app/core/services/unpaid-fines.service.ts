import { Injectable, computed, inject } from '@angular/core';
import { OperationType } from '../../shared/models/operation-type';
import type { Operation } from '../../shared/models/operation';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
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

export interface FinePaymentResult { success: boolean; challengeUrl?: string }

@Injectable({ providedIn: 'root' })
export class UnpaidFinesService {
  private readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  readonly fines = computed(() =>
    this.operationsService.operations().filter((operation) => operation.type === OperationType.UNPAID_FINES).map((operation) => this.mapOperation(operation)),
  );
  readonly source = this.operationsService.source;

  async payFine(id: string, cardId?: string): Promise<FinePaymentResult> {
    const fine = this.fines().find((item) => item.id === id);
    if (!fine || fine.status !== FineStatus.PAYABLE) return { success: false };

    const numericAmount = fine.amountValue;
    const walletAmount = Math.min(this.walletService.balance(), numericAmount);
    const cardAmount = numericAmount - walletAmount;
    if (cardAmount > 0 && !this.walletService.cards().some((card) => card.id === cardId)) return { success: false };

    const token = this.session.token();
    if (!token) return { success: false };
    const payMethodId = Number(cardId || 0);
    try {
      const response = await this.api.post<string>(
        OPS_ENDPOINTS.fines.confirmPayment,
        {
          contractId: fine.contractId,
          fine: fine.fineNumber,
          quantity: Math.round(numericAmount * 100),
          date: this.opsDate(new Date()),
          cloudToken: '',
          operatingSystem: 3,
          payMethodId: Number.isInteger(payMethodId) ? payMethodId : 0,
        },
        { token },
      );
      const challengeUrl = /^https?:\/\//i.test(response?.trim()) ? response.trim() : undefined;
      if (!challengeUrl) await Promise.all([this.operationsService.load(), this.walletService.load()]);
      return { success: true, challengeUrl };
    } catch {
      return { success: false };
    }
  }

  getFine(id: string): UnpaidFine | undefined {
    return this.fines().find((fine) => fine.id === id);
  }

  private mapOperation(operation: Operation): UnpaidFine {
    const amountValue = Math.abs(operation.amount);
    const originalAmountValue = operation.fineAmount;
    const discountPercent =
      originalAmountValue && originalAmountValue > amountValue
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

  private formatCurrency(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
  }

  private opsDate(date: Date): string {
    const two = (value: number): string => String(value).padStart(2, '0');
    return `${two(date.getHours())}${two(date.getMinutes())}${two(date.getSeconds())}${two(date.getDate())}${two(date.getMonth() + 1)}${two(
      date.getFullYear() % 100,
    )}`;
  }
}
