import { computed, inject, Injectable, signal } from '@angular/core';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OpsApiError } from '../api/ops-api.types';
import { generateUuid } from '../utils/generate-uuid';

export interface MainCard {
  id: string;
  brand: string;
  last4: string;
  expiryDate: string;
  cardholderName: string;
}

interface PaymentMethodDto {
  id: number;
  description: string;
  mask: string;
  tokenUserCard: string;
  idUserCard: number;
  expDate: string;
  cardBrand: string;
  cardType: string;
  type: number;
  favorite: number;
}

interface PaymentMethodsDto {
  payMethods: PaymentMethodDto[] | null;
}

interface RechargeUserCreditResponseDto {
  payMethodId: number;
  amountRecharged: number | string | null;
  newBalance: number | string | null;
  challengeUrl: string | null;
}

interface BalanceRefundResponseDto {
  result: number;
  refundAmount: number;
}

export interface WalletActionResult {
  success: boolean;
  source: 'remote' | 'error';
  amount?: number;
  challengeUrl?: string;
  error?: OpsApiError;
}

export type WalletMovementType = 'top-up' | 'parking-payment' | 'fine-payment' | 'parking-refund' | 'balance-refund';

export interface WalletMovement {
  id: string;
  type: WalletMovementType;
  amount: number;
  date: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  operationId?: string;
  description?: string;
}

type WalletMovementInput = Omit<WalletMovement, 'id' | 'amount' | 'date'>;

const LEGACY_DESCRIPTION_KEYS: Record<string, string> = {
  'Recarga de saldo': 'wallet.movement.topUp',
  Estacionamiento: 'wallet.movement.parkingPayment',
  'Pago de sanción': 'wallet.movement.finePayment',
  'Devolución de saldo': 'wallet.movement.balanceRefund',
};

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly balanceStorageKey = 'urbanoa.wallet.balance';
  private readonly movementsStorageKey = 'urbanoa.wallet.movements';
  private readonly cardsStorageKey = 'urbanoa.payment-cards';
  private readonly defaultCardStorageKey = 'urbanoa.default-payment-card';

  readonly source = signal<'idle' | 'remote' | 'error'>('idle');
  readonly loading = signal(false);
  readonly lastError = signal<string | null>(null);

  readonly balance = signal(0);
  readonly movements = signal<WalletMovement[]>([]);
  readonly cards = signal<MainCard[]>([]);
  readonly defaultCardId = signal('');
  readonly defaultCard = computed(() => this.cards().find((card) => card.id === this.defaultCardId()) ?? this.cards()[0]);

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  get mainCard(): MainCard {
    return this.defaultCard() ?? { id: '', brand: '', last4: '', expiryDate: '', cardholderName: '' };
  }

  async loadPaymentMethodForm(): Promise<string | null> {
    const token = this.session.token();
    if (!token) return null;
    try {
      const html = await this.api.get<string>(OPS_ENDPOINTS.wallet.loadPaymentForm, { token });
      this.source.set('remote');
      this.lastError.set(null);
      return html;
    } catch (error) {
      this.useError(error);
      return null;
    }
  }

  async load(): Promise<void> {
    const token = this.session?.token();
    if (!token) {
      this.balance.set(0);
      this.cards.set([]);
      this.source.set('error');
      this.lastError.set('Se requiere una sesión válida');
      return;
    }

    this.loading.set(true);
    this.lastError.set(null);
    try {
      const [creditResult, paymentMethodsResult] = await Promise.allSettled([
        this.api.get<number>(OPS_ENDPOINTS.wallet.credit, { token }),
        this.api.get<PaymentMethodsDto>(OPS_ENDPOINTS.wallet.paymentMethods, { token }),
      ]);
      if (creditResult.status === 'fulfilled') {
        this.balance.set(this.fromCents(creditResult.value));
        this.persistWallet();
      }
      if (paymentMethodsResult.status === 'fulfilled') {
        const methods = paymentMethodsResult.value.payMethods ?? [];
        const cards = methods.map((method) => this.mapPaymentMethod(method));
        this.cards.set(cards);
        this.defaultCardId.set(String(methods.find((method) => method.favorite === 1)?.id ?? cards[0]?.id ?? ''));
        this.persistCards();
      }
      const failure =
        creditResult.status === 'rejected'
          ? creditResult.reason
          : paymentMethodsResult.status === 'rejected'
            ? paymentMethodsResult.reason
            : null;
      if (creditResult.status === 'rejected' && paymentMethodsResult.status === 'rejected') {
        this.balance.set(0);
        this.cards.set([]);
        this.useError(failure);
      } else {
        this.source.set('remote');
        this.lastError.set(failure instanceof Error ? failure.message : null);
      }
    } catch (error) {
      this.useError(error);
    } finally {
      this.loading.set(false);
    }
  }

  async setDefaultCard(id: string): Promise<boolean> {
    if (!this.cards().some((card) => card.id === id)) return false;
    const remoteId = this.remoteId(id);
    const token = this.session?.token();
    if (token && this.api && remoteId !== null) {
      try {
        await this.api.post<string>(OPS_ENDPOINTS.wallet.updatePaymentMethod, { id: remoteId }, { token });
        this.source.set('remote');
        this.lastError.set(null);
      } catch (error) {
        this.useError(error);
        return false;
      }
    } else {
      this.source.set('error');
      return false;
    }
    this.setDefaultCardLocal(id);
    return true;
  }

  async removeCard(id: string): Promise<boolean> {
    if (!this.cards().some((card) => card.id === id)) return false;
    const remoteId = this.remoteId(id);
    const token = this.session?.token();
    if (token && this.api && remoteId !== null) {
      try {
        await this.api.post<string>(OPS_ENDPOINTS.wallet.removePaymentMethod, { id: remoteId }, { token });
        this.source.set('remote');
        this.lastError.set(null);
      } catch (error) {
        this.useError(error);
        return false;
      }
    } else {
      this.source.set('error');
      return false;
    }
    this.removeCardLocal(id);
    return true;
  }

  async recharge(amount: number, cardId: string): Promise<WalletActionResult> {
    const value = Math.abs(amount);
    const token = this.session?.token();
    const payMethodId = this.remoteId(cardId);
    if (!token || payMethodId === null) return { success: false, source: 'error' };

    try {
      const response = await this.api.post<RechargeUserCreditResponseDto>(
        OPS_ENDPOINTS.wallet.recharge,
        { contractId: 0, amount: this.toCents(value), payMethodId },
        { token },
      );
      this.source.set('remote');
      this.lastError.set(null);
      if (response.challengeUrl) return { success: true, source: 'remote', challengeUrl: response.challengeUrl };

      const recharged = this.fromCents(Number(response.amountRecharged ?? this.toCents(value)) || 0);
      if (response.newBalance !== null) {
        this.balance.set(this.fromCents(Number(response.newBalance) || 0));
        this.pushMovement(recharged, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
      } else {
        this.credit(recharged, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
      }
      return { success: true, source: 'remote', amount: recharged };
    } catch (error) {
      return { success: false, source: 'error', error: this.useError(error) };
    }
  }

  async refund(amount: number, cloudToken = ''): Promise<WalletActionResult> {
    const value = Math.min(Math.abs(amount), this.balance());
    const token = this.session?.token();
    if (!token) return { success: false, source: 'error' };

    try {
      const response = await this.api.post<BalanceRefundResponseDto>(
        OPS_ENDPOINTS.wallet.refund,
        { contractId: 0, cloudToken, operatingSystem: 3, amount: this.toCents(value), simulate: 0 },
        { token },
      );
      const refunded = this.fromCents(response.refundAmount || this.toCents(value));
      this.recordRefund(refunded);
      this.source.set('remote');
      this.lastError.set(null);
      return { success: true, source: 'remote', amount: refunded };
    } catch (error) {
      return { success: false, source: 'error', error: this.useError(error) };
    }
  }

  addBalance(amount: number): void {
    if (amount >= 0) {
      this.credit(amount, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
    } else {
      this.debit(Math.abs(amount), { type: 'balance-refund', descriptionKey: 'wallet.movement.balanceRefund' });
    }
  }

  credit(amount: number, movement: WalletMovementInput): void;
  credit(amount: number, description: string, type: WalletMovementType): void;
  credit(amount: number, movementOrDescription: WalletMovementInput | string, type?: WalletMovementType): void {
    const value = Math.abs(amount);
    this.balance.update((balance) => balance + value);
    this.pushMovement(value, this.normalizeMovement(movementOrDescription, type ?? 'top-up'));
  }

  debit(amount: number, movement: WalletMovementInput): boolean;
  debit(amount: number, description: string, type: WalletMovementType): boolean;
  debit(amount: number, movementOrDescription: WalletMovementInput | string, type?: WalletMovementType): boolean {
    const value = Math.abs(amount);
    if (this.balance() < value) return false;
    this.balance.update((balance) => balance - value);
    this.pushMovement(-value, this.normalizeMovement(movementOrDescription, type ?? 'parking-payment'));
    return true;
  }

  private pushMovement(amount: number, movement: WalletMovementInput): void {
    this.movements.update((list) => [
      {
        id: generateUuid(),
        type: movement.type,
        amount,
        date: new Date().toISOString(),
        descriptionKey: movement.descriptionKey,
        descriptionParams: movement.descriptionParams,
        operationId: movement.operationId,
        description: movement.description,
      },
      ...list,
    ]);
    this.persistWallet();
  }

  private normalizeMovement(input: WalletMovementInput | string, type: WalletMovementType): WalletMovementInput {
    if (typeof input !== 'string') return input;
    return {
      type,
      descriptionKey: LEGACY_DESCRIPTION_KEYS[input] ?? input,
      description: input,
    };
  }

  private persistWallet(): void {
    this.writeStorage(this.balanceStorageKey, String(this.balance()));
    this.writeStorage(this.movementsStorageKey, JSON.stringify(this.movements()));
  }

  private persistCards(): void {
    this.writeStorage(this.cardsStorageKey, JSON.stringify(this.cards()));
    this.writeStorage(this.defaultCardStorageKey, this.defaultCardId());
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }
  }

  private mapPaymentMethod(method: PaymentMethodDto): MainCard {
    const digits = method.mask.replace(/\D/g, '');
    return {
      id: String(method.id),
      brand: method.cardBrand || method.cardType || 'Tarjeta',
      last4: digits.slice(-4) || method.mask.slice(-4),
      expiryDate: method.expDate,
      cardholderName: method.description || 'Tarjeta bancaria',
    };
  }

  private setDefaultCardLocal(id: string): void {
    this.defaultCardId.set(id);
    this.writeStorage(this.defaultCardStorageKey, id);
  }

  private removeCardLocal(id: string): void {
    this.cards.update((cards) => cards.filter((card) => card.id !== id));
    if (this.defaultCardId() === id) this.defaultCardId.set(this.cards()[0]?.id ?? '');
    this.persistCards();
  }

  private recordRefund(amount: number): void {
    const value = Math.min(Math.abs(amount), this.balance());
    this.balance.update((balance) => Math.max(0, balance - value));
    this.pushMovement(-value, { type: 'balance-refund', descriptionKey: 'wallet.movement.balanceRefund' });
  }

  private useError(error: unknown): OpsApiError {
    const apiError =
      error instanceof OpsApiError
        ? error
        : new OpsApiError('transport', 'wallet', error instanceof Error ? error.message : 'Error desconocido');
    this.source.set('error');
    this.lastError.set(apiError.message);
    return apiError;
  }

  private remoteId(id: string): number | null {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  }

  private toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private fromCents(amount: number): number {
    return amount / 100;
  }
}
