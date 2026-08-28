import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppApiClient {
  private readonly http = inject(HttpClient);

  async get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(`${environment.apiBaseUrl}${path}`));
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${environment.apiBaseUrl}${path}`, body));
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(`${environment.apiBaseUrl}${path}`, body));
  }

  async delete<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(`${environment.apiBaseUrl}${path}`));
  }

  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = typeof error.error === 'object' && error.error ? (error.error as { message?: string }).message : undefined;
      return detail ?? error.message;
    }
    return error instanceof Error ? error.message : 'Error de red';
  }
}
