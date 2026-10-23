import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaymentChallengeService } from './payment-challenge.service';

describe('PaymentChallengeService', () => {
  let service: PaymentChallengeService;

  it('keeps free parking pending while its write is uncertain', () => {
    service.begin({ kind: 'parking', returnUrl: '/app/operations', amount: 0, status: 'uncertain' });
    expect(service.hasPendingPayment()).toBeTrue();
    expect(service.getPending()?.amount).toBe(0);
  });

  it('keeps uncertain outcomes pending after reload and does not expire them into permission to pay again', () => {
    service.begin({ kind: 'parking', returnUrl: '/app/operations', status: 'uncertain' });
    const raw = JSON.parse(sessionStorage.getItem('urbanoa.paycomet.pending-payment-v1')!);
    raw.startedAt = Date.now() - 31 * 60_000;
    sessionStorage.setItem('urbanoa.paycomet.pending-payment-v1', JSON.stringify(raw));
    expect(new PaymentChallengeService().hasUncertainPayment()).toBeTrue();
  });

  it('retains an in-memory pending write when browser storage is unavailable', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('storage blocked');
    service.begin({ kind: 'recharge', amount: 1, returnUrl: '/app/operations', status: 'uncertain' });
    expect(service.hasPendingPayment()).toBeTrue();
    service.clear();
    expect(service.hasPendingPayment()).toBeFalse();
  });

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(PaymentChallengeService);
  });

  it('persists minimal typed context for a recharge challenge', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-09-29T12:00:00Z'));

    service.beginRecharge({ amount: 10, order: 'paycomet-order' });

    expect(service.getPending()).toEqual({
      kind: 'recharge',
      returnUrl: '/app/account/payment-methods/recharge',
      startedAt: Date.parse('2026-09-29T12:00:00Z'),
      amount: 10,
      order: 'paycomet-order',
    });
    jasmine.clock().uninstall();
  });

  it('persists the resume route for parking and fine challenges without personal data', () => {
    service.begin({ kind: 'parking-extension', returnUrl: '/app/operations', amount: 2.5 });

    const parking = service.getPending();
    expect(parking?.kind).toBe('parking-extension');
    expect(parking?.returnUrl).toBe('/app/operations');
    expect(JSON.stringify(parking)).not.toContain('plate');

    service.begin({ kind: 'fine', returnUrl: '/app/operations/unpaid-fine-detail/42', amount: 20 });
    expect(service.getPending()?.returnUrl).toBe('/app/operations/unpaid-fine-detail/42');
  });

  it('rejects external return routes and keeps expired challenges uncertain instead of unlocking payment', () => {
    sessionStorage.setItem(
      'urbanoa.paycomet.pending-payment-v1',
      JSON.stringify({ kind: 'fine', returnUrl: 'https://example.com', startedAt: Date.now(), amount: 20 }),
    );
    expect(service.getPending()).toBeNull();

    sessionStorage.setItem(
      'urbanoa.paycomet.pending-payment-v1',
      JSON.stringify({ kind: 'fine', returnUrl: '/app/operations', startedAt: Date.now() - 31 * 60_000, amount: 20 }),
    );
    expect(service.getPending()?.status).toBe('uncertain');
    expect(new PaymentChallengeService().hasPendingPayment()).toBeTrue();
  });

  it('migrates legacy recharge context so it also expires after the first safe resume', () => {
    sessionStorage.setItem('urbanoa.paycomet.pending-recharge', JSON.stringify({ amount: 7, order: 'legacy' }));

    expect(service.getPending()).toEqual(
      jasmine.objectContaining({ kind: 'recharge', amount: 7, order: 'legacy', returnUrl: '/app/account/payment-methods/recharge' }),
    );
    expect(sessionStorage.getItem('urbanoa.paycomet.pending-recharge')).toBeNull();
    expect(sessionStorage.getItem('urbanoa.paycomet.pending-payment-v1')).not.toBeNull();
  });

  it('preserves references and the original attempt time across reloads', () => {
    service.begin({ kind: 'parking', returnUrl: '/app/operations', amount: 0.8, status: 'uncertain' });
    const startedAt = service.getPending()!.startedAt;
    service.updateReferences({ operationId: 13183249, reference: 'ops-reference', order: 'provider-order' });
    const restored = new PaymentChallengeService();
    expect(restored.getPending()).toEqual(
      jasmine.objectContaining({
        operationId: '13183249',
        reference: 'ops-reference',
        order: 'provider-order',
        startedAt,
      }),
    );
    expect(restored.hasPendingPayment()).toBeTrue();
  });

  it('archives a confirmed reference without keeping payment blocked and clears it on session cleanup', () => {
    service.begin({ kind: 'parking', returnUrl: '/app/operations', amount: 0.8, status: 'uncertain' });
    service.confirm(13183249);
    const restored = new PaymentChallengeService();
    expect(restored.hasPendingPayment()).toBeFalse();
    expect(restored.getLastConfirmed()?.payment.operationId).toBe('13183249');
    restored.clear();
    expect(restored.getLastConfirmed()).toBeNull();
  });

  it('clears pending context after the return flow finishes', () => {
    service.beginRecharge({ amount: 5 });

    service.clear();

    expect(service.getPending()).toBeNull();
  });
});
