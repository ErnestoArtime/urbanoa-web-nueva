import { OpsApiError } from '../api/ops-api.types';

/** A lost response is not evidence that OPS rejected a financial write. */
export function isPaymentOutcomeUnknown(error: unknown): boolean {
  if (!(error instanceof OpsApiError)) return true;
  return (
    error.kind === 'transport' ||
    error.kind === 'timeout' ||
    error.kind === 'abort' ||
    error.kind === 'invalid-response' ||
    (error.kind === 'backend' && (!error.backendError || [-9, -12, -13].includes(error.backendError.code))) ||
    (error.kind === 'http' && ((error.status ?? 0) >= 500 || error.status === 408))
  );
}
