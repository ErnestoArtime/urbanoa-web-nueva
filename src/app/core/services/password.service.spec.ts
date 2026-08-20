import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '../http/api-client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function lastRequest(spy: jasmine.Spy): { url: string; body: unknown; headers: Headers } {
  const [url, init] = spy.calls.mostRecent().args as [string, RequestInit];
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

    const request = lastRequest(fetchSpy);
    expect(request.url).toContain('/OPSWebServicesAPI3/RecoverPasswordAPI');
    expect(request.body).toEqual(jasmine.objectContaining({ email: 'ane@example.com' }));
  });

  it('sends the session token when updating the password', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValues(
      Promise.resolve(jsonResponse({ value: { token: 'abc123', user: { email: 'ane@example.com' } }, isSuccess: true, error: null })),
      Promise.resolve(jsonResponse({ value: 'Result_OK', isSuccess: true, error: null })),
    );
    const authService = TestBed.inject(AuthService);
    const service = TestBed.inject(PasswordService);

    await authService.login('ane@example.com', 'secret');
    await service.updatePassword('newsecret');

    const request = lastRequest(fetchSpy);
    expect(request.url).toContain('/OPSWebServicesAPI3/UpdatePasswordAPI');
    expect(request.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('propagates an invalid code as an ApiError', async () => {
    spyOn(window, 'fetch').and.resolveTo(jsonResponse({ message: 'invalid code' }, 400));
    const service = TestBed.inject(PasswordService);

    await expectAsync(service.confirmPasswordReset('ane@example.com', '000000', 'newsecret')).toBeRejectedWith(jasmine.any(ApiError));
  });
});
