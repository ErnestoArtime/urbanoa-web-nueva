import { ApiError, ApiErrorCode } from './api-client';
import { OpsApiError } from '../api/ops-api.types';

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
  const code = error instanceof ApiError ? error.code : error instanceof OpsApiError ? opsErrorCode(error) : 'server';
  return overrides[code] ?? DEFAULT_KEYS[code];
}

function opsErrorCode(error: OpsApiError): ApiErrorCode {
  if (error.kind === 'transport') return 'network';
  if (error.status === 401 || error.backendError?.code === -1) return 'unauthorized';
  switch (error.backendError?.code) {
    case -21:
      return 'conflict';
    case -29:
      return 'notActivated';
    case -31:
      return 'invalidCode';
    case -101:
    case -106:
    case -130:
      return 'missingParam';
    default:
      return 'server';
  }
}
