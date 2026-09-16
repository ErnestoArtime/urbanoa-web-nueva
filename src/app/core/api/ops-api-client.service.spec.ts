import { OpsApiClient } from './ops-api-client.service';
import { OpsApiError } from './ops-api.types';
import { OpsSessionService } from './ops-session.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

describe('OpsApiClient', () => {
  let client: OpsApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), OpsApiClient, OpsSessionService] });
    client = TestBed.inject(OpsApiClient);
  });

  it('unwraps a successful APK response', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ value: { count: 2 }, isSuccess: true, error: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expectAsync(client.get<{ count: number }>('test')).toBeResolvedTo({ count: 2 });
  });

  it('rejects an HTTP 200 backend error', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(
        JSON.stringify({
          value: null,
          isSuccess: false,
          error: { code: -9, type: 2, message_ES: 'Error genérico' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expectAsync(client.post('test', {})).toBeRejectedWithError(OpsApiError, 'Error genérico');
  });

  it('notifies when the backend reports an expired session with code -231', async () => {
    const sessionExpired = jasmine.createSpy('sessionExpired');
    window.addEventListener('urbanoa:session-expired', sessionExpired);
    spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(
        JSON.stringify({
          value: null,
          isSuccess: false,
          error: { code: -231, type: 4, message_ES: 'Login inválido, token caducado' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    try {
      await expectAsync(client.get('QueryUserPlatesAPI')).toBeRejectedWithError(OpsApiError, 'Login inválido, token caducado');
      expect(sessionExpired).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('urbanoa:session-expired', sessionExpired);
    }
  });

  it('getOrNull resolves to null on a successful envelope without data', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ value: null, isSuccess: true, error: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expectAsync(client.getOrNull('test')).toBeResolvedTo(null);
  });

  it('getOrNull still throws on backend errors and HTTP failures', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(
        JSON.stringify({
          value: null,
          isSuccess: false,
          error: { code: -9, type: 2, message_ES: 'Error genérico' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expectAsync(client.getOrNull('test')).toBeRejectedWithError(OpsApiError, 'Error genérico');

    (globalThis.fetch as jasmine.Spy).and.resolveTo(new Response('{"Message":"Error."}', { status: 500 }));

    await expectAsync(client.getOrNull('test')).toBeRejectedWithError(OpsApiError);
  });

  it('aborts active requests when the OPS session is cleared', async () => {
    const session = new OpsSessionService();
    session.setToken('session-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: OpsSessionService, useValue: session }, OpsApiClient],
    });
    client = TestBed.inject(OpsApiClient);
    let requestSignal: AbortSignal | undefined;
    spyOn(globalThis, 'fetch').and.callFake((_input, init) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    });

    const request = client.get('test');
    session.clear();

    await expectAsync(request).toBeRejectedWith(jasmine.objectContaining({ name: 'OpsApiError', kind: 'abort' }));
    expect(requestSignal?.aborted).toBeTrue();
  });

  it('distinguishes a request timeout from other aborts', async () => {
    spyOn(globalThis, 'fetch').and.callFake((_input, init) => {
      const signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    });

    const request = client.get('slow-endpoint', { timeoutMs: 1 });

    await expectAsync(request).toBeRejectedWith(
      jasmine.objectContaining({ name: 'OpsApiError', kind: 'timeout', endpoint: 'slow-endpoint' }),
    );
  });
});
