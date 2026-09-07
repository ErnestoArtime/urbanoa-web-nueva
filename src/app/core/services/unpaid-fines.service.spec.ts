import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OperationsService } from './operations.service';
import { UnpaidFinesService, FineStatus } from './unpaid-fines.service';
import { WalletService } from './wallet.service';
import { OperationType } from '../../shared/models/operation-type';
import type { Operation } from '../../shared/models/operation';

const EXPIRED_FINE: Operation = {
  id: 'fine-1',
  type: OperationType.UNPAID_FINES,
  plate: '1234 ABC',
  date: '05/06/2026',
  amount: -35,
  zone: null,
  contractId: 7,
  fineNumber: 'FN-2026-001',
  fineStatus: FineStatus.EXPIRED,
};

describe('UnpaidFinesService stored data migration', () => {
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

  it('does not hydrate sanctions from legacy local storage', () => {
    localStorage.setItem(
      'urbanoa.unpaid-fines',
      JSON.stringify([
        { id: 'legacy-fine', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', amountValue: 35, location: 'Nagusia Kalea' },
      ]),
    );

    const service = TestBed.inject(UnpaidFinesService);
    expect(service.getFine('legacy-fine')).toBeUndefined();
  });
});

describe('UnpaidFinesService acknowledgeExpired', () => {
  it('calls UpdateFineStatusAPI and refreshes operations for an expired fine', async () => {
    const api = { post: jasmine.createSpy('post').and.resolveTo('') };
    const operations = {
      operations: signal([EXPIRED_FINE]).asReadonly(),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: OperationsService, useValue: operations },
      ],
    });

    const service = TestBed.inject(UnpaidFinesService);
    const result = await service.acknowledgeExpired('fine-1');

    expect(api.post).toHaveBeenCalledOnceWith(
      'OPSWebServicesAPI/UpdateFineStatusAPI',
      { contractId: 7, fine: 'FN-2026-001' },
      { token: 'token' },
    );
    expect(operations.load).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('rejects the acknowledge for a fine that is still payable', async () => {
    const api = { post: jasmine.createSpy('post').and.resolveTo('') };
    const operations = {
      operations: signal([{ ...EXPIRED_FINE, fineStatus: FineStatus.PAYABLE }]).asReadonly(),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: OperationsService, useValue: operations },
      ],
    });

    const service = TestBed.inject(UnpaidFinesService);
    const result = await service.acknowledgeExpired('fine-1');

    expect(api.post).not.toHaveBeenCalled();
    expect(operations.load).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('returns failure without calling the API when there is no session token', async () => {
    const api = { post: jasmine.createSpy('post').and.resolveTo('') };
    const operations = {
      operations: signal([EXPIRED_FINE]).asReadonly(),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => null } },
        { provide: OperationsService, useValue: operations },
      ],
    });

    const service = TestBed.inject(UnpaidFinesService);
    const result = await service.acknowledgeExpired('fine-1');

    expect(api.post).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('returns failure when the API call fails', async () => {
    const api = { post: jasmine.createSpy('post').and.rejectWith(new Error('network')) };
    const operations = {
      operations: signal([EXPIRED_FINE]).asReadonly(),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: OperationsService, useValue: operations },
      ],
    });

    const service = TestBed.inject(UnpaidFinesService);
    const result = await service.acknowledgeExpired('fine-1');

    expect(result.success).toBe(false);
  });
});
