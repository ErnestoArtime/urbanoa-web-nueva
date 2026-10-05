import { computed, Injectable, signal } from '@angular/core';

export type LocationPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';
export type LocationSetupStatus = 'granted' | 'denied' | 'unsupported' | 'error';

export interface LocationSettings {
  permissionState: LocationPermissionState;
  useCurrentLocation: boolean;
  preferredCityId?: string;
  preferredCityName?: string;
  preferredContractId?: number;
  preferredCitySyncPending?: boolean;
  lastLatitude?: number;
  lastLongitude?: number;
  lastUpdatedAt?: string;
}

export interface LocationSetupResult {
  ok: boolean;
  status: LocationSetupStatus;
}

@Injectable({ providedIn: 'root' })
export class LocationSettingsService {
  private readonly storagePrefix = 'urbanoa.location-settings';
  private userScope = 'anonymous';
  private readonly state = signal<LocationSettings>(this.readSettings());

  readonly settings = this.state.asReadonly();
  readonly isConfigured = computed(() => {
    const s = this.state();
    return s.permissionState === 'granted' || !!s.preferredCityId;
  });

  setUserScope(userId?: string): void {
    const nextScope = userId?.trim() ? userId.trim().toLocaleLowerCase() : 'anonymous';
    if (nextScope === this.userScope) return;
    this.userScope = nextScope;
    this.state.set(this.readSettings());
  }

  async refreshPermissionState(): Promise<LocationPermissionState> {
    const scope = this.userScope;
    if (!navigator.geolocation) {
      this.patch({ permissionState: 'unsupported', useCurrentLocation: false });
      return 'unsupported';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (scope !== this.userScope) return this.state().permissionState;
      const permissionState = permission.state as LocationPermissionState;
      this.patch({ permissionState });
      return permissionState;
    } catch {
      return this.state().permissionState;
    }
  }

  async requestCurrentLocation(): Promise<LocationSetupResult> {
    const scope = this.userScope;
    if (!navigator.geolocation) {
      this.patch({ permissionState: 'unsupported', useCurrentLocation: false });
      return { ok: false, status: 'unsupported' };
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      if (scope !== this.userScope) return { ok: false, status: 'error' };
      this.patch({
        permissionState: 'granted',
        useCurrentLocation: true,
        lastLatitude: position.coords.latitude,
        lastLongitude: position.coords.longitude,
        lastUpdatedAt: new Date().toISOString(),
      });
      return { ok: true, status: 'granted' };
    } catch {
      if (scope !== this.userScope) return { ok: false, status: 'error' };
      const permissionState = await this.refreshPermissionState();
      if (scope !== this.userScope) return { ok: false, status: 'error' };
      if (permissionState !== 'granted') {
        this.patch({ useCurrentLocation: false, lastLatitude: undefined, lastLongitude: undefined });
      }
      return { ok: false, status: permissionState === 'denied' ? 'denied' : 'error' };
    }
  }

  setPreferredCity(cityId: string, cityName: string, contractId?: number, syncPending = false): void {
    if (!cityId.trim() || !cityName.trim()) throw new Error('El municipio preferido es obligatorio');
    this.patch({
      preferredCityId: cityId,
      preferredCityName: cityName,
      preferredContractId: Number.isFinite(contractId) && contractId! > 0 ? contractId : undefined,
      preferredCitySyncPending: syncPending,
      useCurrentLocation: false,
    });
  }

  confirmPreferredCitySync(savedSettings: LocationSettings): void {
    // Ignore confirmations for a different account or a newer local selection.
    if (this.state() === savedSettings) this.patch({ preferredCitySyncPending: false });
  }

  disableCurrentLocation(): void {
    this.patch({
      useCurrentLocation: false,
      lastLatitude: undefined,
      lastLongitude: undefined,
    });
  }

  toggleUseCurrentLocation(enabled: boolean): void {
    if (enabled) {
      this.patch({ useCurrentLocation: true });
      return;
    }
    this.disableCurrentLocation();
  }

  reset(): void {
    this.state.set(this.defaults());
    this.persist();
  }

  private patch(changes: Partial<LocationSettings>): void {
    this.state.update((settings) => ({ ...settings, ...changes }));
    this.persist();
  }

  private readSettings(): LocationSettings {
    try {
      const scopedKey = `${this.storagePrefix}.${encodeURIComponent(this.userScope)}`;
      const raw = localStorage.getItem(scopedKey);
      const parsed = JSON.parse(raw ?? 'null') as LocationSettings | null;
      if (parsed && typeof parsed === 'object') return { ...this.defaults(), ...parsed };
    } catch {
      // Fall back to defaults when storage is unavailable or malformed.
    }
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
      localStorage.setItem(`${this.storagePrefix}.${encodeURIComponent(this.userScope)}`, JSON.stringify(this.state()));
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }
  }
}
