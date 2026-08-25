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

  it('queries the parking status per contract and maps an active parking', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const fakePost = <T>(endpoint: string, body?: unknown): Promise<T> => {
      const contractId = (body as { contractId: number }).contractId;
      return (
        contractId === 3
          ? Promise.resolve({ zonename: 'Zona Centro', sectorname: 'S1', dateInitial: '240826 100000', dateEnd: '240826 110000' })
          : Promise.reject(new Error('no parking'))
      ) as Promise<T>;
    };
    api.post.and.callFake(fakePost);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const status = await service.queryParkingStatus('1234 ABC');

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI3/QueryParkingStatusAPI',
      jasmine.objectContaining({ contractId: jasmine.any(Number), plate: '1234 ABC' }),
      { token: 'token' },
    );
    expect(status.isParked).toBeTrue();
    expect(status.zone).toBe('Zona Centro');
    expect(status.sector).toBe('S1');
  });

  it('reports no parking when every contract answers without data', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo(null);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const status = await service.queryParkingStatus('1234 ABC');

    expect(api.post.calls.count()).toBeGreaterThan(0);
    expect(status.isParked).toBeFalse();
  });

  it('skips the remote query without a session token', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    const status = await service.queryParkingStatus('1234 ABC');

    expect(api.post).not.toHaveBeenCalled();
    expect(status.isParked).toBeFalse();
  });
});
