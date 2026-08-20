export enum OperationType {
  PARKING = 1,
  PARKING_EXTENSION = 2,
  REFUND = 3,
  FINE_PAYMENT = 4,
  TOP_UP = 5,
  BALANCE_REFUND = 8,
  UNPAID_FINES = 104,
}

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OperationType.PARKING]: 'ops.type.parking',
  [OperationType.PARKING_EXTENSION]: 'ops.type.extension',
  [OperationType.REFUND]: 'ops.type.parkingEndRefund',
  [OperationType.FINE_PAYMENT]: 'ops.type.denuncia',
  [OperationType.TOP_UP]: 'ops.type.topUp',
  [OperationType.BALANCE_REFUND]: 'ops.type.balanceRefund',
  [OperationType.UNPAID_FINES]: 'ops.type.denuncias',
};
