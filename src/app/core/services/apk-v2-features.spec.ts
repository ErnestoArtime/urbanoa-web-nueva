import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PaymentChallengeService } from './payment-challenge.service';
import { SecuritySettingsService } from './security-settings.service';
import { SupportService } from './support.service';

function configureTestBed(): void {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient()] });
}

describe('APK v2 feature services', () => {
  beforeEach(() => {
    localStorage.clear();
    configureTestBed();
  });

  it('creates and replies to a persisted support conversation', () => {
    const service = TestBed.inject(SupportService);
    const thread = service.create({
      type: 'incident',
      subtype: 'parking-meters',
      cityId: 'zarautz',
      cityName: 'Zarautz',
      plate: '1234 abc',
      message: 'El parquímetro no responde.',
    });

    expect(thread.plate).toBe('1234 ABC');
    expect(service.reply(thread.id, 'Adjunto más información.')).toBeTrue();
    expect(service.getById(thread.id)?.messages.length).toBe(2);

    TestBed.resetTestingModule();
    configureTestBed();
    expect(TestBed.inject(SupportService).getById(thread.id)?.messages.length).toBe(2);
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

  it('keeps a card pending only while the secure challenge is active', () => {
    const service = new PaymentChallengeService();
    service.begin({ brand: 'Visa', last4: '4242', expiryDate: '08/30', cardholderName: 'Ane García' });
    expect(service.pendingCard()?.last4).toBe('4242');
    service.clear();
    expect(service.pendingCard()).toBeNull();
  });
});
