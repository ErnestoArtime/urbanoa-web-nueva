import { inject, Injectable } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { getOpsCloudToken, OPS_PARKING_SESSION_OPERATING_SYSTEM } from '../api/ops-client.constants';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
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
  /** Base operation reference: links an extension to the first parking (APK opBaseId). */
  reference?: string;
}

export interface ParkingApiResult {
  success: boolean;
  source: 'remote';
  operationId?: number;
  refundAmount?: number;
  challengeUrl?: string;
  error?: unknown;
}

interface ConfirmParkingResponseDto {
  operationId: number | null;
  challengeUrl: string | null;
}

export interface UnparkingQuoteResult extends ParkingApiResult {
  quantity?: number;
}

interface UnparkingResponseDto {
  result?: number;
  error?: number;
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
  ticketBehavior?: number;
  informationalOnly?: boolean;
  free?: boolean;
  resident24h?: boolean;
  pmr?: boolean;
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
    return this.confirmParkingOperation(input);
  }

  /** The APK extends a parking through the same confirmation operation. */
  async confirmExtension(input: ConfirmParkingInput): Promise<ParkingApiResult> {
    return this.confirmParkingOperation(input);
  }

  private async confirmParkingOperation(input: ConfirmParkingInput): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token)
      return {
        success: false,
        source: 'remote',
        error: new OpsApiError('transport', OPS_ENDPOINTS.parking.confirmParking, 'Se requiere una sesión válida'),
      };
    try {
      const response = await this.api.post<ConfirmParkingResponseDto | string>(
        OPS_ENDPOINTS.parking.confirmParking,
        {
          contractId: input.contractId,
          plate: input.plate,
          sector: input.sector,
          quantity: input.quantity,
          tariffType: input.tariffType,
          cloudToken: getOpsCloudToken(),
          // Compatibility with the current OPS/Swagger parking contract.
          operatingSystem: OPS_PARKING_SESSION_OPERATING_SYSTEM,
          date: input.date,
          time: input.time,
          latitude: input.latitude,
          longitude: input.longitude,
          reference: input.reference ?? '',
          spaceId: '',
          streetname: input.street,
          streetno: '',
          payMethodId: input.payMethodId,
        },
        // La confirmación puede completar la escritura en OPS después del timeout
        // estándar; no se debe cancelar una operación de pago a los 15 segundos.
        { token, timeoutMs: 60_000 },
      );
      const operationId = this.operationId(response);
      const challengeUrl = this.challengeUrl(response);
      return {
        success: true,
        source: 'remote',
        ...(operationId !== undefined ? { operationId } : {}),
        ...(challengeUrl ? { challengeUrl } : {}),
      };
    } catch (error) {
      return { success: false, source: 'remote', error };
    }
  }

  async queryUnparking(input: {
    contractId: number;
    plate: string;
    groupId?: number;
    ticketId?: number;
    datetime?: string;
  }): Promise<UnparkingQuoteResult> {
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
      const result = quote.result ?? (quote.error !== undefined && quote.error < 0 ? quote.error : undefined);
      if (result !== undefined && result !== 1) {
        const message = this.unparkResultMessage(result);
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
          cloudToken: getOpsCloudToken(),
          // Compatibility with the current OPS/Swagger parking contract.
          operatingSystem: OPS_PARKING_SESSION_OPERATING_SYSTEM,
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
        return 'La matrícula no tiene derechos al desaparcar';
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
            ticketBehavior?: number;
            ticketBeh?: number;
            hasTicket?: number | string | boolean;
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
      data: (response.ticketlist ?? [])
        .map((ticket) => {
          const rawBehavior = ticket.ticketBehavior ?? ticket.ticketBeh;
          const parsedBehavior = rawBehavior === undefined || rawBehavior === null ? undefined : Number(rawBehavior);
          return { ticket, behavior: Number.isFinite(parsedBehavior) ? parsedBehavior : undefined };
        })
        .filter(({ behavior }) => behavior !== 2)
        .map(({ ticket, behavior }) => {
          const minAmountCents = this.amountInCents(ticket.minAmount);
          const schedule = this.normalizeTariffText(ticket.schedule) ?? '';
          const behaviorText = this.normalizeTariffText(ticket.ticketBehText);
          const minAmountText =
            typeof ticket.minAmount === 'string' ? this.normalizeTariffText(ticket.minAmount.replace(/<br\s*\/?>/gi, ' · ')) : undefined;
          const tariffText = `${ticket.ticketDesc} ${behaviorText ?? ''} ${schedule} ${minAmountText ?? ''}`.toLocaleLowerCase('es-ES');
          const explicitlyFree = /\bgratuit[oa]s?\b|\bgratis\b/.test(tariffText);
          const hasZeroAmount = this.hasOnlyZeroAmounts(ticket.minAmount);
          const isPmr = /pmr|discapacidad|minusválid/.test(tariffText);
          return {
            id: String(ticket.ticketId),
            name: ticket.ticketDesc,
            desc: behaviorText || schedule,
            price: minAmountText?.trim() ? minAmountText : `${(minAmountCents / 100).toFixed(2).replace('.', ',')} €`,
            schedule,
            maxTime: ticket.maxTime,
            minAmount: minAmountText,
            minAmountCents,
            zoneId: ticket.zoneId,
            sectorId: ticket.sectorId,
            sectorColor: ticket.sectorColor,
            ticketBehavior: behavior,
            // hasTicket describes the vehicle's current state, not whether this tariff
            // requires obtaining a ticket. The APK drives the action from ticketBehavior.
            informationalOnly: behavior !== 1,
            // A zero can be the lower bound of a paid range (for example 0 € - 20 €).
            // PMR behavior 3 is free even when OPS repeats the rotation price range.
            free: explicitlyFree || (behavior === 3 && (hasZeroAmount || isPmr)),
            resident24h: /residente|residentes/.test(tariffText) && /24\s*h|24h/.test(tariffText),
            pmr: isPmr,
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

  private hasOnlyZeroAmounts(value: number | string): boolean {
    if (typeof value === 'number') return value === 0;
    const amounts = [...value.matchAll(/(\d+(?:[,.]\d+)?)\s*€/g)].map((match) => Number(match[1].replace(',', '.')));
    if (amounts.length) return amounts.every((amount) => amount === 0);
    return /^0+(?:[,.]0+)?$/.test(value.trim());
  }

  private normalizeTariffText(value: string | undefined): string | undefined {
    if (!value) return value;
    return value.replace(
      /\b(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/giu,
      (day) => day.charAt(0).toLocaleUpperCase('es-ES') + day.slice(1).toLocaleLowerCase('es-ES'),
    );
  }

  private challengeUrl(value: unknown): string | undefined {
    const candidate =
      typeof value === 'string'
        ? value.trim()
        : value && typeof value === 'object' && typeof (value as Partial<ConfirmParkingResponseDto>).challengeUrl === 'string'
          ? (value as Partial<ConfirmParkingResponseDto>).challengeUrl!.trim()
          : '';
    return /^https?:\/\//i.test(candidate) ? candidate : undefined;
  }

  private operationId(value: unknown): number | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const candidate = (value as Partial<ConfirmParkingResponseDto>).operationId;
    return typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0 ? candidate : undefined;
  }
}
