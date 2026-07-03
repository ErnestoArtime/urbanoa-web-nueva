import { Injectable, signal } from '@angular/core';
import { MOCK_USER } from '../../shared/mock-data';

export interface UserData {
  name: string;
  surname: string;
  email: string;
  nif: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly user = signal<UserData>({
    name: MOCK_USER.name,
    surname: MOCK_USER.surname,
    email: MOCK_USER.email,
    nif: MOCK_USER.nif,
    phone: MOCK_USER.phone,
  });

  updateUser(data: UserData): void {
    this.user.set(data);
  }
}
