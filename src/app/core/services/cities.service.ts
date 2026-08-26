import { inject, Injectable, signal } from '@angular/core';
import type { Municipio } from '../../shared/models/municipio';
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
  private readonly state = signal<ParkingMunicipio[]>([]);
  readonly cities = this.state.asReadonly();

  async getCities(force = false): Promise<DataResult<ParkingMunicipio[]>> {
    if (!force && this.state().length) return { data: this.state(), source: 'remote' };
    const value = await this.api.get<ContractsApiValue>(OPS_ENDPOINTS.parking.contracts);
    if (!Array.isArray(value.contractlist)) throw new Error('QueryContractsAPI no devolvió contractlist');
    const cities = value.contractlist.map((item) => this.toMunicipio(item));
    this.state.set(cities);
    return { data: cities, source: 'remote' };
  }

  contractIdFor(identifier: string): number {
    const numericId = Number(identifier);
    if (Number.isFinite(numericId)) return numericId;
    return this.state().find((city) => city.id === identifier)?.contractId ?? CONTRACT_IDS[identifier.toLocaleLowerCase('es')] ?? 0;
  }

  knownContractIds(): number[] {
    return [...new Set(Object.values(CONTRACT_IDS))];
  }

  private toMunicipio(item: ContractApiItem): ParkingMunicipio {
    const name = item.description1 || item.description2;
    return {
      id: this.slug(name),
      nombre: name,
      provincia: '',
      zonas: 0,
      imagen: '',
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
