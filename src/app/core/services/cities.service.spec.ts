import { OpsApiClient } from '../api/ops-api-client.service';
import { CitiesService } from './cities.service';

describe('CitiesService', () => {
  it('maps QueryContractsAPI to the view model', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get']);
    api.get.and.resolveTo({
      contractsNumber: '1',
      contractlist: [{ contractId: 3, description2: 'Zarautz' }],
    });
    const service = new CitiesService(api);

    const result = await service.getCities();

    expect(result.source).toBe('remote');
    expect(result.data[0]).toEqual(jasmine.objectContaining({ id: 'zarautz', nombre: 'Zarautz', contractId: 3 }));
  });
});
