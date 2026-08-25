import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { ParkingSessionService } from './parking-session.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): ParkingSessionService {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: OpsApiClient, useValue: api }],
  });
  return TestBed.inject(ParkingSessionService);
}

const START_PARKING = {
  id: 'parking-1',
  plate: '1234 ABC',
  vehicleId: 'vehicle-1',
  zone: 'Centro',
  startTime: '10:00',
  durationLabel: '1 h',
  timeRemaining: '01:00:00',
  endTime: '11:00',
  amount: 1,
};

describe('ParkingSessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('urbanoa.operations.active', '[]');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient()] });
  });

  it('does not start a second active parking for the same vehicle', () => {
    const service = TestBed.inject(ParkingSessionService);
    const input = { ...START_PARKING };

    expect(service.startParking(input)).toBeTruthy();
    expect(service.startParking({ ...input, id: 'parking-2' })).toBeNull();
    expect(service.activeParkings().length).toBe(1);
  });

  it('counts every active parking from different vehicles', () => {
    const service = TestBed.inject(ParkingSessionService);

    service.startParking(START_PARKING);
    service.startParking({ ...START_PARKING, id: 'parking-2', plate: '5678 DEF', vehicleId: 'vehicle-2' });

    expect(service.activeParkingsCount()).toBe(2);
  });

  it('syncs remote parking statuses across contracts and marks the source as remote', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
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
    api.post.and.callFake(fakePost);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.loadParkingStatuses([{ id: '1', plate: '1234 ABC' }]);

    expect(service.activeSource()).toBe('remote');
    expect(service.activeParkings().length).toBe(1);
    expect(service.isVehicleParked('1234 ABC')).toBeTrue();
  });

  it('keeps local parkings when every contract query fails', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.rejectWith(new Error('backend down'));
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.startParking(START_PARKING);

    await service.loadParkingStatuses([{ id: 'vehicle-1', plate: '1234 ABC' }]);

    expect(service.activeSource()).toBe('mock');
    expect(service.activeParkings().length).toBe(1);
  });

  it('clears active parkings remotely when there are no vehicles to check', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    service.startParking(START_PARKING);

    await service.loadParkingStatuses([]);

    expect(api.post).not.toHaveBeenCalled();
    expect(service.activeParkings().length).toBe(0);
  });

  it('does not sync without a session token', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    await service.loadParkingStatuses([{ id: '1', plate: '1234 ABC' }]);

    expect(api.post).not.toHaveBeenCalled();
    expect(service.activeSource()).toBe('mock');
  });
});
