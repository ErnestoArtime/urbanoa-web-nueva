import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { StreetsService } from './streets.service';

function serviceWith(api: jasmine.SpyObj<OpsApiClient>): StreetsService {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
  return TestBed.inject(StreetsService);
}

describe('StreetsService', () => {
  it('uses the APK contractId request and streetsFulllist response', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({
      streetsFullNumber: 1,
      streetsFulllist: [{ streetId: 7, street: 'AITZA KALEA', zone: 2, zoneDesc: 'Z2 AZUL' }],
    });
    const service = serviceWith(api);

    const result = await service.getStreets(3);

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI/QueryStreetsAPI', { contractId: 3 });
    expect(result.source).toBe('remote');
    expect(result.data).toEqual([{ id: 7, name: 'AITZA KALEA', zoneId: 2, zoneDescription: 'Z2 AZUL' }]);
  });

  it('propagates backend errors instead of returning demo streets', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.rejectWith(new Error('offline'));
    const service = serviceWith(api);

    await expectAsync(service.getStreets(3)).toBeRejectedWithError('offline');
  });

  it('does not substitute another municipality when its request fails', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.rejectWith(new Error('offline'));
    const service = serviceWith(api);

    await expectAsync(service.getStreets(5)).toBeRejectedWithError('offline');
  });
});
