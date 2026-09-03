import { inject, Injectable } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { DataResult } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';

export interface ParkingStreet {
  id: number;
  name: string;
  zoneId: number;
  zoneDescription: string;
  tariff?: string;
}

interface StreetsApiItem {
  streetId: number;
  street: string;
  zone: number;
  zoneDesc: string;
}

interface StreetsApiValue {
  streetsFullNumber: number;
  streetsFulllist: StreetsApiItem[];
}

@Injectable({ providedIn: 'root' })
export class StreetsService {
  private readonly api = inject(OpsApiClient);

  async getStreets(contractId: number): Promise<DataResult<ParkingStreet[]>> {
    const value = await this.api.post<StreetsApiValue>(OPS_ENDPOINTS.parking.streets, { contractId });
    if (!Array.isArray(value.streetsFulllist)) throw new Error('QueryStreetsAPI no devolvió streetsFulllist');
    return {
      data: value.streetsFulllist.map((item) => ({
        id: item.streetId,
        name: item.street,
        zoneId: item.zone,
        zoneDescription: item.zoneDesc,
      })),
      source: 'remote',
    };
  }
}
