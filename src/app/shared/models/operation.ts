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
  contractId?: number;
  contractName?: string;
  fineNumber?: string;
  fineProcessingDate?: string;
  fineArticle?: string;
  fineVehicleColor?: string;
  fineVehicleMake?: string;
  fineStatus?: 1 | 2 | 3;
  fineStreet?: string;
  fineStreetNumber?: string;
  fineValidDate?: string;
  fineAmount?: number;
  cityId?: number;
  cityName?: string;
  zoneId?: number;
  zoneName?: string;
  sectorId?: number;
  sectorName?: string;
  latitude?: number;
  longitude?: number;
}
