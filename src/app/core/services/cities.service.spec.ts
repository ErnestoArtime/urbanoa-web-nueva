import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { CitiesService } from './cities.service';

describe('CitiesService', () => {
  it('maps QueryContractsAPI to the view model', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({
      contractsNumber: '1',
      contractlist: [{ contractId: 3, description1: '', description2: 'Zarautz', address: '', email: '', imagePath: '', longitude: 0, latitude: 0, phone: '', radius: '' }],
    });
    api.post.and.resolveTo({ data: '' });
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });
    const service = TestBed.inject(CitiesService);

    const result = await service.getCities();

    expect(result.source).toBe('remote');
    expect(result.data[0]).toEqual(jasmine.objectContaining({ id: 'zarautz', nombre: 'Zarautz', contractId: 3 }));
  });

  it('uses map KML zones when the streets endpoint has no zones', async () => {
    const api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['get', 'post']);
    api.get.and.resolveTo({
      contractsNumber: '1',
      contractlist: [{ contractId: 3, description1: 'Zarautz', description2: '', address: '', email: '', imagePath: '', longitude: 0, latitude: 0, phone: '', radius: '' }],
    });
    api.post.withArgs('OPSWebServicesAPI/QueryStreetsAPI', { contractId: 3 }).and.resolveTo({ streetsFulllist: [] });
    api.post.withArgs('OPSWebServicesAPI/QueryMapStretchesAPI', { contractId: 3, version: '0' }).and.resolveTo({
      data: `<kml><Document><Placemark><name>SECTOR 01</name><description>SECTOR 01 AZUL</description><ExtendedData><zoneId>7</zoneId></ExtendedData></Placemark></Document></kml>`,
    });
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: OpsApiClient, useValue: api }] });

    const result = await TestBed.inject(CitiesService).getCities();

    expect(result.data[0].zones).toEqual([{ id: 7, name: 'SECTOR 01 AZUL' }]);
    expect(result.data[0].zonas).toBe(1);
  });
});
