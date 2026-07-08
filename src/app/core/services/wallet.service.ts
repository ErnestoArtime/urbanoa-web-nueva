import { computed, Injectable, signal } from '@angular/core';

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
  description: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly cardsStorageKey = 'urbanoa.payment-cards';
  private readonly defaultCardStorageKey = 'urbanoa.default-payment-card';
  readonly balance = signal(12.5);
  readonly movements = signal<WalletMovement[]>([]);
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
    const created = { ...card, id: crypto.randomUUID() };
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
    this.balance.update((b) => b + amount);
  }

  credit(amount: number, description: string, type: WalletMovementType): void {
    const value = Math.abs(amount);
    this.balance.update((b) => b + value);
    this.movements.update((list) => [
      { id: crypto.randomUUID(), type, amount: value, date: new Date().toISOString(), description },
      ...list,
    ]);
  }

  debit(amount: number, description: string, type: WalletMovementType): boolean {
    const value = Math.abs(amount);
    if (this.balance() < value) return false;
    this.balance.update((b) => b - value);
    this.movements.update((list) => [
      { id: crypto.randomUUID(), type, amount: -value, date: new Date().toISOString(), description },
      ...list,
    ]);
    return true;
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
