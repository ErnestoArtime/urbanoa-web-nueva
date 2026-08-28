import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { CitiesService } from './cities.service';

describe('CitiesService', () => {
  it('maps QueryContractsAPI to the view model', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get']);
    api.get.and.resolveTo({
      contractsNumber: '1',
      contractlist: [{ contractId: 3, description1: '', description2: 'Zarautz', address: '', email: '', imagePath: '', longitude: 0, latitude: 0, phone: '', radius: '' }],
    });
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    const service = TestBed.inject(CitiesService);

    const result = await service.getCities();

    expect(result.source).toBe('remote');
    expect(result.data[0]).toEqual(jasmine.objectContaining({ id: 'zarautz', nombre: 'Zarautz', contractId: 3 }));
  });
});
