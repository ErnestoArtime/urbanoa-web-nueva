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
      date: '120000130826',
      time: 60,
      latitude: 43.2,
      longitude: -2.1,
      street: 'Nagusia Kalea',
      payMethodId: 7,
    });

    expect(api.post).toHaveBeenCalledWith(
      'OPSWebServicesAPI/ConfirmParkingOperationAPI',
      {
        contractId: 3,
        plate: '1234ABC',
        sector: 4,
        quantity: 125,
        tariffType: 2,
        cloudToken: '',
        operatingSystem: 1,
        date: '120000130826',
        time: 60,
        latitude: 43.2,
        longitude: -2.1,
        reference: '',
        spaceId: '',
        streetname: 'Nagusia Kalea',
        streetno: '',
        payMethodId: 7,
      },
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

  it('queries tickets with the Swagger fields and maps the returned tariff text', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({
      ticketlist: [
        {
          ticketId: 4,
          ticketDesc: 'Rotación',
          minAmount: '0 € - 20,00 €',
          schedule: 'Todos los días 9:00 - 20:00',
          sectorId: 22002,
        },
      ],
    });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.tickets({
      contractId: 3,
      plate: '1234567',
      zone: 22002,
      date: '183423260826',
    });

    expect(api.post).toHaveBeenCalledOnceWith(
      'OPSWebServicesAPI/QueryTicketsAPI',
      { contractId: 3, plate: '1234567', date: '183423260826', zone: 22002, language: 'ES' },
      { token: 'token' },
    );
    expect(result.data[0]).toEqual(jasmine.objectContaining({ id: '4', minAmount: '0 € - 20,00 €', sectorId: 22002 }));
  });

  it('always sends a non-empty map version and the complete sector location', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.returnValues(
      Promise.resolve({ version: '2', data: '<kml />' }) as Promise<never>,
      Promise.resolve({ sectorlist: [] }) as Promise<never>,
    );
    const service = serviceWith(api);

    await service.mapStretches(3, '');
    await service.sectors({ contractId: 3, streetId: 2601, latitude: 43.28, longitude: -2.16 });

    expect(api.post.calls.argsFor(0)).toEqual(['OPSWebServicesAPI/QueryMapStretchesAPI', { contractId: 3, version: '0' }]);
    expect(api.post.calls.argsFor(1)).toEqual([
      'OPSWebServicesAPI/QuerySectorsAPI',
      { contractId: 3, streetId: 2601, latitude: 43.28, longitude: -2.16 },
    ]);
  });

  it('uses street 0 when resolving a sector without a street mapping', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({ sectorlist: [{ zoneId: 50001, sectorId: 60003, sector: '3 - PARKING PUBLICO IBARGARAI' }] });
    const service = serviceWith(api);

    await service.sectors({ contractId: 23, latitude: 43.11599, longitude: -2.41484 });

    expect(api.post).toHaveBeenCalledOnceWith('OPSWebServicesAPI/QuerySectorsAPI', {
      contractId: 23,
      streetId: 0,
      latitude: 43.11599,
      longitude: -2.41484,
    });
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

  it('does not confirm unparking when the quote rejects the plate', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({ result: -4, tariffType: 0, tariffTime: 0, payAmount: 0, moneyReturned: false });
    const service = serviceWith(api);
    TestBed.inject(OpsSessionService).setToken('token');

    const result = await service.unpark({ contractId: 3, plate: '1234567', groupId: 22002, ticketId: 108 });

    expect(api.post).toHaveBeenCalledOnceWith(
      'OPSWebServicesAPI/QueryUnParkingOperationAPI',
      jasmine.objectContaining({ contractId: 3, plate: '1234567', groupId: 22002, ticketId: 108 }),
      { token: 'token' },
    );
    expect(result.success).toBeFalse();
    expect(result.error instanceof Error ? result.error.message : '').toBe('La matrícula no tiene derechos al desaparcar.');
  });
});
