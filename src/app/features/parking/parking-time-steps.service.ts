import { inject, Injectable, signal } from '@angular/core';
import { OPS_ENDPOINTS } from '../../core/api/ops-endpoints';
import { OpsApiClient } from '../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../core/api/ops-session.service';
import { OpsApiError } from '../../core/api/ops-api.types';
import type { ParkingTimeStep, ParkingTimeStepInput } from './models/parking-time-step.model';
import { formatOpsDate } from '../../core/utils/ops-date';
import { formatParkingDuration } from '../../core/utils/parking-duration';

export class NoParkingTimeAvailableError extends Error {
  constructor() {
    super('No quedan tramos de tiempo disponibles para ampliar el aparcamiento');
    this.name = 'NoParkingTimeAvailableError';
  }
}

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
      const mapped = (response.steps ?? [])
        .filter((step) => Number.isFinite(step.time) && step.time > 0)
        .map((step) => ({
          tariffType: response.tariffType ?? 0,
          time: step.time,
          quantity: step.quantity,
          timeFormatted: formatParkingDuration(step.time),
          hourMinute: `${Math.floor(step.time / 60)}:${String(step.time % 60).padStart(2, '0')}`,
          dayDescriptor: 'hoy',
          datetimeRaw: step.datetime,
          startDatetimeRaw: response.dateInitial,
          amount: step.quantity / 100,
        }));
      if (!mapped.length) throw new NoParkingTimeAvailableError();
      this.steps.set(mapped);
      this.source.set('remote');
      return mapped;
    } catch (error) {
      this.source.set('error');
      throw error;
    }
  }

  private opsDate(date: Date): string {
    return formatOpsDate(date);
  }
}
