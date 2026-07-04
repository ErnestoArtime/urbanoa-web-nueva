import { Injectable, signal } from '@angular/core';

export interface ParkingTimeStep {
  time: number;
  quantity: number;
  timeFormatted: string;
  hourMinute: string;
  dayDescriptor: string;
  datetimeRaw: string;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingTimeStepsService {
  private readonly steps = signal<ParkingTimeStep[]>(this.generateDefaultSteps());
  readonly vm = this.steps.asReadonly();

  private generateDefaultSteps(): ParkingTimeStep[] {
    const now = new Date();
    const prices = [0.60, 0.60, 0.90, 1.20, 1.80];

    return [
      { time: 30, quantity: 1, timeFormatted: '30 min', hourMinute: '0:30', dayDescriptor: 'hoy', datetimeRaw: now.toISOString(), amount: prices[0] },
      { time: 60, quantity: 1, timeFormatted: '1 h', hourMinute: '1:00', dayDescriptor: 'hoy', datetimeRaw: now.toISOString(), amount: prices[1] },
      { time: 90, quantity: 1, timeFormatted: '1 h 30 min', hourMinute: '1:30', dayDescriptor: 'hoy', datetimeRaw: now.toISOString(), amount: prices[2] },
      { time: 120, quantity: 1, timeFormatted: '2 h', hourMinute: '2:00', dayDescriptor: 'hoy', datetimeRaw: now.toISOString(), amount: prices[3] },
      { time: 180, quantity: 1, timeFormatted: '3 h', hourMinute: '3:00', dayDescriptor: 'hoy', datetimeRaw: now.toISOString(), amount: prices[4] },
    ];
  }

  setSteps(steps: ParkingTimeStep[]): void {
    this.steps.set(steps);
  }

  getStepByTime(minutes: number): ParkingTimeStep | undefined {
    return this.steps().find(s => s.time === minutes);
  }
}
