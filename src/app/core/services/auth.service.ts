import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { ApiError, getJson, postJson } from '../http/api-client';
import { readStorage, writeStorage } from '../storage/signal-storage';
import { TranslationService } from './translation.service';
import { UserService, UserData } from './user.service';
import { AccountApiService } from './account-api.service';

export interface AuthUser extends UserData {
  id: string;
}

/*
export interface AuthUser {
  id?: number | string;
  email: string;
  password: string;
  plates: string[];
  name?: string;
  surname?: string;
  nif?: string;
  mainMobilePhone?: string;
}*/

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  plates: string[];
  name?: string;
  surname?: string;
  nif?: string;
  mainMobilePhone?: string;
}

const OPERATING_SYSTEM_WEB = 1;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);
  private readonly opsSession = inject(OpsSessionService);
  private readonly translationService = inject(TranslationService);
  private readonly storageKey = 'urbanoa.auth.session';
  private readonly session = signal<AuthSession | null>(readStorage<AuthSession | null>(this.storageKey, null));

  readonly currentSession = this.session.asReadonly();
  readonly token = computed(() => this.session()?.token ?? '');
  readonly isAuthenticated = computed(() => !!this.session()?.token);

  constructor() {
    this.syncOpsSession(this.token());
  }
  private readonly api = inject(AppApiClient);
  private readonly opsApi = inject(OpsApiClient);
  //private readonly session = inject(OpsSessionService);
  //private readonly router = inject(Router);
  //private readonly accountApi = inject(AccountApiService);
  //private readonly userState = signal<AuthUser>(this.readUser());
  //readonly user = this.userState.asReadonly();
  //readonly isAuthenticated = computed(() => Boolean(this.session.token()));
  readonly source = signal<'remote' | 'mock'>('mock');

  async login(email: string, password: string): Promise<void> {
    const response = await postJson<unknown>('/LoginUserAPI', {
      userName: email,
      password,
      operatingSystem: OPERATING_SYSTEM_WEB,
      language: this.translationService.currentLang$(),
    });
    const session = this.normalizeSession(response, email);
    if (!session.token) {
      throw new ApiError(0, 'unauthorized');
    }
    this.storeSession(session);
  }

  async register(payload: RegisterPayload): Promise<void> {
    const response = await postJson<unknown>('/RegisterUserAPI', payload);
    const session = this.normalizeSession(response, payload.email);
    if (session.token) {
      this.storeSession(session);
    }
  }

  adoptToken(token: string, email: string): void {
    this.storeSession({
      token,
      refreshToken: '',
      user: { id: '', name: '', surname: '', email, nif: '', phone: '' },
    });
  }

  async cancelAccount(): Promise<void> {
    await getJson('/CancelUserAccountAPI', { token: this.token() });
    this.clearSession();
  }

  async requestPasswordReset(email: string): Promise<void> {
    try { await this.opsApi.post(OPS_ENDPOINTS.auth.recoverPassword, { contractId: 0, userName: email.trim(), email: email.trim() }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Reset usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  logout(): void {
    this.clearSession();
  }

  async verifyResetCode(email: string, code: string): Promise<void> {
    try { await this.opsApi.post(OPS_ENDPOINTS.auth.verifyRecoveryPassword, { contractId: 0, userName: email.trim(), email: email.trim(), recode: code.trim() }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Verificación usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  private storeSession(session: AuthSession): void {
    this.session.set(session);
    writeStorage(this.storageKey, session);
    this.syncOpsSession(session.token);
    this.userService.updateUser({
      name: session.user.name,
      surname: session.user.surname,
      email: session.user.email,
      nif: session.user.nif,
      phone: session.user.phone,
    });
  }

  async changeResetPassword(email: string, code: string, password: string): Promise<void> {
    try { await this.opsApi.post(OPS_ENDPOINTS.user.changePassword, { contractId: 0, userName: email.trim(), email: email.trim(), password, recode: code.trim() }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Cambio de password usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  private clearSession(): void {
    this.session.set(null);
    writeStorage<AuthSession | null>(this.storageKey, null);
    this.syncOpsSession('');
  }

  private syncOpsSession(token: string): void {
    if (token) {
      this.opsSession.setToken(token);
    } else {
      this.opsSession.clear();
    }
  }

  private normalizeSession(payload: unknown, fallbackEmail: string): AuthSession {
    const root = (payload ?? {}) as Record<string, unknown>;
    const rawUser = (root['user'] ?? root['userData'] ?? root) as Record<string, unknown>;

    return {
      token: this.readString(root['token'] ?? root['accessToken']),
      refreshToken: this.readString(root['refreshToken']),
      user: {
        id: this.readString(rawUser['id'] ?? rawUser['userId']),
        name: this.readString(rawUser['name'] ?? rawUser['nombre']),
        surname: this.readString(rawUser['surname'] ?? rawUser['apellidos']),
        email: this.readString(rawUser['email']) || fallbackEmail,
        nif: this.readString(rawUser['nif']),
        phone: this.readString(rawUser['phone'] ?? rawUser['telefono']),
      },
    };
  }

  private readString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
