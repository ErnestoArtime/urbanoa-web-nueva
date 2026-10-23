import { Injectable } from '@angular/core';

export type PaymentChallengeKind = 'recharge' | 'parking' | 'parking-extension' | 'fine' | 'refund' | 'unparking';

export interface PendingPaymentChallenge {
  kind: PaymentChallengeKind;
  returnUrl: string;
  startedAt: number;
  amount?: number;
  order?: string;
  operationId?: string;
  reference?: string;
  status?: 'uncertain';
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
  private volatileConfirmed: { payment: PendingPaymentChallenge; confirmedAt: number } | null = null;
  private readonly confirmedKey = 'urbanoa.payments.last-confirmed-v1';
  private volatilePending: PendingPaymentChallenge | null = null;
  private readonly key = 'urbanoa.paycomet.pending-payment-v1';
  private readonly legacyRechargeKey = 'urbanoa.paycomet.pending-recharge';
  private readonly maxAgeMs = 30 * 60_000;

  begin(challenge: PaymentChallengeRequest): void {
    const pending: PendingPaymentChallenge = { ...challenge, startedAt: Date.now() };
    this.volatilePending = pending;
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

  updateReferences(references: { operationId?: number | string; reference?: string; order?: string }): void {
    const pending = this.getPending();
    if (!pending) return;
    const updated = {
      ...pending,
      ...(references.operationId !== undefined ? { operationId: String(references.operationId) } : {}),
      ...(references.reference ? { reference: references.reference } : {}),
      ...(references.order ? { order: references.order } : {}),
    };
    this.volatilePending = updated;
    this.write(this.key, JSON.stringify(updated));
  }

  /** Only call after an authenticated terminal success response, never a provider redirect. */
  confirm(operationId?: number | string): void {
    this.updateReferences({ operationId });
    const payment = this.getPending();
    if (!payment) return;
    this.clear();
    this.volatileConfirmed = { payment, confirmedAt: Date.now() };
    this.write(this.confirmedKey, JSON.stringify(this.volatileConfirmed));
  }

  getLastConfirmed(): { payment: PendingPaymentChallenge; confirmedAt: number } | null {
    const raw = this.read(this.confirmedKey);
    if (!raw) return this.volatileConfirmed;
    try {
      const record = JSON.parse(raw);
      const payment = this.parsePending(JSON.stringify(record.payment));
      return payment && Number.isFinite(record.confirmedAt) ? { payment, confirmedAt: record.confirmedAt } : null;
    } catch {
      return null;
    }
  }

  getPending(): PendingPaymentChallenge | null {
    const value = this.read(this.key);
    if (value) return this.parsePending(value);
    if (this.volatilePending) return this.parsePending(JSON.stringify(this.volatilePending));

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
    this.volatileConfirmed = null;
    this.remove(this.confirmedKey);
    this.volatilePending = null;
    this.remove(this.key);
    this.remove(this.legacyRechargeKey);
  }

  hasUncertainPayment(): boolean {
    return this.getPending()?.status === 'uncertain';
  }

  hasPendingPayment(): boolean {
    return this.getPending() !== null;
  }

  private parsePending(value: string): PendingPaymentChallenge | null {
    try {
      const parsed = JSON.parse(value) as Partial<PendingPaymentChallenge>;
      const validKinds: PaymentChallengeKind[] = ['recharge', 'parking', 'parking-extension', 'fine', 'refund', 'unparking'];
      if (!parsed.kind || !validKinds.includes(parsed.kind)) return null;
      if (typeof parsed.returnUrl !== 'string' || !parsed.returnUrl.startsWith('/app/')) return null;
      const age = Date.now() - Number(parsed.startedAt);
      if (!Number.isFinite(parsed.startedAt) || age < 0) return null;
      if (parsed.status !== undefined && parsed.status !== 'uncertain') return null;
      if (
        parsed.amount !== undefined &&
        (!Number.isFinite(parsed.amount) ||
          Number(parsed.amount) < 0 ||
          (Number(parsed.amount) === 0 && parsed.kind !== 'parking' && parsed.kind !== 'parking-extension'))
      )
        return null;

      // Expiration limits session continuation, never proves that OPS rejected a write.
      if (parsed.status !== 'uncertain' && age > this.maxAgeMs) {
        parsed.status = 'uncertain';
        this.write(this.key, JSON.stringify(parsed));
      }

      return {
        kind: parsed.kind,
        returnUrl: parsed.returnUrl,
        startedAt: Number(parsed.startedAt),
        ...(parsed.status === 'uncertain' ? { status: parsed.status } : {}),
        ...(parsed.amount !== undefined ? { amount: Number(parsed.amount) } : {}),
        ...(typeof parsed.order === 'string' && parsed.order.trim() ? { order: parsed.order.trim() } : {}),
        ...(typeof parsed.operationId === 'string' && parsed.operationId.trim() ? { operationId: parsed.operationId.trim() } : {}),
        ...(typeof parsed.reference === 'string' && parsed.reference.trim() ? { reference: parsed.reference.trim() } : {}),
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
