import { computed, Injectable, signal } from '@angular/core';
import { generateUuid } from '../utils/generate-uuid';

export interface MainCard {
  id: string;
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

  setDefaultCard(id: string): void {
    if (!this.cards().some((card) => card.id === id)) return;
    this.defaultCardId.set(id);
    this.writeStorage(this.defaultCardStorageKey, id);
  }

  removeCard(id: string): boolean {
    if (!this.cards().some((card) => card.id === id)) return false;
    this.cards.update((cards) => cards.filter((card) => card.id !== id));
    if (this.defaultCardId() === id) this.defaultCardId.set(this.cards()[0]?.id ?? '');
    this.persistCards();
    return true;
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
      const stored = Number(localStorage.getItem(this.balanceStorageKey));
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
}
