import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { CitiesService } from './cities.service';
import { SupportService } from './support.service';
import { UserService } from './user.service';

describe('SupportService', () => {
  it('sends feedback using the contract expected by the APK', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 7, 27, 2, 27, 47));
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo('123');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: CitiesService, useValue: { contractIdFor: () => 1 } },
        { provide: UserService, useValue: { user: signal({ email: 'user@example.com' }), load: jasmine.createSpy() } },
      ],
    });

    try {
      const service = TestBed.inject(SupportService);
      await service.create({
        type: 'incident',
        subtype: 'app',
        cityId: 'durango',
        cityName: 'Durango',
        plate: '1234abc',
        message: 'test',
      });

      expect(api.post).toHaveBeenCalledOnceWith(
        OPS_ENDPOINTS.support.add,
        jasmine.objectContaining({
          baseId: null,
          userId: null,
          userEmail: 'user@example.com',
          channel: 0,
          contractId: 1,
          date: '022747270826',
          type: 1,
          subtype: 1,
          message: 'test',
          plate: '1234ABC',
          numFiles: 0,
          files: [],
        }),
        { token: 'token' },
      );
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('loads the authenticated profile before sending when the email is not ready', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo('123');
    const userService = {
      user: signal({ email: '' }),
      load: jasmine.createSpy().and.resolveTo({ email: 'user@example.com' }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: CitiesService, useValue: { contractIdFor: () => 1 } },
        { provide: UserService, useValue: userService },
      ],
    });

    const service = TestBed.inject(SupportService);
    await service.create({
      type: 'incident',
      subtype: 'app',
      cityId: 'durango',
      cityName: 'Durango',
      plate: '1234567',
      message: 'test',
    });

    expect(userService.load).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(
      OPS_ENDPOINTS.support.add,
      jasmine.objectContaining({ userEmail: 'user@example.com', plate: '1234567' }),
      { token: 'token' },
    );
  });

  it('maps the web option to the application subtype supported by the backend', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo('123');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: CitiesService, useValue: { contractIdFor: () => 1 } },
        { provide: UserService, useValue: { user: signal({ email: 'user@example.com' }), load: jasmine.createSpy() } },
      ],
    });

    const service = TestBed.inject(SupportService);
    await service.create({
      type: 'incident',
      subtype: 'web',
      cityId: 'durango',
      cityName: 'Durango',
      plate: '1234567',
      message: 'test',
    });

    expect(api.post).toHaveBeenCalledWith(
      OPS_ENDPOINTS.support.add,
      jasmine.objectContaining({ subtype: 1 }),
      { token: 'token' },
    );
  });
});
