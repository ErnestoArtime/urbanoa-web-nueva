import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '../http/api-client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function requestAt(spy: jasmine.Spy, index = -1): { url: string; body: unknown; headers: Headers } {
  const call = index === -1 ? spy.calls.mostRecent() : spy.calls.all()[index];
  const [url, init] = call.args as [string, RequestInit];
  return { url, body: JSON.parse(String(init.body)), headers: new Headers(init.headers) };
}

describe('PasswordService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('requests a recovery code with the email only', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(jsonResponse({ value: '1', isSuccess: true, error: null }));
    const service = TestBed.inject(PasswordService);

    await service.requestCode('ane@example.com');

    const request = requestAt(fetchSpy);
    expect(request.url).toContain('/OPSWebServicesAPI3/RecoverPasswordAPI');
    expect(request.body).toEqual(jasmine.objectContaining({ email: 'ane@example.com' }));
  });

  it('sends the session token when updating the password', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValues(
      Promise.resolve(jsonResponse({ value: { token: 'abc123', user: { email: 'ane@example.com' } }, isSuccess: true, error: null })),
      Promise.resolve(jsonResponse({ value: {}, isSuccess: true, error: null })),
      Promise.resolve(jsonResponse({ value: 'Result_OK', isSuccess: true, error: null })),
    );
    const authService = TestBed.inject(AuthService);
    const service = TestBed.inject(PasswordService);

    await authService.login('ane@example.com', 'secret');
    await service.updatePassword('newsecret');

    const request = requestAt(fetchSpy);
    expect(request.url).toContain('/OPSWebServicesAPI3/UpdatePasswordAPI');
    expect(request.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('propagates an invalid recovery code as an ApiError', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      jsonResponse({
        value: null,
        isSuccess: false,
        error: { code: -31, type: 1, message_EN: 'Recovery code not found', message_ES: 'Código de recuperación no encontrado' },
      }),
    );
    const service = TestBed.inject(PasswordService);

    await expectAsync(service.confirmPasswordReset('ane@example.com', '000000', 'newsecret')).toBeRejectedWith(
      jasmine.objectContaining({ code: 'invalidCode' } as Partial<ApiError>),
    );
  });

  it('verifies the recovery code before changing the password', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValues(
      Promise.resolve(jsonResponse({ value: '1', isSuccess: true, error: null })),
      Promise.resolve(jsonResponse({ value: 'new-jwt', isSuccess: true, error: null })),
    );
    const service = TestBed.inject(PasswordService);

    await service.confirmPasswordReset('ane@example.com', '000000', 'newsecret');

    expect(fetchSpy.calls.count()).toBe(2);
    const verifyRequest = requestAt(fetchSpy, 0);
    expect(verifyRequest.url).toContain('/OPSWebServicesAPI3/VerifyRecoveryPasswordAPI');
    expect(verifyRequest.body).toEqual(jasmine.objectContaining({ email: 'ane@example.com', recode: '000000' }));

    const changeRequest = requestAt(fetchSpy, 1);
    expect(changeRequest.url).toContain('/OPSWebServicesAPI3/ChangePasswordAPI');
    expect(changeRequest.body).toEqual(jasmine.objectContaining({ email: 'ane@example.com', password: 'newsecret', recode: '000000' }));
    expect(TestBed.inject(AuthService).token()).toBe('new-jwt');
  });
});
