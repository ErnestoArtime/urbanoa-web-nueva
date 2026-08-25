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

    expect(api.get).toHaveBeenCalledWith('OPSWebServicesAPI3/QueryUserPlatesAPI', { token: 'token' });
    expect(service.source()).toBe('remote');
    expect(service.vehicles()).toEqual([{ id: '1234ABC', plate: '1234ABC', isDefault: true }]);
  });

  it('marks a newly added plate favorite and clears the previous favorite remotely', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.add({ plate: ' 9999 xyz ', isDefault: true });

    expect(api.post.calls.argsFor(0)).toEqual(['OPSWebServicesAPI3/AddUserPlateAPI', { plate: '9999 XYZ' }, { token: 'token' }]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI3/UpdateUserPlateAPI',
      { plate: '9999 XYZ', favorite: 1 },
      { token: 'token' },
    ]);
    expect(api.post.calls.argsFor(2)).toEqual([
      'OPSWebServicesAPI3/UpdateUserPlateAPI',
      { plate: '1234 ABC', favorite: 0 },
      { token: 'token' },
    ]);
    expect(result.source).toBe('remote');
    expect(service.vehicles().find((v) => v.plate === '9999 XYZ')?.isDefault).toBeTrue();
    expect(service.vehicles().find((v) => v.plate === '1234 ABC')?.isDefault).toBeFalse();
  });

  it('setDefault is a no-op when the vehicle is already the favorite', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    const current = service.vehicles().find((v) => v.isDefault);

    const result = await service.setDefault(current!.id);

    expect(api.post).not.toHaveBeenCalled();
    expect(result.success).toBeTrue();
  });

  it('promotes and remotely favorites a new default when the favorite plate is removed', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    const favorite = service.vehicles().find((v) => v.isDefault)!;
    const other = service.vehicles().find((v) => v.id !== favorite.id)!;

    const result = await service.remove(favorite.id);

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI3/RemoveUserPlateAPI', { plate: favorite.plate }, { token: 'token' });
    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI3/UpdateUserPlateAPI', { plate: other.plate, favorite: 1 }, { token: 'token' });
    expect(api.post.calls.count()).toBe(2);
    expect(service.vehicles().find((v) => v.id === other.id)?.isDefault).toBeTrue();
    expect(result.success).toBeTrue();
  });

  it('does not promote a new default when the removed plate was not the favorite', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    const nonFavorite = service.vehicles().find((v) => !v.isDefault)!;

    await service.remove(nonFavorite.id);

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI3/RemoveUserPlateAPI', { plate: nonFavorite.plate }, { token: 'token' });
    expect(api.post.calls.count()).toBe(1);
    expect(service.vehicles().find((v) => v.isDefault)).toBeTruthy();
  });

  it('promotes the first plate to favorite when the remote list arrives without any', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({ plates: [{ plate: '1111 AAA' }, { plate: '2222 BBB' }] });
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI3/UpdateUserPlateAPI', { plate: '1111 AAA', favorite: 1 }, { token: 'token' });
    expect(service.vehicles().find((v) => v.plate === '1111 AAA')?.isDefault).toBeTrue();
    expect(service.vehicles().find((v) => v.plate === '2222 BBB')?.isDefault).toBeFalse();
  });

  it('promotes a newly added plate when the list would be left without any favorite', async () => {
    localStorage.setItem('urbanoa.vehicles', JSON.stringify([{ id: '7777 KKK', plate: '7777 KKK', isDefault: false }]));
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.add({ plate: '9999 XYZ', isDefault: false });

    expect(api.post.calls.argsFor(0)).toEqual(['OPSWebServicesAPI3/AddUserPlateAPI', { plate: '9999 XYZ' }, { token: 'token' }]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI3/UpdateUserPlateAPI',
      { plate: '9999 XYZ', favorite: 1 },
      { token: 'token' },
    ]);
    expect(service.vehicles().find((v) => v.plate === '9999 XYZ')?.isDefault).toBeTrue();
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
