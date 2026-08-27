import { inject, Injectable } from '@angular/core';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OpsApiError } from '../api/ops-api.types';

export interface ConfirmParkingInput {
  contractId: number;
  plate: string;
  sector: number;
  quantity: number;
  tariffType: number;
  date: string;
  time: number;
  latitude: number;
  longitude: number;
  street: string;
  payMethodId: number;
}

export interface ParkingApiResult {
  success: boolean;
  source: 'remote';
  refundAmount?: number;
  challengeUrl?: string;
  error?: unknown;
}

interface UnparkingResponseDto {
  tariffType: number;
  tariffTime: number;
  payAmount: number;
  dateInitial: string;
  dateEnd: string;
  moneyReturned: boolean;
}

export interface ParkingTicketOption {
  id: string;
  name: string;
  desc: string;
  price: string;
  schedule?: string;
  maxTime?: string;
  minAmount?: string;
  minAmountCents?: number;
  zoneId?: number;
  sectorId?: number;
  sectorColor?: string;
}

export interface ParkingSectorOption {
  zoneId: number;
  zone: string;
  zoneColor: string;
  sectorId: number;
  sector: string;
  sectorColor: string;
}

@Injectable({ providedIn: 'root' })
export class ParkingApiService {
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  async confirmParking(input: ConfirmParkingInput): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token) return { success: false, source: 'remote', error: new OpsApiError('transport', OPS_ENDPOINTS.parking.confirmParking, 'Se requiere una sesión válida') };
    try {
      const response = await this.api.post<unknown>(
        OPS_ENDPOINTS.parking.confirmParking,
        {
          contractId: input.contractId,
          plate: input.plate,
          sector: String(input.sector),
          quantity: input.quantity,
          tariffType: input.tariffType,
          cloudToken: '',
          operatingSystem: 1,
          date: this.opsDate(new Date(input.date)),
          time: input.time,
          latitude: input.latitude,
          longitude: input.longitude,
          reference: '',
          spaceId: '',
          streetname: input.street,
          streetno: '',
          groupId: input.sector,
          tariffId: input.tariffType,
          payMethodId: input.payMethodId,
        },
        { token },
      );
      return { success: true, source: 'remote', challengeUrl: this.challengeUrl(response) };
    } catch (error) {
      return { success: false, source: 'remote', error };
    }
  }

  async unpark(input: { contractId: number; plate: string; groupId?: number; ticketId?: number }): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token) return { success: false, source: 'remote', error: new OpsApiError('transport', OPS_ENDPOINTS.parking.queryUnparking, 'Se requiere una sesión válida') };
    try {
      const date = this.opsDate(new Date());
      const quote = await this.api.post<UnparkingResponseDto>(
        OPS_ENDPOINTS.parking.queryUnparking,
        { ...input, datetime: date },
        { token },
      );
      await this.api.post<string>(
        OPS_ENDPOINTS.parking.confirmUnparking,
        {
          contractId: input.contractId,
          plate: input.plate,
          quantity: quote.payAmount,
          groupId: input.groupId,
          ticketId: input.ticketId,
          cloudToken: '',
          operatingSystem: 1,
          date,
        },
        { token },
      );
      return { success: true, source: 'remote', refundAmount: Math.max(0, quote.payAmount) / 100 };
    } catch (error) {
      return { success: false, source: 'remote', error };
    }
  }

  async tickets(input: {
    contractId: number;
    plate: string;
    zone: number;
    date: string;
    streetId?: number;
  }): Promise<{ data: ParkingTicketOption[]; source: 'remote' }> {
    const token = this.session.token();
    if (!token) throw new OpsApiError('transport', OPS_ENDPOINTS.parking.tickets, 'Se requiere una sesión válida');
    const response = await this.api.post<{
      ticketlist: {
        ticketId: number; ticketDesc: string; minAmount: number | string; schedule: string; ticketBehText?: string;
        maxTime?: string; zoneId?: number; sectorId?: number; sectorColor?: string;
      }[] | null;
    }>(
      OPS_ENDPOINTS.parking.tickets,
      {
        contractId: input.contractId,
        plate: input.plate,
        date: this.formatOpsDate(input.date),
        zone: input.zone,
        language: 'ES',
        street: input.streetId ?? 0,
      },
      { token },
    );
    return {
      data: (response.ticketlist ?? []).map((ticket) => {
        const minAmountCents = this.amountInCents(ticket.minAmount);
        return {
          id: String(ticket.ticketId),
          name: ticket.ticketDesc,
          desc: ticket.ticketBehText || ticket.schedule,
          price: typeof ticket.minAmount === 'string' && ticket.minAmount.trim()
            ? ticket.minAmount.replace(/<br\s*\/?>/gi, ' · ')
            : `${(minAmountCents / 100).toFixed(2).replace('.', ',')} €`,
          schedule: ticket.schedule,
          maxTime: ticket.maxTime,
          minAmount: typeof ticket.minAmount === 'string' ? ticket.minAmount.replace(/<br\s*\/?>/gi, ' · ') : undefined,
          minAmountCents,
          zoneId: ticket.zoneId,
          sectorId: ticket.sectorId,
          sectorColor: ticket.sectorColor,
        };
      }),
      source: 'remote',
    };
  }

  async mapStretches(contractId: number, version = '0'): Promise<{ version: string; data: string }> {
    const requestedVersion = version.trim() || '0';
    return this.api.post(OPS_ENDPOINTS.parking.mapStretches, { contractId, version: requestedVersion });
  }

  async sectors(input: { contractId: number; streetId?: number; latitude: number; longitude: number }): Promise<ParkingSectorOption[]> {
    const response = await this.api.post<{ sectorlist: ParkingSectorOption[] | null }>(
      OPS_ENDPOINTS.parking.sectors,
      { contractId: input.contractId, streetId: input.streetId ?? 0, latitude: input.latitude, longitude: input.longitude },
    );
    return response.sectorlist ?? [];
  }

  private opsDate(date: Date): string {
    const two = (value: number): string => String(value).padStart(2, '0');
    return `${two(date.getHours())}${two(date.getMinutes())}${two(date.getSeconds())}${two(date.getDate())}${two(date.getMonth() + 1)}${two(
      date.getFullYear() % 100,
    )}`;
  }

  private formatOpsDate(value: string | Date): string {
    if (typeof value === 'string' && /^\d{12}$/.test(value)) return value;
    const date = value instanceof Date ? value : new Date(value);
    return this.opsDate(Number.isNaN(date.getTime()) ? new Date() : date);
  }

  private amountInCents(value: number | string): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const match = value.match(/[\d]+(?:[,.][\d]+)?/);
    if (!match) return 0;
    return Math.round(Number(match[0].replace(',', '.')) * 100);
  }

  private challengeUrl(value: unknown): string | undefined {
    const candidate = typeof value === 'string' ? value.trim() : '';
    return /^https?:\/\//i.test(candidate) ? candidate : undefined;
  }
}
