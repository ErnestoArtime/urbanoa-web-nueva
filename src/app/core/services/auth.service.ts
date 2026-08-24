import { computed, inject, Injectable, signal } from '@angular/core';
import { OpsSessionService } from '../api/ops-session.service';
import { ApiError, getJson, postJson } from '../http/api-client';
import { readStorage, writeStorage } from '../storage/signal-storage';
import { TranslationService } from './translation.service';
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
    await this.loadUserProfile();
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
      user: { id: '', ...this.emptyProfileUser(email) },
    });
  }

  async cancelAccount(): Promise<void> {
    await getJson('/CancelUserAccountAPI', { token: this.token() });
    this.clearSession();
  }

  logout(): void {
    this.clearSession();
  }

  private storeSession(session: AuthSession): void {
    this.session.set(session);
    writeStorage(this.storageKey, session);
    this.syncOpsSession(session.token);
    this.userService.updateLocal({
      name: session.user.name,
      surname: session.user.surname,
      secondSurname: session.user.secondSurname,
      email: session.user.email,
      nif: session.user.nif,
      phone: session.user.phone,
      address: session.user.address,
    });
  }

  private async loadUserProfile(): Promise<void> {
    try {
      await this.userService.load();
    } catch {
      // El perfil se queda con los datos locales si QueryUserAPI no está disponible.
    }
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
        ...this.normalizeProfileUser(rawUser, fallbackEmail),
      },
    };
  }

  private normalizeProfileUser(rawUser: Record<string, unknown>, fallbackEmail: string): Omit<AuthUser, 'id'> {
    return {
      name: this.readString(rawUser['names'] ?? rawUser['name'] ?? rawUser['nombre']),
      surname: this.readString(rawUser['firstSurname'] ?? rawUser['surname'] ?? rawUser['apellidos']),
      secondSurname: this.readString(rawUser['secondSurname']),
      email: this.readString(rawUser['email']) || fallbackEmail,
      nif: this.readString(rawUser['nif']),
      phone: this.readString(rawUser['mainMobilePhone'] ?? rawUser['phone'] ?? rawUser['telefono']),
      address: {
        street: this.readString(rawUser['addressStreetName']),
        number: this.readString(rawUser['addressBuildingNumber']),
        floor: this.readString(rawUser['addressDepartmentFloor']),
        door: this.readString(rawUser['addressDepartmentDoor']),
        stair: this.readString(rawUser['addressDepartmentStair']),
        letter: this.readString(rawUser['addressLetterNumber']),
        city: this.readString(rawUser['addressCity']),
        province: this.readString(rawUser['addressProvince']),
        postalCode: this.readString(rawUser['addressPostalCode']),
        country: this.readString(rawUser['addressCountry']) || 'ESPANA',
      },
    };
  }

  private emptyProfileUser(email: string): Omit<AuthUser, 'id'> {
    return this.normalizeProfileUser({}, email);
  }

  private readString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
