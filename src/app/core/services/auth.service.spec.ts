import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { AccountApiService } from './account-api.service';
import { AuthService } from './auth.service';
import { TranslationService } from './translation.service';
import { UserService } from './user.service';

describe('AuthService', () => {
  let service: AuthService;
  let opsApi: jasmine.SpyObj<OpsApiClient>;
  let opsSession: jasmine.SpyObj<OpsSessionService>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    localStorage.clear();
    opsApi = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    opsSession = jasmine.createSpyObj<OpsSessionService>('OpsSessionService', ['token', 'setToken', 'clear']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['updateLocal']);
    opsSession.token.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuthService,
        { provide: OpsApiClient, useValue: opsApi },
        { provide: OpsSessionService, useValue: opsSession },
        { provide: UserService, useValue: userService },
        { provide: AccountApiService, useValue: jasmine.createSpyObj('AccountApiService', ['cancelAccount']) },
        { provide: TranslationService, useValue: { currentLang$: () => 'es' } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', { navigate: Promise.resolve(true) }) },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('uses the Postman login contract and hydrates the profile with the returned token', async () => {
    opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 1 });
    opsApi.get.and.resolveTo({
      contractId: '42',
      email: 'user@example.com',
      names: 'Ada',
      firstSurname: 'Lovelace',
      secondSurname: '',
      nif: '12345678A',
      mainMobilePhone: '600000000',
      userName: 'user@example.com',
    });

    const user = await service.login(' user@example.com ', 'secret');

    expect(opsApi.post).toHaveBeenCalledOnceWith(
      OPS_ENDPOINTS.auth.login,
      {
        userName: 'user@example.com',
        password: 'secret',
        cloudToken: '',
        operatingSystem: 1,
        appVersion: '4.0.0',
        language: 'es',
      },
      { headers: { 'Accept-Language': 'es-ES' } },
    );
    expect(opsApi.get).toHaveBeenCalledOnceWith(OPS_ENDPOINTS.user.query, {
      token: 'real-token',
      headers: { 'Accept-Language': 'es-ES' },
    });
    expect(opsSession.setToken).toHaveBeenCalledWith('real-token');
    expect(user).toEqual(jasmine.objectContaining({ id: '42', name: 'Ada', surname: 'Lovelace', firstLogin: true }));
    expect(service.currentSession()?.token).toBe('real-token');
    expect(localStorage.getItem('urbanoa.auth.session')).toContain('real-token');
  });

  it('keeps a valid OPS session when QueryUserAPI fails', async () => {
    opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 0 });
    opsApi.get.and.rejectWith(new Error('profile unavailable'));

    await service.login({ email: 'user@example.com', password: 'secret' });

    expect(service.token()).toBe('real-token');
    expect(service.source()).toBe('remote');
    expect(opsSession.setToken).toHaveBeenCalledWith('real-token');
  });

  it('registers plates as APK plate objects for the merged form payload', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.register({ email: ' user@example.com ', password: 'secret', plates: [' 1234 abc '] });

    expect(opsApi.post).toHaveBeenCalledOnceWith(
      OPS_ENDPOINTS.auth.register,
      { contractId: 0, email: 'user@example.com', password: 'secret', plates: [{ plate: '1234 ABC' }] },
      { headers: { 'Accept-Language': 'es-ES' } },
    );
  });

  it('uses the complete Swagger recovery contract', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.requestPasswordReset(' user@example.com ');
    await service.verifyResetCode('user@example.com', ' 123456 ');
    await service.changeResetPassword(' user@example.com ', ' 123456 ', 'new-secret');

    expect(opsApi.post.calls.argsFor(0)).toEqual([
      OPS_ENDPOINTS.auth.recoverPassword,
      { contractId: 0, userName: 'user@example.com', email: 'user@example.com' },
      { headers: { 'Accept-Language': 'es-ES' } },
    ]);
    expect(opsApi.post.calls.argsFor(1)).toEqual([
      OPS_ENDPOINTS.auth.verifyRecoveryPassword,
      { contractId: 0, userName: 'user@example.com', email: 'user@example.com', recode: '123456' },
      { headers: { 'Accept-Language': 'es-ES' } },
    ]);
    expect(opsApi.post.calls.argsFor(2)).toEqual([
      OPS_ENDPOINTS.user.changePassword,
      {
        contractId: 0,
        userName: 'user@example.com',
        email: 'user@example.com',
        password: 'new-secret',
        recode: '123456',
      },
      { headers: { 'Accept-Language': 'es-ES' } },
    ]);
    expect(opsApi.post).toHaveBeenCalledTimes(3);
  });

  it('matches both Postman ResendMailAPI bodies', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.resendMail(' user@example.com ', 'register');
    await service.resendMail(' user@example.com ', 'recover');

    expect(opsApi.post.calls.argsFor(0)[1]).toEqual({
      userName: 'user@example.com',
      email: 'user@example.com',
      type: 'register',
    });
    expect(opsApi.post.calls.argsFor(1)[1]).toEqual({ email: 'user@example.com', type: 'recover' });
  });

  it('preserves auth-service error handling when LoginUserAPI fails', async () => {
    opsApi.post.and.rejectWith(new Error('backend unavailable'));

    await expectAsync(service.login('user@example.com', 'secret')).toBeRejectedWithError('backend unavailable');

    expect(service.token()).toBe('');
    expect(service.source()).toBe('mock');
    expect(opsApi.get).not.toHaveBeenCalled();
  });
});
