import type { OperationType } from './operation-type';

export interface OperationPaymentBreakdown {
  walletAmount: number;
  cardAmount: number;
  cardLabel?: string;
}

export interface Operation {
  id: string;
  type: OperationType;
  plate: string | null;
  date: string;
  amount: number;
  zone: string | null;
  relatedOperationId?: string;
  cardId?: string;
  cardLabel?: string;
  paymentBreakdown?: OperationPaymentBreakdown;
  durationLabel?: string;
  startTime?: string;
  endTime?: string;
}
