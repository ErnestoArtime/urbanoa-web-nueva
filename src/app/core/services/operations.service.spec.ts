import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OperationsService } from './operations.service';
import { WalletService } from './wallet.service';
import { OperationType } from '../../shared/models/operation-type';
import { CitiesService } from './cities.service';
import { LocationSettingsService } from './location-settings.service';

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

  it('uses the parking status refundable option for the active parking', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['postOrNull']);
    api.postOrNull.and.resolveTo({
      status: 2,
      extension: 0,
      refundable: 2,
      tariffId: 4,
      dateInitial: '175900280826',
      dateEnd: '185900280826',
      accumulatedTime: 60,
      sector: '22002',
      sectorname: 'Z2 AZUL',
    });
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, { useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [3] } });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);

    await service.loadDashboardParkingStatuses([{ id: 'a', plate: 'AAA111' }]);

    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ refundable: 2 })]);
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

  it('checks the most relevant contract first for each vehicle', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      { operationNumber: 21, operationType: 1, contractId: 3, paymentAmount: 150, opDate: '195500260826', plate: 'AAA111' },
      { operationNumber: 22, operationType: 3, contractId: 1, paymentAmount: 40, opDate: '180000260826', plate: 'BBB222' },
    ]);
    api.postOrNull.and.resolveTo({
      status: 2,
      extension: 0,
      tariffId: 4,
      dateInitial: '175900280826',
      dateEnd: '185900280826',
      accumulatedTime: 60,
      sector: '22002',
      sectorname: 'Z2 AZUL',
    });
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, {
      useValue: {
        cities: () => [],
        contractIdFor: (id: string) => (id === 'tolosa' ? 5 : 0),
        knownContractIds: () => [1, 3, 5, 23, 61, 73, 79, 81],
      },
    });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: 'tolosa' }) } });
    const service = TestBed.inject(OperationsService);

    await service.load();
    await service.loadDashboardParkingStatuses([
      { id: 'a', plate: 'AAA111' },
      { id: 'b', plate: 'BBB222' },
      { id: 'c', plate: 'CCC333' },
    ]);

    expect(api.postOrNull).toHaveBeenCalledTimes(3);
    expect(api.postOrNull.calls.allArgs().map((args) => args[1])).toEqual([
      jasmine.objectContaining({ contractId: 3, plate: 'AAA111' }),
      jasmine.objectContaining({ contractId: 1, plate: 'BBB222' }),
      jasmine.objectContaining({ contractId: 5, plate: 'CCC333' }),
    ]);
  });

  it('continues with the remaining contracts when the most recent one has no active parking', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      { operationNumber: 21, operationType: 1, contractId: 3, paymentAmount: 150, opDate: '195500260826', plate: 'AAA111' },
    ]);
    api.postOrNull.and.callFake(((_endpoint: string, body: { contractId: number }) =>
      body.contractId === 1
        ? Promise.resolve({
            status: 2,
            extension: 0,
            tariffId: 4,
            dateInitial: '175900280826',
            dateEnd: '185900280826',
            accumulatedTime: 60,
            sector: '22002',
            sectorname: 'Z2 AZUL',
          })
        : Promise.resolve(null)) as typeof api.postOrNull);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, {
      useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [3, 1, 5] },
    });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);

    await service.load();
    await service.loadDashboardParkingStatuses([{ id: 'a', plate: 'AAA111' }]);

    expect(api.postOrNull.calls.allArgs().map((args) => (args[1] as { contractId: number }).contractId)).toEqual([3, 1]);
    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ plate: 'AAA111', contractId: 1 })]);
  });

  it('keeps the exhaustive fallback when operations and preferred city are unavailable', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['postOrNull']);
    api.postOrNull.and.resolveTo(null);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, {
      useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [1, 3, 5] },
    });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);

    await service.loadDashboardParkingStatuses([{ id: 'a', plate: 'AAA111' }]);

    expect(api.postOrNull).toHaveBeenCalledTimes(3);
  });

  it('publishes an active parking without waiting for the other vehicle checks', async () => {
    let finishSecondVehicle!: (value: null) => void;
    const secondVehicle = new Promise<null>((resolve) => {
      finishSecondVehicle = resolve;
    });
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['postOrNull']);
    api.postOrNull.and.callFake(((_endpoint: string, body: { plate: string }) =>
      body.plate === 'AAA111'
        ? Promise.resolve({
            status: 2,
            extension: 0,
            tariffId: 4,
            dateInitial: '175900280826',
            dateEnd: '185900280826',
            accumulatedTime: 60,
            sector: '22002',
            sectorname: 'Z2 AZUL',
            streetname: 'Z_2_AZUL_01',
          })
        : secondVehicle) as typeof api.postOrNull);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, {
      useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [3] },
    });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);

    const loading = service.loadDashboardParkingStatuses([
      { id: 'a', plate: 'AAA111' },
      { id: 'b', plate: 'BBB222' },
    ]);
    await Promise.resolve();
    await Promise.resolve();

    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ plate: 'AAA111', contractId: 3 })]);

    finishSecondVehicle(null);
    await loading;
  });

  it('uses the operation duration for the active parking timeline like the APK', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post', 'postOrNull']);
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
      },
    ]);
    api.postOrNull.and.resolveTo({
      status: 2,
      extension: 0,
      tariffId: 1,
      dateInitial: '115500010926',
      dateEnd: '145500010926',
      accumulatedTime: 0,
      sector: '22002',
      sectorname: 'SECTOR',
      operationDate: '1234567',
    });
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, { useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [3] } });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);

    await service.load();
    await service.loadDashboardParkingStatuses([{ id: 'vehicle-1', plate: 'AAA111' }]);

    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ durationLabel: '180 min' })]);
  });

  it('shares an identical dashboard status scan while it is in progress', async () => {
    let finishRequest!: (value: null) => void;
    const pending = new Promise<null>((resolve) => {
      finishRequest = resolve;
    });
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['postOrNull']);
    api.postOrNull.and.returnValue(pending);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, {
      useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [3] },
    });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);
    const vehicles = [{ id: 'a', plate: 'AAA111' }];

    const first = service.loadDashboardParkingStatuses(vehicles);
    const second = service.loadDashboardParkingStatuses(vehicles);

    expect(api.postOrNull).toHaveBeenCalledTimes(1);

    finishRequest(null);
    await Promise.all([first, second]);
  });

  it('does not remove an active parking from another contract during a scoped scan', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['postOrNull']);
    api.postOrNull.and.resolveTo({
      status: 2,
      extension: 0,
      tariffId: 4,
      dateInitial: '175900280826',
      dateEnd: '185900280826',
      accumulatedTime: 60,
      sector: '22002',
      sectorname: 'Z2 AZUL',
    });
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    TestBed.overrideProvider(CitiesService, { useValue: { cities: () => [], contractIdFor: () => 0, knownContractIds: () => [1, 3] } });
    TestBed.overrideProvider(LocationSettingsService, { useValue: { settings: () => ({ preferredCityId: '' }) } });
    const service = TestBed.inject(OperationsService);
    const vehicle = { id: 'a', plate: 'AAA111' };

    await service.loadParkingStatuses([vehicle], 3);
    api.postOrNull.and.resolveTo(null);
    await service.loadParkingStatuses([vehicle], 1);

    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ plate: 'AAA111', contractId: 3 })]);
  });
});
