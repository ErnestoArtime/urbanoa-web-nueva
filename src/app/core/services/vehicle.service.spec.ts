import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { VehicleService } from './vehicle.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): VehicleService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(VehicleService);
}

describe('VehicleService', () => {
  beforeEach(() => localStorage.clear());

  it('loads plates using the APK response contract when a token exists', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({ plates: [{ plate: '1234ABC', favorite: true }] });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(api.get).toHaveBeenCalledWith('OPSWebServicesAPI/QueryUserPlatesAPI', { token: 'token' });
    expect(service.source()).toBe('remote');
    expect(service.vehicles()).toEqual([{ id: '1234ABC', plate: '1234ABC', isDefault: true }]);
  });

  it('uses AddUserPlateAPI and UpdateUserPlateAPI with only the plate', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.add({ plate: ' 9999 xyz ', isDefault: true });

    expect(api.post.calls.argsFor(0)).toEqual(['OPSWebServicesAPI/AddUserPlateAPI', { plate: '9999 XYZ' }, { token: 'token' }]);
    expect(api.post.calls.argsFor(1)).toEqual(['OPSWebServicesAPI/UpdateUserPlateAPI', { plate: '9999 XYZ' }, { token: 'token' }]);
    expect(result.source).toBe('remote');
  });

  it('keeps local mock behavior when login is postponed', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);

    const result = await service.add({ plate: '9999 XYZ', isDefault: false });

    expect(api.post).not.toHaveBeenCalled();
    expect(result.source).toBe('mock');
    expect(service.vehicles().some((vehicle) => vehicle.plate === '9999 XYZ')).toBeTrue();
  });
});
