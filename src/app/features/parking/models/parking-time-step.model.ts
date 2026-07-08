export interface ParkingTimeStep {
  time: number;
  quantity: number;
  timeFormatted: string;
  hourMinute: string;
  dayDescriptor: string;
  datetimeRaw: string;
  amount: number;
}

export interface ParkingTimeStepInput {
  tariffId: string;
  tariffPrice: number;
  startDate?: Date;
  maxMinutes?: number;
  stepMinutes?: number;
}

export interface ParkingPaymentSummary {
  method: 'balance' | 'card' | 'mixed';
  balanceUsed: number;
  cardUsed: number;
  total: number;
}
