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

    const durations: { minutes: number; label: string }[] = [
      { minutes: 30, label: '30 min' },
      { minutes: 60, label: '1 h' },
      { minutes: 90, label: '1 h 30 min' },
      { minutes: 120, label: '2 h' },
      { minutes: 180, label: '3 h' },
    ];

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
