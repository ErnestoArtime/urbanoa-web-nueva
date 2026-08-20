const API_PREFIX = 'OPSWebServicesAPI3/';

const endpoint = (name: string): string => `${API_PREFIX}${name}`;

export const OPS_ENDPOINTS = {
  auth: {
    login: endpoint('LoginUserAPI'),
    register: endpoint('RegisterUserAPI'),
    recoverPassword: endpoint('RecoverPasswordAPI'),
    updatePassword: endpoint('UpdatePasswordAPI'),
    resendMail: endpoint('ResendMailAPI'),
  },
  parking: {
    contracts: endpoint('QueryContractsAPI'),
    mapStretches: endpoint('QueryMapStretchesAPI'),
    sectors: endpoint('QuerySectorsAPI'),
    streets: endpoint('QueryStreetsAPI'),
    tickets: endpoint('QueryTicketsAPI'),
    parkingStatus: endpoint('QueryParkingStatusAPI'),
    queryParking: endpoint('QueryParkingOperationWithTimeStepsAPI'),
    confirmParking: endpoint('ConfirmParkingOperationAPI'),
    queryUnparking: endpoint('QueryUnParkingOperationAPI'),
    confirmUnparking: endpoint('ConfirmUnParkingOperationAPI'),
  },
  fines: {
    confirmPayment: endpoint('ConfirmFinePaymentAPI'),
  },
  user: {
    query: endpoint('QueryUserAPI'),
    update: endpoint('UpdateUserAPI'),
    cancel: endpoint('CancelUserAccountAPI'),
    changePassword: endpoint('ChangePasswordAPI'),
    plates: endpoint('QueryUserPlatesAPI'),
    addPlate: endpoint('AddUserPlateAPI'),
    removePlate: endpoint('RemoveUserPlateAPI'),
    updatePlate: endpoint('UpdateUserPlateAPI'),
    notifications: endpoint('QueryUserNotificationsAPI'),
    updateNotifications: endpoint('UpdateUserNotificationsAPI'),
    operations: endpoint('QueryUserOperationsAPI'),
    report: endpoint('QueryUserReportAPI'),
  },
  wallet: {
    credit: endpoint('QueryUserCreditAPI'),
    recharge: endpoint('RechargeUserCreditAPI'),
    refund: endpoint('RefundUserCreditAPI'),
    paymentMethods: endpoint('QueryUserPaymentMethodsAPI'),
    loadPaymentForm: endpoint('LoadPaymentMethodFormAPI'),
    removePaymentMethod: endpoint('RemoveUserPaymentMethodAPI'),
    updatePaymentMethod: endpoint('UpdateUserPaymentMethodAPI'),
  },
  support: {
    add: endpoint('AddUserFeedbackAPI'),
    query: endpoint('QueryUserFeedbackAPI'),
    update: endpoint('UpdateUserFeedbackAPI'),
  },
} as const;
