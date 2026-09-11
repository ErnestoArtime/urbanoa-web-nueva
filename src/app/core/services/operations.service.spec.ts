import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OperationsService } from './operations.service';
import { WalletService } from './wallet.service';
import { OperationType } from '../../shared/models/operation-type';

describe('OperationsService stored data migration', () => {
  it('refreshes cached details using the current history filters', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([{ operationNumber: 17, operationType: 7, paymentAmount: 500, opDate: '120000260825' }]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);
    await service.load('2025-01-01', '2025-12-31', [7]);
    const filters = api.post.calls.mostRecent().args[1];
    api.post.and.resolveTo([{ operationNumber: 17, operationType: 7, paymentAmount: 700, opDate: '120000260825' }]);
    expect((await service.loadDetail('17'))?.amount).toBe(-7);
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.calls.mostRecent().args[1]).toEqual(filters);
  });

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

  it('counts displayed active parkings plus only payable fines', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      { operationNumber: 1, operationType: 1, timePeriod: 2, opDate: '120000070926', plate: 'AAA111', contractId: 3, sectorId: 10 },
      { operationNumber: 2, operationType: 2, timePeriod: 2, opDate: '130000070926', plate: 'AAA111', contractId: 3, sectorId: 10 },
      { operationNumber: 9, operationType: 1, timePeriod: 2, opDate: '130000070926', plate: 'BBB222', contractId: 3, sectorId: 11 },
      { operationNumber: 3, operationType: 1, timePeriod: 1, opDate: '110000070926' },
      { operationNumber: 4, operationType: 2, timePeriod: 3, opDate: '140000070926' },
      ...[1, 2, 3, undefined].map((fineStatus, i) => ({ operationNumber: 5 + i, operationType: 104, fineStatus, opDate: '120000070926' })),
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);
    await service.load();
    service.syncActiveParkingsFromOperations([
      { id: 'vehicle-a', plate: 'AAA111' },
      { id: 'vehicle-b', plate: 'BBB222' },
    ]);
    expect(service.operationsBadgeCount()).toBe(3);
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

  it('keeps the municipality from contractName when the operation omits cityName', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        contractName: 'ZARAUTZ',
        operationType: OperationType.UNPAID_FINES,
        fineNumber: '910051',
        fineStatus: 2,
        timePeriod: 2,
        amount: 3000,
        zoneDesc: 'ZONA 1',
        sectorDesc: 'Z1 ALTA ROTACION',
        latitude: 0,
        longitude: 0,
        opDate: '150006070926',
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations()[0]).toEqual(jasmine.objectContaining({ cityName: 'ZARAUTZ', latitude: 0, longitude: 0 }));
  });

  it('keeps the operation time separate from parking start and end times', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      {
        operationNumber: 18,
        operationType: OperationType.REFUND,
        paymentAmount: 250,
        opDate: '210100030926',
        parkingStartDate: '090000030926',
        parkingEndDate: '103000030926',
        plate: '11111',
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations()[0]).toEqual(jasmine.objectContaining({ operationTime: '21:01', startTime: '21:01', endTime: '10:30' }));
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

  it('gives unpaid fines without operationNumber a distinct id based on their fineNumber', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      {
        operationNumber: null,
        opBaseId: null,
        operationType: OperationType.UNPAID_FINES,
        fineNumber: '910051',
        fineStatus: 2,
        paymentAmount: 3000,
        opDate: '150006070926',
        plate: '1234567',
        timePeriod: 2,
      },
      {
        operationNumber: null,
        opBaseId: null,
        operationType: OperationType.UNPAID_FINES,
        fineNumber: '910054',
        fineStatus: 2,
        paymentAmount: 3000,
        opDate: '150006070926',
        plate: '1234567',
        timePeriod: 1,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    const ids = service.operations().map((operation) => operation.id);
    expect(ids).toEqual(['104-910051', '104-910054']);
    expect(new Set(ids).size).toBe(2);
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
      jasmine.objectContaining({
        id: 'operation-active-2',
        vehicleId: 'vehicle-a',
        tariffId: 5,
        startTime: '09:00',
        endTime: '17:30',
        durationLabel: '510 min',
        canExtend: false,
        refundable: 0,
      }),
      jasmine.objectContaining({
        id: 'operation-active-1',
        vehicleId: 'vehicle-a',
        tariffId: 4,
        startTime: '09:00',
        endTime: '17:00',
        durationLabel: '480 min',
        canExtend: true,
        refundable: 2,
      }),
    ]);
  });

  it('consolidates an extension with its parking in the same sector and preserves omitted context', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'serverNow']);
    api.serverNow.and.returnValue(new Date('2026-09-03T14:00:00Z'));
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'base',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '120000030926',
        plate: 'AAA111',
        parkingStartDate: '090000030926',
        parkingEndDate: '170000030926',
        parkingDuration: 480,
        timePeriod: 2,
        ticketId: 4,
        sectorId: 22002,
        sectorDesc: 'Z2 AZUL',
        pstreet: 'Kale Nagusia',
      },
      {
        contractId: 3,
        operationNumber: 'extension',
        operationType: OperationType.PARKING_EXTENSION,
        paymentAmount: 50,
        opDate: '121000030926',
        plate: 'AAA111',
        parkingEndDate: '173000030926',
        parkingDuration: 510,
        timePeriod: 2,
        sectorId: 22002,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.loadParkingStatuses([{ id: 'vehicle-a', plate: 'AAA111' }]);

    expect(service.activeParkings()).toEqual([
      jasmine.objectContaining({
        id: 'operation-extension',
        tariffId: 4,
        street: 'Kale Nagusia',
        startTime: '09:00',
        endTime: '17:30',
        durationLabel: '510 min',
      }),
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

  it('labels an active parking that ends the following day as tomorrow', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'serverNow']);
    api.serverNow.and.returnValue(new Date('2026-09-10T17:30:00Z'));
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'overnight',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '193300100926',
        plate: 'AAA111',
        parkingStartDate: '193300100926',
        parkingEndDate: '093300110926',
        timePeriod: 2,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.loadParkingStatuses([{ id: 'vehicle-1', plate: 'AAA111' }]);

    expect(service.activeParkings()[0]).toEqual(jasmine.objectContaining({ startDayLabel: 'ops.today', endDayLabel: 'ops.tomorrow' }));
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

  it('calculates the remaining time using Madrid timestamps and the server clock', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'serverNow']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'madrid-time',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '160000030926',
        plate: 'AAA111',
        parkingStartDate: '150000030926',
        parkingEndDate: '170000030926',
        timePeriod: 2,
      },
    ]);
    api.serverNow.and.returnValue(new Date('2026-09-03T14:00:00Z'));
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.loadParkingStatuses([{ id: 'vehicle-1', plate: 'AAA111' }]);

    expect(service.activeParkings()[0].timeRemaining).toBe('01:00:00');
  });

  it('keeps the last active parking when a refresh fails temporarily', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'serverNow']);
    api.serverNow.and.returnValue(new Date('2026-09-03T14:00:00Z'));
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'still-active',
        operationType: OperationType.PARKING,
        paymentAmount: 100,
        opDate: '160000030926',
        plate: 'AAA111',
        parkingEndDate: '170000030926',
        timePeriod: 2,
      },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);
    const vehicles = [{ id: 'vehicle-1', plate: 'AAA111' }];
    await service.loadParkingStatuses(vehicles);

    api.post.and.rejectWith(new Error('temporary network error'));
    await service.loadParkingStatuses(vehicles);

    expect(service.source()).toBe('error');
    expect(service.activeSource()).toBe('error');
    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ id: 'operation-still-active', plate: 'AAA111' })]);
  });
});
