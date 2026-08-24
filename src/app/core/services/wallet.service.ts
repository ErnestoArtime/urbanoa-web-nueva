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
  amountRecharged: number | null;
  newBalance: number | null;
  challengeUrl: string | null;
}

interface BalanceRefundResponseDto {
  result: number;
  refundAmount: number;
}

export interface WalletActionResult {
  success: boolean;
  source: 'remote' | 'mock';
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
  'Pago de denuncia': 'wallet.movement.finePayment',
  'Devolución de saldo': 'wallet.movement.balanceRefund',
};

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly balanceStorageKey = 'urbanoa.wallet.balance';
  private readonly movementsStorageKey = 'urbanoa.wallet.movements';
  private readonly cardsStorageKey = 'urbanoa.payment-cards';
  private readonly defaultCardStorageKey = 'urbanoa.default-payment-card';

  readonly source = signal<'remote' | 'mock'>('mock');
  readonly loading = signal(false);
  readonly lastError = signal<string | null>(null);

  readonly balance = signal(this.readBalance());
  readonly movements = signal<WalletMovement[]>(this.readMovements());

  private readonly fallbackCards: MainCard[] = [
    {
      id: 'visa-1234',
      brand: 'Visa',
      last4: '1234',
      expiryDate: '12/28',
      cardholderName: 'Juan García',
    },
    {
      id: 'mastercard-5678',
      brand: 'Mastercard',
      last4: '5678',
      expiryDate: '09/29',
      cardholderName: 'Juan García',
    },
  ];

  readonly cards = signal<MainCard[]>(this.readCards());
  readonly defaultCardId = signal(this.readDefaultCardId());
  readonly defaultCard = computed(() => this.cards().find((card) => card.id === this.defaultCardId()) ?? this.cards()[0]);

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  get mainCard(): MainCard {
    return this.defaultCard() ?? this.fallbackCards[0];
  }

  addCard(card: Omit<MainCard, 'id'>): MainCard {
    const created = { ...card, id: generateUuid() };
    this.cards.update((cards) => [...cards, created]);
    if (!this.defaultCardId()) this.defaultCardId.set(created.id);
    this.persistCards();
    return created;
  }

  async load(): Promise<void> {
    const token = this.session?.token();
    if (!token || !this.api) {
      this.source.set('mock');
      this.lastError.set(null);
      return;
    }

    this.loading.set(true);
    this.lastError.set(null);
    try {
      const [credit, paymentMethods] = await Promise.all([
        this.api.get<number>(OPS_ENDPOINTS.wallet.credit, { token }),
        this.api.get<PaymentMethodsDto>(OPS_ENDPOINTS.wallet.paymentMethods, { token }),
      ]);
      this.balance.set(this.fromCents(credit));
      const methods = paymentMethods.payMethods ?? [];
      const cards = methods.map((method) => this.mapPaymentMethod(method));
      this.cards.set(cards);
      this.defaultCardId.set(String(methods.find((method) => method.favorite === 1)?.id ?? cards[0]?.id ?? ''));
      this.source.set('remote');
      this.persistWallet();
      this.persistCards();
    } catch (error) {
      this.useMock(error);
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
        this.useMock(error);
      }
    } else {
      this.source.set('mock');
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
        this.useMock(error);
      }
    } else {
      this.source.set('mock');
    }
    this.removeCardLocal(id);
    return true;
  }

  async recharge(amount: number, cardId: string): Promise<WalletActionResult> {
    const value = Math.abs(amount);
    const token = this.session?.token();
    const payMethodId = this.remoteId(cardId);
    if (!token || !this.api || payMethodId === null) return this.mockRecharge(value);

    try {
      const response = await this.api.post<RechargeUserCreditResponseDto>(
        OPS_ENDPOINTS.wallet.recharge,
        { contractId: 0, amount: this.toCents(value), payMethodId },
        { token },
      );
      this.source.set('remote');
      this.lastError.set(null);
      if (response.challengeUrl) return { success: true, source: 'remote', challengeUrl: response.challengeUrl };

      const recharged = this.fromCents(response.amountRecharged ?? this.toCents(value));
      if (response.newBalance !== null) {
        this.balance.set(this.fromCents(response.newBalance));
        this.pushMovement(recharged, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
      } else {
        this.credit(recharged, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
      }
      return { success: true, source: 'remote', amount: recharged };
    } catch (error) {
      return this.mockRecharge(value, error);
    }
  }

  async refund(amount: number, cloudToken = ''): Promise<WalletActionResult> {
    const value = Math.min(Math.abs(amount), this.balance());
    const token = this.session?.token();
    if (!token || !this.api) return this.mockRefund(value);

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
      return this.mockRefund(value, error);
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

  private readBalance(): number {
    try {
      const raw = localStorage.getItem(this.balanceStorageKey);
      if (raw === null) return 12.5;
      const stored = Number(raw);
      return Number.isFinite(stored) ? stored : 12.5;
    } catch {
      return 12.5;
    }
  }

  private readMovements(): WalletMovement[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.movementsStorageKey) ?? 'null') as WalletMovement[] | null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private readCards(): MainCard[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.cardsStorageKey) ?? 'null') as MainCard[] | null;
      return Array.isArray(parsed) ? parsed : this.fallbackCards.map((card) => ({ ...card }));
    } catch {
      return this.fallbackCards.map((card) => ({ ...card }));
    }
  }

  private readDefaultCardId(): string {
    try {
      return localStorage.getItem(this.defaultCardStorageKey) ?? this.readCards()[0]?.id ?? '';
    } catch {
      return this.fallbackCards[0].id;
    }
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

  private mockRecharge(amount: number, error?: unknown): WalletActionResult {
    const apiError = error === undefined ? undefined : this.useMock(error);
    this.source.set('mock');
    this.credit(amount, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
    return { success: true, source: 'mock', amount, error: apiError };
  }

  private mockRefund(amount: number, error?: unknown): WalletActionResult {
    const apiError = error === undefined ? undefined : this.useMock(error);
    this.source.set('mock');
    this.recordRefund(amount);
    return { success: true, source: 'mock', amount, error: apiError };
  }

  private recordRefund(amount: number): void {
    const value = Math.min(Math.abs(amount), this.balance());
    this.balance.update((balance) => Math.max(0, balance - value));
    this.pushMovement(-value, { type: 'balance-refund', descriptionKey: 'wallet.movement.balanceRefund' });
  }

  private useMock(error: unknown): OpsApiError {
    const apiError =
      error instanceof OpsApiError
        ? error
        : new OpsApiError('transport', 'wallet', error instanceof Error ? error.message : 'Error desconocido');
    console.warn('[OPS API] La billetera utiliza fallback mock', apiError);
    this.source.set('mock');
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
