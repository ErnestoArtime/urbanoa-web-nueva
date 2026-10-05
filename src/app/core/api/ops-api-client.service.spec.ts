import { OpsApiClient } from './ops-api-client.service';
import { OpsApiError } from './ops-api.types';
import { OpsSessionService } from './ops-session.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowSessionService } from '../services/window-session.service';
import { OPS_ENDPOINTS } from './ops-endpoints';

describe('OpsApiClient', () => {
  let client: OpsApiClient;

  const success = () => new Response(JSON.stringify({ value: 0, isSuccess: true, error: null }), { status: 200 });

  it('recovers a read-only POST after a transport failure', async () => {
    const pause = spyOn<any>(client, 'waitForRetry').and.resolveTo();
    const fetchSpy = spyOn(globalThis, 'fetch').and.returnValues(
      Promise.reject(new TypeError('Network failed')),
      Promise.resolve(success()),
    );
    await expectAsync(client.post(OPS_ENDPOINTS.user.operations, { page: 1 })).toBeResolvedTo(0);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(pause.calls.first().args[0]).toBe(250);
  });

  it('stops after three retries and keeps the final error', async () => {
    const pause = spyOn<any>(client, 'waitForRetry').and.resolveTo();
    const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(async () => new Response('', { status: 503 }));
    await expectAsync(client.get(OPS_ENDPOINTS.wallet.credit)).toBeRejectedWith(jasmine.objectContaining({ kind: 'http', status: 503 }));
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(pause.calls.allArgs().map((args) => args[0])).toEqual([250, 500, 1000]);
  });

  it('never retries mutations, login, or payment quotes', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(async () => new Response('', { status: 503 }));
    for (const endpoint of [
      OPS_ENDPOINTS.auth.login,
      OPS_ENDPOINTS.wallet.recharge,
      OPS_ENDPOINTS.parking.confirmParking,
      OPS_ENDPOINTS.parking.confirmUnparking,
      OPS_ENDPOINTS.parking.queryUnparking,
    ]) {
      await expectAsync(client.post(endpoint, {})).toBeRejectedWithError(OpsApiError);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  it('does not retry business errors, invalid responses or permanent HTTP failures', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch');
    for (const response of [
      new Response('', { status: 401 }),
      new Response('not JSON'),
      new Response(JSON.stringify({ value: null, isSuccess: false, error: { code: -9 } })),
    ]) {
      fetchSpy.and.resolveTo(response);
      await expectAsync(client.get(OPS_ENDPOINTS.wallet.credit)).toBeRejectedWithError(OpsApiError);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('cancels the retry delay when the session changes', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(async () => new Response('', { status: 503 }));
    let delayStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      delayStarted = resolve;
    });
    const originalPause = (client as any).waitForRetry.bind(client);
    spyOn<any>(client, 'waitForRetry').and.callFake((...args: unknown[]) => {
      delayStarted();
      return originalPause(...args);
    });
    const request = client.get(OPS_ENDPOINTS.wallet.credit);
    await started;
    TestBed.inject(OpsSessionService).setToken('another-account');
    await expectAsync(request).toBeRejectedWith(jasmine.objectContaining({ kind: 'abort' }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries a query timeout with a fresh request', async () => {
    spyOn<any>(client, 'waitForRetry').and.resolveTo();
    let attempts = 0;
    spyOn(globalThis, 'fetch').and.callFake((_input, init) => {
      if (++attempts === 2) return Promise.resolve(success());
      return new Promise<Response>((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true }),
      );
    });
    await expectAsync(client.get(OPS_ENDPOINTS.wallet.credit, { timeoutMs: 1 })).toBeResolvedTo(0);
    expect(attempts).toBe(2);
  });

  it('does not accept or retry data when the session changes while reading the body', async () => {
    const response = success();
    spyOn(response, 'json').and.callFake(async () => {
      TestBed.inject(OpsSessionService).setToken('new-account');
      return { value: 100, isSuccess: true, error: null };
    });
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(response);
    await expectAsync(client.get(OPS_ENDPOINTS.wallet.credit)).toBeRejectedWith(jasmine.objectContaining({ kind: 'abort' }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

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

  it('rejects an authenticated request before sending it from an inactive window', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch');
    await expectAsync(client.get('private-endpoint', { token: 'old-token' })).toBeRejectedWith(jasmine.objectContaining({ kind: 'abort' }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a late authenticated response after another window takes ownership', async () => {
    TestBed.inject(WindowSessionService).activate();
    TestBed.inject(OpsSessionService).setToken('old-token');
    spyOn(globalThis, 'fetch').and.callFake(async () => {
      const key = Object.keys(localStorage).find((item) => item.startsWith('urbanoa.auth.active-window.'))!;
      localStorage.setItem(key, 'other-window');
      return new Response(JSON.stringify({ value: { balance: 999 }, isSuccess: true, error: null }), { status: 200 });
    });
    await expectAsync(client.get('private-endpoint', { token: 'old-token' })).toBeRejectedWith(jasmine.objectContaining({ kind: 'abort' }));
  });

  it('does not admit a response from a previous account after a token change in the same window', async () => {
    TestBed.inject(WindowSessionService).activate();
    const session = TestBed.inject(OpsSessionService);
    session.setToken('old-token');
    spyOn(globalThis, 'fetch').and.callFake(async () => {
      session.setToken('new-token');
      return new Response(JSON.stringify({ value: { privateData: true }, isSuccess: true, error: null }), { status: 200 });
    });
    await expectAsync(client.get('private-endpoint', { token: 'old-token' })).toBeRejectedWith(jasmine.objectContaining({ kind: 'abort' }));
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
