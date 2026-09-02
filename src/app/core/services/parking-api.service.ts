import { inject, Injectable } from '@angular/core';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { OpsApiError } from '../api/ops-api.types';
import { formatOpsDate } from '../utils/ops-date';
import { TranslationService } from './translation.service';

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

export interface UnparkingQuoteResult extends ParkingApiResult {
  quantity?: number;
}

interface UnparkingResponseDto {
  result?: number;
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
  private readonly translation = inject(TranslationService);

  serverNow(): Date {
    return this.api.serverNow();
  }

  async confirmParking(input: ConfirmParkingInput): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token)
      return {
        success: false,
        source: 'remote',
        error: new OpsApiError('transport', OPS_ENDPOINTS.parking.confirmParking, 'Se requiere una sesión válida'),
      };
    try {
      const response = await this.api.post<unknown>(
        OPS_ENDPOINTS.parking.confirmParking,
        {
          contractId: input.contractId,
          plate: input.plate,
          sector: input.sector,
          quantity: input.quantity,
          tariffType: input.tariffType,
          cloudToken: '',
          operatingSystem: 1,
          date: input.date,
          time: input.time,
          latitude: input.latitude,
          longitude: input.longitude,
          reference: '',
          spaceId: '',
          streetname: input.street,
          streetno: '',
          payMethodId: input.payMethodId,
        },
        { token },
      );
      return { success: true, source: 'remote', challengeUrl: this.challengeUrl(response) };
    } catch (error) {
      return { success: false, source: 'remote', error };
    }
  }

  async queryUnparking(input: { contractId: number; plate: string; groupId?: number; ticketId?: number; datetime?: string }): Promise<UnparkingQuoteResult> {
    const token = this.session.token();
    if (!token)
      return {
        success: false,
        source: 'remote',
        error: new OpsApiError('transport', OPS_ENDPOINTS.parking.queryUnparking, 'Se requiere una sesión válida'),
      };
    try {
      const date = this.opsDate(this.api.serverNow ? this.api.serverNow() : new Date());
      const quote = await this.api.post<UnparkingResponseDto>(
        OPS_ENDPOINTS.parking.queryUnparking,
        { ...input, datetime: date },
        { token },
      );
      if (quote.result !== undefined && quote.result !== 1) {
        const message = this.unparkResultMessage(quote.result);
        return {
          success: false,
          source: 'remote',
          error: new OpsApiError('backend', OPS_ENDPOINTS.parking.queryUnparking, message),
        };
      }
      return { success: true, source: 'remote', refundAmount: Math.max(0, quote.payAmount) / 100, quantity: quote.payAmount };
    } catch (error) {
      return { success: false, source: 'remote', error };
    }
  }

  async unpark(
    input: { contractId: number; plate: string; groupId?: number; ticketId?: number },
    preparedQuote?: UnparkingQuoteResult,
  ): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token) {
      return {
        success: false,
        source: 'remote',
        error: new OpsApiError('transport', OPS_ENDPOINTS.parking.confirmUnparking, 'Se requiere una sesión válida'),
      };
    }
    const quote = preparedQuote ?? (await this.queryUnparking(input));
    if (!quote.success) return quote;
    try {
      const date = this.opsDate(this.api.serverNow ? this.api.serverNow() : new Date());
      await this.api.post<string>(
        OPS_ENDPOINTS.parking.confirmUnparking,
        {
          contractId: input.contractId,
          plate: input.plate,
          quantity: quote.quantity ?? 0,
          groupId: input.groupId,
          ticketId: input.ticketId,
          cloudToken: '',
          operatingSystem: 1,
          date,
        },
        { token },
      );
      return { success: true, source: 'remote', refundAmount: quote.refundAmount };
    } catch (error) {
      return { success: false, source: 'remote', error };
    }
  }

  private unparkResultMessage(result: number): string {
    switch (result) {
      case -1:
        return 'No se pudo calcular el desaparcar. (autenticación no válida)';
      case -4:
        return 'La matrícula no tiene derechos al desaparcar.';
      case -9:
        return 'No se pudo calcular el desaparcar. (error genérico)';
      case -10:
        return 'No se pudo calcular el desaparcar. (parámetro de entrada no válido)';
      case -11:
        return 'No se pudo calcular el desaparcar. (parámetro de entrada faltante)';
      case -12:
        return 'No se pudo calcular el desaparcar. (error del sistema)';
      default:
        return `No se pudo calcular el desaparcar. (resultado ${result})`;
    }
  }

  async tickets(input: {
    contractId: number;
    plate: string;
    zone: number;
    date: string;
  }): Promise<{ data: ParkingTicketOption[]; source: 'remote' }> {
    const token = this.session.token();
    if (!token) throw new OpsApiError('transport', OPS_ENDPOINTS.parking.tickets, 'Se requiere una sesión válida');
    const response = await this.api.post<{
      ticketlist:
        | {
        ticketId: number;
        ticketDesc: string;
        minAmount: number | string;
        schedule: string;
        ticketBehText?: string;
        maxTime?: string;
        zoneId?: number;
        sectorId?: number;
        sectorColor?: string;
      }[]
        | null;
    }>(
      OPS_ENDPOINTS.parking.tickets,
      {
        contractId: input.contractId,
        plate: input.plate,
        date: this.formatOpsDate(input.date),
        zone: input.zone,
        language: 'ES',
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
          price:
            typeof ticket.minAmount === 'string' && ticket.minAmount.trim()
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
    const response = await this.api.post<{ sectorlist: ParkingSectorOption[] | null }>(OPS_ENDPOINTS.parking.sectors, {
      contractId: input.contractId,
      streetId: input.streetId ?? 0,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    return response.sectorlist ?? [];
  }

  opsDate(date: Date): string {
    return formatOpsDate(date);
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
