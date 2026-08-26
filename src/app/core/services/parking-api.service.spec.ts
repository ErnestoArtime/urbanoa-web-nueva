import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { ParkingApiService } from './parking-api.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): ParkingApiService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(ParkingApiService);
}

describe('ParkingApiService', () => {
  it('uses the exact APK contract to confirm parking', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo('OK');
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.confirmParking({
      contractId: 3,
      plate: '1234ABC',
      sector: 4,
      quantity: 125,
      tariffType: 2,
      date: '2026-08-13T12:00:00.000Z',
      time: 60,
      latitude: 43.2,
      longitude: -2.1,
      street: 'Nagusia Kalea',
      payMethodId: 7,
    });

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/ConfirmParkingOperationAPI',
      jasmine.objectContaining({
        contractId: 3,
        plate: '1234ABC',
        sector: '4',
        quantity: 125,
        tariffType: 2,
        cloudToken: '',
        operatingSystem: 1,
        payMethodId: 7,
      }),
      { token: 'token' },
    );
    expect(result.source).toBe('remote');
  });

  it('rejects confirmation when there is no authenticated session', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    const service = serviceWith(api);

    const result = await service.confirmParking({
      contractId: 0,
      plate: '1234ABC',
      sector: 1,
      quantity: 100,
      tariffType: 1,
      date: '',
      time: 60,
      latitude: 0,
      longitude: 0,
      street: '',
      payMethodId: 0,
    });

    expect(api.post).not.toHaveBeenCalled();
    expect(result).toEqual(jasmine.objectContaining({ success: false, source: 'remote' }));
  });

  it('queries and confirms unparking with the Swagger date and refund contracts', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({ payAmount: 125, moneyReturned: true });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.unpark({ contractId: 3, plate: '1234ABC', ticketId: 7 });

    expect(api.post.calls.argsFor(0)).toEqual([
      'OPSWebServicesAPI/QueryUnParkingOperationAPI',
      jasmine.objectContaining({ contractId: 3, plate: '1234ABC', ticketId: 7, datetime: jasmine.stringMatching(/^\d{12}$/) }),
      { token: 'token' },
    ]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI/ConfirmUnParkingOperationAPI',
      jasmine.objectContaining({ contractId: 3, plate: '1234ABC', quantity: 125, date: jasmine.stringMatching(/^\d{12}$/) }),
      { token: 'token' },
    ]);
    expect(result).toEqual(jasmine.objectContaining({ source: 'remote', refundAmount: 1.25 }));
  });
});
