import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MOCK_STREETS_ZARAUTZ } from '../../shared/mock-data';

export interface ParkingStreet {
  id: number;
  name: string;
  zoneId: number;
  zoneDescription: string;
  tariff?: string;
}

interface StreetsApiItem {
  streetId?: number;
  street?: string;
  zone?: number;
  zoneDesc?: string;
}

@Injectable({ providedIn: 'root' })
export class StreetsService {
  async getStreets(cityId: number): Promise<ParkingStreet[]> {
    try {
      const response = await fetch(`${environment.opsApiBaseUrl}/OPSWebServicesAPI/QueryStreetsAPI`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId }),
      });
      if (!response.ok) throw new Error(`QueryStreetsAPI: ${response.status}`);

      const payload: unknown = await response.json();
      const items = this.extractItems(payload);
      if (items.length === 0) throw new Error('QueryStreetsAPI returned no streets');

      return items.map((item, index) => ({
        id: Number(item.streetId ?? index + 1),
        name: String(item.street ?? ''),
        zoneId: Number(item.zone ?? 0),
        zoneDescription: String(item.zoneDesc ?? ''),
      }));
    } catch {
      return MOCK_STREETS_ZARAUTZ.map((street, index) => ({
        id: index + 1,
        name: street.nombre,
        zoneId: 1,
        zoneDescription: street.zona,
        tariff: street.tarifa,
      }));
    }
  }

  private extractItems(payload: unknown): StreetsApiItem[] {
    if (!payload || typeof payload !== 'object') return [];
    const root = payload as Record<string, unknown>;
    const candidates = [root['streetsList'], root['data'], root['result'], root['response']];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as StreetsApiItem[];
      if (candidate && typeof candidate === 'object') {
        const nested = (candidate as Record<string, unknown>)['streetsList'];
        if (Array.isArray(nested)) return nested as StreetsApiItem[];
      }
    }
    return [];
  }
}
