import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OperationsService } from './operations.service';
import { WalletService } from './wallet.service';
import { OperationType } from '../../shared/models/operation-type';

describe('OperationsService stored data migration', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: OpsApiClient, useValue: {} },
        { provide: OpsSessionService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
      ],
    });
  });

  it('does not hydrate operations from legacy local storage', () => {
    localStorage.setItem(
      'urbanoa.operations',
      JSON.stringify([{ id: 'legacy-refund', type: 6, plate: '1234 ABC', date: '15/07/2026', amount: 0.4, zone: 'Zarautz' }]),
    );

    const service = TestBed.inject(OperationsService);

    expect(service.operations()).toEqual([]);
  });

  it('maps operation type 7 as a balance refund', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([{ operationNumber: 17, operationType: 7, paymentAmount: 500, opDate: '120000260826', plate: null }]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations()[0]).toEqual(jasmine.objectContaining({ type: OperationType.BALANCE_REFUND, amount: -5 }));
    expect(api.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ operationTypeList: jasmine.arrayContaining([7]) }));
  });

  it('uses the QueryUserOperationsAPI timePeriod field to identify active parking operations', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      { operationNumber: 1, operationType: 1, paymentAmount: 100, opDate: '120000010926', plate: 'ACTIVE1', timePeriod: 2 },
      { operationNumber: 2, operationType: 2, paymentAmount: 100, opDate: '120000010926', plate: 'ACTIVE2', timePeriod: 2 },
      { operationNumber: 3, operationType: 1, paymentAmount: 100, opDate: '120000010926', plate: 'PAST001', timePeriod: 1 },
      { operationNumber: 4, operationType: 5, paymentAmount: 100, opDate: '120000010926', plate: null, timePeriod: 2 },
      { operationNumber: 5, operationType: 1, paymentAmount: 100, opDate: '120000010926', plate: 'PENDING1', timePeriod: 3 },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.activeParkingOperations().map((operation) => operation.id)).toEqual(['1', '2']);
    expect(service.hasActiveParkingOperations()).toBeTrue();
  });

  it('maps the QueryUserOperationsAPI refundable option', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      { operationNumber: 1, operationType: 1, paymentAmount: 100, opDate: '120000010926', plate: 'YES0001', refundable: '2' },
      { operationNumber: 2, operationType: 1, paymentAmount: 100, opDate: '120000010926', plate: 'NO00001', refundable: 0 },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations().map((operation) => operation.refundable)).toEqual([2, 0]);
  });

  it('preserves the sector color returned by QueryUserOperationsAPI', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      {
        operationNumber: 1,
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '120000010926',
        plate: 'AAA111',
        sectorColor: 'E53935',
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations()[0]).toEqual(jasmine.objectContaining({ sectorColor: 'E53935' }));
  });

  it('builds every live dashboard parking from QueryUserOperationsAPI without querying parking status', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'active-1',
        operationType: OperationType.PARKING,
        paymentAmount: 150,
        opDate: '120000030926',
        plate: 'AAA111',
        parkingStartDate: '090000030926',
        parkingEndDate: '170000030926',
        duration: 480,
        timePeriod: 2,
        ticketId: 4,
        sectorId: 22002,
        sectorDesc: 'Z2 AZUL',
        sectorColor: '1E88E5',
        extension: '2',
        refundable: '2',
      },
      {
        contractId: 3,
        operationNumber: 'active-2',
        operationType: OperationType.PARKING_EXTENSION,
        paymentAmount: 75,
        opDate: '121000030926',
        plate: 'AAA111',
        parkingStartDate: '090000030926',
        parkingEndDate: '173000030926',
        duration: 510,
        timePeriod: 2,
        ticketId: 5,
        sectorId: 22003,
        sectorDesc: 'Z3 VERDE',
        extension: '1',
        refundable: '0',
      },
      {
        contractId: 3,
        operationNumber: 'past',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '120000020926',
        plate: 'BBB222',
        timePeriod: 1,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();
    service.syncActiveParkingsFromOperations([{ id: 'vehicle-a', plate: 'AAA111' }]);

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.postOrNull).not.toHaveBeenCalled();
    expect(service.activeParkings()).toEqual([
      jasmine.objectContaining({ id: 'operation-active-2', vehicleId: 'vehicle-a', tariffId: 5, canExtend: false, refundable: 0 }),
      jasmine.objectContaining({ id: 'operation-active-1', vehicleId: 'vehicle-a', tariffId: 4, canExtend: true, refundable: 2 }),
    ]);
  });

  it('sends operation dates as twelve OPS digits without timezone fallback', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load('2026-01-01', '2026-12-31');

    expect(api.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ dateStart: '000000010126', dateEnd: '235959311226' }));
  });

  it('shares an identical operations request while it is in progress', async () => {
    let finishRequest!: (value: []) => void;
    const pending = new Promise<[]>((resolve) => {
      finishRequest = resolve;
    });
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.returnValue(pending);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    const first = service.load();
    const second = service.load();

    expect(api.post).toHaveBeenCalledTimes(1);

    finishRequest([]);
    await Promise.all([first, second]);
  });

  it('uses the operation duration for the active parking timeline like the APK', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        contractName: 'CITY',
        operationNumber: '1234567',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '120000010926',
        plate: 'AAA111',
        zoneDesc: 'ZONE',
        sectorDesc: 'SECTOR',
        parkingStartDate: '115500010926',
        parkingEndDate: '145500010926',
        duration: 180,
        parkingDuration: 180,
        timePeriod: 2,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();
    await service.loadDashboardParkingStatuses([{ id: 'vehicle-1', plate: 'AAA111' }]);

    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ durationLabel: '180 min' })]);
  });

  it('keeps an active parking when QueryUserOperationsAPI marks it active', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: '9876543',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '120000010926',
        plate: 'AAA111',
        zoneDesc: 'ZONE',
        sectorDesc: 'SECTOR',
        parkingStartDate: '115500010926',
        parkingEndDate: '145500010926',
        duration: 180,
        parkingDuration: 180,
        timePeriod: 2,
        refundable: 2,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();
    await service.loadDashboardParkingStatuses([{ id: 'vehicle-1', plate: 'AAA111' }]);

    expect(service.activeParkings()).toEqual([
      jasmine.objectContaining({
        id: 'operation-9876543',
        plate: 'AAA111',
        durationLabel: '180 min',
        contractId: 3,
        refundable: 2,
      }),
    ]);
  });

  it('filters active operations by contract without calling QueryParkingStatusAPI', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'contract-3',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '120000030926',
        plate: 'AAA111',
        timePeriod: 2,
      },
      {
        contractId: 1,
        operationNumber: 'contract-1',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '110000030926',
        plate: 'AAA111',
        timePeriod: 2,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);
    const vehicle = { id: 'a', plate: 'AAA111' };

    await service.loadParkingStatuses([vehicle], 3);

    expect(api.postOrNull).not.toHaveBeenCalled();
    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ plate: 'AAA111', contractId: 3 })]);
  });
});
