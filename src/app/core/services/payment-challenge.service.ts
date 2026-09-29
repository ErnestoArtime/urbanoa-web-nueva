import { Injectable } from '@angular/core';

export type PaymentChallengeKind = 'recharge' | 'parking' | 'parking-extension' | 'fine';

export interface PendingPaymentChallenge {
  kind: PaymentChallengeKind;
  returnUrl: string;
  startedAt: number;
  amount?: number;
  order?: string;
}

export interface PendingRechargeChallenge {
  amount: number;
  order?: string;
}

export type PaymentChallengeRequest = Omit<PendingPaymentChallenge, 'startedAt'>;

/**
 * Keeps the minimum UI context required while Paycomet takes the browser away
 * from the SPA. A stored challenge is navigation context, never proof that a
 * payment has settled.
 */
@Injectable({ providedIn: 'root' })
export class PaymentChallengeService {
  private readonly key = 'urbanoa.paycomet.pending-payment-v1';
  private readonly legacyRechargeKey = 'urbanoa.paycomet.pending-recharge';
  private readonly maxAgeMs = 30 * 60_000;

  begin(challenge: PaymentChallengeRequest): void {
    const pending: PendingPaymentChallenge = { ...challenge, startedAt: Date.now() };
    this.write(this.key, JSON.stringify(pending));
    this.remove(this.legacyRechargeKey);
  }

  beginRecharge(challenge: PendingRechargeChallenge): void {
    this.begin({
      kind: 'recharge',
      returnUrl: '/app/account/payment-methods/recharge',
      amount: challenge.amount,
      ...(challenge.order ? { order: challenge.order } : {}),
    });
  }

  getPending(): PendingPaymentChallenge | null {
    const value = this.read(this.key);
    if (value) return this.parsePending(value);

    // Allows an in-flight recharge created by the previous web version to
    // return safely after a deployment. It still is not treated as success.
    const legacy = this.read(this.legacyRechargeKey);
    if (!legacy) return null;
    try {
      const parsed = JSON.parse(legacy) as Partial<PendingRechargeChallenge>;
      if (!Number.isFinite(parsed.amount) || Number(parsed.amount) <= 0) return null;
      const pending: PendingPaymentChallenge = {
        kind: 'recharge',
        returnUrl: '/app/account/payment-methods/recharge',
        startedAt: Date.now(),
        amount: Number(parsed.amount),
        ...(typeof parsed.order === 'string' && parsed.order.trim() ? { order: parsed.order.trim() } : {}),
      };
      this.write(this.key, JSON.stringify(pending));
      this.remove(this.legacyRechargeKey);
      return pending;
    } catch {
      return null;
    }
  }

  consumeRecharge(): PendingRechargeChallenge | null {
    const pending = this.getPending();
    if (pending?.kind !== 'recharge' || !pending.amount) return null;
    return {
      amount: pending.amount,
      ...(pending.order ? { order: pending.order } : {}),
    };
  }

  clear(): void {
    this.remove(this.key);
    this.remove(this.legacyRechargeKey);
  }

  private parsePending(value: string): PendingPaymentChallenge | null {
    try {
      const parsed = JSON.parse(value) as Partial<PendingPaymentChallenge>;
      const validKinds: PaymentChallengeKind[] = ['recharge', 'parking', 'parking-extension', 'fine'];
      if (!parsed.kind || !validKinds.includes(parsed.kind)) return null;
      if (typeof parsed.returnUrl !== 'string' || !parsed.returnUrl.startsWith('/app/')) return null;
      if (!Number.isFinite(parsed.startedAt) || Date.now() - Number(parsed.startedAt) > this.maxAgeMs) return null;
      if (parsed.amount !== undefined && (!Number.isFinite(parsed.amount) || Number(parsed.amount) <= 0)) return null;

      return {
        kind: parsed.kind,
        returnUrl: parsed.returnUrl,
        startedAt: Number(parsed.startedAt),
        ...(parsed.amount !== undefined ? { amount: Number(parsed.amount) } : {}),
        ...(typeof parsed.order === 'string' && parsed.order.trim() ? { order: parsed.order.trim() } : {}),
      };
    } catch {
      return null;
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

  private remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in restricted browsing contexts.
    }
  }
}
