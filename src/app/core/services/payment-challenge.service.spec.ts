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

  it('persists only the minimal recharge context during the external challenge', () => {
    service.beginRecharge({ amount: 10, order: 'paycomet-order' });

    expect(service.consumeRecharge()).toEqual({ amount: 10, order: 'paycomet-order' });
  });

  it('clears the pending recharge after it is consumed', () => {
    service.beginRecharge({ amount: 5 });

    service.clear();

    expect(service.consumeRecharge()).toBeNull();
  });
});
