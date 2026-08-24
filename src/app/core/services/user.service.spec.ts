import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let api: jasmine.SpyObj<OpsApiClient>;
  let service: UserService;

  beforeEach(() => {
    localStorage.clear();
    api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }],
    });
    TestBed.inject(OpsSessionService).setToken('token');
    service = TestBed.inject(UserService);
  });

  it('maps QueryUserAPI identity and fiscal fields', async () => {
    api.get.and.resolveTo({
      names: 'Ada',
      firstSurname: 'Lovelace',
      secondSurname: 'Byron',
      email: 'ada@example.com',
      nif: '12345678A',
      mainMobilePhone: '600000000',
      addressStreetName: 'Nagusia Kalea',
      addressBuildingNumber: '12',
      addressDepartmentFloor: '2',
      addressCity: 'Zarautz',
      addressProvince: 'Gipuzkoa',
      addressPostalCode: '20800',
    });

    const user = await service.load();

    expect(api.get).toHaveBeenCalledWith('OPSWebServicesAPI/QueryUserAPI', { token: 'token' });
    expect(user).toEqual(
      jasmine.objectContaining({
        name: 'Ada',
        surname: 'Lovelace',
        secondSurname: 'Byron',
        street: 'Nagusia Kalea',
        buildingNumber: '12',
        city: 'Zarautz',
      }),
    );
    expect(service.source()).toBe('remote');
  });

  it('merges edits into the complete UpdateUserAPI contract', async () => {
    api.get.and.resolveTo({
      names: 'Ada',
      firstSurname: 'Lovelace',
      email: 'ada@example.com',
      password: '',
      contractId: 4,
      validateConditions: 1,
    });
    api.post.and.resolveTo('OK');
    await service.load();

    await service.save({ city: 'Zarautz', postalCode: '20800' });

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/UpdateUserAPI',
      jasmine.objectContaining({
        contractId: 4,
        names: 'Ada',
        firstSurname: 'Lovelace',
        email: 'ada@example.com',
        addressCity: 'Zarautz',
        addressPostalCode: '20800',
        operatingSystem: 3,
      }),
      { token: 'token' },
    );
    expect(service.source()).toBe('remote');
  });
});
