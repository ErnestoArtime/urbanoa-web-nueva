import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OPS_ENDPOINTS } from '../../../core/api/ops-endpoints';
import { OpsSessionService } from '../../../core/api/ops-session.service';
import { CitiesService } from '../../../core/services/cities.service';
import { UserService } from '../../../core/services/user.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AccountSupportFormComponent } from '../support-form/support-form.component';
import { AccountSupportSuccessComponent } from '../support-success/support-success.component';
import { AccountSupportComponent } from './support.component';

describe('Support creation return flow', () => {
  it('returns from confirmation to the conversation list even when the next query has not included the confirmed creation', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.callFake(
      (endpoint) => Promise.resolve(endpoint === OPS_ENDPOINTS.support.add ? '123' : { feedback: [] }) as Promise<never>,
    );
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'app/account/support', component: AccountSupportComponent },
          { path: 'app/account/support/new', component: AccountSupportFormComponent },
          { path: 'app/account/support-success', component: AccountSupportSuccessComponent },
        ]),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'token' } },
        {
          provide: CitiesService,
          useValue: {
            getCities: async () => ({ data: [{ id: 'durango', contractId: 1, nombre: 'Durango' }] }),
            contractIdFor: () => 1,
          },
        },
        { provide: UserService, useValue: { user: signal({ email: 'user@example.com' }) } },
        { provide: VehicleService, useValue: { vehicles: signal([]), load: async () => undefined, mainVehicle: () => undefined } },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    });
    TestBed.overrideComponent(AccountSupportFormComponent, { set: { template: '' } });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/app/account/support', AccountSupportComponent);
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('.support-empty')).not.toBeNull();

    const form = await harness.navigateByUrl('/app/account/support/new', AccountSupportFormComponent);
    await harness.fixture.whenStable();
    form.form.patchValue({ type: 'incident', subtype: 'app', cityId: 'durango', message: 'Nueva conversación' });
    await form.submit();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/app/account/support-success');
    (harness.routeNativeElement?.querySelector('button') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/app/account/support');
    expect(harness.routeNativeElement?.querySelector('.support-empty')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('.thread-card')?.textContent).toContain('Nueva conversación');
  });
});
