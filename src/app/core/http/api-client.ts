import { environment } from '../../../environments/environment';

export interface OpsApiResponse<T = unknown> {
  value: T | null;
  isSuccess: boolean;
  error: OpsApiError | null;
}

export interface OpsApiError {
  code: number;
  type: number;
  message_EN: string;
  message_ES: string;
  message_EU?: string;
  message_FR?: string;
}

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

interface RequestOptions {
  token?: string;
  signal?: AbortSignal;
}

const APP_VERSION = '4.0.0';

function getOrCreateCloudToken(): string {
  let token = localStorage.getItem('urbanoa.deviceToken');
  if (!token) {
    token = crypto.randomUUID?.() || `device-${Date.now()}`;
    localStorage.setItem('urbanoa.deviceToken', token);
  }
  return token;
}

function buildUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${environment.opsApiBaseUrl}/OPSWebServicesAPI3${normalized}`;
}

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', cityId: '0' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function codeForServerError(serverCode: number): ApiErrorCode {
  if (serverCode === -101 || serverCode === -106 || serverCode === -130) return 'missingParam';
  if (serverCode === -1) return 'unauthorized';
  if (serverCode === -21) return 'conflict';
  if (serverCode === -29) return 'notActivated';
  if (serverCode === -31) return 'invalidCode';
  return 'server';
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<TRes>(method: 'GET' | 'POST', path: string, body?: unknown, options: RequestOptions = {}): Promise<TRes> {
  let response: Response;
  try {
    const requestBody =
      body && typeof body === 'object'
        ? {
            cloudToken: getOrCreateCloudToken(),
            appVersion: APP_VERSION,
            ...body,
          }
        : body;

    response = await fetch(buildUrl(path), {
      method,
      headers: buildHeaders(options.token),
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError(0, 'network');
  }

  const payload = (await parseBody(response)) as OpsApiResponse<unknown>;

  if (!payload?.isSuccess) {
    const error = payload?.error;
    const serverCode = error?.code ?? -9;
    const errorCode = codeForServerError(serverCode);
    throw new ApiError(response.status, errorCode, serverCode, payload);
  }

  return payload.value as TRes;
}

export function postJson<TRes>(path: string, body?: unknown, options?: RequestOptions): Promise<TRes> {
  return request<TRes>('POST', path, body, options);
}

export function getJson<TRes>(path: string, options?: RequestOptions): Promise<TRes> {
  return request<TRes>('GET', path, undefined, options);
}
