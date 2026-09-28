import { Injectable } from '@angular/core';

export interface PendingRechargeChallenge {
  amount: number;
  order?: string;
}

/**
 * Persists only the UI context required to resume after Paycomet redirects the
 * browser away from the SPA. It deliberately does not assert that a payment
 * has settled: the current provider flow exposes only an OK/KO return signal.
 */
@Injectable({ providedIn: 'root' })
export class PaymentChallengeService {
  private readonly rechargeKey = 'urbanoa.paycomet.pending-recharge';

  beginRecharge(challenge: PendingRechargeChallenge): void {
    this.write(this.rechargeKey, JSON.stringify(challenge));
  }

  consumeRecharge(): PendingRechargeChallenge | null {
    const value = this.read(this.rechargeKey);
    if (!value) return null;

    try {
      const parsed = JSON.parse(value) as Partial<PendingRechargeChallenge>;
      if (!Number.isFinite(parsed.amount) || Number(parsed.amount) <= 0) return null;
      return {
        amount: Number(parsed.amount),
        ...(typeof parsed.order === 'string' && parsed.order.trim() ? { order: parsed.order.trim() } : {}),
      };
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(this.rechargeKey);
    } catch {
      // Storage can be unavailable in restricted browsing contexts.
    }
  }

  private write(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // The redirect can still proceed when browser storage is unavailable.
    }
  }

  private read(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
