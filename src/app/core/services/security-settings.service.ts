import { Injectable, signal } from '@angular/core';
import { readStorage, writeStorage } from '../storage/signal-storage';

export type BiometricMode = 'none' | 'fingerprint' | 'face';

export interface SecuritySettings {
  unlockEnabled: boolean;
  biometricMode: BiometricMode;
}

const DEFAULT_SETTINGS: SecuritySettings = { unlockEnabled: false, biometricMode: 'none' };

@Injectable({ providedIn: 'root' })
export class SecuritySettingsService {
  private readonly storageKey = 'urbanoa.security-settings';
  readonly settings = signal<SecuritySettings>(readStorage(this.storageKey, DEFAULT_SETTINGS));

  readonly recommendedMode: Exclude<BiometricMode, 'none'> =
    typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/i.test(navigator.userAgent) ? 'face' : 'fingerprint';

  setBiometric(mode: BiometricMode): void {
    this.settings.set({ unlockEnabled: mode !== 'none', biometricMode: mode });
    this.persist();
  }

  clearLocalUserData(): void {
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('urbanoa.'))
        .forEach((key) => localStorage.removeItem(key));
    }
    this.settings.set(DEFAULT_SETTINGS);
  }

  private persist(): void {
    writeStorage(this.storageKey, this.settings());
  }
}
