import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom, take } from 'rxjs';
import { routes } from '../../app.routes';
import { OpsApiClient } from '../../core/api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../../core/api/ops-endpoints';
import { OpsSessionService } from '../../core/api/ops-session.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardApiService } from '../../core/services/dashboard-api.service';
import { TranslationService } from '../../core/services/translation.service';

describe('Home navigation to actual feature routes', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    const responses = new Map<string, unknown>([
      [OPS_ENDPOINTS.user.query, { names: 'Navigation', firstSurname: 'Test', email: 'navigation@example.test' }],
      [OPS_ENDPOINTS.user.plates, { plates: [{ plate: '1234ABC', favorite: 1 }] }],
      [OPS_ENDPOINTS.user.operations, [{ operationNumber: 123, operationType: 7, paymentAmount: 100, opDate: '120000201026' }]],
      [OPS_ENDPOINTS.wallet.credit, 2000],
      [OPS_ENDPOINTS.wallet.paymentMethods, { payMethods: [] }],
      [OPS_ENDPOINTS.parking.contracts, { contractlist: [] }],
    ]);
    const read = (endpoint: string) => Promise.resolve(responses.get(endpoint) ?? {});
    // Retain the production child routes, layouts and components. Only omit the
    // outer app chrome and replace authentication/network responses.
    const appRoute = routes.find((route) => route.path === 'app')!;
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'app', children: appRoute.children }, ...routes.filter((route) => route.path === 'onboarding')]),
        { provide: AuthService, useValue: { ensureActiveSession: () => true } },
        {
          provide: OpsApiClient,
          useValue: { get: read, getOrNull: read, post: read, postOrNull: read, serverNow: () => new Date(2026, 9, 20, 12) },
        },
        {
          provide: TranslationService,
          useValue: { translate: (key: string) => key, translateLabel: (value: string) => value, currentLang$: () => 'es' },
        },
      ],
    }).compileComponents();
    TestBed.inject(OpsSessionService).setToken('navigation-test');
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create('/app/home');
    await TestBed.inject(DashboardApiService).load();
    await harness.fixture.whenStable();
    harness.detectChanges();
  });

  async function click(selector: string, target: string, contentSelector: string): Promise<void> {
    const element = harness.routeNativeElement!.querySelector<HTMLElement>(selector);
    expect(element).withContext(selector).not.toBeNull();
    const navigation = firstValueFrom(
      router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1),
      ),
    );
    element!.click();
    await navigation;
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe(target);
    expect(harness.routeNativeElement!.querySelector(contentSelector)).withContext(target).not.toBeNull();
  }

  it('opens the vehicle list from its summary', async () => {
    await click('.manage-vehicles', '/app/account/vehicles', '.vehicles-list');
  });

  it('opens the profile form from account completion', async () => {
    await click('a[href="/app/account/profile"]', '/app/account/profile', 'form input[formControlName="name"]');
  });

  it('opens location setup from account completion', async () => {
    await click('a[href="/onboarding/location"]', '/onboarding/location', 'app-onboarding-location .location-page');
  });

  it('opens a recent operation and renders its details', async () => {
    await click('app-recent-operations-card a.list-item', '/app/operations/detail/123', '.operation-detail-page');
  });

  it('opens all operations and then an operation from the history', async () => {
    await click('.view-all-link', '/app/operations', '.history-list');
    await click('.history-list a.list-item', '/app/operations/detail/123', '.operation-detail-page');
  });
});
