import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OpsLoginRequest, OpsLoginResponse, OpsRegisterRequest, OpsUserResponse } from '../api/ops-auth.types';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { readStorage, writeStorage } from '../storage/signal-storage';
import { AccountApiService } from './account-api.service';
import { TranslationService } from './translation.service';
import { UserData, UserService } from './user.service';

export interface AuthUser extends UserData {
  id: string;
  firstLogin?: boolean;
  userName?: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  plate: string;
  email: string;
  password: string;
  foreignPlate: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  plates: string[];
  foreignPlate?: boolean;
}

export type ResendMailType = 'register' | 'recover';

const OPS_APP_VERSION = '4.0.0';
const OPS_OPERATING_SYSTEM = 1;
const DEVICE_TOKEN_KEY = 'urbanoa.deviceToken';

function getOrCreateCloudToken(): string {
  try {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID?.() ?? `device-${Date.now()}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return `device-${Date.now()}`;
  }
}
const EMPTY_USER: AuthUser = {
  id: '',
  name: '',
  surname: '',
  secondSurname: '',
  email: '',
  nif: '',
  phone: '',
  address: {
    street: '',
    number: '',
    floor: '',
    door: '',
    stair: '',
    letter: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'ESPANA',
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly opsApi = inject(OpsApiClient);
  private readonly opsSession = inject(OpsSessionService);
  private readonly router = inject(Router);
  private readonly accountApi = inject(AccountApiService);
  private readonly translation = inject(TranslationService);
  private readonly userService = inject(UserService);
  private readonly storageKey = 'urbanoa.auth.session';
  private readonly legacyStorageKey = 'urbanoa.auth.user';
  private readonly session = signal<AuthSession | null>(readStorage<AuthSession | null>(this.storageKey, null));

  readonly currentSession = this.session.asReadonly();
  readonly token = computed(() => this.session()?.token ?? '');
  readonly user = computed(() => this.session()?.user ?? EMPTY_USER);
  readonly isAuthenticated = computed(() => Boolean(this.token()));
  readonly source = signal<'idle' | 'remote' | 'error'>(this.token() ? 'remote' : 'idle');

  constructor() {
    if (this.token().startsWith('mock-')) this.clearSession();
    this.syncOpsSession(this.token());
  }

  async login(input: LoginInput): Promise<AuthUser>;
  async login(email: string, password: string): Promise<AuthUser>;
  async login(inputOrEmail: LoginInput | string, password = ''): Promise<AuthUser> {
    const input = typeof inputOrEmail === 'string' ? { email: inputOrEmail, password } : inputOrEmail;
    const email = input.email.trim();

    try {
      const response = await this.opsApi.post<OpsLoginResponse>(OPS_ENDPOINTS.auth.login, this.loginRequest(email, input.password), {
        headers: this.languageHeaders(),
      });
      if (!response.token?.trim()) throw new Error('LoginUserAPI no devolvió token');

      // QueryUserAPI is secondary: a profile failure must not discard a
      // valid login token needed by every other OPS request.
      const user = await this.loadAuthenticatedUser(email, response);
      this.storeSession({ token: response.token, refreshToken: '', user });
      return user;
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  async register(input: RegisterInput | RegisterPayload): Promise<void> {
    const plate = 'plate' in input ? input.plate : (input.plates[0] ?? '');
    const body: OpsRegisterRequest = {
      contractId: 0,
      email: input.email.trim(),
      password: input.password,
      plates: plate.trim() ? [{ plate: plate.trim().toUpperCase() }] : [],
    };

    try {
      await this.opsApi.post(OPS_ENDPOINTS.auth.register, body, { headers: this.languageHeaders() });
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  async resendMail(email: string, type: ResendMailType): Promise<void> {
    const normalizedEmail = email.trim();
    const body = type === 'register' ? { userName: normalizedEmail, email: normalizedEmail, type } : { email: normalizedEmail, type };

    try {
      await this.opsApi.post(OPS_ENDPOINTS.auth.resendMail, body, { headers: this.languageHeaders() });
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  async resendRegistrationEmail(email: string): Promise<void> {
    await this.resendMail(email, 'register');
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.opsApi.post(
        OPS_ENDPOINTS.auth.recoverPassword,
        { contractId: 0, userName: email.trim(), email: email.trim() },
        { headers: this.languageHeaders() },
      );
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  async verifyResetCode(email: string, code: string): Promise<void> {
    if (!email.trim() || !code.trim()) throw new Error('Correo y código son obligatorios');
    try {
      await this.opsApi.post(
        OPS_ENDPOINTS.auth.verifyRecoveryPassword,
        { contractId: 0, userName: email.trim(), email: email.trim(), recode: code.trim() },
        { headers: this.languageHeaders() },
      );
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  async changeResetPassword(email: string, code: string, password: string): Promise<void> {
    try {
      await this.opsApi.post(
        OPS_ENDPOINTS.user.changePassword,
        { contractId: 0, userName: email.trim(), email: email.trim(), password, recode: code.trim() },
        { headers: this.languageHeaders() },
      );
      this.source.set('remote');
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  adoptToken(token: string, email: string): void {
    this.storeSession({ token, refreshToken: '', user: { ...EMPTY_USER, email } });
  }

  async logout(): Promise<void> {
    this.clearSession();
    await this.router.navigate(['/auth/login']);
  }

  async cancelAccount(): Promise<void> {
    await this.accountApi.cancelAccount();
    this.clearSession();
  }

  private loginRequest(email: string, password: string): OpsLoginRequest {
    return {
      userName: email,
      password,
      cloudToken: getOrCreateCloudToken(),
      operatingSystem: OPS_OPERATING_SYSTEM,
      appVersion: OPS_APP_VERSION,
      language: this.opsLanguage(),
    };
  }

  private async loadAuthenticatedUser(email: string, login: OpsLoginResponse): Promise<AuthUser> {
    try {
      const profile = await this.opsApi.get<OpsUserResponse>(OPS_ENDPOINTS.user.query, {
        token: login.token,
        headers: this.languageHeaders(),
      });
      return {
        id: String(profile.contractId ?? ''),
        email: profile.email || email,
        name: profile.names ?? '',
        surname: profile.firstSurname ?? '',
        secondSurname: profile.secondSurname ?? '',
        nif: profile.nif ?? '',
        phone: profile.mainMobilePhone ?? '',
        address: {
          street: profile.addressStreetName ?? '',
          number: profile.addressBuildingNumber ?? '',
          floor: profile.addressDepartmentFloor ?? '',
          door: profile.addressDepartmentDoor ?? '',
          stair: profile.addressDepartmentStair ?? '',
          letter: profile.addressLetterNumber ?? '',
          city: profile.addressCity ?? '',
          province: profile.addressProvince ?? '',
          postalCode: profile.addressPostalCode ?? '',
          country: profile.addressCountry || 'ESPANA',
        },
        firstLogin: login.firstLogin === 1,
        userName: profile.userName,
      };
    } catch (error) {
      console.warn('[OPS API] No se pudo completar el perfil tras el login; se conserva la sesión', this.errorMessage(error));
      return { ...EMPTY_USER, address: { ...EMPTY_USER.address }, email, firstLogin: login.firstLogin === 1, userName: email };
    }
  }

  private languageHeaders(): Record<string, string> {
    const locale = { es: 'es-ES', eu: 'eu-ES', fr: 'fr-FR', uk: 'en-GB' }[this.translation.currentLang$()];
    return { 'Accept-Language': locale };
  }

  private opsLanguage(): string {
    const language = this.translation.currentLang$();
    return language === 'uk' ? 'en' : language;
  }

  private storeSession(session: AuthSession): void {
    this.session.set(session);
    writeStorage(this.storageKey, session);
    writeStorage(this.legacyStorageKey, { ...session.user, token: session.token });
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
    this.source.set('remote');
  }

  private clearSession(): void {
    this.session.set(null);
    writeStorage<AuthSession | null>(this.storageKey, null);
    try {
      localStorage.removeItem(this.legacyStorageKey);
    } catch {
      // Storage may be unavailable in private or restricted contexts.
    }
    this.syncOpsSession('');
    this.source.set('idle');
  }

  private syncOpsSession(token: string): void {
    if (token) this.opsSession.setToken(token);
    else this.opsSession.clear();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Error desconocido';
  }
}
