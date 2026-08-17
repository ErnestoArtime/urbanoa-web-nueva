import { DataResult, OpsApiError } from './ops-api.types';

export async function withMockFallback<T>(remote: () => Promise<T>, mock: () => T): Promise<DataResult<T>> {
  try {
    return { data: await remote(), source: 'remote' };
  } catch (error) {
    const apiError =
      error instanceof OpsApiError
        ? error
        : new OpsApiError('transport', 'unknown', error instanceof Error ? error.message : 'Error desconocido');
    console.warn('[OPS API] Se utiliza fallback mock', apiError);
    return { data: mock(), source: 'mock', error: apiError };
  }
}
