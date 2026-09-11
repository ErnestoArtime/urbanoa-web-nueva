import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../../core/api/ops-session.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingTimeStepsComponent } from './time-steps.component';

describe('ParkingTimeStepsComponent extension', () => {
  const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post', 'serverNow']);

  beforeEach(() => {
    api.post.calls.reset();
    api.serverNow.and.returnValue(new Date('2026-09-09T10:00:00Z'));
    api.post.and.resolveTo({
      dateInitial: '120000090926',
      tariffType: 6,
      steps: [
        { time: 30, quantity: 75, datetime: '123000090926' },
        { time: 60, quantity: 150, datetime: '130000090926' },
      ],
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'test-token' } },
        { provide: ParkingSessionService, useValue: { activeParkings: signal([]) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    TestBed.inject(ParkingFlowStore).startExtension({
      plate: '1234567',
      vehicleId: '1234567',
      zone: 'Z2 AZUL',
      contractId: 3,
      sectorId: 22002,
      tariffId: 4,
    });
  });

  it('loads extension durations without an hourly price and uses the server amounts', async () => {
    const store = TestBed.inject(ParkingFlowStore);
    expect(store.fromStore().tariffPrice).toBe('');
    const component = TestBed.runInInjectionContext(() => new ParkingTimeStepsComponent());
    await component.ngOnInit();
    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/QueryParkingOperationWithTimeStepsAPI',
      jasmine.objectContaining({ contractId: 3, sector: 22002, ticket: 4, plate: '1234567' }),
      { token: 'test-token' },
    );
    expect(component.error()).toBeFalse();
    expect(component.steps().length).toBe(2);
    expect(component.amountFormatted()).toBe('1,50 €');
    component.changeTime(-1);
    expect(component.amountFormatted()).toBe('0,75 €');
    component.onContinue();
    expect(store.vm()).toEqual(jasmine.objectContaining({ mode: 'extension', minutes: '30', amount: '0,75 €', tariffType: '6' }));
  });

  it('does not invent a tariff when its identifier is absent', async () => {
    TestBed.inject(ParkingFlowStore).update({ tariffId: '' });
    const component = TestBed.runInInjectionContext(() => new ParkingTimeStepsComponent());
    await component.ngOnInit();
    expect(api.post).not.toHaveBeenCalled();
    expect(component.error()).toBeTrue();
  });

  it('shows an error when the server returns no available durations', async () => {
    api.post.and.resolveTo({ dateInitial: '120000090926', steps: [] });
    const component = TestBed.runInInjectionContext(() => new ParkingTimeStepsComponent());
    await component.ngOnInit();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(component.steps()).toEqual([]);
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });

  it('identifies an end time on the next calendar day as tomorrow', async () => {
    api.post.and.resolveTo({
      dateInitial: '204300100926',
      tariffType: 6,
      steps: [{ time: 270, quantity: 1070, datetime: '133000110926' }],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingTimeStepsComponent());

    await component.ngOnInit();

    expect(component.endTime()).toBe('13:30');
    expect(component.endDayLabel()).toBe('ops.tomorrow');
  });
});
