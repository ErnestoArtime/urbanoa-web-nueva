import { Injectable, signal } from '@angular/core';
import type { ParkingTimeStep, ParkingTimeStepInput } from './models/parking-time-step.model';

@Injectable({ providedIn: 'root' })
export class ParkingTimeStepsService {
  private readonly steps = signal<ParkingTimeStep[]>([]);
  readonly vm = this.steps.asReadonly();

  generateSteps(input: ParkingTimeStepInput): ParkingTimeStep[] {
    const now = input.startDate ?? new Date();
    const hourlyPrice = input.tariffPrice;
    const maxMinutes = input.maxMinutes ?? 180;

    const durations = Array.from({ length: Math.floor(maxMinutes / 5) }, (_, index) => {
      const minutes = (index + 1) * 5;
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
    // Future: replace with QueryParkingOperationWithTimeStepsAPI endpoint
    return this.generateSteps(input);
  }

  setSteps(steps: ParkingTimeStep[]): void {
    this.steps.set(steps);
  }

  getStepByTime(minutes: number): ParkingTimeStep | undefined {
    return this.steps().find((s) => s.time === minutes);
  }
}
