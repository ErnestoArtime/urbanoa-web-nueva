export interface OpsApiErrorPayload {
  code: number;
  type: number;
  message_EN?: string;
  message_ES?: string;
  message_EU?: string;
  message_FR?: string;
}

export interface OpsApiEnvelope<T> {
  value: T | null;
  isSuccess: boolean;
  error: OpsApiErrorPayload | null;
}

export type DataSource = 'remote' | 'mock';

export interface DataResult<T> {
  data: T;
  source: DataSource;
  error?: OpsApiError;
}

export type OpsApiErrorKind = 'transport' | 'http' | 'invalid-response' | 'backend';

export class OpsApiError extends Error {
  constructor(
    readonly kind: OpsApiErrorKind,
    readonly endpoint: string,
    message: string,
    readonly status?: number,
    readonly backendError?: OpsApiErrorPayload | null,
  ) {
    super(message);
    this.name = 'OpsApiError';
  }
}
