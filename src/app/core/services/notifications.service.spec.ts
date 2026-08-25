import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { NotificationPreferences, NotificationsService } from './notifications.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): NotificationsService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  TestBed.inject(OpsSessionService).setToken('token');
  return TestBed.inject(NotificationsService);
}

describe('NotificationsService', () => {
  const preferences: NotificationPreferences = {
    balance: 1,
    fineNotifications: 1,
    quantityBalance: 500,
    rechargeNotifications: 0,
    minutesBeforeUnparking: 10,
    unparkingNotifications: 1,
    emailBalance: 0,
    emailFineNotifications: 1,
    emailRechargeNotifications: 0,
    emailUnparkingNotifications: 1,
    emailParkingNotifications: 1,
    feedbackNotifications: 1,
    emailFeedbackNotifications: 0,
  };

  it('loads notifications from the APK response wrapper', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({ notifications: preferences });
    const service = serviceWith(api);

    await service.load();

    expect(api.get).toHaveBeenCalledWith('OPSWebServicesAPI3/QueryUserNotificationsAPI', { token: 'token' });
    expect(service.preferences()).toEqual(preferences);
    expect(service.source()).toBe('remote');
  });

  it('sends contractId and the complete notification contract', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);

    await service.save(preferences);

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI3/UpdateUserNotificationsAPI',
      { contractId: 0, notifications: preferences },
      { token: 'token' },
    );
  });
});
