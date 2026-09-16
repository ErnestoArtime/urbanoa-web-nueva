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

interface StreetsApiValue {
  streetsFulllist?: { zone: number; zoneDesc: string }[] | null;
}

interface MapStretchesApiValue {
  data?: string | null;
}

export interface ParkingZoneSummary {
  id: number;
  name: string;
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
  zones: ParkingZoneSummary[];
}

export interface CityCoordinatesInput {
  contractId?: number;
  cityId?: number;
  cityName?: string;
  latitude?: number;
  longitude?: number;
}

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
    const enriched = await Promise.all(
      cities.map(async (city) => {
        const zones = new Map<number, string>();
        try {
          const streets = await this.api.post<StreetsApiValue>(OPS_ENDPOINTS.parking.streets, { contractId: city.contractId });
          for (const street of streets.streetsFulllist ?? []) {
            if (street.zone > 0) zones.set(street.zone, street.zoneDesc || `Zona ${street.zone}`);
          }
        } catch {
          // QueryMapStretchesAPI se usa como respaldo más abajo.
        }

        if (!zones.size) {
          try {
            for (const zone of await this.getZonesFromMap(city.contractId)) {
              zones.set(zone.id, zone.name);
            }
          } catch {
            // El municipio se mantiene visible aunque su información de zonas falle.
          }
        }

        const zoneList = [...zones.entries()].map(([id, name]) => ({ id, name }));
        return { ...city, zones: zoneList, zonas: zoneList.length };
      }),
    );
    this.state.set(enriched);
    return { data: enriched, source: 'remote' };
  }

  contractIdFor(identifier: string): number {
    const numericId = Number(identifier);
    if (Number.isFinite(numericId)) return numericId;
    return this.state().find((city) => city.id === identifier)?.contractId ?? 0;
  }

  knownContractIds(): number[] {
    return [...new Set(this.state().map((city) => city.contractId))];
  }

  nameFor(input: CityCoordinatesInput): string {
    if (input.cityName?.trim()) return input.cityName.trim();
    const city = this.state().find((item) => item.contractId === input.contractId);
    if (city) return city.nombre;
    return '';
  }

  selectableCities(cities: readonly ParkingMunicipio[] = this.state()): ParkingMunicipio[] {
    return cities.filter((city) => city.contractId > 0 && city.zones.length > 0);
  }

  coordinatesFor(input: CityCoordinatesInput): { latitude: number; longitude: number } | null {
    if (this.validCoordinates(input.latitude, input.longitude)) {
      return { latitude: input.latitude!, longitude: input.longitude! };
    }
    const city = this.state().find(
      (item) =>
        item.contractId === input.contractId ||
        item.contractId === input.cityId ||
        (input.cityName ? this.slug(item.nombre) === this.slug(input.cityName) : false),
    );
    if (city && this.validCoordinates(city.latitude, city.longitude)) {
      return { latitude: city.latitude, longitude: city.longitude };
    }
    return null;
  }

  private toMunicipio(item: ContractApiItem): ParkingMunicipio {
    const name = item.description1 || item.description2;
    const id = this.slug(name);
    return {
      id,
      nombre: name,
      provincia: '',
      zonas: 0,
      imagen: `${id}.jpg`,
      contractId: item.contractId,
      description1: item.description1 ?? '',
      address: item.address ?? '',
      email: item.email ?? '',
      imagePath: item.imagePath ? `https://arinpark.gerteksa.eus/Arinpark/images/${item.imagePath}` : '',
      longitude: item.longitude ?? 0,
      latitude: item.latitude ?? 0,
      phone: item.phone ?? '',
      radius: item.radius ?? '',
      zones: [],
    };
  }

  private async getZonesFromMap(contractId: number): Promise<ParkingZoneSummary[]> {
    const response = await this.api.post<MapStretchesApiValue>(OPS_ENDPOINTS.parking.mapStretches, {
      contractId,
      version: '0',
    });
    const kml = response.data?.trim();
    if (!kml) return [];

    const xml = new DOMParser().parseFromString(kml, 'application/xml');
    const zones = new Map<number, string>();
    for (const placemark of Array.from(xml.getElementsByTagName('Placemark'))) {
      const zoneId = Number(placemark.querySelector('ExtendedData zoneId')?.textContent?.trim()) || 0;
      if (zoneId <= 0) continue;
      const name =
        placemark.getElementsByTagName('description')[0]?.textContent?.trim() ||
        placemark.getElementsByTagName('name')[0]?.textContent?.trim() ||
        `Zona ${zoneId}`;
      zones.set(zoneId, name);
    }
    return [...zones.entries()].map(([id, name]) => ({ id, name }));
  }

  private slug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private validCoordinates(latitude?: number, longitude?: number): boolean {
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude!) <= 90 &&
      Math.abs(longitude!) <= 180 &&
      (latitude !== 0 || longitude !== 0)
    );
  }
}
