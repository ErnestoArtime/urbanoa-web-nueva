import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { getOpsCloudToken, OPS_UNVERIFIED_OPERATING_SYSTEM } from '../api/ops-client.constants';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { generateUuid } from '../utils/generate-uuid';
import { isCardUsable } from '../utils/card-expiry';

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
  order?: string | null;
  challengeUrl: string | null;
}

interface BalanceRefundResponseDto {
  result: number;
  refundAmount?: number | string | null;
}

export interface WalletActionResult {
  success: boolean;
  source: 'remote' | 'error';
  amount?: number;
  order?: string;
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
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');
  readonly loading = signal(false);
  readonly lastError = signal<string | null>(null);

  readonly balance = signal(0);
  readonly movements = signal<WalletMovement[]>([]);
  readonly cards = signal<MainCard[]>([]);
  readonly defaultCardId = signal('');
  readonly usableCards = computed(() => this.cards().filter((card) => isCardUsable(card)));
  readonly defaultCard = computed(
    () => this.usableCards().find((card) => card.id === this.defaultCardId()) ?? this.usableCards()[0],
  );

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  constructor() {
    const unsubscribe = this.session.onChange?.(() => this.reset());
    inject(DestroyRef).onDestroy(() => unsubscribe?.());
  }

  get mainCard(): MainCard {
    return this.defaultCard() ?? { id: '', brand: '', last4: '', expiryDate: '', cardholderName: '' };
  }

  async loadPaymentMethodForm(): Promise<string | null> {
    const token = this.session.token();
    if (!token) return null;
    try {
      const html = await this.api.get<string>(OPS_ENDPOINTS.wallet.loadPaymentForm, { token });
      if (this.session.token() !== token) return null;
      this.source.set('remote');
      this.lastError.set(null);
      return html;
    } catch (error) {
      if (this.session.token() !== token) return null;
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
      if (this.session.token() !== token) return;
      if (creditResult.status === 'fulfilled') {
        this.balance.set(this.fromCents(creditResult.value));
      }
      if (paymentMethodsResult.status === 'fulfilled') {
        const methods = paymentMethodsResult.value.payMethods ?? [];
        const cards = methods.map((method) => this.mapPaymentMethod(method));
        this.cards.set(cards);
        this.defaultCardId.set(String(methods.find((method) => method.favorite === 1)?.id ?? cards[0]?.id ?? ''));
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
      if (this.session.token() === token) this.useError(error);
    } finally {
      if (this.session.token() === token) this.loading.set(false);
    }
  }

  async setDefaultCard(id: string): Promise<boolean> {
    if (!this.cards().some((card) => card.id === id)) return false;
    const remoteId = this.remoteId(id);
    const token = this.session?.token();
    if (token && this.api && remoteId !== null) {
      try {
        await this.api.post<string>(OPS_ENDPOINTS.wallet.updatePaymentMethod, { id: remoteId }, { token });
        if (this.session.token() !== token) return false;
        this.source.set('remote');
        this.lastError.set(null);
      } catch (error) {
        if (this.session.token() !== token) return false;
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
        if (this.session.token() !== token) return false;
        this.source.set('remote');
        this.lastError.set(null);
      } catch (error) {
        if (this.session.token() !== token) return false;
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
    if (!token || payMethodId === null || !Number.isFinite(amount) || amount <= 0 || !this.usableCards().some(card => card.id === cardId)) return { success: false, source: 'error' };

    try {
      const response = await this.api.post<RechargeUserCreditResponseDto>(
        OPS_ENDPOINTS.wallet.recharge,
        { contractId: 0, amount: this.toCents(value), payMethodId },
        { token },
      );
      if (this.session.token() !== token) return { success: false, source: 'error' };
      this.source.set('remote');
      this.lastError.set(null);
      const order = response.order?.trim() || undefined;
      if (response.challengeUrl) {
        return { success: true, source: 'remote', ...(order ? { order } : {}), challengeUrl: response.challengeUrl };
      }

      const recharged = this.fromCents(Number(response.amountRecharged ?? this.toCents(value)) || 0);
      if (response.newBalance !== null) {
        this.balance.set(this.fromCents(Number(response.newBalance) || 0));
        this.pushMovement(recharged, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
      } else {
        this.credit(recharged, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
      }
      return { success: true, source: 'remote', amount: recharged, ...(order ? { order } : {}) };
    } catch (error) {
      // A rejected recharge does not invalidate the wallet data already shown
      // on screen. Keep that state and expose the operation error to its form.
      return { success: false, source: 'error', error: this.actionError(error) };
    }
  }

  async refund(amount: number, cloudToken = ''): Promise<WalletActionResult> {
    const value = Math.min(Math.abs(amount), this.balance());
    const token = this.session?.token();
    if (!token || !Number.isFinite(amount) || amount <= 0 || value <= 0) return { success: false, source: 'error' };

    try {
      const response = await this.api.post<BalanceRefundResponseDto>(
        OPS_ENDPOINTS.wallet.refund,
        { contractId: 0, cloudToken: cloudToken.trim() || getOpsCloudToken(), operatingSystem: OPS_UNVERIFIED_OPERATING_SYSTEM, amount: this.toCents(value), simulate: 0 },
        { token },
      );
      if (this.session.token() !== token) return { success: false, source: 'error' };
      if (response.result !== 1 || response.refundAmount == null || String(response.refundAmount).trim() === '' || !Number.isFinite(Number(response.refundAmount)) || Number(response.refundAmount) < 0) {
        throw new OpsApiError('invalid-response', OPS_ENDPOINTS.wallet.refund, 'El servicio no confirmó el importe de la devolución.');
      }
      const refunded = this.fromCents(Number(response.refundAmount));
      this.recordRefund(refunded);
      this.source.set('remote');
      this.lastError.set(null);
      return { success: true, source: 'remote', amount: refunded };
    } catch (error) {
      if (this.session.token() !== token) return { success: false, source: 'error' };
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
  }

  private normalizeMovement(input: WalletMovementInput | string, type: WalletMovementType): WalletMovementInput {
    if (typeof input !== 'string') return input;
    return {
      type,
      descriptionKey: LEGACY_DESCRIPTION_KEYS[input] ?? input,
      description: input,
    };
  }

  reset(): void {
    this.balance.set(0);
    this.movements.set([]);
    this.cards.set([]);
    this.defaultCardId.set('');
    this.source.set('idle');
    this.loading.set(false);
    this.lastError.set(null);
  }

  private mapPaymentMethod(method: PaymentMethodDto): MainCard {
    const digits = method.mask.replace(/\D/g, '');
    return {
      id: String(method.id),
      brand: method.cardBrand || method.cardType || '',
      last4: digits.slice(-4) || method.mask.slice(-4),
      expiryDate: method.expDate,
      cardholderName: method.description || '',
    };
  }

  private setDefaultCardLocal(id: string): void {
    this.defaultCardId.set(id);
  }

  private removeCardLocal(id: string): void {
    this.cards.update((cards) => cards.filter((card) => card.id !== id));
    if (this.defaultCardId() === id) this.defaultCardId.set(this.cards()[0]?.id ?? '');
  }

  private recordRefund(amount: number): void {
    const value = Math.min(Math.abs(amount), this.balance());
    this.balance.update((balance) => Math.max(0, balance - value));
    this.pushMovement(-value, { type: 'balance-refund', descriptionKey: 'wallet.movement.balanceRefund' });
  }

  private useError(error: unknown): OpsApiError {
    const apiError = this.actionError(error);
    this.source.set('error');
    return apiError;
  }

  private actionError(error: unknown): OpsApiError {
    const apiError =
      error instanceof OpsApiError
        ? error
        : new OpsApiError('transport', 'wallet', error instanceof Error ? error.message : 'Error desconocido');
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
