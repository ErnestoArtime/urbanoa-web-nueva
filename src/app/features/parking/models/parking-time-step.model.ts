export interface ParkingTimeStep {
  tariffType: number;
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
  contractId?: number;
  sectorId?: number;
  ticketId?: number;
  plate?: string;
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
