import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../core/api/ops-session.service';
import { ParkingTimeStepsService } from './parking-time-steps.service';

describe('ParkingTimeStepsService', () => {
  it('uses the complete Swagger contract and maps amounts from cents', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({ dateInitial: '120000270826', steps: [{ time: 60, quantity: 150, datetime: '130000270826' }] });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }],
    });
    TestBed.inject(OpsSessionService).setToken('token');
    const service = TestBed.inject(ParkingTimeStepsService);

    const result = await service.queryTimeSteps({
      contractId: 3,
      sectorId: 22002,
      ticketId: 4,
      tariffId: '4',
      tariffPrice: 0,
      plate: '1234567',
    });

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/QueryParkingOperationWithTimeStepsAPI',
      jasmine.objectContaining({
        contractId: 3,
        sector: 22002,
        ticket: 4,
        plate: '1234567',
        datetime: jasmine.stringMatching(/^\d{12}$/),
        groupId: 22002,
        ticketId: 4,
      }),
      { token: 'token' },
    );
    expect(result[0]).toEqual(jasmine.objectContaining({ time: 60, amount: 1.5, datetimeRaw: '130000270826' }));
  });
});
