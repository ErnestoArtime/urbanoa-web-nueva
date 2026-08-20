import { Injectable, signal } from '@angular/core';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';

export interface NotificationPreferences {
  balance: number;
  fineNotifications: number;
  quantityBalance: number;
  rechargeNotifications: number;
  minutesBeforeUnparking: number;
  unparkingNotifications: number;
  emailBalance: number;
  emailFineNotifications: number;
  emailRechargeNotifications: number;
  emailUnparkingNotifications: number;
  emailParkingNotifications: number;
}

const DEFAULTS: NotificationPreferences = {
  balance: 1,
  fineNotifications: 1,
  quantityBalance: 500,
  rechargeNotifications: 1,
  minutesBeforeUnparking: 10,
  unparkingNotifications: 1,
  emailBalance: 0,
  emailFineNotifications: 0,
  emailRechargeNotifications: 0,
  emailUnparkingNotifications: 0,
  emailParkingNotifications: 1,
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly preferences = signal<NotificationPreferences>({ ...DEFAULTS });
  readonly source = signal<'remote' | 'mock'>('mock');

  constructor(
    private readonly api: OpsApiClient,
    private readonly session: OpsSessionService,
  ) {}

  async load(): Promise<NotificationPreferences> {
    const token = this.session.token();
    if (!token) return this.preferences();
    try {
      const response = await this.api.get<{ notifications: NotificationPreferences }>(OPS_ENDPOINTS.user.notifications, { token });
      this.preferences.set({ ...DEFAULTS, ...response.notifications });
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Notificaciones utiliza fallback mock', error);
      this.source.set('mock');
    }
    return this.preferences();
  }

  async save(preferences: NotificationPreferences): Promise<'remote' | 'mock'> {
    this.preferences.set(preferences);
    const token = this.session.token();
    if (!token) {
      this.source.set('mock');
      return 'mock';
    }
    try {
      await this.api.post<string>(OPS_ENDPOINTS.user.updateNotifications, { contractId: 0, notifications: preferences }, { token });
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Guardado de notificaciones utiliza fallback mock', error);
      this.source.set('mock');
    }
    return this.source();
  }
}
