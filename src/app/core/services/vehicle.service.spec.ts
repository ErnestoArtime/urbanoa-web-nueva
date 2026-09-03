import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OpsSessionService } from '../api/ops-session.service';
import { VehicleService } from './vehicle.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): VehicleService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(VehicleService);
}

describe('VehicleService', () => {
  beforeEach(() => localStorage.clear());

  it('loads plates using the APK response contract when a token exists', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({ plates: [{ plate: '1234ABC', favorite: true }] });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(api.getOrNull).toHaveBeenCalledWith('OPSWebServicesAPI/QueryUserPlatesAPI', { token: 'token' });
    expect(service.source()).toBe('remote');
    expect(service.vehicles()).toEqual([{ id: '1234ABC', plate: '1234ABC', isDefault: true }]);
  });

  it('exposes the first favorite as the main vehicle while preserving added order as fallback', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({
      plates: [
        { plate: '1111 AAA', favorite: false },
        { plate: '2222 BBB', favorite: true },
        { plate: '3333 CCC', favorite: false },
      ],
    });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(service.mainVehicle()?.plate).toBe('2222 BBB');
  });

  it('shares an in-flight plate request between the wizard layout and the map', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    let resolveRequest!: (value: { plates: { plate: string; favorite: boolean }[] }) => void;
    api.getOrNull.and.returnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const layoutRequest = service.load();
    const mapRequest = service.load();
    resolveRequest({ plates: [{ plate: '1234ABC', favorite: true }] });
    await Promise.all([layoutRequest, mapRequest]);

    expect(api.getOrNull).toHaveBeenCalledTimes(1);
    expect(service.vehicles()).toEqual([{ id: '1234ABC', plate: '1234ABC', isDefault: true }]);
  });

  it('marks a newly added plate favorite and clears the previous favorite remotely', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({
      plates: [
        { plate: '1234 ABC', favorite: true },
        { plate: '5678 XYZ', favorite: false },
      ],
    });
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();
    api.post.calls.reset();

    const result = await service.add({ plate: ' 9999 xyz ', isDefault: true });

    expect(api.post.calls.argsFor(0)).toEqual([
      'OPSWebServicesAPI/AddUserPlateAPI',
      { plate: '9999 XYZ', favorite: 1 },
      { token: 'token' },
    ]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI/UpdateUserPlateAPI',
      { plate: '9999 XYZ', favorite: 1 },
      { token: 'token' },
    ]);
    expect(api.post.calls.argsFor(2)).toEqual([
      'OPSWebServicesAPI/UpdateUserPlateAPI',
      { plate: '1234 ABC', favorite: 0 },
      { token: 'token' },
    ]);
    expect(result.source).toBe('remote');
    expect(service.vehicles().find((v) => v.plate === '9999 XYZ')?.isDefault).toBeTrue();
    expect(service.vehicles().find((v) => v.plate === '1234 ABC')?.isDefault).toBeFalse();
  });

  it('setDefault is a no-op when the vehicle is already the favorite', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({ plates: [{ plate: '1234 ABC', favorite: true }] });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();
    const current = service.vehicles().find((v) => v.isDefault);

    const result = await service.setDefault(current!.id);

    expect(api.post).not.toHaveBeenCalled();
    expect(result.success).toBeTrue();
  });

  it('promotes and remotely favorites a new default when the favorite plate is removed', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({
      plates: [
        { plate: '1234 ABC', favorite: true },
        { plate: '5678 XYZ', favorite: false },
      ],
    });
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();
    api.post.calls.reset();
    const favorite = service.vehicles().find((v) => v.isDefault)!;
    const other = service.vehicles().find((v) => v.id !== favorite.id)!;

    const result = await service.remove(favorite.id);

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI/RemoveUserPlateAPI', { plate: favorite.plate }, { token: 'token' });
    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI/UpdateUserPlateAPI', { plate: other.plate, favorite: 1 }, { token: 'token' });
    expect(api.post.calls.count()).toBe(2);
    expect(service.vehicles().find((v) => v.id === other.id)?.isDefault).toBeTrue();
    expect(result.success).toBeTrue();
  });

  it('does not promote a new default when the removed plate was not the favorite', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({
      plates: [
        { plate: '1234 ABC', favorite: true },
        { plate: '5678 XYZ', favorite: false },
      ],
    });
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();
    api.post.calls.reset();
    const nonFavorite = service.vehicles().find((v) => !v.isDefault)!;

    await service.remove(nonFavorite.id);

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI/RemoveUserPlateAPI', { plate: nonFavorite.plate }, { token: 'token' });
    expect(api.post.calls.count()).toBe(1);
    expect(service.vehicles().find((v) => v.isDefault)).toBeTruthy();
  });

  it('promotes the first plate to favorite when the remote list arrives without any', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({ plates: [{ plate: '1111 AAA' }, { plate: '2222 BBB' }] });
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI/UpdateUserPlateAPI', { plate: '1111 AAA', favorite: 1 }, { token: 'token' });
    expect(service.vehicles().find((v) => v.plate === '1111 AAA')?.isDefault).toBeTrue();
    expect(service.vehicles().find((v) => v.plate === '2222 BBB')?.isDefault).toBeFalse();
  });

  it('treats a successful empty response as a real empty list', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo(null);
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(service.source()).toBe('remote');
    expect(service.lastError()).toBeNull();
    expect(service.vehicles()).toEqual([]);
  });

  it('treats the known QueryUserPlatesAPI HTTP 500-for-empty-account quirk as a real empty list', async () => {
    localStorage.setItem('urbanoa.vehicles', JSON.stringify([{ id: '7777 KKK', plate: '7777 KKK', isDefault: false }]));
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.rejectWith(new OpsApiError('http', 'OPSWebServicesAPI/QueryUserPlatesAPI', 'HTTP 500 - {"Message":"Error."}', 500));
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(service.source()).toBe('remote');
    expect(service.lastError()).toBeNull();
    expect(service.vehicles()).toEqual([]);
  });

  it('treats any other plates load failure (network, backend, ...) as an empty list too', async () => {
    localStorage.setItem('urbanoa.vehicles', JSON.stringify([{ id: '7777 KKK', plate: '7777 KKK', isDefault: false }]));
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.rejectWith(new OpsApiError('transport', 'OPSWebServicesAPI/QueryUserPlatesAPI', 'Network error'));
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(service.source()).toBe('remote');
    expect(service.lastError()).toBeNull();
    expect(service.vehicles()).toEqual([]);
  });

  it('promotes a newly added plate when the list would be left without any favorite', async () => {
    localStorage.setItem('urbanoa.vehicles', JSON.stringify([{ id: '7777 KKK', plate: '7777 KKK', isDefault: false }]));
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.add({ plate: '9999 XYZ', isDefault: false });

    expect(api.post.calls.argsFor(0)).toEqual([
      'OPSWebServicesAPI/AddUserPlateAPI',
      { plate: '9999 XYZ', favorite: 0 },
      { token: 'token' },
    ]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI/UpdateUserPlateAPI',
      { plate: '9999 XYZ', favorite: 1 },
      { token: 'token' },
    ]);
    expect(service.vehicles().find((v) => v.plate === '9999 XYZ')?.isDefault).toBeTrue();
    expect(result.source).toBe('remote');
  });

  it('preserves the current favorite status when renaming a non-default plate', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    api.getOrNull.and.resolveTo({
      plates: [
        { plate: '1234 ABC', favorite: true },
        { plate: '5678 XYZ', favorite: false },
      ],
    });
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');
    await service.load();
    const nonFavorite = service.vehicles().find((v) => !v.isDefault)!;
    api.post.calls.reset();

    await service.update(nonFavorite.id, { plate: '9999 ZZZ' });

    expect(api.post.calls.argsFor(0)).toEqual(['OPSWebServicesAPI/RemoveUserPlateAPI', { plate: '5678 XYZ' }, { token: 'token' }]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI/AddUserPlateAPI',
      { plate: '9999 ZZZ', favorite: 0 },
      { token: 'token' },
    ]);
  });

  it('rejects a local-only plate when login is postponed', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'getOrNull', 'post']);
    const service = serviceWith(api);

    const result = await service.add({ plate: '9999 XYZ', isDefault: false });

    expect(api.post).not.toHaveBeenCalled();
    expect(result.source).toBe('error');
    expect(service.vehicles()).toEqual([]);
  });
});
