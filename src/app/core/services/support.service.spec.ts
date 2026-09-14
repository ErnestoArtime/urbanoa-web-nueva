import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { CitiesService } from './cities.service';
import { SupportService } from './support.service';
import { UserService } from './user.service';

describe('SupportService', () => {
  it('reconstructs replies, normalizes OPS dates and retains attachment-only responses', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    const base = { contractId: 1, type: 1, subtype: 1, status: 1, read: 1 };
    api.post.and.resolveTo({ feedback: [
      { ...base, id: 14, baseId: 12, read: 0, date: '130000260826', message: 'Reply', response: '', files: [{ filename: 'answer.pdf', direction: 1, payload: 'JVBERi0=', path: 'C:\\private\\answer.pdf' }] },
      { ...base, id: 12, date: '120000260826', message: 'Original' },
    ] });
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(),
      { provide: OpsApiClient, useValue: api }, { provide: OpsSessionService, useValue: { token: () => 'token' } },
      { provide: CitiesService, useValue: { nameFor: () => 'City' } },
      { provide: UserService, useValue: {} },
    ] });
    const service = TestBed.inject(SupportService);
    await service.load();
    expect(service.threads().length).toBe(1);
    expect(service.getById('12')?.messages.map(message => message.body)).toEqual(['Original', 'Reply', '']);
    expect(service.getById('12')?.messages[0].createdAt).toBe('2026-08-26T10:00:00.000Z');
    expect(service.getById('12')?.messages[2].attachments?.[0].dataUrl).toBe('data:application/pdf;base64,JVBERi0=');
    expect(service.getById('14')?.id).toBe('12');
    await service.markAsRead('14');
    expect(api.post).toHaveBeenCalledWith(OPS_ENDPOINTS.support.update, { id: 14, contractId: 1, read: 1 }, { token: 'token' });
    expect(service.getById('12')?.unread).toBeFalse();
  });
  it('loads support conversations from QueryUserFeedbackAPI', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({
      feedbackList: [
        { id: 12, contractId: 1, date: '120000260826', type: 1, subtype: 1, message: 'test', plate: '1234567', status: 1, read: 0 },
      ],
    });
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
    const loaded = await service.load();

    expect(loaded).toBeTrue();
    expect(api.post).toHaveBeenCalledOnceWith(
      OPS_ENDPOINTS.support.query,
      { contractId: 0, startDate: '000000010100', endDate: jasmine.stringMatching(/^\d{12}$/) },
      { token: 'token' },
    );
    expect(OPS_ENDPOINTS.support.query).toBe('OPSWebServicesAPI/QueryUserFeedbackAPI');
    expect(service.threads()[0]).toEqual(jasmine.objectContaining({ id: '12', plate: '1234567', unread: true }));
  });

  it('maps Swagger FileInfo attachments into the conversation messages', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({
      feedback: [
        {
          id: 13,
          contractId: 1,
          date: '120000260826',
          dateSent: '130000260826',
          type: 1,
          subtype: 1,
          message: 'Con foto',
          status: 2,
          read: 1,
          response: 'Recibido',
          files: [
            { filename: 'evidencia.png', payload: 'aGVsbG8=', direction: 0 },
            { filename: 'respuesta.pdf', url: 'https://example.test/respuesta.pdf', direction: 1 },
          ],
        },
      ],
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: CitiesService, useValue: { contractIdFor: () => 1, nameFor: () => 'Durango' } },
        { provide: UserService, useValue: { user: signal({ email: 'user@example.com' }), load: jasmine.createSpy() } },
      ],
    });

    const service = TestBed.inject(SupportService);
    await service.load();
    const messages = service.threads()[0].messages;

    expect(messages[0].attachments?.[0]).toEqual(
      jasmine.objectContaining({ name: 'evidencia.png', type: 'image/png', dataUrl: 'data:image/png;base64,aGVsbG8=' }),
    );
    expect(messages[1].attachments?.[0]).toEqual(
      jasmine.objectContaining({ name: 'respuesta.pdf', type: 'application/pdf', dataUrl: 'https://example.test/respuesta.pdf' }),
    );
  });

  it('allows feedback without a plate because only contractId is required by Swagger', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo('123');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        { provide: CitiesService, useValue: { contractIdFor: () => 1 } },
        {
          provide: UserService,
          useValue: { user: signal({ email: '' }), load: jasmine.createSpy().and.rejectWith(new Error('profile unavailable')) },
        },
      ],
    });

    const service = TestBed.inject(SupportService);
    const created = await service.create({
      type: 'incident',
      subtype: 'web',
      cityId: 'durango',
      cityName: 'Durango',
      plate: '',
      message: 'test',
    });

    expect(created?.id).toBe('123');
    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/AddUserFeedbackAPI',
      jasmine.objectContaining({ contractId: 1, plate: '', userEmail: null }),
      { token: 'token' },
    );
  });

  it('sends feedback using the contract expected by the APK', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-27T00:27:47Z'));
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

    expect(api.post).toHaveBeenCalledWith(OPS_ENDPOINTS.support.add, jasmine.objectContaining({ subtype: 1 }), { token: 'token' });
  });
});
