import { OpsApiClient } from '../api/ops-api-client.service';
import { StreetsService } from './streets.service';

describe('StreetsService', () => {
  it('uses the APK contractId request and streetsFulllist response', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo({
      streetsFullNumber: 1,
      streetsFulllist: [{ streetId: 7, street: 'AITZA KALEA', zone: 2, zoneDesc: 'Z2 AZUL' }],
    });
    const service = new StreetsService(api);

    const result = await service.getStreets(3);

    expect(api.post).toHaveBeenCalledWith('OPSWebServicesAPI/QueryStreetsAPI', { contractId: 3 });
    expect(result.source).toBe('remote');
    expect(result.data).toEqual([{ id: 7, name: 'AITZA KALEA', zoneId: 2, zoneDescription: 'Z2 AZUL' }]);
  });

  it('uses the Zarautz fallback and marks it as mock', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.rejectWith(new Error('offline'));
    const service = new StreetsService(api);

    const result = await service.getStreets(3);

    expect(result.source).toBe('mock');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('does not show Zarautz streets for another municipality', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.rejectWith(new Error('offline'));
    const service = new StreetsService(api);

    const result = await service.getStreets(5);

    expect(result.source).toBe('mock');
    expect(result.data).toEqual([]);
  });
});
