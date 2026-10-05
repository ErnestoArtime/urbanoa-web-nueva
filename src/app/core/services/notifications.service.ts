import { DestroyRef, inject, Injectable, signal } from '@angular/core';
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
  feedbackNotifications?: number;
  emailFeedbackNotifications?: number;
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
  feedbackNotifications: 1,
  emailFeedbackNotifications: 0,
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly preferences = signal<NotificationPreferences>({ ...DEFAULTS });
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private generation = 0;

  constructor() {
    const unsubscribe = this.session.onChange?.(() => this.reset());
    inject(DestroyRef).onDestroy(() => unsubscribe?.());
  }

  reset(): void {
    this.generation++;
    this.preferences.set({ ...DEFAULTS });
    this.source.set('idle');
  }

  async load(): Promise<NotificationPreferences> {
    const generation = this.generation;
    const token = this.session.token();
    if (!token) {
      this.source.set('error');
      return this.preferences();
    }
    try {
      const response = await this.api.get<{ notifications: NotificationPreferences }>(OPS_ENDPOINTS.user.notifications, { token });
      if (generation !== this.generation) return this.preferences();
      this.preferences.set({ ...DEFAULTS, ...response.notifications });
      this.source.set('remote');
    } catch (error) {
      if (generation !== this.generation) return this.preferences();
      console.warn('[OPS API] No se pudieron cargar las notificaciones', error);
      this.source.set('error');
    }
    return this.preferences();
  }

  async save(preferences: NotificationPreferences): Promise<'remote' | 'error'> {
    const generation = this.generation;
    const token = this.session.token();
    if (!token) {
      this.source.set('error');
      return 'error';
    }
    try {
      await this.api.post<string>(OPS_ENDPOINTS.user.updateNotifications, { contractId: 0, notifications: preferences }, { token });
      if (generation !== this.generation) return 'error';
      this.preferences.set(preferences);
      this.source.set('remote');
    } catch (error) {
      if (generation !== this.generation) return 'error';
      console.warn('[OPS API] No se pudieron guardar las notificaciones', error);
      this.source.set('error');
    }
    return this.source() === 'remote' ? 'remote' : 'error';
  }
}
