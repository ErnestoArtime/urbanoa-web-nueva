import type { TranslationService } from '../services/translation.service';
import { ApiError, ApiErrorCode } from './api-client';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
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
  if (error.endpoint === OPS_ENDPOINTS.auth.recoverPassword && error.backendError?.code === -20) return 'unauthorized';
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

/** Prefer the OPS message in the active language; otherwise use the web catalogue. */
export function apiErrorMessage(
  error: unknown,
  translation: Pick<TranslationService, 'currentLang$' | 'translate'>,
  overrides: Partial<Record<ApiErrorCode, string>> = {},
): string {
  if (error instanceof OpsApiError && error.backendError) {
    const messages = {
      es: error.backendError.message_ES,
      eu: error.backendError.message_EU,
      fr: error.backendError.message_FR,
      uk: error.backendError.message_EN,
    };
    const message = messages[translation.currentLang$()];
    if (typeof message === 'string' && message.trim()) return message;
  }
  return translation.translate(apiErrorKey(error, overrides));
}
