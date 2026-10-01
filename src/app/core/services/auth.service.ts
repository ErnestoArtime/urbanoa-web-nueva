import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OpsLoginRequest, OpsLoginResponse, OpsRegisterRequest, OpsUserResponse } from '../api/ops-auth.types';
import { OpsApiClient } from '../api/ops-api-client.service';
import { getOpsCloudToken, OPS_APP_VERSION, OPS_PARKING_SESSION_OPERATING_SYSTEM } from '../api/ops-client.constants';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { AccountApiService } from './account-api.service';
import { TranslationService } from './translation.service';
import { UserData, UserService } from './user.service';
import { LocationSettingsService } from './location-settings.service';
import { WindowSessionService } from './window-session.service';
import { WalletService } from './wallet.service';
import { VehicleService } from './vehicle.service';
import { ParkingTicketStoreService } from './parking-ticket-store.service';

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
    country: '',
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
  private readonly locationSettings = inject(LocationSettingsService);
  private readonly windowSession = inject(WindowSessionService);
  private readonly wallet = inject(WalletService);
  private readonly vehicles = inject(VehicleService);
  private readonly ticketStore = inject(ParkingTicketStoreService);
  private readonly storageKey = 'urbanoa.auth.session';
  private readonly legacyStorageKey = 'urbanoa.auth.user';
  private readonly session = signal<AuthSession | null>(null);
  private loginAttempt = 0;

  readonly currentSession = this.session.asReadonly();
  readonly token = computed(() => this.session()?.token ?? '');
  readonly user = computed(() => this.session()?.user ?? EMPTY_USER);
  readonly isAuthenticated = computed(() => Boolean(this.token()));
  readonly source = signal<'idle' | 'remote' | 'error'>(this.token() ? 'remote' : 'idle');

  constructor() {
    this.removeStoredCredentials();
    this.clearBusinessData();
    this.syncOpsSession('');
    this.locationSettings.setUserScope();
    window.addEventListener('urbanoa:session-expired', this.handleSessionExpired);
    const pageHide = () => this.clearSession();
    const pageShow = (event: PageTransitionEvent) => {
      if (event.persisted) this.handleSessionExpired();
    };
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('pageshow', pageShow);
    const unsubscribe = this.windowSession.onInvalidated(this.handleSessionExpired);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('urbanoa:session-expired', this.handleSessionExpired);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', pageShow);
      unsubscribe();
      this.clearSession();
    });
  }

  private readonly handleSessionExpired = (): void => {
    this.clearSession();
    void this.router.navigate(['/auth/login'], { queryParams: { sessionExpired: '1' } });
  };

  ensureActiveSession(): boolean {
    return this.isAuthenticated() && this.windowSession.ensureActive();
  }

  async login(input: LoginInput): Promise<AuthUser>;
  async login(email: string, password: string): Promise<AuthUser>;
  async login(inputOrEmail: LoginInput | string, password = ''): Promise<AuthUser> {
    const input = typeof inputOrEmail === 'string' ? { email: inputOrEmail, password } : inputOrEmail;
    const email = input.email.trim();
    const attempt = ++this.loginAttempt;

    try {
      const response = await this.opsApi.post<OpsLoginResponse>(OPS_ENDPOINTS.auth.login, this.loginRequest(email, input.password), {
        headers: this.languageHeaders(),
      });
      if (!response.token?.trim()) throw new Error('LoginUserAPI no devolvió token');
      if (attempt !== this.loginAttempt) throw new Error('Login cancelled');
      this.windowSession.activate();
      this.syncOpsSession(response.token);

      // QueryUserAPI is secondary: a profile failure must not discard a
      // valid login token needed by every other OPS request.
      const user = await this.loadAuthenticatedUser(email, response);
      if (attempt !== this.loginAttempt || !this.windowSession.ensureActive()) throw new Error('Login cancelled');
      this.storeSession({ token: response.token, refreshToken: '', user });
      return user;
    } catch (error) {
      if (attempt === this.loginAttempt) this.clearSession();
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
    const body = { contractId: 0, userName: normalizedEmail, email: normalizedEmail, type };

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
    this.windowSession.activate();
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
      cloudToken: getOpsCloudToken(),
      operatingSystem: OPS_PARKING_SESSION_OPERATING_SYSTEM,
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
          country: profile.addressCountry || '',
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
    this.clearBusinessData();
    this.ticketStore.setUserScope(session.user.email);
    this.session.set(session);
    this.syncOpsSession(session.token);
    this.locationSettings.setUserScope(this.userIdentity(session.user));
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
    this.loginAttempt++;
    this.session.set(null);
    this.windowSession.release();
    this.removeStoredCredentials();
    this.clearBusinessData();
    this.syncOpsSession('');
    this.locationSettings.setUserScope();
    this.source.set('idle');
  }

  private clearBusinessData(): void {
    this.wallet.reset();
    this.vehicles.reset();
    this.ticketStore.setUserScope();
    const keys = [
      'urbanoa.wallet.balance', 'urbanoa.wallet.movements',
      'urbanoa.payment-cards', 'urbanoa.default-payment-card',
      'urbanoa.vehicles', 'urbanoa.parking.active-tickets',
    ];
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Restricted storage must not prevent clearing in-memory account data.
      }
    }
  }

  private removeStoredCredentials(): void {
    for (const storage of [() => localStorage, () => sessionStorage]) {
      try {
        storage().removeItem(this.storageKey);
        storage().removeItem(this.legacyStorageKey);
      } catch {
        // Restricted storage does not allow restoring a session either.
      }
    }
  }

  private syncOpsSession(token: string): void {
    if (token) this.opsSession.setToken(token);
    else this.opsSession.clear();
  }

  private userIdentity(user: Pick<AuthUser, 'id' | 'email'>): string {
    return user.id.trim() || user.email.trim();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Error desconocido';
  }
}
