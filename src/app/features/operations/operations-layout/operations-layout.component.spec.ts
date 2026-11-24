import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../../core/api/ops-session.service';
import { OperationsService } from '../../../core/services/operations.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { OperationsEmptyComponent } from '../operations-empty/operations-empty.component';
import { UnpaidFinesComponent } from '../unpaid-fines/unpaid-fines.component';
import { OperationsLayoutComponent } from './operations-layout.component';

describe('OperationsLayoutComponent', () => {
  it('loads each date range in place and only shows pending fines from its confirmed results', async () => {
    const fine = { operationNumber: 7, operationType: 104, fineStatus: 1, opDate: '120000221126' };
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'serverNow']);
    api.serverNow.and.returnValue(new Date(2026, 10, 24));
    api.post.and.resolveTo([fine]);
    TestBed.configureTestingModule({
      imports: [OperationsLayoutComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'app/operations', component: OperationsEmptyComponent },
          { path: 'app/operations/unpaid-fines', component: UnpaidFinesComponent },
          { path: 'app/operations/unpaid-fine-detail/:id', component: OperationsEmptyComponent },
        ]),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'test-token' } },
        { provide: VehicleService, useValue: { vehicles: signal([]), load: async () => undefined } },
        { provide: ParkingSessionService, useValue: { activeParkings: signal([]), unparkError: signal(null) } },
        { provide: TranslationService, useValue: { currentLang$: () => 'es', translate: (key: string) => key } },
      ],
    });
    const operations = TestBed.inject(OperationsService);
    await operations.load();

    let finishDefaultRange!: (operations: unknown[]) => void;
    api.post.and.returnValue(new Promise((resolve) => (finishDefaultRange = resolve)));
    const fixture = TestBed.createComponent(OperationsLayoutComponent);
    const view = fixture.nativeElement as HTMLElement;
    const banner = () => view.querySelector('.sanctions-alert');
    const skeleton = () => view.querySelector('.history-range-skeleton');
    await fixture.whenStable();

    expect(api.post.calls.count()).toBe(2);
    expect(fixture.componentInstance.unpaidFinesCount()).toBe(1);
    expect(banner()).toBeNull();
    expect(skeleton()).not.toBeNull();
    expect(view.querySelector('app-date-range-filter')).not.toBeNull();

    finishDefaultRange([]);
    await Promise.resolve();
    await fixture.whenStable();
    expect(banner()).toBeNull();
    expect(skeleton()).toBeNull();

    let finishPreviousRange!: (operations: unknown[]) => void;
    api.post.and.returnValue(new Promise((resolve) => (finishPreviousRange = resolve)));
    fixture.componentInstance.onRangeChange({ from: '20/11/2026', to: '24/11/2026' });

    let rejectLatestRange!: (error: Error) => void;
    api.post.and.returnValue(new Promise((_resolve, reject) => (rejectLatestRange = reject)));
    fixture.componentInstance.onRangeChange({ from: '21/11/2026', to: '24/11/2026' });

    finishPreviousRange([fine]);
    await Promise.resolve();
    await fixture.whenStable();
    expect(skeleton()).not.toBeNull();
    expect(banner()).toBeNull();

    rejectLatestRange(new Error('Query failed'));
    await Promise.resolve();
    await fixture.whenStable();
    expect(skeleton()).toBeNull();
    const retry = view.querySelector<HTMLButtonElement>('.history-list button')!;
    expect(retry.textContent?.trim()).toBe('common.retry');
    const failedQuery = api.post.calls.mostRecent().args[1];

    let finishRetry!: (operations: unknown[]) => void;
    api.post.and.returnValue(new Promise((resolve) => (finishRetry = resolve)));
    retry.click();
    await fixture.whenStable();
    expect(api.post.calls.mostRecent().args[1]).toEqual(failedQuery);
    expect(skeleton()).not.toBeNull();

    finishRetry([fine, { operationNumber: 8, operationType: 1, opDate: '120000221126' }]);
    await Promise.resolve();
    await fixture.whenStable();
    expect(skeleton()).toBeNull();
    expect(banner()).not.toBeNull();
    expect(view.querySelector('.history-group-items a')).not.toBeNull();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/app/operations/unpaid-fines');
    await fixture.whenStable();
    expect(view.querySelector('app-unpaid-fines .fine-list-card')).not.toBeNull();

    let finishFilteredFines!: (operations: unknown[]) => void;
    api.post.and.returnValue(new Promise((resolve) => (finishFilteredFines = resolve)));
    fixture.componentInstance.onRangeChange({ from: '22/11/2026', to: '24/11/2026' });
    await fixture.whenStable();
    expect(skeleton()).not.toBeNull();
    expect(banner()).not.toBeNull();
    expect(router.url).toBe('/app/operations/unpaid-fines');

    finishFilteredFines([fine]);
    await Promise.resolve();
    await fixture.whenStable();
    expect(banner()).not.toBeNull();
    expect(router.url).toBe('/app/operations/unpaid-fines');

    await router.navigateByUrl('/app/operations/unpaid-fine-detail/7');
    api.post.and.resolveTo([{ ...fine, operationNumber: 9, opDate: '120000231126' }]);
    fixture.componentInstance.onRangeChange({ from: '23/11/2026', to: '24/11/2026' });
    await Promise.resolve();
    await fixture.whenStable();
    expect(router.url).toBe('/app/operations/unpaid-fines');
    expect(banner()).not.toBeNull();

    api.post.and.resolveTo([]);
    fixture.componentInstance.onRangeChange({ from: '24/11/2026', to: '24/11/2026' });
    await Promise.resolve();
    await fixture.whenStable();
    expect(banner()).toBeNull();
    expect(router.url).toBe('/app/operations');
  });
});
