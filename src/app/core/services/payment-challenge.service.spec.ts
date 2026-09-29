import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaymentChallengeService } from './payment-challenge.service';

describe('PaymentChallengeService', () => {
  let service: PaymentChallengeService;

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

    service.begin({ kind: 'fine', returnUrl: '/app/operations/unpaid-fines/42', amount: 20 });
    expect(service.getPending()?.returnUrl).toBe('/app/operations/unpaid-fines/42');
  });

  it('rejects expired or externally-routable stored context', () => {
    sessionStorage.setItem(
      'urbanoa.paycomet.pending-payment-v1',
      JSON.stringify({ kind: 'fine', returnUrl: 'https://example.com', startedAt: Date.now(), amount: 20 }),
    );
    expect(service.getPending()).toBeNull();

    sessionStorage.setItem(
      'urbanoa.paycomet.pending-payment-v1',
      JSON.stringify({ kind: 'fine', returnUrl: '/app/operations', startedAt: Date.now() - 31 * 60_000, amount: 20 }),
    );
    expect(service.getPending()).toBeNull();
  });

  it('migrates legacy recharge context so it also expires after the first safe resume', () => {
    sessionStorage.setItem('urbanoa.paycomet.pending-recharge', JSON.stringify({ amount: 7, order: 'legacy' }));

    expect(service.getPending()).toEqual(
      jasmine.objectContaining({ kind: 'recharge', amount: 7, order: 'legacy', returnUrl: '/app/account/payment-methods/recharge' }),
    );
    expect(sessionStorage.getItem('urbanoa.paycomet.pending-recharge')).toBeNull();
    expect(sessionStorage.getItem('urbanoa.paycomet.pending-payment-v1')).not.toBeNull();
  });

  it('clears pending context after the return flow finishes', () => {
    service.beginRecharge({ amount: 5 });

    service.clear();

    expect(service.getPending()).toBeNull();
  });
});
