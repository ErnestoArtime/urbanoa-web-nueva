import { Injectable } from '@angular/core';
import { MOCK_MUNICIPIOS, Municipio } from '../../shared/mock-data';
import { withMockFallback } from '../api/mock-fallback';
import { OpsApiClient } from '../api/ops-api-client.service';
import { DataResult } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';

interface ContractApiItem {
  contractId: number;
  description2: string;
}

interface ContractsApiValue {
  contractsNumber: number | string;
  contractlist: ContractApiItem[];
}

export interface ParkingMunicipio extends Municipio {
  contractId: number;
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
  constructor(private readonly api: OpsApiClient) {}

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

  private mockCities(): ParkingMunicipio[] {
    return MOCK_MUNICIPIOS.map((city) => ({ ...city, contractId: this.contractIdFor(city.id) }));
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
