import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { UserService, type UserData } from './user.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): UserService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(UserService);
}

function baseUser(): UserData {
  return {
    name: 'Ane',
    surname: 'Lopez',
    secondSurname: '',
    email: 'ane@example.com',
    nif: '12345678A',
    phone: '600000000',
    address: {
      street: '',
      number: '',
      floor: '',
      door: '',
      stair: '',
      letter: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'ESPANA',
    },
  };
}

describe('UserService', () => {
  beforeEach(() => localStorage.clear());

  it('loads the profile from QueryUserAPI and maps the fiscal address fields', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({
      names: 'Ane',
      firstSurname: 'Lopez',
      secondSurname: 'Etxebarria',
      email: 'ane@example.com',
      nif: '12345678A',
      mainMobilePhone: '600000000',
      addressStreetName: 'Calle Ficticia',
      addressBuildingNumber: '1',
      addressDepartmentFloor: '2',
      addressDepartmentDoor: 'B',
      addressDepartmentStair: 'A',
      addressLetterNumber: 'C',
      addressCity: 'Bilbao',
      addressProvince: 'Bizkaia',
      addressPostalCode: '48001',
      addressCountry: 'ESPANA',
    });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    await service.load();

    expect(api.get).toHaveBeenCalledWith('OPSWebServicesAPI/QueryUserAPI', { token: 'token' });
    expect(service.source()).toBe('remote');
    expect(service.user()).toEqual(
      jasmine.objectContaining({
        name: 'Ane',
        surname: 'Lopez',
        secondSurname: 'Etxebarria',
        nif: '12345678A',
        phone: '600000000',
        address: jasmine.objectContaining({ street: 'Calle Ficticia', number: '1', floor: '2', door: 'B', stair: 'A', letter: 'C' }),
      }),
    );
  });

  it('clears provisional data when there is no session token', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    const service = serviceWith(api);
    service.updateLocal(baseUser());

    await service.load();

    expect(api.get).not.toHaveBeenCalled();
    expect(service.source()).toBe('error');
    expect(service.user().name).toBe('');
  });

  it('saves profile changes through UpdateUserAPI with the documented field names', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('194063');
    const service = serviceWith(api);
    service.updateLocal(baseUser());
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.save({ name: 'Andoni', address: { ...baseUser().address, street: 'Calle Nueva', city: 'Bilbao' } });

    const [endpoint, body] = api.post.calls.argsFor(0);
    expect(endpoint).toBe('OPSWebServicesAPI/UpdateUserAPI');
    expect(body).toEqual(
      jasmine.objectContaining({
        names: 'Andoni',
        firstSurname: 'Lopez',
        secondSurname: '',
        email: 'ane@example.com',
        nif: '12345678A',
        mainMobilePhone: '600000000',
        addressStreetName: 'Calle Nueva',
        addressCity: 'Bilbao',
        addressCountry: 'ESPANA',
      }),
    );
    expect(result.success).toBeTrue();
    expect(result.source).toBe('remote');
    expect(service.user().name).toBe('Andoni');
    expect(service.user().address.street).toBe('Calle Nueva');
    expect(service.user().surname).toBe('Lopez');
  });

  it('updates the preferred contract id through UpdateUserAPI', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValues(Promise.resolve({
      ...baseUser(),
      contractId: 1,
      names: 'Ane',
      firstSurname: 'Lopez',
      email: 'ane@example.com',
    }), Promise.resolve({ names: 'Ane', firstSurname: 'Lopez', email: 'ane@example.com', contractId: 3 }));
    api.post.and.resolveTo('194063');
    const service = serviceWith(api);
    service.updateLocal(baseUser());
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.updatePreferredContract(3);

    const [endpoint, body] = api.post.calls.argsFor(0);
    expect(endpoint).toBe('OPSWebServicesAPI/UpdateUserAPI');
    expect(body).toEqual(jasmine.objectContaining({ contractId: 3, names: 'Ane', email: 'ane@example.com' }));
    expect(result.success).toBeTrue();
    expect(service.user().preferredContractId).toBe(3);
    expect(api.get.calls.count()).toBe(2);
  });

  it('does not confirm a municipality when OPS reports success but reads back contractId 0', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({ names: 'Ane', email: 'ane@example.com', contractId: 0 });
    api.post.and.resolveTo('194063');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    expect((await service.updatePreferredContract(3)).success).toBeFalse();
    expect(service.user().preferredContractId).toBe(0);
    expect(service.lastError()?.kind).toBe('invalid-response');
    await service.save({ name: 'Andoni' });
    expect(api.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ contractId: 0 }));
  });

  it('keeps the original municipality when the confirmation query fails', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValues(Promise.resolve({ names: 'Ane', contractId: 1 }), Promise.resolve(null));
    api.post.and.resolveTo('194063');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    expect((await service.updatePreferredContract(3)).success).toBeFalse();
    expect(service.user().preferredContractId).toBe(1);
    await service.save({ name: 'Andoni' });
    expect(api.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ contractId: 1 }));
  });

  it('does not merge changes locally when the remote update fails', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.rejectWith(new Error('backend down'));
    const service = serviceWith(api);
    service.updateLocal(baseUser());
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.save({ name: 'Changed' });

    expect(result.success).toBeFalse();
    expect(service.user().name).toBe('Ane');
    expect(service.lastError()).toBeTruthy();
  });
});
