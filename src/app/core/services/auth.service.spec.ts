import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OPS_APP_VERSION } from '../api/ops-client.constants';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { AccountApiService } from './account-api.service';
import { AuthService } from './auth.service';
import { TranslationService } from './translation.service';
import { UserService } from './user.service';
import { WindowSessionService } from './window-session.service';
import { WalletService } from './wallet.service';
import { VehicleService } from './vehicle.service';
import { ParkingTicketStoreService } from './parking-ticket-store.service';
import { PaymentChallengeService } from './payment-challenge.service';

const activeWindowKey = (): string | null => Object.keys(localStorage).find((key) => key.startsWith('urbanoa.auth.active-window.')) ?? null;

describe('AuthService', () => {
  let service: AuthService;
  let opsApi: jasmine.SpyObj<OpsApiClient>;
  let opsSession: jasmine.SpyObj<OpsSessionService>;
  let userService: jasmine.SpyObj<UserService>;
  let currentLanguage: 'es' | 'eu' | 'fr' | 'uk';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('urbanoa.auth.session', JSON.stringify({ token: 'previous-token', user: { email: 'old@example.com' } }));
    localStorage.setItem('urbanoa.auth.user', JSON.stringify({ token: 'previous-token' }));
    sessionStorage.setItem('urbanoa.auth.session', JSON.stringify({ token: 'previous-token' }));
    currentLanguage = 'es';
    opsApi = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    opsSession = jasmine.createSpyObj<OpsSessionService>('OpsSessionService', ['token', 'setToken', 'clear']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['updateLocal']);
    opsSession.token.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuthService,
        { provide: OpsApiClient, useValue: opsApi },
        { provide: OpsSessionService, useValue: opsSession },
        { provide: UserService, useValue: userService },
        { provide: AccountApiService, useValue: jasmine.createSpyObj('AccountApiService', ['cancelAccount']) },
        { provide: TranslationService, useValue: { currentLang$: () => currentLanguage, translate: (key: string) => key } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', { navigate: Promise.resolve(true) }) },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  for (const [webLanguage, opsLanguage] of [
    ['es', 'es'],
    ['eu', 'eu'],
    ['fr', 'fr'],
    ['uk', 'en'],
  ] as const) {
    it(`sends ${opsLanguage} to LoginUserAPI when the web language is ${webLanguage}`, async () => {
      currentLanguage = webLanguage;
      opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 0 });
      opsApi.get.and.resolveTo({ contractId: '42', email: 'user@example.com' });

      await service.login('user@example.com', 'secret');

      expect(opsApi.post).toHaveBeenCalledOnceWith(
        OPS_ENDPOINTS.auth.login,
        jasmine.objectContaining({ language: opsLanguage }),
        jasmine.any(Object),
      );
    });
  }

  it('uses the Postman login contract and hydrates the profile with the returned token', async () => {
    opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 1 });
    opsApi.get.and.resolveTo({
      contractId: '42',
      email: 'user@example.com',
      names: 'Ada',
      firstSurname: 'Lovelace',
      secondSurname: '',
      nif: '12345678A',
      mainMobilePhone: '600000000',
      userName: 'user@example.com',
    });

    const user = await service.login(' user@example.com ', 'secret');

    expect(opsApi.post).toHaveBeenCalledOnceWith(
      OPS_ENDPOINTS.auth.login,
      {
        userName: 'user@example.com',
        password: 'secret',
        cloudToken: jasmine.any(String),
        operatingSystem: 3,
        appVersion: OPS_APP_VERSION,
        language: 'es',
      },
      { headers: { 'Accept-Language': 'es-ES' } },
    );
    const loginBody = opsApi.post.calls.mostRecent().args[1] as { cloudToken: string };
    expect(loginBody.cloudToken.length).toBeGreaterThan(0);
    expect(opsApi.get).toHaveBeenCalledOnceWith(OPS_ENDPOINTS.user.query, {
      token: 'real-token',
      headers: { 'Accept-Language': 'es-ES' },
    });
    expect(opsSession.setToken).toHaveBeenCalledWith('real-token');
    expect(user).toEqual(jasmine.objectContaining({ id: '42', name: 'Ada', surname: 'Lovelace', firstLogin: true }));
    expect(service.currentSession()?.token).toBe('real-token');
    expect(localStorage.getItem('urbanoa.auth.session')).toBeNull();
    expect(localStorage.getItem('urbanoa.auth.user')).toBeNull();
    expect(sessionStorage.getItem('urbanoa.auth.session')).toBeNull();
  });

  it('starts unauthenticated and deletes persisted credentials from the previous version', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBe('');
    expect(localStorage.getItem('urbanoa.auth.session')).toBeNull();
    expect(localStorage.getItem('urbanoa.auth.user')).toBeNull();
    expect(sessionStorage.getItem('urbanoa.auth.session')).toBeNull();
  });

  it('allows a second login in the same window after logout', async () => {
    opsApi.post.and.resolveTo({ token: 'first-token', firstLogin: 0 });
    opsApi.get.and.resolveTo({ contractId: '42', email: 'user@example.com' });
    await service.login('user@example.com', 'secret');
    const firstKey = activeWindowKey();
    const firstMarker = firstKey ? localStorage.getItem(firstKey) : null;

    await service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(activeWindowKey()).toBeNull();

    opsApi.post.and.resolveTo({ token: 'second-token', firstLogin: 0 });
    await service.login('user@example.com', 'secret');

    expect(service.token()).toBe('second-token');
    expect(service.ensureActiveSession()).toBeTrue();
    const secondKey = activeWindowKey();
    expect(secondKey).not.toBeNull();
    expect(localStorage.getItem(secondKey!)).not.toBe(firstMarker);
    expect(opsApi.get).toHaveBeenCalledTimes(2);
  });

  it('rejects a successful backend login before querying the profile if window activation fails', async () => {
    opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 0 });
    spyOn(TestBed.inject(WindowSessionService), 'activate').and.throwError('Window activation unavailable');

    await expectAsync(service.login('user@example.com', 'secret')).toBeRejectedWithError('Window activation unavailable');

    expect(opsApi.get).not.toHaveBeenCalled();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('purges legacy business data while retaining language and location preferences', async () => {
    const keys = [
      'urbanoa.wallet.balance',
      'urbanoa.wallet.movements',
      'urbanoa.payment-cards',
      'urbanoa.default-payment-card',
      'urbanoa.vehicles',
      'urbanoa.parking.active-tickets',
    ];
    keys.forEach((key) => localStorage.setItem(key, 'private-data'));
    localStorage.setItem('urbanoa.location-settings.user', 'preference');
    localStorage.setItem('unrelated-preference', 'keep');
    service.adoptToken('first-token', 'first@example.com');
    keys.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    const wallet = TestBed.inject(WalletService);
    const vehicles = TestBed.inject(VehicleService);
    const tickets = TestBed.inject(ParkingTicketStoreService);
    wallet.credit(10, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
    wallet.cards.set([{ id: '1', brand: 'Visa', last4: '1234', expiryDate: '12/30', cardholderName: 'First' }]);
    wallet.defaultCardId.set('1');
    tickets.save({ plate: 'ABC', ticketId: 10 });
    service.adoptToken('second-token', 'second@example.com');
    expect(wallet.balance()).toBe(0);
    expect(wallet.movements()).toEqual([]);
    expect(wallet.cards()).toEqual([]);
    expect(wallet.defaultCardId()).toBe('');
    expect(vehicles.vehicles()).toEqual([]);
    expect(tickets.getByPlate('ABC')).toBeUndefined();
    tickets.save({ plate: 'ABC', ticketId: 20 });
    await service.logout();
    expect(tickets.getByPlate('ABC')).toBeUndefined();
    expect(localStorage.getItem('urbanoa.location-settings.user')).toBe('preference');
    expect(localStorage.getItem('unrelated-preference')).toBe('keep');
  });

  it('invalidates the authenticated window when another window claims ownership', () => {
    service.adoptToken('real-token', 'user@example.com');
    const key = activeWindowKey()!;
    localStorage.setItem(key, 'other-window');
    window.dispatchEvent(new StorageEvent('storage', { key }));

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBe('');
    expect(opsSession.clear).toHaveBeenCalled();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { sessionExpired: '1' } });
    expect(localStorage.getItem(key)).toBe('other-window');
  });

  it('does not restore authentication after leaving the page and returning via browser history', () => {
    service.adoptToken('real-token', 'user@example.com');
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

    expect(service.isAuthenticated()).toBeFalse();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { sessionExpired: '1' } });
  });

  it('restores the current tab on reload before checking authenticated routes', () => {
    service.adoptToken('reload-token', 'user@example.com');
    const owner = localStorage.getItem(activeWindowKey()!);
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    spyOn(performance, 'getEntriesByType').and.returnValue([{ type: 'reload' } as PerformanceNavigationTiming]);
    const refreshed = TestBed.runInInjectionContext(() => new AuthService());
    expect(refreshed.token()).toBe('reload-token');
    expect(refreshed.ensureActiveSession()).toBeTrue();
    expect(localStorage.getItem(activeWindowKey()!)).toBe(owner);
    expect(opsSession.setToken).toHaveBeenCalledWith('reload-token');
    expect(sessionStorage.getItem('urbanoa.auth.reload-resume')).toBeNull();
  });

  it('rejects reload after another window claims the account', () => {
    service.adoptToken('reload-token', 'user@example.com');
    const key = activeWindowKey()!;
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    localStorage.setItem(key, 'another-window');
    spyOn(performance, 'getEntriesByType').and.returnValue([{ type: 'reload' } as PerformanceNavigationTiming]);
    const refreshed = TestBed.runInInjectionContext(() => new AuthService());
    expect(refreshed.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(key)).toBe('another-window');
  });

  it('discards the reload continuation on ordinary navigation', () => {
    service.adoptToken('reload-token', 'user@example.com');
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    spyOn(performance, 'getEntriesByType').and.returnValue([{ type: 'navigate' } as PerformanceNavigationTiming]);
    const opened = TestBed.runInInjectionContext(() => new AuthService());
    expect(opened.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem('urbanoa.auth.reload-resume')).toBeNull();
  });

  it('does not resume after logout even when the next document is a reload', async () => {
    service.adoptToken('reload-token', 'user@example.com');
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    await service.logout();
    spyOn(performance, 'getEntriesByType').and.returnValue([{ type: 'reload' } as PerformanceNavigationTiming]);
    const refreshed = TestBed.runInInjectionContext(() => new AuthService());
    expect(refreshed.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem('urbanoa.auth.reload-resume')).toBeNull();
  });

  it('rejects malformed or expired reload continuations', () => {
    service.adoptToken('reload-token', 'user@example.com');
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    const saved = JSON.parse(sessionStorage.getItem('urbanoa.auth.reload-resume')!);
    saved.savedAt = Date.now() - 61_000;
    sessionStorage.setItem('urbanoa.auth.reload-resume', JSON.stringify(saved));
    spyOn(performance, 'getEntriesByType').and.returnValue([{ type: 'reload' } as PerformanceNavigationTiming]);
    expect(TestBed.runInInjectionContext(() => new AuthService()).isAuthenticated()).toBeFalse();
    sessionStorage.setItem('urbanoa.auth.reload-resume', '{broken');
    expect(TestBed.runInInjectionContext(() => new AuthService()).isAuthenticated()).toBeFalse();
  });

  it('keeps the session for a prepared Paycomet round trip and consumes its continuation on history return', () => {
    service.adoptToken('payment-token', 'user@example.com');
    TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1, order: 'order' });
    service.preparePaymentRedirect('https://api.paycomet.com/gateway/sca_challenge.php');
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    expect(service.isAuthenticated()).toBeTrue();
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(service.token()).toBe('payment-token');
    expect(service.ensureActiveSession()).toBeTrue();
    expect(sessionStorage.getItem('urbanoa.auth.paycomet-resume')).toBeNull();
    expect(localStorage.getItem('urbanoa.auth.session')).toBeNull();
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('does not restore a payment session after logout or after another window signs in', async () => {
    service.adoptToken('payment-token', 'user@example.com');
    TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1 });
    service.preparePaymentRedirect('https://api.paycomet.com/gateway/sca_challenge.php');
    await service.logout();
    expect(sessionStorage.getItem('urbanoa.auth.paycomet-resume')).toBeNull();
    expect(TestBed.inject(PaymentChallengeService).getPending()).toBeNull();
    service.adoptToken('payment-token', 'user@example.com');
    TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1 });
    service.preparePaymentRedirect('https://api.paycomet.com/gateway/sca_challenge.php');
    const key = activeWindowKey()!;
    localStorage.setItem(key, 'another-owner');
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('rejects an expired payment continuation and a new document loaded outside a payment return', () => {
    service.adoptToken('payment-token', 'user@example.com');
    TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1 });
    service.preparePaymentRedirect('https://api.paycomet.com/gateway/sca_challenge.php');
    const saved = JSON.parse(sessionStorage.getItem('urbanoa.paycomet.pending-payment-v1')!);
    saved.startedAt = Date.now() - 31 * 60_000;
    sessionStorage.setItem('urbanoa.paycomet.pending-payment-v1', JSON.stringify(saved));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(service.isAuthenticated()).toBeFalse();
    service.adoptToken('payment-token', 'user@example.com');
    TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1 });
    service.preparePaymentRedirect('https://api.paycomet.com/gateway/sca_challenge.php');
    spyOn(performance, 'getEntriesByType').and.returnValue([]);
    const refreshed = TestBed.runInInjectionContext(() => new AuthService());
    expect(refreshed.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem('urbanoa.auth.paycomet-resume')).toBeNull();
  });

  it('only prepares a continuation for an active session, pending challenge and HTTPS Paycomet destination', () => {
    service.adoptToken('payment-token', 'user@example.com');
    expect(() => service.preparePaymentRedirect('https://api.paycomet.com/gateway')).toThrow();
    TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1 });
    expect(() => service.preparePaymentRedirect('https://paycomet.com.attacker.example/gateway')).toThrow();
    expect(() => service.preparePaymentRedirect('http://api.paycomet.com/gateway')).toThrow();
    expect(sessionStorage.getItem('urbanoa.auth.paycomet-resume')).toBeNull();
  });

  it('restores a new document at the web payment callback only once', () => {
    const originalUrl = location.href;
    try {
      service.adoptToken('payment-token', 'user@example.com');
      TestBed.inject(PaymentChallengeService).beginRecharge({ amount: 1 });
      service.preparePaymentRedirect('https://api.paycomet.com/gateway/sca_challenge.php');
      const key = activeWindowKey()!;
      const owner = localStorage.getItem(key);
      history.replaceState(null, '', '/ok?ret=0');
      const returned = TestBed.runInInjectionContext(() => new AuthService());
      expect(returned.token()).toBe('payment-token');
      expect(returned.ensureActiveSession()).toBeTrue();
      expect(localStorage.getItem(key)).toBe(owner);
      const refreshed = TestBed.runInInjectionContext(() => new AuthService());
      expect(refreshed.isAuthenticated()).toBeFalse();
    } finally {
      history.replaceState(null, '', originalUrl);
    }
  });

  it('does not resurrect a login whose profile finishes after the window lost ownership', async () => {
    opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 0 });
    let finishProfile!: (value: object) => void;
    opsApi.get.and.returnValue(
      new Promise((resolve) => {
        finishProfile = resolve;
      }),
    );
    const login = service.login('user@example.com', 'secret');
    await Promise.resolve();
    const key = activeWindowKey()!;
    localStorage.setItem(key, 'other-window');
    window.dispatchEvent(new StorageEvent('storage', { key }));
    finishProfile({ email: 'user@example.com' });

    await expectAsync(login).toBeRejectedWithError('Login cancelled');
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('checks ownership again before admitting an authenticated route', () => {
    service.adoptToken('real-token', 'user@example.com');
    TestBed.inject(WindowSessionService).release();
    expect(service.ensureActiveSession()).toBeFalse();
  });

  it('keeps a valid OPS session when QueryUserAPI fails', async () => {
    opsApi.post.and.resolveTo({ token: 'real-token', firstLogin: 0 });
    opsApi.get.and.rejectWith(new Error('profile unavailable'));

    await service.login({ email: 'user@example.com', password: 'secret' });

    expect(service.token()).toBe('real-token');
    expect(service.source()).toBe('remote');
    expect(opsSession.setToken).toHaveBeenCalledWith('real-token');
  });

  it('registers plates as APK plate objects for the merged form payload', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.register({ email: ' user@example.com ', password: 'secret', plates: [' 1234 abc '] });

    expect(opsApi.post).toHaveBeenCalledOnceWith(
      OPS_ENDPOINTS.auth.register,
      { contractId: 0, email: 'user@example.com', password: 'secret', plates: [{ plate: '1234 ABC' }] },
      { headers: { 'Accept-Language': 'es-ES' } },
    );
  });

  it('uses the complete Swagger recovery contract', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.requestPasswordReset(' user@example.com ');
    await service.verifyResetCode('user@example.com', ' 123456 ');
    await service.changeResetPassword(' user@example.com ', ' 123456 ', 'new-secret');

    expect(opsApi.post.calls.argsFor(0)).toEqual([
      OPS_ENDPOINTS.auth.recoverPassword,
      { contractId: 0, userName: 'user@example.com', email: 'user@example.com' },
      { headers: { 'Accept-Language': 'es-ES' } },
    ]);
    expect(opsApi.post.calls.argsFor(1)).toEqual([
      OPS_ENDPOINTS.auth.verifyRecoveryPassword,
      { contractId: 0, userName: 'user@example.com', email: 'user@example.com', recode: '123456' },
      { headers: { 'Accept-Language': 'es-ES' } },
    ]);
    expect(opsApi.post.calls.argsFor(2)).toEqual([
      OPS_ENDPOINTS.user.changePassword,
      {
        contractId: 0,
        userName: 'user@example.com',
        email: 'user@example.com',
        password: 'new-secret',
        recode: '123456',
      },
      { headers: { 'Accept-Language': 'es-ES' } },
    ]);
    expect(opsApi.post).toHaveBeenCalledTimes(3);
  });

  it('matches both Postman ResendMailAPI bodies', async () => {
    opsApi.post.and.resolveTo('ok');

    await service.resendMail(' user@example.com ', 'register');
    await service.resendMail(' user@example.com ', 'recover');

    expect(opsApi.post.calls.argsFor(0)[1]).toEqual({
      contractId: 0,
      userName: 'user@example.com',
      email: 'user@example.com',
      type: 'register',
    });
    expect(opsApi.post.calls.argsFor(1)[1]).toEqual({
      contractId: 0,
      userName: 'user@example.com',
      email: 'user@example.com',
      type: 'recover',
    });
  });

  it('preserves auth-service error handling when LoginUserAPI fails', async () => {
    opsApi.post.and.rejectWith(new Error('backend unavailable'));

    await expectAsync(service.login('user@example.com', 'secret')).toBeRejectedWithError('backend unavailable');

    expect(service.token()).toBe('');
    expect(service.source()).toBe('error');
    expect(opsApi.get).not.toHaveBeenCalled();
  });
});
