import { OpsApiError } from '../api/ops-api.types';
import { PaymentChallengeService } from './payment-challenge.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { ParkingSessionService } from './parking-session.service';
import { OperationsService } from './operations.service';
import { ParkingApiService } from './parking-api.service';
import { ParkingTicketStoreService } from './parking-ticket-store.service';
import { WalletService } from './wallet.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): ParkingSessionService {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: OpsApiClient, useValue: api }],
  });
  return TestBed.inject(ParkingSessionService);
}

describe('ParkingSessionService', () => {
  beforeEach(() => sessionStorage.clear());
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('urbanoa.operations.active', '[]');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient()] });
  });

  it('syncs active parkings from QueryUserOperationsAPI and marks the source as remote', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post', 'postOrNull']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'active-1',
        operationType: 1,
        paymentAmount: 100,
        opDate: '100000030926',
        plate: '1234 ABC',
        parkingStartDate: '100000030926',
        parkingEndDate: '110000030926',
        duration: 60,
        timePeriod: 2,
        ticketId: 7,
        sectorId: 17,
        sectorDesc: 'S1',
      },
    ]);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.loadParkingStatuses([{ id: '1', plate: '1234 ABC' }]);

    expect(service.activeSource()).toBe('remote');
    expect(service.activeParkings().length).toBe(1);
    expect(service.isVehicleParked('1234 ABC')).toBeTrue();
    expect(api.postOrNull).not.toHaveBeenCalled();
  });

  for (const refreshFailure of [false, true]) {
    it(`finishes confirmed unparking without waiting for auxiliary reads (failure: ${refreshFailure})`, async () => {
      const parking = {
        id: 'parking-1',
        plate: '1234 ABC',
        vehicleId: 'vehicle-1',
        zone: 'Centro',
        startTime: '10:00',
        durationLabel: '1 h',
        timeRemaining: '01:00:00',
        endTime: '11:00',
        contractId: 3,
        tariffId: 7,
        refundable: 2,
      };
      const operations = {
        activeParkings: () => [parking],
        activeParkingsCount: () => 1,
        hasActiveParkings: () => true,
        activeSource: () => 'remote',
        getActiveParking: jasmine.createSpy().and.returnValue(parking),
        isVehicleParked: jasmine.createSpy().and.returnValue(true),
        isPlateParked: jasmine.createSpy().and.returnValue(false),
        markParkingEnded: jasmine.createSpy(),
        load: jasmine
          .createSpy()
          .and.returnValue(refreshFailure ? Promise.reject(new Error('refresh failed')) : new Promise<void>(() => undefined)),
        syncActiveParkingsFromOperations: jasmine.createSpy(),
      };
      const parkingApi = { unpark: jasmine.createSpy().and.resolveTo({ success: true, source: 'remote', refundAmount: 0.4 }) };
      const wallet = {
        load: jasmine
          .createSpy()
          .and.returnValue(refreshFailure ? Promise.reject(new Error('refresh failed')) : new Promise<void>(() => undefined)),
      };
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          ParkingSessionService,
          { provide: OperationsService, useValue: operations },
          { provide: ParkingApiService, useValue: parkingApi },
          { provide: WalletService, useValue: wallet },
        ],
      });

      const result = await TestBed.inject(ParkingSessionService).leaveParking('parking-1');

      expect(result).toBeTrue();
      expect(parkingApi.unpark).toHaveBeenCalledOnceWith({ contractId: 3, plate: '1234 ABC', ticketId: 7 });
      expect(operations.markParkingEnded).toHaveBeenCalledOnceWith('parking-1');
      expect(operations.load).toHaveBeenCalledTimes(1);
      expect(wallet.load).toHaveBeenCalledOnceWith({ balanceOnly: true });
      expect(operations.syncActiveParkingsFromOperations).not.toHaveBeenCalled();
    });
  }

  it('does not apply a delayed confirmation to a different account', async () => {
    let confirm!: (value: { success: boolean; source: 'remote' }) => void;
    const parking = { id: 'p', contractId: 1, refundable: 2, plate: 'PKJ321', tariffId: 7 };
    const operations = { getActiveParking: () => parking, markParkingEnded: jasmine.createSpy(), load: jasmine.createSpy() };
    const wallet = { load: jasmine.createSpy() };
    TestBed.overrideProvider(OperationsService, { useValue: operations });
    TestBed.overrideProvider(WalletService, { useValue: wallet });
    TestBed.overrideProvider(ParkingApiService, { useValue: { unpark: () => new Promise((resolve) => (confirm = resolve)) } });
    const session = TestBed.inject(OpsSessionService);
    session.setToken('first-account');
    const result = TestBed.inject(ParkingSessionService).leaveParking('p');
    session.setToken('second-account');
    confirm({ success: true, source: 'remote' });
    expect(await result).toBeFalse();
    expect(operations.markParkingEnded).not.toHaveBeenCalled();
    expect(wallet.load).not.toHaveBeenCalled();
  });

  it('uses the selected operation tariff instead of the last ticket cached for the same plate', async () => {
    const parking = {
      id: 'parking-1',
      plate: '1234 ABC',
      vehicleId: 'vehicle-1',
      zone: 'Centro',
      startTime: '10:00',
      durationLabel: '1 h',
      timeRemaining: '01:00:00',
      endTime: '11:00',
      contractId: 3,
      tariffId: 7,
      refundable: 2,
      sectorId: 17,
      operationDate: '100000260825',
    };
    const operations = {
      activeParkings: () => [parking],
      activeParkingsCount: () => 1,
      hasActiveParkings: () => true,
      activeSource: () => 'remote',
      getActiveParking: jasmine.createSpy().and.returnValue(parking),
      isVehicleParked: jasmine.createSpy().and.returnValue(true),
      isPlateParked: jasmine.createSpy().and.returnValue(false),
      markParkingEnded: jasmine.createSpy(),
      load: jasmine.createSpy().and.resolveTo(),
      syncActiveParkingsFromOperations: jasmine.createSpy(),
      restoreActiveParking: jasmine.createSpy(),
    };
    const parkingApi = { unpark: jasmine.createSpy().and.resolveTo({ success: true, source: 'remote', refundAmount: 0.4 }) };
    const wallet = { load: jasmine.createSpy().and.resolveTo() };
    const ticketStore = {
      getByPlate: jasmine.createSpy().and.returnValue({ plate: '1234 ABC', ticketId: 108, contractId: 1, sectorId: 22002 }),
      clearByPlate: jasmine.createSpy(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingSessionService,
        { provide: OperationsService, useValue: operations },
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: WalletService, useValue: wallet },
        { provide: ParkingTicketStoreService, useValue: ticketStore },
      ],
    });

    const result = await TestBed.inject(ParkingSessionService).leaveParking('parking-1');

    expect(result).toBeTrue();
    expect(parkingApi.unpark).toHaveBeenCalledOnceWith({
      contractId: 3,
      plate: '1234 ABC',
      groupId: 17,
      ticketId: 7,
      datetime: '100000260825',
    });
    expect(ticketStore.clearByPlate).not.toHaveBeenCalled();
  });

  for (const cachedContractId of [1, 3]) {
    it(`quotes the selected operation without borrowing a cached tariff from contract ${cachedContractId}`, async () => {
      const parking = {
        id: 'operation-13173663',
        plate: 'PKJ321',
        contractId: 1,
        sectorId: 60301,
        tariffId: 7,
        refundable: 2,
      };
      const parkingApi = { queryUnparking: jasmine.createSpy().and.resolveTo({ success: true, refundAmount: 0 }) };
      TestBed.overrideProvider(OperationsService, { useValue: { getActiveParking: () => parking } });
      TestBed.overrideProvider(ParkingApiService, { useValue: parkingApi });
      TestBed.overrideProvider(ParkingTicketStoreService, {
        useValue: { getByPlate: () => ({ ticketId: 108, contractId: cachedContractId, sectorId: 22002 }) },
      });
      const result = await TestBed.inject(ParkingSessionService).quoteUnparking(parking.id);
      expect(result.success).toBeTrue();
      expect(parkingApi.queryUnparking).toHaveBeenCalledOnceWith({
        contractId: 1,
        plate: 'PKJ321',
        groupId: 60301,
        ticketId: 7,
      });
    });
  }

  for (const sectorId of [60301, 22002]) {
    it(`uses a cached tariff only as a fallback in the same municipality and sector (${sectorId})`, async () => {
      const parking = { id: 'operation-13173663', plate: 'PKJ321', contractId: 1, sectorId: 60301, refundable: 2 };
      const parkingApi = { queryUnparking: jasmine.createSpy().and.resolveTo({ success: true, refundAmount: 0 }) };
      TestBed.overrideProvider(OperationsService, { useValue: { getActiveParking: () => parking } });
      TestBed.overrideProvider(ParkingApiService, { useValue: parkingApi });
      TestBed.overrideProvider(ParkingTicketStoreService, {
        useValue: { getByPlate: () => ({ ticketId: 108, contractId: 1, sectorId }) },
      });
      await TestBed.inject(ParkingSessionService).quoteUnparking(parking.id);
      expect(parkingApi.queryUnparking).toHaveBeenCalledOnceWith({
        contractId: 1,
        plate: 'PKJ321',
        groupId: 60301,
        ticketId: sectorId === 60301 ? 108 : undefined,
      });
    });
  }

  it('clears local parkings when every contract query fails', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.rejectWith(new Error('backend down'));
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.loadParkingStatuses([{ id: 'vehicle-1', plate: '1234 ABC' }]);

    expect(service.activeSource()).toBe('error');
    expect(service.activeParkings().length).toBe(0);
  });

  it('keeps operations-based active parkings even when the vehicle list is unavailable', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post', 'postOrNull']);
    api.post.and.resolveTo([
      {
        contractId: 3,
        operationNumber: 'active-1',
        operationType: 1,
        paymentAmount: 100,
        opDate: '100000030926',
        plate: '1234 ABC',
        parkingEndDate: '110000030926',
        timePeriod: 2,
      },
    ]);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.loadParkingStatuses([]);

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.postOrNull).not.toHaveBeenCalled();
    expect(service.activeParkings()).toEqual([jasmine.objectContaining({ plate: '1234 ABC', vehicleId: '1234 ABC' })]);
  });

  it('reports an error without a session token', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    await service.loadParkingStatuses([{ id: '1', plate: '1234 ABC' }]);

    expect(api.post).not.toHaveBeenCalled();
    expect(service.activeSource()).toBe('error');
  });
});

describe('Unparking error message priority', () => {
  it('shows the OPS message and retains the duplicate payment guard', async () => {
    sessionStorage.clear();
    const error = new OpsApiError('backend', 'ConfirmUnParkingOperationAPI', 'unused', 200, {
      code: -9,
      type: 2,
      message_ES: 'Error genérico - 1025',
    });
    const unpark = jasmine.createSpy().and.resolveTo({ success: false, error });
    const parking = { contractId: 1, plate: '1234ABC', refundable: 2, tariffId: 4, sectorId: 60301 };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        { provide: ParkingApiService, useValue: { unpark } },
        { provide: OperationsService, useValue: { getActiveParking: () => parking } },
        { provide: WalletService, useValue: {} },
      ],
    });
    const service = TestBed.inject(ParkingSessionService);
    TestBed.inject(OpsSessionService).setToken('test');
    await service.leaveParking('42');
    expect(service.unparkError()).toBe('Error genérico - 1025');
    expect(TestBed.inject(PaymentChallengeService).hasPendingPayment()).toBeTrue();
    await service.leaveParking('42');
    expect(service.unparkError()).toBe('Error genérico - 1025');
    expect(unpark).toHaveBeenCalledTimes(1);
    sessionStorage.clear();
  });
});
