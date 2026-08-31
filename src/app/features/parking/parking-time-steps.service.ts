import { inject, Injectable, signal } from '@angular/core';
import { OPS_ENDPOINTS } from '../../core/api/ops-endpoints';
import { OpsApiClient } from '../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../core/api/ops-session.service';
import { OpsApiError } from '../../core/api/ops-api.types';
import type { ParkingTimeStep, ParkingTimeStepInput } from './models/parking-time-step.model';
import { formatOpsDate } from '../../core/utils/ops-date';

interface ParkingTimeStepsResponseDto {
  result?: number;
  tariffType?: number;
  ticketId?: number;
  ticketDesc?: string;
  groupId?: number;
  operationType?: number;
  payAmountMin?: number;
  payAmountMax?: number;
  timeAmountMin?: number;
  timeAmountMax?: number;
  dateMin?: string;
  dateMax?: string;
  dateInitial: string;
  dateEnd?: string;
  accumulatedQuantity?: number;
  accumulatedTime?: number;
  operationBase?: number;
  timeBalanceUsed?: number;
  steps: { time: number; quantity: number; datetime: string }[] | null;
}

@Injectable({ providedIn: 'root' })
export class ParkingTimeStepsService {
  private readonly steps = signal<ParkingTimeStep[]>([]);
  readonly vm = this.steps.asReadonly();
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  async queryTimeSteps(input: ParkingTimeStepInput): Promise<ParkingTimeStep[]> {
    const token = this.session.token();
    if (!token || input.contractId === undefined || input.sectorId === undefined || input.ticketId === undefined || !input.plate) {
      this.source.set('error');
      throw new OpsApiError(
        'invalid-response',
        OPS_ENDPOINTS.parking.queryParking,
        'Faltan datos para consultar los tramos de aparcamiento',
      );
    }
    try {
      const response = await this.api.post<ParkingTimeStepsResponseDto>(
        OPS_ENDPOINTS.parking.queryParking,
        {
          contractId: input.contractId,
          sector: input.sectorId,
          ticket: input.ticketId,
          plate: input.plate,
          datetime: this.opsDate(input.startDate ?? (this.api.serverNow ? this.api.serverNow() : new Date())),
          groupId: input.sectorId,
          ticketId: input.ticketId,
        },
        { token },
      );
      const mapped = (response.steps ?? []).map((step) => ({
        tariffType: response.tariffType ?? 0,
        time: step.time,
        quantity: step.quantity,
        timeFormatted: this.durationLabel(step.time),
        hourMinute: `${Math.floor(step.time / 60)}:${String(step.time % 60).padStart(2, '0')}`,
        dayDescriptor: 'hoy',
        datetimeRaw: step.datetime,
        amount: step.quantity / 100,
      }));
      if (!mapped.length) throw new Error('El servicio no devolvió tramos de tiempo');
      this.steps.set(mapped);
      this.source.set('remote');
      return mapped;
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  private durationLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours === 0 ? `${minutes} min` : remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
  }

  private opsDate(date: Date): string {
    return formatOpsDate(date);
  }
}
