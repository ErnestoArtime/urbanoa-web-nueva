import { inject, Injectable } from '@angular/core';
import { MOCK_MUNICIPIOS, Municipio } from '../../shared/mock-data';
import { withMockFallback } from '../api/mock-fallback';
import { OpsApiClient } from '../api/ops-api-client.service';
import { DataResult } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';

interface ContractApiItem {
  contractId: number;
  description1: string;
  description2: string;
  address: string;
  email: string;
  imagePath: string;
  longitude: number;
  latitude: number;
  phone: string;
  radius: string;
}

interface ContractsApiValue {
  contractsNumber: number | string;
  contractlist: ContractApiItem[];
}

export interface ParkingMunicipio extends Municipio {
  contractId: number;
  description1: string;
  address: string;
  email: string;
  imagePath: string;
  longitude: number;
  latitude: number;
  phone: string;
  radius: string;
}

const CONTRACT_IDS: Record<string, number> = {
  durango: 1,
  zarautz: 3,
  tolosa: 5,
  bergara: 23,
  arrasate: 61,
  soria: 73,
  deba: 79,
  mutriku: 81,
};

@Injectable({ providedIn: 'root' })
export class CitiesService {
  private readonly api = inject(OpsApiClient);

  getCities(): Promise<DataResult<ParkingMunicipio[]>> {
    return withMockFallback(
      async () => {
        const value = await this.api.get<ContractsApiValue>(OPS_ENDPOINTS.parking.contracts);
        if (!Array.isArray(value.contractlist)) throw new Error('QueryContractsAPI no devolvió contractlist');
        return value.contractlist.map((item) => this.toMunicipio(item));
      },
      () => this.mockCities(),
    );
  }

  contractIdFor(identifier: string): number {
    const numericId = Number(identifier);
    return Number.isFinite(numericId) ? numericId : (CONTRACT_IDS[identifier.toLocaleLowerCase('es')] ?? CONTRACT_IDS['zarautz']);
  }

  knownContractIds(): number[] {
    return [...new Set(Object.values(CONTRACT_IDS))];
  }

  private mockCities(): ParkingMunicipio[] {
    return MOCK_MUNICIPIOS.map((city) => ({
      ...city,
      contractId: this.contractIdFor(city.id),
      description1: '',
      address: '',
      email: '',
      imagePath: '',
      longitude: 0,
      latitude: 0,
      phone: '',
      radius: '',
    }));
  }

  private toMunicipio(item: ContractApiItem): ParkingMunicipio {
    const known = MOCK_MUNICIPIOS.find((city) => city.nombre.toLocaleLowerCase('es') === item.description2.toLocaleLowerCase('es'));
    return {
      id: known?.id ?? this.slug(item.description2),
      nombre: item.description2,
      provincia: known?.provincia ?? '',
      zonas: known?.zonas ?? 0,
      imagen: known?.imagen ?? '',
      contractId: item.contractId,
      description1: item.description1 ?? '',
      address: item.address ?? '',
      email: item.email ?? '',
      imagePath: item.imagePath ? `https://arinpark.gerteksa.eus/Arinpark/images/${item.imagePath}` : '',
      longitude: item.longitude ?? 0,
      latitude: item.latitude ?? 0,
      phone: item.phone ?? '',
      radius: item.radius ?? '',
    };
  }

  private slug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
