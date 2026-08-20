import { ApiError, ApiErrorCode } from './api-client';

const DEFAULT_KEYS: Record<ApiErrorCode, string> = {
  network: 'errors.network',
  unauthorized: 'errors.unauthorized',
  invalidCode: 'errors.invalidCode',
  conflict: 'errors.conflict',
  missingParam: 'errors.server',
  notActivated: 'errors.notActivated',
  server: 'errors.server',
};

export function apiErrorKey(error: unknown, overrides: Partial<Record<ApiErrorCode, string>> = {}): string {
  if (!(error instanceof ApiError)) return DEFAULT_KEYS.server;
  return overrides[error.code] ?? DEFAULT_KEYS[error.code];
}
