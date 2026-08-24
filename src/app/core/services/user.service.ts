import { inject, Injectable, signal } from '@angular/core';
import { MOCK_USER } from '../../shared/mock-data';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { readStorage, writeStorage } from '../storage/signal-storage';

export interface UserData {
  name: string;
  surname: string;
  secondSurname?: string;
  email: string;
  nif: string;
  phone: string;
  alternativePhone?: string;
  street?: string;
  buildingNumber?: string;
  door?: string;
  floor?: string;
  letter?: string;
  stair?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
}

interface OpsUserProfile {
  addressBuildingNumber?: string;
  addressCity?: string;
  addressDepartmentDoor?: string;
  addressDepartmentFloor?: string;
  addressLetterNumber?: string;
  addressDepartmentStair?: string;
  alternativeMobilePhone?: string;
  addressPostalCode?: string;
  addressProvince?: string;
  addressStreetName?: string;
  addressCountry?: string;
  cloudToken?: string;
  contractId?: number;
  email: string;
  firstSurname: string;
  mainMobilePhone?: string;
  names: string;
  nif?: string;
  operatingSystem?: number;
  secondSurname?: string;
  userName?: string;
  password?: string;
  version?: string;
  validateConditions?: number;
  firstLogin?: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly storageKey = 'urbanoa.user-profile';
  private readonly fallbackUser: UserData = {
    name: MOCK_USER.name,
    surname: MOCK_USER.surname,
    email: MOCK_USER.email,
    nif: MOCK_USER.nif,
    phone: MOCK_USER.phone,
  };

  readonly user = signal<UserData>(readStorage(this.storageKey, this.fallbackUser));
  readonly source = signal<'remote' | 'mock'>('mock');
  readonly loading = signal(false);

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private remoteProfile: OpsUserProfile | null = null;

  updateUser(data: UserData): void {
    this.user.set(data);
    writeStorage(this.storageKey, data);
  }

  async load(): Promise<UserData> {
    const token = this.session.token();
    if (!token) return this.user();

    this.loading.set(true);
    try {
      const profile = await this.api.get<OpsUserProfile>(OPS_ENDPOINTS.user.query, { token });
      this.remoteProfile = profile;
      const data = this.fromRemote(profile);
      this.updateUser(data);
      this.source.set('remote');
      return data;
    } catch (error) {
      console.warn('[OPS API] Perfil utiliza fallback local', error);
      this.source.set('mock');
      return this.user();
    } finally {
      this.loading.set(false);
    }
  }

  async save(changes: Partial<UserData>): Promise<'remote' | 'mock'> {
    const next = { ...this.user(), ...changes };
    this.updateUser(next);

    const token = this.session.token();
    if (!token) {
      this.source.set('mock');
      return 'mock';
    }

    try {
      const profile = this.remoteProfile ?? (await this.api.get<OpsUserProfile>(OPS_ENDPOINTS.user.query, { token }));
      const payload: OpsUserProfile = {
        ...profile,
        names: next.name,
        firstSurname: next.surname,
        secondSurname: next.secondSurname ?? profile.secondSurname ?? '',
        email: next.email,
        nif: next.nif,
        mainMobilePhone: next.phone,
        alternativeMobilePhone: next.alternativePhone ?? profile.alternativeMobilePhone ?? '',
        addressStreetName: next.street ?? profile.addressStreetName ?? '',
        addressBuildingNumber: next.buildingNumber ?? profile.addressBuildingNumber ?? '',
        addressDepartmentDoor: next.door ?? profile.addressDepartmentDoor ?? '',
        addressDepartmentFloor: next.floor ?? profile.addressDepartmentFloor ?? '',
        addressLetterNumber: next.letter ?? profile.addressLetterNumber ?? '',
        addressDepartmentStair: next.stair ?? profile.addressDepartmentStair ?? '',
        addressPostalCode: next.postalCode ?? profile.addressPostalCode ?? '',
        addressCity: next.city ?? profile.addressCity ?? '',
        addressProvince: next.province ?? profile.addressProvince ?? '',
        addressCountry: next.country ?? profile.addressCountry ?? '',
        cloudToken: profile.cloudToken ?? '',
        contractId: profile.contractId ?? 0,
        operatingSystem: 3,
        version: profile.version ?? '4.0.0',
        password: profile.password ?? '',
      };
      await this.api.post<string>(OPS_ENDPOINTS.user.update, payload, { token });
      this.remoteProfile = payload;
      this.source.set('remote');
      return 'remote';
    } catch (error) {
      console.warn('[OPS API] Actualización de perfil utiliza fallback local', error);
      this.source.set('mock');
      return 'mock';
    }
  }

  private fromRemote(profile: OpsUserProfile): UserData {
    return {
      name: profile.names ?? '',
      surname: profile.firstSurname ?? '',
      secondSurname: profile.secondSurname ?? '',
      email: profile.email ?? '',
      nif: profile.nif ?? '',
      phone: profile.mainMobilePhone ?? '',
      alternativePhone: profile.alternativeMobilePhone ?? '',
      street: profile.addressStreetName ?? '',
      buildingNumber: profile.addressBuildingNumber ?? '',
      door: profile.addressDepartmentDoor ?? '',
      floor: profile.addressDepartmentFloor ?? '',
      letter: profile.addressLetterNumber ?? '',
      stair: profile.addressDepartmentStair ?? '',
      postalCode: profile.addressPostalCode ?? '',
      city: profile.addressCity ?? '',
      province: profile.addressProvince ?? '',
      country: profile.addressCountry ?? '',
    };
  }
}
