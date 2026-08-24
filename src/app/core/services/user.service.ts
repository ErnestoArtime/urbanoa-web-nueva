import { inject, Injectable, signal } from '@angular/core';
import { MOCK_USER } from '../../shared/mock-data';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError, type DataSource } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { getOrCreateCloudToken, APP_VERSION } from '../http/api-client';
import { readStorage, writeStorage } from '../storage/signal-storage';

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
  source: DataSource;
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

  private readonly storageKey = 'urbanoa.user-profile';
  private readonly fallbackUser: UserData = {
    name: MOCK_USER.name,
    surname: MOCK_USER.surname,
    secondSurname: '',
    email: MOCK_USER.email,
    nif: MOCK_USER.nif,
    phone: MOCK_USER.phone,
    address: emptyAddress(),
  };

  private readonly state = signal<UserData>(readStorage(this.storageKey, this.fallbackUser));
  private readonly sourceState = signal<DataSource>('mock');
  private readonly errorState = signal<OpsApiError | null>(null);

  readonly user = this.state.asReadonly();
  readonly source = this.sourceState.asReadonly();
  readonly lastError = this.errorState.asReadonly();

  async load(): Promise<void> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('mock');
      return;
    }

    try {
      const value = await this.api.get<UserApiPayload>(OPS_ENDPOINTS.user.query, { token });
      this.state.set(this.fromApi(value, this.state()));
      this.sourceState.set('remote');
      this.errorState.set(null);
      this.persist();
    } catch (error) {
      const apiError = error instanceof OpsApiError ? error : new OpsApiError('invalid-response', OPS_ENDPOINTS.user.query, String(error));
      this.sourceState.set('mock');
      this.errorState.set(apiError);
      console.warn('[OPS API] Se conservan los datos locales del perfil', apiError);
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
      this.persist();
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
    this.persist();
  }

  private async remoteUpdate(user: UserData): Promise<UserMutationResult> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('mock');
      return { success: true, source: 'mock' };
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
      this.sourceState.set('mock');
      this.errorState.set(apiError);
      console.warn('[OPS API] Actualización de perfil aplicada solo localmente', apiError);
      return { success: false, source: 'mock' };
    }
  }

  private fromApi(value: UserApiPayload, fallback: UserData): UserData {
    return {
      name: readString(value.names) || fallback.name,
      surname: readString(value.firstSurname) || fallback.surname,
      secondSurname: readString(value.secondSurname),
      email: readString(value.email) || fallback.email,
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
        country: readString(value.addressCountry) || fallback.address.country,
      },
    };
  }

  private toApiBody(user: UserData): Record<string, unknown> {
    return {
      cloudToken: getOrCreateCloudToken(),
      appVersion: APP_VERSION,
      operatingSystem: 1,
      contractId: 0,
      userName: user.email,
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

  private persist(): void {
    writeStorage(this.storageKey, this.state());
  }
}
