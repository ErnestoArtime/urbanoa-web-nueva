import { Injectable, signal } from '@angular/core';
import { MOCK_USER } from '../../shared/mock-data';
import { readStorage, writeStorage } from '../storage/signal-storage';

export interface UserData {
  name: string;
  surname: string;
  email: string;
  nif: string;
  phone: string;
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

  updateUser(data: UserData): void {
    this.user.set(data);
    writeStorage(this.storageKey, data);
  }
}
