import { inject, Injectable, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';

export interface UserAddress {
  street: string;
  number: string;
  floor: string;
  door: string;
  stair: string;
  letter: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface UserData {
  name: string;
  surname: string;
  secondSurname: string;
  email: string;
  nif: string;
  phone: string;
  address: UserAddress;
}

export interface UserMutationResult {
  success: boolean;
  source: 'remote' | 'error';
}

interface UserApiPayload {
  names?: unknown;
  firstSurname?: unknown;
  secondSurname?: unknown;
  email?: unknown;
  userName?: unknown;
  nif?: unknown;
  mainMobilePhone?: unknown;
  alternativeMobilePhone?: unknown;
  addressStreetName?: unknown;
  addressBuildingNumber?: unknown;
  addressDepartmentFloor?: unknown;
  addressDepartmentDoor?: unknown;
  addressDepartmentStair?: unknown;
  addressLetterNumber?: unknown;
  addressCity?: unknown;
  addressProvince?: unknown;
  addressPostalCode?: unknown;
  addressCountry?: unknown;
  cloudToken?: unknown;
  contractId?: unknown;
  operatingSystem?: unknown;
  password?: unknown;
  version?: unknown;
  validateConditions?: unknown;
  firstLogin?: unknown;
}

function emptyAddress(): UserAddress {
  return { street: '', number: '', floor: '', door: '', stair: '', letter: '', city: '', province: '', postalCode: '', country: 'ESPANA' };
}

function readString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  private readonly emptyUser: UserData = {
    name: '',
    surname: '',
    secondSurname: '',
    email: '',
    nif: '',
    phone: '',
    address: emptyAddress(),
  };

  private readonly state = signal<UserData>(this.emptyUser);
  private readonly sourceState = signal<'idle' | 'remote' | 'error'>('idle');
  private readonly errorState = signal<OpsApiError | null>(null);
  private remoteProfile: UserApiPayload | null = null;

  readonly user = this.state.asReadonly();
  readonly source = this.sourceState.asReadonly();
  readonly lastError = this.errorState.asReadonly();

  async load(): Promise<UserData> {
    const token = this.session.token();
    if (!token) {
      this.state.set(this.emptyUser);
      this.sourceState.set('error');
      return this.state();
    }

    try {
      const value = await this.api.get<UserApiPayload>(OPS_ENDPOINTS.user.query, { token });
      this.remoteProfile = value;
      this.state.set(this.fromApi(value, this.state()));
      this.sourceState.set('remote');
      this.errorState.set(null);
      return this.state();
    } catch (error) {
      const apiError = error instanceof OpsApiError ? error : new OpsApiError('invalid-response', OPS_ENDPOINTS.user.query, String(error));
      this.state.set(this.emptyUser);
      this.sourceState.set('error');
      this.errorState.set(apiError);
      return this.state();
    }
  }

  async save(changes: Partial<UserData>): Promise<UserMutationResult> {
    const current = this.state();
    const next: UserData = {
      ...current,
      ...changes,
      address: { ...current.address, ...(changes.address ?? {}) },
    };

    const result = await this.remoteUpdate(next);
    if (result.success) {
      this.state.set(next);
    }
    return result;
  }

  updateLocal(changes: Partial<UserData>): void {
    const current = this.state();
    this.state.set({
      ...current,
      ...changes,
      address: { ...current.address, ...(changes.address ?? {}) },
    });
  }

  private async remoteUpdate(user: UserData): Promise<UserMutationResult> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('error');
      return { success: false, source: 'error' };
    }

    try {
      await this.api.post<string>(OPS_ENDPOINTS.user.update, this.toApiBody(user), { token });
      this.sourceState.set('remote');
      this.errorState.set(null);
      return { success: true, source: 'remote' };
    } catch (error) {
      const apiError =
        error instanceof OpsApiError
          ? error
          : new OpsApiError('invalid-response', OPS_ENDPOINTS.user.update, error instanceof Error ? error.message : 'Error desconocido');
      this.sourceState.set('error');
      this.errorState.set(apiError);
      return { success: false, source: 'error' };
    }
  }

  private fromApi(value: UserApiPayload, base: UserData): UserData {
    return {
      name: readString(value.names) || base.name,
      surname: readString(value.firstSurname) || base.surname,
      secondSurname: readString(value.secondSurname),
      email: readString(value.email) || base.email,
      nif: readString(value.nif),
      phone: readString(value.mainMobilePhone),
      address: {
        street: readString(value.addressStreetName),
        number: readString(value.addressBuildingNumber),
        floor: readString(value.addressDepartmentFloor),
        door: readString(value.addressDepartmentDoor),
        stair: readString(value.addressDepartmentStair),
        letter: readString(value.addressLetterNumber),
        city: readString(value.addressCity),
        province: readString(value.addressProvince),
        postalCode: readString(value.addressPostalCode),
        country: readString(value.addressCountry) || base.address.country,
      },
    };
  }

  private toApiBody(user: UserData): Record<string, unknown> {
    const profile = this.remoteProfile ?? {};
    return {
      ...profile,
      cloudToken: readString(profile.cloudToken),
      version: readString(profile.version) || '4.0.0',
      operatingSystem: 3,
      contractId: Number(profile.contractId) || 0,
      userName: readString(profile.userName) || user.email,
      password: readString(profile.password),
      names: user.name,
      firstSurname: user.surname,
      secondSurname: user.secondSurname,
      email: user.email,
      nif: user.nif,
      mainMobilePhone: user.phone,
      alternativeMobilePhone: '',
      addressStreetName: user.address.street,
      addressBuildingNumber: user.address.number,
      addressCity: user.address.city,
      addressProvince: user.address.province,
      addressPostalCode: user.address.postalCode,
      addressCountry: user.address.country,
      addressDepartmentFloor: user.address.floor,
      addressDepartmentDoor: user.address.door,
      addressDepartmentStair: user.address.stair,
      addressLetterNumber: user.address.letter,
    };
  }

}
