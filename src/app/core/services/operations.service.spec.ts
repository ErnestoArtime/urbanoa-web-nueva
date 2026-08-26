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

  it('maps operation type 7 as a web balance withdrawal', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo([
      { operationNumber: 17, operationType: 7, paymentAmount: 500, opDate: '120000260826', plate: null },
    ]);
    TestBed.overrideProvider(OpsApiClient, { useValue: api });
    TestBed.overrideProvider(OpsSessionService, { useValue: { token: () => 'token' } });
    const service = TestBed.inject(OperationsService);

    await service.load();

    expect(service.operations()[0]).toEqual(jasmine.objectContaining({ type: OperationType.BALANCE_REFUND, amount: -5 }));
  });
});
