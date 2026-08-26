import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SecuritySettingsService } from './security-settings.service';
import { SupportService } from './support.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';

function configureTestBed(): void {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient()] });
}

describe('APK v2 feature services', () => {
  beforeEach(() => {
    localStorage.clear();
    configureTestBed();
  });

  it('creates and replies to a backend-confirmed support conversation', async () => {
    const api = TestBed.inject(OpsApiClient);
    spyOn(api, 'post').and.resolveTo('1048');
    TestBed.inject(OpsSessionService).setToken('token');
    const service = TestBed.inject(SupportService);
    const thread = await service.create({
      type: 'incident',
      subtype: 'parking-meters',
      cityId: 'zarautz',
      cityName: 'Zarautz',
      plate: '1234 abc',
      message: 'El parquímetro no responde.',
    });

    expect(thread?.plate).toBe('1234 ABC');
    expect(await service.reply(thread!.id, 'Adjunto más información.')).toBeTrue();
    expect(service.getById(thread!.id)?.messages.length).toBe(2);
  });

  it('stores biometric preferences and clears local app data', () => {
    const service = new SecuritySettingsService();
    service.setBiometric('fingerprint');
    expect(service.settings()).toEqual({ unlockEnabled: true, biometricMode: 'fingerprint' });

    localStorage.setItem('urbanoa.support.threads', '[]');
    localStorage.setItem('unrelated.preference', 'keep');
    service.clearLocalUserData();

    expect(localStorage.getItem('urbanoa.support.threads')).toBeNull();
    expect(localStorage.getItem('unrelated.preference')).toBe('keep');
    expect(service.settings().unlockEnabled).toBeFalse();
  });
});
