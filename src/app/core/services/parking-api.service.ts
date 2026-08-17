import { Injectable } from '@angular/core';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';

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
  source: 'remote' | 'mock';
  error?: unknown;
}

interface UnparkingResponseDto {
  tariffType: number;
  tariffTime: number;
  payAmount: number;
  dateInitial: string;
  dateEnd: string;
  moneyReturned: number;
}

export interface ParkingTicketOption {
  id: string;
  name: string;
  desc: string;
  price: string;
}

@Injectable({ providedIn: 'root' })
export class ParkingApiService {
  constructor(
    private readonly api: OpsApiClient,
    private readonly session: OpsSessionService,
  ) {}

  async confirmParking(input: ConfirmParkingInput): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token) return { success: true, source: 'mock' };
    try {
      await this.api.post<string>(
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
      return { success: true, source: 'remote' };
    } catch (error) {
      console.warn('[OPS API] Confirmación de aparcamiento utiliza fallback mock', error);
      return { success: true, source: 'mock', error };
    }
  }

  async unpark(input: { contractId: number; plate: string; groupId: number; ticketId: number }): Promise<ParkingApiResult> {
    const token = this.session.token();
    if (!token) return { success: true, source: 'mock' };
    try {
      const quote = await this.api.post<UnparkingResponseDto>(OPS_ENDPOINTS.parking.queryUnparking, input, { token });
      await this.api.post<string>(
        OPS_ENDPOINTS.parking.confirmUnparking,
        {
          contractId: input.contractId,
          plate: input.plate,
          quantity: quote.moneyReturned,
          groupId: input.groupId,
          ticketId: input.ticketId,
          cloudToken: '',
          operatingSystem: 1,
        },
        { token },
      );
      return { success: true, source: 'remote' };
    } catch (error) {
      console.warn('[OPS API] Desaparcar utiliza fallback mock', error);
      return { success: true, source: 'mock', error };
    }
  }

  async tickets(input: {
    contractId: number;
    plate: string;
    zone: number;
    date: string;
  }): Promise<{ data: ParkingTicketOption[]; source: 'remote' | 'mock' }> {
    const token = this.session.token();
    if (!token) return { data: [], source: 'mock' };
    try {
      const response = await this.api.post<{
        ticketlist: Array<{ ticketId: number; ticketDesc: string; minAmount: number; schedule: string; ticketBehText: string }> | null;
      }>(OPS_ENDPOINTS.parking.tickets, { ...input, language: 'ES' }, { token });
      return {
        data: (response.ticketlist ?? []).map((ticket) => ({
          id: String(ticket.ticketId),
          name: ticket.ticketDesc,
          desc: ticket.ticketBehText || ticket.schedule,
          price: `${(ticket.minAmount / 100).toFixed(2).replace('.', ',')} €`,
        })),
        source: 'remote',
      };
    } catch (error) {
      console.warn('[OPS API] Tarifas utiliza fallback mock', error);
      return { data: [], source: 'mock' };
    }
  }
}
