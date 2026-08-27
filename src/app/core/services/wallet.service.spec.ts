import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { WalletService } from './wallet.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): WalletService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(WalletService);
}

describe('WalletService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('credits balance and records a top-up movement', () => {
    const service = TestBed.inject(WalletService);

    service.credit(10, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });

    expect(service.balance()).toBe(10);
    expect(service.movements()[0].type).toBe('top-up');
    expect(service.movements()[0].amount).toBe(10);
  });

  it('does not debit when balance is insufficient', () => {
    const service = TestBed.inject(WalletService);

    const paid = service.debit(99, { type: 'fine-payment', descriptionKey: 'wallet.movement.finePayment' });

    expect(paid).toBeFalse();
    expect(service.balance()).toBe(0);
    expect(service.movements().length).toBe(0);
  });

  it('loads balance and payment methods with the APK response contract', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValues(
      Promise.resolve(1250) as Promise<never>,
      Promise.resolve({
        payMethods: [
          {
            id: 7,
            description: 'Personal',
            mask: '************4321',
            tokenUserCard: 'token-card',
            idUserCard: 9,
            expDate: '12/28',
            cardBrand: 'Visa',
            cardType: 'CREDIT',
            type: 1,
            favorite: 1,
          },
        ],
      }) as Promise<never>,
    );
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();

    expect(service.balance()).toBe(12.5);
    expect(service.cards()).toEqual([{ id: '7', brand: 'Visa', last4: '4321', expiryDate: '12/28', cardholderName: 'Personal' }]);
    expect(service.defaultCardId()).toBe('7');
    expect(service.source()).toBe('remote');
  });

  it('keeps the real balance when payment methods fail', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValues(Promise.resolve(29823) as Promise<never>, Promise.reject(new Error('cards unavailable')) as Promise<never>);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(service.balance()).toBe(298.23);
    expect(service.cards()).toEqual([]);
    expect(service.source()).toBe('remote');
  });

  it('recharges in cents using RechargeUserCreditAPI', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo({ payMethodId: 7, amountRecharged: 250, newBalance: 1500, challengeUrl: null });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.recharge(2.5, '7');

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/RechargeUserCreditAPI',
      { contractId: 0, amount: 250, payMethodId: 7 },
      { token: 'token' },
    );
    expect(result).toEqual({ success: true, source: 'remote', amount: 2.5 });
    expect(service.balance()).toBe(15);
  });

  it('refunds with the exact APK fields and converts cents to euros', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo({ result: 1, refundAmount: 500 });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.credit(12.5, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });

    const result = await service.refund(5, 'cloud-token');

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/RefundUserCreditAPI',
      { contractId: 0, cloudToken: 'cloud-token', operatingSystem: 3, amount: 500, simulate: 0 },
      { token: 'token' },
    );
    expect(result.source).toBe('remote');
    expect(service.balance()).toBe(7.5);
  });

  it('rejects recharge when login is postponed', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    const result = await service.recharge(2, 'visa-1234');

    expect(api.post).not.toHaveBeenCalled();
    expect(result.source).toBe('error');
    expect(service.balance()).toBe(0);
  });
});
