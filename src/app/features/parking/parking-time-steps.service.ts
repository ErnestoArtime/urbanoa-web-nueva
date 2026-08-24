import { inject, Injectable, signal } from '@angular/core';
import { OPS_ENDPOINTS } from '../../core/api/ops-endpoints';
import { OpsApiClient } from '../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../core/api/ops-session.service';
import type { ParkingTimeStep, ParkingTimeStepInput } from './models/parking-time-step.model';

@Injectable({ providedIn: 'root' })
export class ParkingTimeStepsService {
  private readonly steps = signal<ParkingTimeStep[]>([]);
  readonly vm = this.steps.asReadonly();
  readonly source = signal<'remote' | 'mock'>('mock');

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  generateSteps(input: ParkingTimeStepInput): ParkingTimeStep[] {
    const now = input.startDate ?? new Date();
    const hourlyPrice = input.tariffPrice;
    const maxMinutes = input.maxMinutes ?? 180;
    const stepMinutes = input.stepMinutes ?? 5;

    const durations = Array.from({ length: Math.floor(maxMinutes / stepMinutes) }, (_, index) => {
      const minutes = (index + 1) * stepMinutes;
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      const label = hours === 0 ? `${minutes} min` : remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
      return { minutes, label };
    });

    const steps = durations
      .filter((d) => d.minutes <= maxMinutes)
      .map((d) => {
        const amount = parseFloat(((d.minutes / 60) * hourlyPrice).toFixed(2));
        return {
          time: d.minutes,
          quantity: 1,
          timeFormatted: d.label,
          hourMinute: `${Math.floor(d.minutes / 60)}:${(d.minutes % 60).toString().padStart(2, '0')}`,
          dayDescriptor: 'hoy',
          datetimeRaw: now.toISOString(),
          amount,
        };
      });

    this.steps.set(steps);
    return steps;
  }

  async queryTimeSteps(input: ParkingTimeStepInput): Promise<ParkingTimeStep[]> {
    const token = this.session.token();
    if (!token || input.contractId === undefined || input.sectorId === undefined || input.ticketId === undefined || !input.plate) {
      this.source.set('mock');
      return this.generateSteps(input);
    }
    try {
      const response = await this.api.post<{
        dateInitial: string;
        steps: { time: number; quantity: number; datetime: string }[] | null;
      }>(
        OPS_ENDPOINTS.parking.queryParking,
        {
          contractId: input.contractId,
          sector: input.sectorId,
          ticket: input.ticketId,
          plate: input.plate,
          datetime: (input.startDate ?? new Date()).toISOString(),
        },
        { token },
      );
      const mapped = (response.steps ?? []).map((step) => ({
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
      console.warn('[OPS API] Tramos de aparcamiento utiliza fallback mock', error);
      this.source.set('mock');
      return this.generateSteps(input);
    }
  }

  setSteps(steps: ParkingTimeStep[]): void {
    this.steps.set(steps);
  }

  getStepByTime(minutes: number): ParkingTimeStep | undefined {
    return this.steps().find((s) => s.time === minutes);
  }

  private durationLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours === 0 ? `${minutes} min` : remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
  }
}
