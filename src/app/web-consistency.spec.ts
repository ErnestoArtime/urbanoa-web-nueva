import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OpsApiClient } from './core/api/ops-api-client.service';
import { OpsSessionService } from './core/api/ops-session.service';
import { AuthService, AuthUser } from './core/services/auth.service';
import { WindowSessionService } from './core/services/window-session.service';
import { LocationSettingsService } from './core/services/location-settings.service';
import { UserService } from './core/services/user.service';
import { CitiesService } from './core/services/cities.service';
import { TranslationService } from './core/services/translation.service';
import { WalletService } from './core/services/wallet.service';
import { PaymentAddComponent } from './features/account/payment-add/payment-add.component';
import { AccountNotificationsComponent } from './features/account/notifications/notifications.component';
import { NotificationsService, NotificationPreferences } from './core/services/notifications.service';
import { VehicleService } from './core/services/vehicle.service';
import { RouterTestingHarness } from '@angular/router/testing';
import { AccountSupportDetailComponent } from './features/account/support-detail/support-detail.component';
import { SupportService } from './core/services/support.service';
import { ReportComponent } from './features/operations/report/report.component';
import { OperationsService } from './core/services/operations.service';
import { UnpaidFinesService } from './core/services/unpaid-fines.service';
import { OperationType } from './shared/models/operation-type';
import { AccountProfileComponent } from './features/account/profile/profile.component';

describe('Web consistency regressions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps windows and location preferences independent for accounts with the same contractId', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const prototype = AuthService.prototype as unknown as {
      loadAuthenticatedUser(email: string, login: { token: string; firstLogin: number }): Promise<AuthUser>;
      userIdentity(user: AuthUser): string;
    };
    const context = { opsApi: { get: async () => ({ contractId: 23 }) }, languageHeaders: () => ({}) };
    const firstUser = await prototype.loadAuthenticatedUser.call(context, 'first@example.invalid', { token: 'first', firstLogin: 0 });
    const secondUser = await prototype.loadAuthenticatedUser.call(context, 'second@example.invalid', { token: 'second', firstLogin: 0 });
    const firstIdentity = prototype.userIdentity(firstUser);
    const secondIdentity = prototype.userIdentity(secondUser);
    expect(firstIdentity).not.toBe(secondIdentity);
    expect(firstUser.id).toBe('first@example.invalid');
    const firstWindow = TestBed.runInInjectionContext(() => new WindowSessionService());
    const secondWindow = TestBed.runInInjectionContext(() => new WindowSessionService());
    firstWindow.activate(firstIdentity);
    secondWindow.activate(secondIdentity);
    expect(firstWindow.ensureActive()).toBeTrue();
    const settings = TestBed.inject(LocationSettingsService);
    settings.setUserScope(firstIdentity);
    settings.setPreferredCity('durango', 'Durango', 23);
    settings.setUserScope(secondIdentity);
    expect(settings.settings().preferredCityId).toBeUndefined();
  });

  it('keeps a successfully saved profile when an older read finishes afterwards', async () => {
    let finishLoad!: (profile: object) => void;
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValue(
      new Promise((resolve) => {
        finishLoad = resolve;
      }),
    );
    api.post.and.resolveTo('ok');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    TestBed.inject(OpsSessionService).setToken('token');
    const service = TestBed.inject(UserService);
    service.updateLocal({ name: 'Antiguo', email: 'first@example.invalid' });
    const pending = service.load();
    expect((await service.save({ name: 'Nuevo' })).success).toBeTrue();
    expect(service.user().name).toBe('Nuevo');
    finishLoad({ names: 'Antiguo' });
    await pending;
    expect(service.user().name).toBe('Nuevo');
  });

  it('keeps a confirmed new vehicle when an older read finishes afterwards', async () => {
    let finishLoad!: (value: object) => void;
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['getOrNull', 'post']);
    api.getOrNull.and.returnValue(
      new Promise((resolve) => {
        finishLoad = resolve;
      }),
    );
    api.post.and.resolveTo('ok');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    TestBed.inject(OpsSessionService).setToken('token');
    const service = TestBed.inject(VehicleService);
    const pending = service.load();
    expect((await service.add({ plate: '1234ABC', isDefault: false })).success).toBeTrue();
    expect(service.vehicles().length).toBe(1);
    finishLoad({ plates: [] });
    await pending;
    expect(service.vehicles().length).toBe(1);
    expect(service.vehicles()[0].id).toBe('1234ABC');
  });

  it('keeps available municipalities and exposes failed contract ids for a partial load', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({
      contractlist: [
        { contractId: 1, description1: 'Municipio disponible' },
        { contractId: 2, description1: 'Municipio con error' },
      ],
    });
    api.post.and.callFake((_endpoint, body) =>
      Number((body as { contractId: number }).contractId) === 1
        ? (Promise.resolve({ streetsFulllist: [{ zone: 1, zoneDesc: 'Azul' }] }) as Promise<never>)
        : Promise.reject(new Error('Municipio 2 no disponible')),
    );
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    const service = TestBed.inject(CitiesService);
    const result = await service.getCities();
    expect(result.data.map((city) => city.contractId)).toEqual([1]);
    expect(service.failedContractIds()).toEqual([2]);
  });

  it('rejects card-added messages from an unrelated origin and source', async () => {
    const wallet = {
      responseError: () => null,
      loadPaymentMethodForm: async () => '<html></html>',
      load: jasmine.createSpy().and.resolveTo(),
      cards: signal([]),
      source: signal('error'),
    };
    TestBed.configureTestingModule({
      imports: [PaymentAddComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WalletService, useValue: wallet },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    });
    TestBed.overrideComponent(PaymentAddComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(PaymentAddComponent);
    await fixture.whenStable();
    window.dispatchEvent(new MessageEvent('message', { data: 'urbanoa-card-added', origin: 'https://unexpected.example.invalid' }));
    await fixture.whenStable();
    expect(wallet.load).toHaveBeenCalledTimes(1);
    expect(wallet.cards().length).toBe(0);
    expect(fixture.componentInstance.success()).toBeFalse();
  });

  it('prevents saving default notification preferences before the remote load finishes', async () => {
    let finishLoad!: (value: NotificationPreferences) => void;
    const loading = new Promise<NotificationPreferences>((resolve) => {
      finishLoad = resolve;
    });
    const save = jasmine.createSpy('save').and.resolveTo('remote');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: NotificationsService,
          useValue: { load: () => loading, source: signal('remote'), save },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new AccountNotificationsComponent());
    const pending = component.ngOnInit();
    expect(component.loading()).toBeTrue();
    await component.save();
    expect(save).not.toHaveBeenCalled();
    finishLoad({ unparkingNotifications: 1 } as NotificationPreferences);
    await pending;
    expect(component.appNotifications[0].enabled).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(component.loadFailed()).toBeFalse();
  });

  it('selects the internal English catalogue for an English browser', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    spyOnProperty(navigator, 'languages', 'get').and.returnValue(['en-GB']);
    spyOnProperty(navigator, 'language', 'get').and.returnValue('en-GB');
    const service = TestBed.inject(TranslationService) as unknown as { detectBrowserLang(): string | null };
    expect(service.detectBrowserLang()).toBe('uk');
  });

  it('updates the support conversation and marks the selected thread read when its route id changes', async () => {
    const support = {
      getById: (id: string) => ({ id }),
      markAsRead: jasmine.createSpy().and.resolveTo(true),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'support/:id', component: AccountSupportDetailComponent }]),
        { provide: SupportService, useValue: support },
        { provide: TranslationService, useValue: {} },
      ],
    });
    TestBed.overrideComponent(AccountSupportDetailComponent, { set: { template: '' } });
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/support/first', AccountSupportDetailComponent);
    const second = await harness.navigateByUrl('/support/second', AccountSupportDetailComponent);
    expect(second).toBe(first);
    expect(second.thread()?.id).toBe('second');
    expect(support.markAsRead.calls.allArgs()).toEqual([['first'], ['second']]);
  });

  it('queries the whole Madrid calendar day for a one-day custom report', () => {
    const prototype = ReportComponent.prototype as unknown as {
      resolveRange(): { start: Date; end: Date };
      dayBoundary(value: string, endOfDay: boolean): Date;
    };
    const context = {
      customDatesEnabled: () => true,
      fromDate: '14/10/2026',
      toDate: '14/10/2026',
      dayBoundary: prototype.dayBoundary,
    };
    const range = prototype.resolveRange.call(context);
    expect(range.start.toISOString()).toBe('2026-10-13T22:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-10-14T21:59:59.000Z');
  });

  it('keeps the latest operation range when responses arrive out of order', async () => {
    let finishFirst!: (value: object[]) => void;
    let finishSecond!: (value: object[]) => void;
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.returnValues(
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
      new Promise((resolve) => {
        finishSecond = resolve;
      }),
    );
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    TestBed.inject(OpsSessionService).setToken('token');
    const service = TestBed.inject(OperationsService);
    const first = service.load('2026-01-01', '2026-01-31');
    const second = service.load('2026-02-01', '2026-02-28');
    finishSecond([{ operationType: OperationType.TOP_UP, operationNumber: 2, opDate: '120000010226' }]);
    await second;
    finishFirst([{ operationType: OperationType.TOP_UP, operationNumber: 1, opDate: '120000010126' }]);
    await first;
    expect(service.operations()[0].operationNumber).toBe('2');
    expect(service.loading()).toBeFalse();
  });

  it('keeps saved notification preferences when an older read finishes afterwards', async () => {
    let finish!: (value: object) => void;
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.returnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    api.post.and.resolveTo('ok');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    TestBed.inject(OpsSessionService).setToken('token');
    const service = TestBed.inject(NotificationsService);
    const read = service.load();
    const preferences = { ...service.preferences(), unparkingNotifications: 0 };
    expect(await service.save(preferences)).toBe('remote');
    finish({ notifications: { ...preferences, unparkingNotifications: 1 } });
    await read;
    expect(service.preferences().unparkingNotifications).toBe(0);
  });

  it('rejects a fine payment response without a confirmed operation id or challenge', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({ operationId: null, challengeUrl: null });
    const operations = {
      operations: signal([
        {
          id: 'fine',
          type: OperationType.UNPAID_FINES,
          fineStatus: 1,
          plate: '1234ABC',
          date: '14/10/2026',
          amount: -5,
          zone: '',
          contractId: 1,
        },
      ]),
      load: jasmine.createSpy('load'),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OperationsService, useValue: operations },
        { provide: CitiesService, useValue: { nameFor: () => '' } },
        { provide: WalletService, useValue: { balance: () => 5, cards: () => [] } },
      ],
    });
    TestBed.inject(OpsSessionService).setToken('token');
    const result = await TestBed.inject(UnpaidFinesService).payFine('fine');
    expect(result.success).toBeFalse();
    expect(result.error?.kind).toBe('invalid-response');
    expect(operations.load).not.toHaveBeenCalled();
  });

  it('hydrates untouched profile fields from a late load while preserving a dirty field', async () => {
    TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: {} }],
    });
    TestBed.overrideComponent(AccountProfileComponent, { set: { template: '' } });
    const service = TestBed.inject(UserService);
    service.updateLocal({ name: 'Inicial', surname: 'Inicial' });
    const fixture = TestBed.createComponent(AccountProfileComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.controls.name.setValue('Mi borrador');
    fixture.componentInstance.form.controls.name.markAsDirty();
    service.updateLocal({ name: 'Servidor', surname: 'Actualizado' });
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.name.value).toBe('Mi borrador');
    expect(fixture.componentInstance.form.controls.surname.value).toBe('Actualizado');
  });
});
