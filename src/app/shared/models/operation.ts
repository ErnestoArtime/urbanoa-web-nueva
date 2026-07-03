import type { OperationType } from './operation-type';

export interface Operation {
  id: string;
  type: OperationType;
  plate: string | null;
  date: string;
  amount: number;
  zone: string | null;
}
