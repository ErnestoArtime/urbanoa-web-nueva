import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OpsApiEnvelope, OpsApiError } from './ops-api.types';
import { OpsSessionService } from './ops-session.service';
import { TranslationService } from '../services/translation.service';
import { WindowSessionService } from '../services/window-session.service';
import { OPS_ENDPOINTS } from './ops-endpoints';

const SESSION_EXPIRED_ERROR_CODES = new Set([-23, -231]);
// Explicit read-only operations: POST is also used for queries by OPS.
const RETRYABLE_QUERIES = new Set<string>([
  OPS_ENDPOINTS.parking.contracts,
  OPS_ENDPOINTS.parking.mapStretches,
  OPS_ENDPOINTS.parking.sectors,
  OPS_ENDPOINTS.parking.zone,
  OPS_ENDPOINTS.parking.place,
  OPS_ENDPOINTS.parking.streets,
  OPS_ENDPOINTS.parking.tickets,
  OPS_ENDPOINTS.parking.parkingStatus,
  OPS_ENDPOINTS.user.query,
  OPS_ENDPOINTS.user.plates,
  OPS_ENDPOINTS.user.notifications,
  OPS_ENDPOINTS.user.operations,
  OPS_ENDPOINTS.wallet.credit,
  OPS_ENDPOINTS.wallet.paymentMethods,
  OPS_ENDPOINTS.support.query,
]);
const RETRY_DELAYS_MS = [250, 500, 1000];
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

interface OpsRequestOptions {
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Devuelve null en vez de fallar cuando el envelope es exitoso pero `value` es null. */
  allowEmptyValue?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OpsApiClient {
  private serverOffsetMs = 0;

  private readonly session = inject(OpsSessionService);
  private readonly translation = inject(TranslationService);
  private readonly windowSession = inject(WindowSessionService);

  get<T>(endpoint: string, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  getOrNull<T>(endpoint: string, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T | null> {
    return this.request<T | null>('GET', endpoint, { ...options, allowEmptyValue: true });
  }

  post<T>(endpoint: string, body: unknown, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  postOrNull<T>(endpoint: string, body: unknown, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T | null> {
    return this.request<T | null>('POST', endpoint, { ...options, body, allowEmptyValue: true });
  }

  serverNow(): Date {
    return new Date(Date.now() + this.serverOffsetMs);
  }

  private async request<T>(method: 'GET' | 'POST', endpoint: string, options: OpsRequestOptions): Promise<T> {
    const lifecycle = new AbortController();
    this.session.registerRequest(lifecycle);
    try {
      for (let attempt = 0; ; attempt++) {
        if (lifecycle.signal.aborted) throw new OpsApiError('abort', endpoint, `${endpoint}: la solicitud fue cancelada`);
        this.verifyWindowSession(endpoint, options.token);
        try {
          const value = await this.requestOnce<T>(method, endpoint, options);
          if (lifecycle.signal.aborted) throw new OpsApiError('abort', endpoint, `${endpoint}: la solicitud fue cancelada`);
          return value;
        } catch (error) {
          if (lifecycle.signal.aborted) throw new OpsApiError('abort', endpoint, `${endpoint}: la solicitud fue cancelada`);
          if (!RETRYABLE_QUERIES.has(endpoint) || attempt >= RETRY_DELAYS_MS.length || !this.isTransient(error)) throw error;
          await this.waitForRetry(RETRY_DELAYS_MS[attempt], lifecycle.signal, endpoint);
        }
      }
    } finally {
      this.session.unregisterRequest(lifecycle);
    }
  }

  private isTransient(error: unknown): boolean {
    return (
      error instanceof OpsApiError &&
      (error.kind === 'transport' || error.kind === 'timeout' || (error.kind === 'http' && RETRYABLE_HTTP_STATUSES.has(error.status ?? 0)))
    );
  }

  private waitForRetry(delay: number, signal: AbortSignal, endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        reject(new OpsApiError('abort', endpoint, `${endpoint}: la solicitud fue cancelada`));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, delay);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
  }

  private async requestOnce<T>(method: 'GET' | 'POST', endpoint: string, options: OpsRequestOptions): Promise<T> {
    const controller = new AbortController();
    this.session?.registerRequest(controller);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException('La solicitud agotó el tiempo de espera', 'TimeoutError'));
    }, options.timeoutMs ?? 15_000);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      cityId: '0',
      ...options.headers,
    };

    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

    try {
      this.verifyWindowSession(endpoint, options.token);
      const response = await fetch(`${environment.opsApiBaseUrl}/${endpoint}`, {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      controller.signal.throwIfAborted();
      this.verifyWindowSession(endpoint, options.token);

      if (!response.ok) {
        const responseBody = await response.text().catch(() => '');
        const detail = responseBody.trim().replace(/\s+/g, ' ').slice(0, 500);
        throw new OpsApiError('http', endpoint, `${endpoint}: HTTP ${response.status}${detail ? ` - ${detail}` : ''}`, response.status);
      }

      const serverDate = response.headers.get('date');
      if (serverDate) {
        const parsedServerDate = Date.parse(serverDate);
        if (!Number.isNaN(parsedServerDate)) this.serverOffsetMs = parsedServerDate - Date.now();
      }

      let payload: unknown;
      try {
        payload = await response.json();
        controller.signal.throwIfAborted();
      } catch (error) {
        if (controller.signal.aborted) throw error;
        throw new OpsApiError('invalid-response', endpoint, `${endpoint}: la respuesta no es JSON válido`, response.status);
      }
      this.verifyWindowSession(endpoint, options.token);

      if (!this.isEnvelope<T>(payload)) {
        throw new OpsApiError('invalid-response', endpoint, `${endpoint}: contrato de respuesta inesperado`, response.status);
      }

      if (!payload.isSuccess) {
        if (payload.error && SESSION_EXPIRED_ERROR_CODES.has(payload.error.code) && !endpoint.endsWith('LoginUserAPI')) {
          window.dispatchEvent(new CustomEvent('urbanoa:session-expired'));
        }
        const message = this.localizedBackendMessage(payload.error, endpoint);
        throw new OpsApiError('backend', endpoint, message, response.status, payload.error);
      }

      if (payload.value === null) {
        if (options.allowEmptyValue) return null as T;
        throw new OpsApiError('invalid-response', endpoint, `${endpoint}: respuesta satisfactoria sin datos`, response.status);
      }

      return payload.value;
    } catch (error) {
      if (error instanceof OpsApiError) throw error;
      if (controller.signal.aborted) {
        const kind = timedOut || (error instanceof DOMException && error.name === 'TimeoutError') ? 'timeout' : 'abort';
        const detail = kind === 'timeout' ? 'la solicitud agotó el tiempo de espera' : 'la solicitud fue cancelada';
        throw new OpsApiError(kind, endpoint, `${endpoint}: ${detail}`);
      }
      const message = error instanceof Error ? error.message : 'Error de red desconocido';
      throw new OpsApiError('transport', endpoint, `${endpoint}: ${message}`);
    } finally {
      clearTimeout(timeout);
      this.session?.unregisterRequest(controller);
    }
  }

  private verifyWindowSession(endpoint: string, token?: string | null): void {
    if (token && (this.session.token() !== token || !this.windowSession.ensureActive())) {
      throw new OpsApiError('abort', endpoint, `${endpoint}: session no longer active in this window`);
    }
  }

  private isEnvelope<T>(payload: unknown): payload is OpsApiEnvelope<T> {
    if (!payload || typeof payload !== 'object') return false;
    const value = payload as Partial<OpsApiEnvelope<T>>;
    return typeof value.isSuccess === 'boolean' && 'value' in value && 'error' in value;
  }

  private localizedBackendMessage(error: OpsApiEnvelope<unknown>['error'], endpoint: string): string {
    if (!error) return `${endpoint}: error del servicio`;
    const messages: Record<string, string | undefined> = {
      es: error.message_ES,
      eu: error.message_EU,
      fr: error.message_FR,
      uk: error.message_EN,
    };
    return messages[this.translation.currentLang$()] ?? error.message_ES ?? error.message_EN ?? `${endpoint}: error del servicio`;
  }
}
