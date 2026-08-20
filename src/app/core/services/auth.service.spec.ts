import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '../http/api-client';
import { AuthService } from './auth.service';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('stores the session returned by the API', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      jsonResponse({
        value: {
          token: 'abc123',
          refreshToken: 'refresh123',
          user: { id: '7', name: 'Ane', surname: 'Lopez', email: 'ane@example.com', nif: '12345678A', phone: '600000000' },
        },
        isSuccess: true,
        error: null,
      }),
    );
    const service = TestBed.inject(AuthService);

    await service.login('ane@example.com', 'secret');

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('abc123');
    expect(service.currentSession()?.user.name).toBe('Ane');
    expect(localStorage.getItem('urbanoa.auth.session')).toContain('abc123');
  });

  it('keeps no session when the API rejects the credentials', async () => {
    spyOn(window, 'fetch').and.resolveTo(jsonResponse({ message: 'bad credentials' }, 401));
    const service = TestBed.inject(AuthService);

    await expectAsync(service.login('ane@example.com', 'wrong')).toBeRejectedWith(jasmine.any(ApiError));

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('urbanoa.auth.session')).toBeNull();
  });

  it('reports a network error when fetch fails', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('offline'));
    const service = TestBed.inject(AuthService);

    await expectAsync(service.login('ane@example.com', 'secret')).toBeRejectedWith(jasmine.objectContaining({ code: 'network' }));

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('clears the stored session on logout', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      jsonResponse({ value: { token: 'abc123', user: { email: 'ane@example.com' } }, isSuccess: true, error: null }),
    );
    const service = TestBed.inject(AuthService);

    await service.login('ane@example.com', 'secret');
    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('urbanoa.auth.session')).toBe('null');
  });

  it('restores a session persisted in storage', () => {
    localStorage.setItem(
      'urbanoa.auth.session',
      JSON.stringify({
        token: 'stored-token',
        refreshToken: '',
        user: { id: '1', name: 'Ane', surname: '', email: 'ane@example.com', nif: '', phone: '' },
      }),
    );

    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('stored-token');
  });
});
