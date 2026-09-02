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
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('urbanoa.operations.active', '[]');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient()] });
  });

  it('syncs remote parking statuses across contracts and marks the source as remote', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post', 'postOrNull']);
    const fakePost = <T>(endpoint: string, body?: { contractId?: number }): Promise<T> => {
      if (endpoint === 'OPSWebServicesAPI/QueryParkingStatusAPI') {
        return (
          body?.contractId === 3
            ? Promise.resolve({
                status: 2,
                extension: 0,
                tariffId: 7,
                dateInitial: '260825100000',
                dateEnd: '260825110000',
                accumulatedTime: 60,
                zonename: 'Zona Centro',
                sectorname: 'S1',
                streetname: 'Nagusia Kalea',
              })
            : Promise.reject(new Error('sin aparcamiento'))
        ) as Promise<T>;
      }
      return Promise.reject(new Error(`endpoint inesperado: ${endpoint}`)) as Promise<T>;
    };
    api.postOrNull.and.callFake(fakePost);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.loadParkingStatuses([{ id: '1', plate: '1234 ABC' }]);

    expect(service.activeSource()).toBe('remote');
    expect(service.activeParkings().length).toBe(1);
    expect(service.isVehicleParked('1234 ABC')).toBeTrue();
  });

  it('confirms unparking remotely and refreshes backend state', async () => {
    const parking = {
      id: 'parking-1', plate: '1234 ABC', vehicleId: 'vehicle-1', zone: 'Centro', startTime: '10:00',
      durationLabel: '1 h', timeRemaining: '01:00:00', endTime: '11:00', contractId: 3, tariffId: 7,
    };
    const operations = {
      activeParkings: () => [parking], activeParkingsCount: () => 1, hasActiveParkings: () => true, activeSource: () => 'remote',
      getActiveParking: jasmine.createSpy().and.returnValue(parking),
      isVehicleParked: jasmine.createSpy().and.returnValue(true), isPlateParked: jasmine.createSpy().and.returnValue(true),
      load: jasmine.createSpy().and.resolveTo(), loadParkingStatuses: jasmine.createSpy().and.resolveTo(),
    };
    const parkingApi = { unpark: jasmine.createSpy().and.resolveTo({ success: true, source: 'remote', refundAmount: 0.4 }) };
    const wallet = { load: jasmine.createSpy().and.resolveTo() };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(), ParkingSessionService,
        { provide: OperationsService, useValue: operations },
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: WalletService, useValue: wallet },
      ],
    });

    const result = await TestBed.inject(ParkingSessionService).leaveParking('parking-1');

    expect(result).toBeTrue();
    expect(parkingApi.unpark).toHaveBeenCalledOnceWith({ contractId: 3, plate: '1234 ABC', ticketId: 7 });
    expect(operations.load).toHaveBeenCalled();
    expect(wallet.load).toHaveBeenCalled();
    expect(operations.loadParkingStatuses).toHaveBeenCalledWith([{ id: 'vehicle-1', plate: '1234 ABC' }], 3);
  });

  it('uses the persisted QueryTicketsAPI ticketId when unparking', async () => {
    const parking = {
      id: 'parking-1', plate: '1234 ABC', vehicleId: 'vehicle-1', zone: 'Centro', startTime: '10:00',
      durationLabel: '1 h', timeRemaining: '01:00:00', endTime: '11:00', contractId: 3, tariffId: 7,
      sectorId: 17, operationDate: '100000260825',
    };
    const operations = {
      activeParkings: () => [parking], activeParkingsCount: () => 1, hasActiveParkings: () => true, activeSource: () => 'remote',
      getActiveParking: jasmine.createSpy().and.returnValue(parking),
      isVehicleParked: jasmine.createSpy().and.returnValue(true), isPlateParked: jasmine.createSpy().and.returnValue(true),
      load: jasmine.createSpy().and.resolveTo(), loadParkingStatuses: jasmine.createSpy().and.resolveTo(),
      restoreActiveParking: jasmine.createSpy(),
    };
    const parkingApi = { unpark: jasmine.createSpy().and.resolveTo({ success: true, source: 'remote', refundAmount: 0.4 }) };
    const wallet = { load: jasmine.createSpy().and.resolveTo() };
    const ticketStore = {
      getByPlate: jasmine.createSpy().and.returnValue({ plate: '1234 ABC', ticketId: 108 }),
      clearByPlate: jasmine.createSpy(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(), ParkingSessionService,
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
      ticketId: 108,
      datetime: '100000260825',
    });
    expect(ticketStore.clearByPlate).toHaveBeenCalledWith('1234 ABC');
  });

  it('clears local parkings when every contract query fails', async () => {    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.rejectWith(new Error('backend down'));
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.loadParkingStatuses([{ id: 'vehicle-1', plate: '1234 ABC' }]);

    expect(service.activeSource()).toBe('error');
    expect(service.activeParkings().length).toBe(0);
  });

  it('clears active parkings remotely when there are no vehicles to check', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.loadParkingStatuses([]);

    expect(api.post).not.toHaveBeenCalled();
    expect(service.activeParkings().length).toBe(0);
  });

  it('reports an error without a session token', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    await service.loadParkingStatuses([{ id: '1', plate: '1234 ABC' }]);

    expect(api.post).not.toHaveBeenCalled();
    expect(service.activeSource()).toBe('error');
  });
});
