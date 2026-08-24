export type ApiErrorCode = 'network' | 'unauthorized' | 'invalidCode' | 'conflict' | 'missingParam' | 'notActivated' | 'server';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    readonly serverCode?: number,
    readonly payload?: unknown,
  ) {
    super(`${code}${serverCode ? ` (${serverCode})` : ''} (HTTP ${status})`);
    this.name = 'ApiError';
  }
}
