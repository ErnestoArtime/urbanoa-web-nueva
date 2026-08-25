import { OpsApiClient } from './ops-api-client.service';
import { OpsApiError } from './ops-api.types';

describe('OpsApiClient', () => {
  let client: OpsApiClient;

  beforeEach(() => {
    client = new OpsApiClient();
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
});
