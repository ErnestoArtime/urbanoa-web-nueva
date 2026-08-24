import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;
  let opsApi: jasmine.SpyObj<OpsApiClient>;
  let authService: {
    requestPasswordReset: jasmine.Spy;
    resendMail: jasmine.Spy;
    verifyResetCode: jasmine.Spy;
    changeResetPassword: jasmine.Spy;
    source: () => 'remote' | 'mock';
  };

  beforeEach(() => {
    opsApi = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    authService = {
      requestPasswordReset: jasmine.createSpy().and.resolveTo(),
      resendMail: jasmine.createSpy().and.resolveTo(),
      verifyResetCode: jasmine.createSpy().and.resolveTo(),
      changeResetPassword: jasmine.createSpy().and.resolveTo(),
      source: () => 'remote',
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PasswordService,
        { provide: AuthService, useValue: authService },
        { provide: OpsApiClient, useValue: opsApi },
        { provide: OpsSessionService, useValue: { token: () => 'session-token' } },
      ],
    });
    service = TestBed.inject(PasswordService);
  });

  it('delegates recovery and resend calls to the reconciled auth contract', async () => {
    await service.requestCode('user@example.com');
    await service.resendMail('user@example.com', 'recover');

    expect(authService.requestPasswordReset).toHaveBeenCalledOnceWith('user@example.com');
    expect(authService.resendMail).toHaveBeenCalledOnceWith('user@example.com', 'recover');
  });

  it('updates an authenticated password with the OPS token', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.updatePassword('new-secret');

    expect(opsApi.post).toHaveBeenCalledOnceWith(OPS_ENDPOINTS.user.updatePassword, { password: 'new-secret' }, { token: 'session-token' });
    expect(service.source()).toBe('remote');
  });

  it('preserves auth-service errors when the authenticated password update fails', async () => {
    opsApi.post.and.rejectWith(new Error('backend unavailable'));

    await expectAsync(service.updatePassword('new-secret')).toBeRejectedWithError('backend unavailable');

    expect(service.source()).toBe('mock');
  });

  it('sends the recovery code only to ChangePasswordAPI', async () => {
    await service.confirmPasswordReset('user@example.com', '123456', 'new-secret');

    expect(authService.verifyResetCode).not.toHaveBeenCalled();
    expect(authService.changeResetPassword).toHaveBeenCalledOnceWith('user@example.com', '123456', 'new-secret');
  });
});
