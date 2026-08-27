const API_PREFIX = 'OPSWebServicesAPI/';
const LEGACY_API_PREFIX = 'OPSWebServicesLegacyAPI/';

const endpoint = (name: string): string => `${API_PREFIX}${name}`;
const legacyEndpoint = (name: string): string => `${LEGACY_API_PREFIX}${name}`;

export const OPS_ENDPOINTS = {
  auth: {
    login: endpoint('LoginUserAPI'),
    register: endpoint('RegisterUserAPI'),
    recoverPassword: endpoint('RecoverPasswordAPI'),
    verifyRecoveryPassword: endpoint('VerifyRecoveryPasswordAPI'),
    updatePassword: endpoint('UpdatePasswordAPI'),
    resendMail: endpoint('ResendMailAPI'),
  },
  parking: {
    contracts: endpoint('QueryContractsAPI'),
    mapStretches: endpoint('QueryMapStretchesAPI'),
    sectors: endpoint('QuerySectorsAPI'),
    zone: endpoint('QueryZoneAPI'),
    place: endpoint('QueryPlaceAPI'),
    streets: endpoint('QueryStreetsAPI'),
    tickets: endpoint('QueryTicketsAPI'),
    parkingStatus: endpoint('QueryParkingStatusAPI'),
    queryParking: endpoint('QueryParkingOperationWithTimeStepsAPI'),
    queryParkingMoneySteps: endpoint('QueryParkingOperationWithMoneyStepsAPI'),
    queryParkingForTime: endpoint('QueryParkingOperationForTimeAPI'),
    queryParkingForMoney: endpoint('QueryParkingOperationForMoneyAPI'),
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
    updatePassword: endpoint('UpdatePasswordAPI'),
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
    removePaymentMethod: endpoint('RemoveUserPaymentMethodAPI'),
    updatePaymentMethod: endpoint('UpdateUserPaymentMethodAPI'),
    loadPaymentForm: legacyEndpoint('LoadPaymentMethodFormAPI'),
  },
  support: {
    add: legacyEndpoint('AddUserFeedbackAPI'),
    query: legacyEndpoint('QueryUserFeedbackAPI'),
    update: legacyEndpoint('UpdateUserFeedbackAPI'),
  },
} as const;
