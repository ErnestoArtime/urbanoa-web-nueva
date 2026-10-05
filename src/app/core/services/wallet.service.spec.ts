import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_UNVERIFIED_OPERATING_SYSTEM } from '../api/ops-client.constants';
import { OpsApiError } from '../api/ops-api.types';
import { OpsSessionService } from '../api/ops-session.service';
import { WalletService } from './wallet.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): WalletService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(WalletService);
}

describe('WalletService', () => {
  it('does not report a confirmed zero balance when credit fails but cards load', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValues(Promise.reject(new Error('credit unavailable')) as Promise<never>, Promise.resolve({ payMethods: [] }) as Promise<never>);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();
    expect(service.source()).toBe('error');
    expect(service.lastError()).toBe('credit unavailable');
    expect(service.balanceAvailable()).toBeFalse();
  });
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
    expect(service.balanceAvailable()).toBeTrue();
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
    api.post.and.resolveTo({ payMethodId: 7, amountRecharged: 250, newBalance: 1500, order: 'order-123', challengeUrl: null });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.cards.set([{ id: '7', brand: 'Visa', last4: '1234', expiryDate: '12/99', cardholderName: 'Test' }]);

    const result = await service.recharge(2.5, '7');

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/RechargeUserCreditAPI',
      { contractId: 0, amount: 250, payMethodId: 7 },
      { token: 'token' },
    );
    expect(result).toEqual({ success: true, source: 'remote', amount: 2.5, order: 'order-123' });
    expect(service.balance()).toBe(15);
  });

  it('keeps movements in memory without writing business data to browser storage', () => {
    const service = TestBed.inject(WalletService);
    const write = spyOn(Storage.prototype, 'setItem');
    service.credit(10, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
    expect(service.balance()).toBe(10);
    expect(write).not.toHaveBeenCalled();
  });

  it('does not repopulate cleared account data when an old load finishes', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    let finishCredit!: (value: number) => void;
    api.get.and.returnValues(new Promise<number>(resolve => { finishCredit = resolve; }), Promise.resolve({ payMethods: [] }));
    const service = serviceWith(api);
    const session = TestBed.inject(OpsSessionService);
    session.setToken('old-token');
    const pending = service.load();
    session.clear();
    service.reset();
    finishCredit(1250);
    await pending;
    expect(service.balance()).toBe(0);
    expect(service.cards()).toEqual([]);
    expect(service.source()).toBe('idle');
  });

  it('keeps loaded wallet data available when a recharge is rejected by the backend', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.rejectWith(new OpsApiError('backend', 'RechargeUserCreditAPI', 'Error genérico'));
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.source.set('remote');
    service.cards.set([{ id: '93', brand: 'Visa', last4: '1234', expiryDate: '12/99', cardholderName: 'Test' }]);

    const result = await service.recharge(10, '93');

    expect(result.success).toBeFalse();
    expect(result.error?.message).toBe('Error genérico');
    expect(service.source()).toBe('remote');
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
      { contractId: 0, cloudToken: 'cloud-token', operatingSystem: OPS_UNVERIFIED_OPERATING_SYSTEM, amount: 500, simulate: 0 },
      { token: 'token' },
    );
    expect(result.source).toBe('remote');
    expect(service.balance()).toBe(7.5);
  });

  it('sends the session device token when the refund screen does not supply a cloud token', async () => {
    localStorage.setItem('urbanoa.deviceToken', 'login-device-token');
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo({ result: 1, refundAmount: 100 });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.balance.set(10);

    await service.refund(1);

    expect(api.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ cloudToken: 'login-device-token', amount: 100, simulate: 0 }));
  });

  for (const response of [{ result: 1 }, { result: -9, refundAmount: 500 }, { result: 1, refundAmount: '' }]) {
    it(`rejects an unconfirmed refund response ${JSON.stringify(response)}`, async () => {
      const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
      api.post.and.resolveTo(response);
      const service = serviceWith(api);
      TestBed.inject(OpsSessionService).setToken('token');
      service.balance.set(10);
      const result = await service.refund(5);
      expect(result.success).toBeFalse();
      expect(service.balance()).toBe(10);
    });
  }

  it('rejects recharge when login is postponed', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    const result = await service.recharge(2, 'visa-1234');

    expect(api.post).not.toHaveBeenCalled();
    expect(result.source).toBe('error');
    expect(service.balance()).toBe(0);
  });

  it('preserves an explicitly confirmed zero refund', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo({ result: 1, refundAmount: '0' });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.balance.set(10);
    expect(await service.refund(5)).toEqual({ success: true, source: 'remote', amount: 0 });
    expect(service.balance()).toBe(10);
  });

  it('rejects expired and unknown cards at the service boundary', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.cards.set([{ id: '1', brand: 'Visa', last4: '1234', expiryDate: '01/20', cardholderName: 'Test' },
      { id: '2', brand: 'Visa', last4: '5678', expiryDate: '12/99', cardholderName: 'Test' }]);
    expect((await service.recharge(5, '1')).success).toBeFalse();
    expect((await service.recharge(5, '3')).success).toBeFalse();
    expect(api.post).not.toHaveBeenCalled();
  });
});
