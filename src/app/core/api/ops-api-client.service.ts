import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OpsApiEnvelope, OpsApiError } from './ops-api.types';

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
  get<T>(endpoint: string, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  getOrNull<T>(endpoint: string, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T | null> {
    return this.request<T | null>('GET', endpoint, { ...options, allowEmptyValue: true });
  }

  post<T>(endpoint: string, body: unknown, options: Omit<OpsRequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  private async request<T>(method: 'GET' | 'POST', endpoint: string, options: OpsRequestOptions): Promise<T> {
    // Las sesiones mock son válidas para mantener navegable la maqueta, pero
    // nunca deben viajar al backend real como si fueran credenciales válidas.
    if (options.token?.startsWith('mock-')) {
      throw new OpsApiError('transport', endpoint, `${endpoint}: sesión mock; se usa el fallback local`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      cityId: '0',
      ...options.headers,
    };

    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

    try {
      const response = await fetch(`${environment.opsApiBaseUrl}/${endpoint}`, {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseBody = await response.text().catch(() => '');
        const detail = responseBody.trim().replace(/\s+/g, ' ').slice(0, 500);
        throw new OpsApiError('http', endpoint, `${endpoint}: HTTP ${response.status}${detail ? ` - ${detail}` : ''}`, response.status);
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new OpsApiError('invalid-response', endpoint, `${endpoint}: la respuesta no es JSON válido`, response.status);
      }

      if (!this.isEnvelope<T>(payload)) {
        throw new OpsApiError('invalid-response', endpoint, `${endpoint}: contrato de respuesta inesperado`, response.status);
      }

      if (!payload.isSuccess) {
        const message = payload.error?.message_ES ?? payload.error?.message_EN ?? `${endpoint}: error del servicio`;
        throw new OpsApiError('backend', endpoint, message, response.status, payload.error);
      }

      if (payload.value === null) {
        if (options.allowEmptyValue) return null as T;
        throw new OpsApiError('invalid-response', endpoint, `${endpoint}: respuesta satisfactoria sin datos`, response.status);
      }

      return payload.value;
    } catch (error) {
      if (error instanceof OpsApiError) throw error;
      const message = error instanceof Error ? error.message : 'Error de red desconocido';
      throw new OpsApiError('transport', endpoint, `${endpoint}: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private isEnvelope<T>(payload: unknown): payload is OpsApiEnvelope<T> {
    if (!payload || typeof payload !== 'object') return false;
    const value = payload as Partial<OpsApiEnvelope<T>>;
    return typeof value.isSuccess === 'boolean' && 'value' in value && 'error' in value;
  }
}
