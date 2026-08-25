export interface OpsLoginRequest {
  userName: string;
  password: string;
  cloudToken: string;
  operatingSystem: number;
  appVersion: string;
  language: string;
}

export interface OpsLoginResponse {
  token: string;
  firstLogin: number;
}

export interface OpsRegisterRequest {
  contractId: number;
  email: string;
  password: string;
  plates: { plate: string }[];
}

export interface OpsUserResponse {
  contractId?: string | number;
  email?: string;
  firstSurname?: string;
  mainMobilePhone?: string;
  names?: string;
  nif?: string;
  secondSurname?: string;
  userName?: string;
  firstLogin?: number;
  addressStreetName?: string;
  addressBuildingNumber?: string;
  addressDepartmentFloor?: string;
  addressDepartmentDoor?: string;
  addressDepartmentStair?: string;
  addressLetterNumber?: string;
  addressCity?: string;
  addressProvince?: string;
  addressPostalCode?: string;
  addressCountry?: string;
}
