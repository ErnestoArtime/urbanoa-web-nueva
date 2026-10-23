import { TranslationService } from './core/services/translation.service';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { OpsApiClient } from './core/api/ops-api-client.service';
import { PaymentChallengeService } from './core/services/payment-challenge.service';
import { OpsSessionService } from './core/api/ops-session.service';
import { OPS_ENDPOINTS } from './core/api/ops-endpoints';
import { WindowSessionService } from './core/services/window-session.service';
import { WalletService } from './core/services/wallet.service';
import { VehicleService } from './core/services/vehicle.service';
import { AuthService } from './core/services/auth.service';
import { ParkingApiService } from './core/services/parking-api.service';
import { OperationsService } from './core/services/operations.service';
import { ParkingFlowStore } from './features/parking/parking-flow.store';
import { ParkingConfirmComponent } from './features/parking/confirm/confirm.component';
import { OpsApiError } from './core/api/ops-api.types';
import { OperationType } from './shared/models/operation-type';

// Regression tests for error containment and state consistency.
describe('Error state consistency', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('authenticated HTTP 401 requests central session expiration', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: WindowSessionService, useValue: { ensureActive: () => true } }] });
    const client = TestBed.inject(OpsApiClient);
    const session = TestBed.inject(OpsSessionService);
    session.setToken('audit-token');
    const dispatch = spyOn(window, 'dispatchEvent').and.callThrough();
    spyOn(globalThis, 'fetch').and.resolveTo(new Response('', { status: 401 }));
    await expectAsync(client.get(OPS_ENDPOINTS.wallet.credit, { token: 'audit-token' })).toBeRejected();
    expect(session.token()).toBe('audit-token');
    expect(dispatch.calls.allArgs().some((args) => args[0].type === 'urbanoa:session-expired')).toBeTrue();
  });

  it('network failure loading vehicles remains an error', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: OpsApiClient, useValue: { getOrNull: () => Promise.reject(new Error('network down')) } }],
    });
    const vehicles = TestBed.inject(VehicleService);
    TestBed.inject(OpsSessionService).setToken('audit-token');
    await vehicles.load();
    expect(vehicles.vehicles()).toEqual([]);
    expect(vehicles.source()).toBe('error');
    expect(vehicles.lastError()).not.toBeNull();
  });

  it('an older concurrent wallet response cannot overwrite newer balance', async () => {
    let resolveOld!: (value: number) => void;
    let creditCalls = 0;
    const oldCredit = new Promise<number>((resolve) => (resolveOld = resolve));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: OpsApiClient,
          useValue: {
            get: (endpoint: string) =>
              endpoint === OPS_ENDPOINTS.wallet.credit
                ? ++creditCalls === 1
                  ? oldCredit
                  : Promise.resolve(2000)
                : Promise.resolve({ payMethods: [] }),
          },
        },
      ],
    });
    const wallet = TestBed.inject(WalletService);
    TestBed.inject(OpsSessionService).setToken('audit-token');
    const older = wallet.load();
    await wallet.load();
    expect(wallet.balance()).toBe(20);
    expect(wallet.loading()).toBeFalse();
    resolveOld(1000);
    await older;
    expect(wallet.balance()).toBe(20);
    expect(wallet.source()).toBe('remote');
  });

  it('redirect failure releases the loader and keeps the payment pending', async () => {
    const confirmParking = jasmine.createSpy().and.resolveTo({ success: true, challengeUrl: 'https://example.invalid' });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            preparePaymentRedirect: () => {
              throw new Error('redirect rejected');
            },
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } },
        {
          provide: ParkingFlowStore,
          useValue: { hasMinimumParkingData: () => true, fromStore: () => ({ amount: '1,50 €', plate: '1234ABC' }) },
        },
        {
          provide: WalletService,
          useValue: { balance: signal(10), cards: signal([]), defaultCardId: signal(''), loading: signal(false), mainCard: {} },
        },
        { provide: ParkingApiService, useValue: { confirmParking, serverNow: () => new Date(), opsDate: () => '20261012' } },
        { provide: OperationsService, useValue: {} },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingConfirmComponent());
    component.swipePay = { reset: jasmine.createSpy() } as never;
    await expectAsync(component.onSwipeComplete()).toBeResolved();
    expect(component.loading()).toBeFalse();
    expect(component.submitError()).not.toBeNull();
    await component.onSwipeComplete();
    expect(confirmParking).toHaveBeenCalledTimes(1);
    sessionStorage.removeItem('urbanoa.paycomet.pending-payment-v1');
  });

  it('navigation rejection after confirmation releases the loader without allowing another payment', async () => {
    const confirmParking = jasmine.createSpy().and.resolveTo({ success: true, operationId: 'confirmed-operation' });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            preparePaymentRedirect: () => {
              throw new Error('redirect rejected');
            },
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy().and.rejectWith(new Error('navigation rejected')) } },
        {
          provide: ParkingFlowStore,
          useValue: { hasMinimumParkingData: () => true, fromStore: () => ({ amount: '1,50 €', plate: '1234ABC' }) },
        },
        {
          provide: WalletService,
          useValue: { balance: signal(10), cards: signal([]), defaultCardId: signal(''), loading: signal(false), mainCard: {} },
        },
        { provide: ParkingApiService, useValue: { confirmParking, serverNow: () => new Date(), opsDate: () => '20261012' } },
        { provide: OperationsService, useValue: {} },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingConfirmComponent());
    component.swipePay = { reset: jasmine.createSpy() } as never;
    await expectAsync(component.onSwipeComplete()).toBeResolved();
    expect(component.loading()).toBeFalse();
    expect(component.submitError()).not.toBeNull();
    const challenge = TestBed.inject(PaymentChallengeService);
    expect(challenge.hasPendingPayment()).toBeFalse();
    expect(challenge.getLastConfirmed()?.payment.operationId).toBe('confirmed-operation');
    expect(component.backendConfirmed()).toBeTrue();
    expect(component.paymentUncertain()).toBeFalse();
    expect(component.submitError()).not.toBe(TestBed.inject(TranslationService).translate('payment.uncertain.message'));
    const router = TestBed.inject(Router);
    (router.navigate as jasmine.Spy).and.resolveTo(true);
    await component.onSwipeComplete();
    expect(router.navigate).toHaveBeenCalledTimes(2);
    expect(component.submitError()).toBeNull();
    expect(confirmParking).toHaveBeenCalledTimes(1);
    sessionStorage.removeItem('urbanoa.paycomet.pending-payment-v1');
  });

  it('never uses a previous operation as proof of this payment', async () => {
    const now = new Date();
    const navigate = jasmine.createSpy().and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({ amount: '1,50 €', plate: '1234ABC', cityId: '3', sectorId: '4' }),
          },
        },
        {
          provide: WalletService,
          useValue: { balance: signal(10), cards: signal([]), defaultCardId: signal(''), loading: signal(false), mainCard: {} },
        },
        {
          provide: ParkingApiService,
          useValue: {
            confirmParking: () => Promise.resolve({ success: false, error: new OpsApiError('timeout', 'confirm', 'timeout') }),
            serverNow: () => now,
            opsDate: () => '20261012',
          },
        },
        {
          provide: OperationsService,
          useValue: {
            load: () => Promise.resolve(),
            source: () => 'remote',
            operations: () => [
              {
                id: 'old-operation',
                type: OperationType.PARKING,
                plate: '1234ABC',
                contractId: 3,
                sectorId: 4,
                amount: -1.5,
                operationDate: new Date(now.getTime() - 5 * 60_000).toISOString(),
              },
            ],
          },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingConfirmComponent());
    component.swipePay = { reset: jasmine.createSpy() } as never;
    await component.onSwipeComplete();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.paymentUncertain()).toBeTrue();
    expect(component.submitError()).not.toBeNull();
  });
});
