import { computed, inject, Injectable, signal } from '@angular/core';
import { postJson } from '../http/api-client';
import { readStorage, writeStorage } from '../storage/signal-storage';
import { UserService, UserData } from './user.service';

export interface AuthUser extends UserData {
  id: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  plate?: string;
  name?: string;
  surname?: string;
  nif?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);
  private readonly storageKey = 'urbanoa.auth.session';
  private readonly session = signal<AuthSession | null>(readStorage<AuthSession | null>(this.storageKey, null));

  readonly currentSession = this.session.asReadonly();
  readonly token = computed(() => this.session()?.token ?? '');
  readonly isAuthenticated = computed(() => !!this.session()?.token);

  async login(email: string, password: string): Promise<void> {
    const response = await postJson<unknown>('/LoginUserAPI', { email, password });
    this.storeSession(this.normalizeSession(response, email));
  }

  async register(payload: RegisterPayload): Promise<void> {
    const response = await postJson<unknown>('/RegisterUserAPI', payload);
    const session = this.normalizeSession(response, payload.email);
    if (session.token) {
      this.storeSession(session);
    }
  }

  async cancelAccount(password: string, reason: string): Promise<void> {
    await postJson('/CancelUserAccountAPI', { password, reason }, { token: this.token() });
    this.clearSession();
  }

  logout(): void {
    this.clearSession();
  }

  private storeSession(session: AuthSession): void {
    this.session.set(session);
    writeStorage(this.storageKey, session);
    this.userService.updateUser({
      name: session.user.name,
      surname: session.user.surname,
      email: session.user.email,
      nif: session.user.nif,
      phone: session.user.phone,
    });
  }

  private clearSession(): void {
    this.session.set(null);
    writeStorage<AuthSession | null>(this.storageKey, null);
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
