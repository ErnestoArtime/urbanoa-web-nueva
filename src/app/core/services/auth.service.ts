import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { AccountApiService } from './account-api.service';

export interface AuthUser {
  id?: number | string;
  email: string;
  name?: string;
  surname?: string;
  token?: string;
  refreshToken?: string;
}

export interface LoginInput { email: string; password: string; }
export interface RegisterInput { plate: string; email: string; password: string; foreignPlate: boolean; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AppApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly router = inject(Router);
  private readonly accountApi = inject(AccountApiService);
  private readonly userState = signal<AuthUser>(this.readUser());
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.session.token()));
  readonly source = signal<'remote' | 'mock'>('mock');

  async login(input: LoginInput): Promise<AuthUser> {
    try {
      const response = await this.api.post<AuthUser>('/auth/login', input);
      const user = this.normalize(response, input.email);
      this.save(user);
      return user;
    } catch (error) {
      console.warn('[API] Login usa fallback mock', this.api.errorMessage(error));
      const user = { email: input.email.trim(), name: 'Usuario', surname: 'Demo', token: `mock-${Date.now()}` };
      this.source.set('mock');
      this.save(user);
      return user;
    }
  }

  async register(input: RegisterInput): Promise<void> {
    try { await this.api.post('/auth/register', input); this.source.set('remote'); }
    catch (error) { console.warn('[API] Registro usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  async confirmRegister(email: string, code: string, password: string): Promise<void> {
    try { await this.api.post('/auth/register/confirm', { email, code, password }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Confirmación usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try { await this.api.post('/auth/password/reset', { email }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Reset usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  async verifyResetCode(email: string, code: string): Promise<void> {
    try { await this.api.post('/auth/password/verify-code', { email, code }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Verificación usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  async changeResetPassword(email: string, code: string, password: string): Promise<void> {
    try { await this.api.post('/auth/password/change', { email, code, password }); this.source.set('remote'); }
    catch (error) { console.warn('[API] Cambio de password usa fallback mock', this.api.errorMessage(error)); this.source.set('mock'); }
  }

  async logout(): Promise<void> { this.session.clear(); this.userState.set({ email: '' }); localStorage.removeItem('urbanoa.auth.user'); await this.router.navigate(['/auth/login']); }
  async cancelAccount(): Promise<void> { await this.accountApi.cancelAccount(); await this.logout(); }

  private normalize(value: AuthUser, email: string): AuthUser {
    const token = value.token ?? (value as AuthUser & { accessToken?: string }).accessToken;
    if (!token) throw new Error('Login sin token');
    return { ...value, email: value.email || email, token };
  }

  private save(user: AuthUser): void {
    if (user.token) this.session.setToken(user.token);
    this.userState.set(user); this.source.set(user.token?.startsWith('mock-') ? 'mock' : 'remote');
    try { localStorage.setItem('urbanoa.auth.user', JSON.stringify(user)); } catch { /* demo remains in memory */ }
  }

  private readUser(): AuthUser { try { return JSON.parse(localStorage.getItem('urbanoa.auth.user') ?? '{"email":""}') as AuthUser; } catch { return { email: '' }; } }
}
