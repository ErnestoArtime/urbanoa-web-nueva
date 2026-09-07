import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { OperationsService } from '../../../core/services/operations.service';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationType } from '../../../shared/models/operation-type';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingConfirmComponent } from './confirm.component';

describe('ParkingConfirmComponent', () => {
  it('blocks payment without funds or cards and opens wallet management without leaving parking', async () => {
    const confirmParking = jasmine.createSpy();
    const navigate = jasmine.createSpy();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({ amount: '1,50 €', plate: '1234ABC' }),
          },
        },
        {
          provide: WalletService,
          useValue: {
            balance: signal(0),
            cards: signal([]),
            defaultCardId: signal(''),
            loading: signal(false),
          },
        },
        { provide: ParkingApiService, useValue: { confirmParking } },
        { provide: OperationsService, useValue: {} },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingConfirmComponent());
    component.swipePay = { reset: jasmine.createSpy() } as never;
    await component.onSwipeComplete();
    expect(confirmParking).not.toHaveBeenCalled();
    expect(component.paymentAlertOpen()).toBeTrue();
    component.openPaymentMethods();
    expect(component.walletManagerOpen()).toBeTrue();
    expect(component.paymentAlertOpen()).toBeFalse();
    expect(component.query().plate).toBe('1234ABC');
    expect(navigate).not.toHaveBeenCalled();
  });
  it('loads the wallet on direct access and selects the default card', async () => {
    const defaultCardId = signal('');
    const wallet = {
      balance: signal(0),
      cards: signal([]),
      defaultCardId,
      loading: signal(false),
      load: jasmine.createSpy().and.callFake(async () => defaultCardId.set('7')),
      mainCard: { id: '7', brand: 'VISA', last4: '1234', expiryDate: '12/30', cardholderName: '' },
    };

    TestBed.configureTestingModule({
      imports: [ParkingConfirmComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({ amount: '1,50 €', plate: '1234567', zone: 'Z2 AZUL', street: 'AITZA KALEA' }),
          },
        },
        { provide: WalletService, useValue: wallet },
        { provide: ParkingApiService, useValue: { confirmParking: jasmine.createSpy(), opsDate: jasmine.createSpy() } },
      ],
    });
    TestBed.overrideComponent(ParkingConfirmComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(ParkingConfirmComponent);
    await fixture.whenStable();

    expect(wallet.load).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.selectedCardId()).toBe('7');
  });

  it('confirms an extension with the APK location contract', async () => {
    const confirmExtension = jasmine.createSpy().and.resolveTo({ success: true, source: 'remote' });
    const wallet = {
      balance: signal(10),
      cards: signal([]),
      defaultCardId: signal(''),
      loading: signal(false),
      load: jasmine.createSpy().and.resolveTo(),
      mainCard: { id: '', brand: '', last4: '', expiryDate: '', cardholderName: '' },
    };
    TestBed.configureTestingModule({
      imports: [ParkingConfirmComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({
              mode: 'extension',
              cityId: '3',
              plate: '1234567',
              sectorId: '22002',
              amount: '2,50 €',
              tariffType: '6',
              minutes: '90',
              latitude: '43.2',
              longitude: '-2.1',
              street: 'Kale Nagusia',
              ticketId: '4',
            }),
          },
        },
        { provide: WalletService, useValue: wallet },
        {
          provide: ParkingApiService,
          useValue: {
            serverNow: () => new Date('2026-09-03T13:00:00Z'),
            opsDate: () => '150000030926',
            confirmParking: jasmine.createSpy(),
            confirmExtension,
          },
        },
      ],
    });
    TestBed.overrideComponent(ParkingConfirmComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(ParkingConfirmComponent);
    fixture.componentInstance.swipePay = { reset: jasmine.createSpy() } as never;

    await fixture.componentInstance.onSwipeComplete();

    expect(confirmExtension).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        contractId: 3,
        plate: '1234567',
        sector: 22002,
        quantity: 250,
        tariffType: 6,
        time: 90,
        latitude: 0,
        longitude: 0,
        street: '',
      }),
    );
  });

  it('does not send a second confirmation while the first one is pending', async () => {
    let resolveConfirmation!: (value: { success: boolean; source: 'remote'; operationId: number }) => void;
    const confirmParking = jasmine.createSpy().and.returnValue(new Promise((resolve) => (resolveConfirmation = resolve)));
    const navigate = jasmine.createSpy().and.resolveTo(true);
    const wallet = {
      balance: signal(10),
      cards: signal([]),
      defaultCardId: signal(''),
      loading: signal(false),
      load: jasmine.createSpy().and.resolveTo(),
      mainCard: { id: '', brand: '', last4: '', expiryDate: '', cardholderName: '' },
    };
    TestBed.configureTestingModule({
      imports: [ParkingConfirmComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({
              cityId: '3',
              plate: '1234ABC',
              sectorId: '4',
              amount: '1,50 €',
              tariffType: '2',
              minutes: '60',
              street: 'Nagusia Kalea',
            }),
          },
        },
        { provide: WalletService, useValue: wallet },
        {
          provide: ParkingApiService,
          useValue: { serverNow: () => new Date('2026-09-07T10:00:00Z'), opsDate: () => '120000070926', confirmParking },
        },
        { provide: OperationsService, useValue: { load: jasmine.createSpy(), operations: signal([]), source: signal('idle') } },
      ],
    });
    TestBed.overrideComponent(ParkingConfirmComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(ParkingConfirmComponent);
    fixture.componentInstance.swipePay = { reset: jasmine.createSpy() } as never;

    const first = fixture.componentInstance.onSwipeComplete();
    const second = fixture.componentInstance.onSwipeComplete();

    expect(confirmParking).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.loading()).toBeTrue();
    resolveConfirmation({ success: true, source: 'remote', operationId: 42 });
    await Promise.all([first, second]);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  for (const recoverableError of [
    new OpsApiError('backend', 'ConfirmParkingOperationAPI', 'La operación ya se ha insertado', 200, {
      code: -13,
      type: 3,
      message_ES: 'La operación ya se ha insertado',
    }),
    new OpsApiError('timeout', 'ConfirmParkingOperationAPI', 'La confirmación agotó el tiempo de espera'),
    new OpsApiError('transport', 'ConfirmParkingOperationAPI', 'Se perdió la respuesta de confirmación'),
  ]) {
    it(`recovers the existing operation after a ${recoverableError.kind} confirmation failure`, async () => {
      const navigate = jasmine.createSpy().and.resolveTo(true);
      const operations = signal([
        {
          id: '8431063',
          type: OperationType.PARKING,
          plate: '1234ABC',
          date: '07/09/2026',
          operationDate: '120030070926',
          amount: -1.5,
          zone: 'Centro',
          contractId: 3,
          sectorId: 4,
          startTime: '12:00',
          endTime: '13:00',
        },
      ]);
      const wallet = {
        balance: signal(10),
        cards: signal([]),
        defaultCardId: signal(''),
        loading: signal(false),
        load: jasmine.createSpy().and.resolveTo(),
        mainCard: { id: '', brand: '', last4: '', expiryDate: '', cardholderName: '' },
      };
      const loadOperations = jasmine.createSpy().and.resolveTo();
      TestBed.configureTestingModule({
        imports: [ParkingConfirmComponent],
        providers: [
          provideZonelessChangeDetection(),
          { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
          { provide: Router, useValue: { navigate } },
          {
            provide: ParkingFlowStore,
            useValue: {
              hasMinimumParkingData: () => true,
              fromStore: () => ({
                cityId: '3',
                cityName: 'Bilbao',
                plate: '1234ABC',
                sectorId: '4',
                zone: 'Centro',
                amount: '1,50 €',
                tariffType: '2',
                minutes: '60',
                street: 'Nagusia Kalea',
              }),
            },
          },
          { provide: WalletService, useValue: wallet },
          {
            provide: ParkingApiService,
            useValue: {
              serverNow: () => new Date('2026-09-07T10:00:00Z'),
              opsDate: () => '120000070926',
              confirmParking: jasmine.createSpy().and.resolveTo({ success: false, source: 'remote', error: recoverableError }),
            },
          },
          { provide: OperationsService, useValue: { load: loadOperations, operations, source: signal('remote') } },
        ],
      });
      TestBed.overrideComponent(ParkingConfirmComponent, { set: { template: '' } });
      const fixture = TestBed.createComponent(ParkingConfirmComponent);
      fixture.componentInstance.swipePay = { reset: jasmine.createSpy() } as never;

      await fixture.componentInstance.onSwipeComplete();

      expect(loadOperations).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledOnceWith(['/app/parking/success'], {
        queryParams: jasmine.objectContaining({ operationId: '8431063', startTime: '12:00', endTime: '13:00' }),
      });
      expect(fixture.componentInstance.submitError()).toBeNull();
    });
  }

  it('retries recovery while the confirmed operation is not yet visible in the history', async () => {
    const navigate = jasmine.createSpy().and.resolveTo(true);
    const operations = signal<unknown[]>([]);
    const loadOperations = jasmine.createSpy().and.callFake(async () => {
      if (loadOperations.calls.count() === 2) {
        operations.set([
          {
            id: '8431063',
            type: OperationType.PARKING,
            plate: '1234ABC',
            date: '07/09/2026',
            operationDate: '120030070926',
            amount: -1.5,
            zone: 'Centro',
            contractId: 3,
            sectorId: 4,
          },
        ]);
      }
    });
    const wallet = {
      balance: signal(10),
      cards: signal([]),
      defaultCardId: signal(''),
      loading: signal(false),
      load: jasmine.createSpy().and.resolveTo(),
      mainCard: { id: '', brand: '', last4: '', expiryDate: '', cardholderName: '' },
    };

    TestBed.configureTestingModule({
      imports: [ParkingConfirmComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { keys: [], get: () => null } } } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({
              cityId: '3',
              plate: '1234ABC',
              sectorId: '4',
              amount: '1,50 €',
              tariffType: '2',
              minutes: '60',
              street: 'Nagusia Kalea',
            }),
          },
        },
        { provide: WalletService, useValue: wallet },
        {
          provide: ParkingApiService,
          useValue: {
            serverNow: () => new Date('2026-09-07T10:00:00Z'),
            opsDate: () => '120000070926',
            confirmParking: jasmine.createSpy().and.resolveTo({
              success: false,
              source: 'remote',
              error: new OpsApiError('timeout', 'ConfirmParkingOperationAPI', 'Tiempo agotado'),
            }),
          },
        },
        { provide: OperationsService, useValue: { load: loadOperations, operations, source: signal('remote') } },
      ],
    });
    TestBed.overrideComponent(ParkingConfirmComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(ParkingConfirmComponent);
    fixture.componentInstance.swipePay = { reset: jasmine.createSpy() } as never;
    (
      fixture.componentInstance as unknown as {
        waitForRecoveryRetry: (delayMs: number) => Promise<void>;
      }
    ).waitForRecoveryRetry = jasmine.createSpy().and.resolveTo();

    await fixture.componentInstance.onSwipeComplete();

    expect(loadOperations).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledOnceWith(
      ['/app/parking/success'],
      jasmine.objectContaining({ queryParams: jasmine.objectContaining({ operationId: '8431063' }) }),
    );
  });
});
