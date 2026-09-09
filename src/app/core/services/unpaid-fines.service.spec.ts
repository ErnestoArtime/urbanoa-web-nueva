import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OpsSessionService } from '../api/ops-session.service';
import { OperationsService } from './operations.service';
import { UnpaidFinesService, FineStatus, isAcknowledgedFine } from './unpaid-fines.service';
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
  timePeriod: 2,
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
    expect(result.error).toBeInstanceOf(Error);
  });

  it('returns failure with a backend error when the API reports one', async () => {
    const api = {
      post: jasmine
        .createSpy('post')
        .and.rejectWith(
          new OpsApiError('backend', 'OPSWebServicesAPI/UpdateFineStatusAPI', 'Error al archivar la sanción', 200, {
            code: -21,
            type: 2,
            message_ES: 'No se pudo archivar la sanción',
          }),
        ),
    };
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
    expect(result.error?.backendError?.message_ES).toBe('No se pudo archivar la sanción');
  });
});

describe('UnpaidFinesService fines listing rules', () => {
  const baseFine: Operation = {
    id: 'fine-1',
    type: OperationType.UNPAID_FINES,
    plate: '1234 ABC',
    date: '05/06/2026',
    amount: -35,
    zone: null,
    contractId: 7,
    fineNumber: 'FN-2026-001',
  };

  function configure(fine: Operation) {
    const operations = { operations: signal([fine]).asReadonly(), load: jasmine.createSpy('load').and.resolveTo() };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
        { provide: OpsApiClient, useValue: {} },
        { provide: OpsSessionService, useValue: { token: () => null } },
        { provide: OperationsService, useValue: operations },
      ],
    });
    return TestBed.inject(UnpaidFinesService);
  }

  it('keeps a payable fine (fineStatus 1) in the pending list', () => {
    const service = configure({ ...baseFine, fineStatus: FineStatus.PAYABLE });
    expect(service.fines().length).toBe(1);
  });

  it('keeps an expired fine within the pay deadline (fineStatus 2 + timePeriod 2)', () => {
    const service = configure({ ...baseFine, fineStatus: FineStatus.EXPIRED, timePeriod: 2 });
    expect(service.fines().length).toBe(1);
  });

  it('drops an acknowledged fine (fineStatus 2 + timePeriod 1) from the pending list', () => {
    const service = configure({ ...baseFine, fineStatus: FineStatus.EXPIRED, timePeriod: 1 });
    expect(service.fines().length).toBe(0);
  });

  it('excludes non-payable fines (fineStatus 3)', () => {
    const service = configure({ ...baseFine, fineStatus: FineStatus.NOT_PAYABLE });
    expect(service.fines().length).toBe(0);
  });
});

describe('isAcknowledgedFine', () => {
  const base = { type: OperationType.UNPAID_FINES, fineStatus: FineStatus.EXPIRED, timePeriod: 1 } as Operation;

  it('is true when an unpaid fine is expired and moved to history', () => {
    expect(isAcknowledgedFine(base)).toBe(true);
  });

  it('is false for an expired fine still within the pay deadline', () => {
    expect(isAcknowledgedFine({ ...base, timePeriod: 2 })).toBe(false);
  });

  it('is false for payable fines', () => {
    expect(isAcknowledgedFine({ ...base, fineStatus: FineStatus.PAYABLE, timePeriod: 2 })).toBe(false);
  });

  it('is false for paid fine operations', () => {
    expect(isAcknowledgedFine({ ...base, type: OperationType.FINE_PAYMENT })).toBe(false);
  });
});

describe('UnpaidFinesService PSD2 confirmation', () => {
  it('returns the challenge URL when ConfirmFinePaymentAPI returns the new object value', async () => {
    const api = { post: jasmine.createSpy('post').and.resolveTo({ operationId: null, challengeUrl: 'https://paycomet.example/challenge/fine-1' }) };
    const operations = {
      operations: signal([{ ...EXPIRED_FINE, fineStatus: FineStatus.PAYABLE }]).asReadonly(),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    const wallet = {
      balance: () => 0,
      cards: () => [{ id: '7', brand: 'VISA', last4: '1111' }],
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: wallet },
        { provide: AppApiClient, useValue: {} },
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: OperationsService, useValue: operations },
      ],
    });

    const service = TestBed.inject(UnpaidFinesService);
    const result = await service.payFine('fine-1', '7');

    expect(result).toEqual({ success: true, challengeUrl: 'https://paycomet.example/challenge/fine-1' });
    expect(operations.load).not.toHaveBeenCalled();
    expect(wallet.load).not.toHaveBeenCalled();
  });
});
