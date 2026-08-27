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

  it('maps operation type 7 as a web balance withdrawal', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([{ operationNumber: 17, operationType: 7, paymentAmount: 500, opDate: '120000260826', plate: null }]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations()[0]).toEqual(jasmine.objectContaining({ type: OperationType.BALANCE_REFUND, amount: -5 }));
  });

  it('checks one relevant contract per vehicle when loading dashboard parking statuses', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'postOrNull']);
    api.post.and.resolveTo([
      { operationNumber: 21, operationType: 1, contractId: 3, paymentAmount: 150, opDate: '195500260826', plate: 'AAA111' },
      { operationNumber: 22, operationType: 3, contractId: 1, paymentAmount: 40, opDate: '180000260826', plate: 'BBB222' },
    ]);
    api.postOrNull.and.resolveTo(null);
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
});
