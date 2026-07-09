import { computed, Injectable, signal } from '@angular/core';

export type LocationPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface LocationSettings {
  permissionState: LocationPermissionState;
  useCurrentLocation: boolean;
  preferredCityId?: string;
  preferredCityName?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastUpdatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class LocationSettingsService {
  private readonly storageKey = 'urbanoa.location-settings';
  private readonly state = signal<LocationSettings>(this.readSettings());

  readonly settings = this.state.asReadonly();
  readonly isConfigured = computed(() => {
    const s = this.state();
    return s.permissionState === 'granted' || !!s.preferredCityId;
  });

  private readSettings(): LocationSettings {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null') as LocationSettings | null;
      if (parsed && typeof parsed === 'object') return { ...this.defaults(), ...parsed };
    } catch { /* fall through */ }
    return this.defaults();
  }

  private defaults(): LocationSettings {
    return {
      permissionState: 'unknown',
      useCurrentLocation: false,
    };
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state()));
    } catch { /* storage unavailable */ }
  }

  async refreshPermissionState(): Promise<LocationPermissionState> {
    if (!navigator.geolocation) {
      this.state.update((s) => ({ ...s, permissionState: 'unsupported' }));
      this.persist();
      return 'unsupported';
    }
    try {
      const p = await navigator.permissions.query({ name: 'geolocation' });
      const mapped = p.state as LocationPermissionState;
      this.state.update((s) => ({ ...s, permissionState: mapped }));
      this.persist();
      return mapped;
    } catch {
      const state = this.state().permissionState;
      return state;
    }
  }

  async requestCurrentLocation(): Promise<boolean> {
    if (!navigator.geolocation) {
      this.state.update((s) => ({ ...s, permissionState: 'unsupported' }));
      this.persist();
      return false;
    }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
      this.state.update((s) => ({
        ...s,
        permissionState: 'granted',
        useCurrentLocation: true,
        lastLatitude: pos.coords.latitude,
        lastLongitude: pos.coords.longitude,
        lastUpdatedAt: new Date().toISOString(),
      }));
      this.persist();
      return true;
    } catch {
      await this.refreshPermissionState();
      const s = this.state();
      if (s.permissionState !== 'granted') {
        this.state.update((v) => ({ ...v, useCurrentLocation: false }));
        this.persist();
      }
      return false;
    }
  }

  setPreferredCity(cityId: string, cityName: string): void {
    this.state.update((s) => ({ ...s, preferredCityId: cityId, preferredCityName: cityName, useCurrentLocation: false }));
    this.persist();
  }

  toggleUseCurrentLocation(enabled: boolean): void {
    this.state.update((s) => ({ ...s, useCurrentLocation: enabled }));
    if (!enabled) {
      this.state.update((s) => ({ ...s, lastLatitude: undefined, lastLongitude: undefined }));
    }
    this.persist();
  }

  reset(): void {
    this.state.set(this.defaults());
    this.persist();
  }
}
