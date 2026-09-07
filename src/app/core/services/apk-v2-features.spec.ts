import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SupportService } from './support.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { UserService } from './user.service';

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
    TestBed.inject(UserService).updateLocal({ email: 'user@example.com' });
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
});
