import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

type GoogleMapsWindow = Window &
  typeof globalThis & {
    google?: typeof google;
    __urbanoaGoogleMapsReady?: () => void;
  };

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly document = inject(DOCUMENT);
  private loadPromise?: Promise<typeof google.maps | null>;

  get configured(): boolean {
    return environment.googleMapsApiKey.trim().length > 0;
  }

  load(): Promise<typeof google.maps | null> {
    if (!this.configured) return Promise.resolve(null);
    if (this.loadPromise) return this.loadPromise;

    const googleWindow = this.document.defaultView as GoogleMapsWindow | null;
    if (!googleWindow) return Promise.resolve(null);
    if (googleWindow.google?.maps) return Promise.resolve(googleWindow.google.maps);

    this.loadPromise = new Promise((resolve) => {
      const callbackName = '__urbanoaGoogleMapsReady';
      const scriptId = 'urbanoa-google-maps-sdk';
      let settled = false;
      const loadState: { timeoutId?: number } = {};

      const finish = (maps: typeof google.maps | null): void => {
        if (settled) return;
        settled = true;
        if (loadState.timeoutId !== undefined) googleWindow.clearTimeout(loadState.timeoutId);
        delete googleWindow[callbackName];
        resolve(maps);
      };

      googleWindow[callbackName] = () => finish(googleWindow.google?.maps ?? null);

      const existingScript = this.document.getElementById(scriptId) as HTMLScriptElement | null;
      const script = existingScript ?? this.document.createElement('script');
      if (!existingScript) {
        const params = new URLSearchParams({
          key: environment.googleMapsApiKey.trim(),
          loading: 'async',
          callback: callbackName,
          v: 'weekly',
        });
        script.id = scriptId;
        script.async = true;
        script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
        this.document.head.appendChild(script);
      }
      script.addEventListener('error', () => finish(null), { once: true });

      loadState.timeoutId = googleWindow.setTimeout(() => finish(null), 12_000);
    });

    return this.loadPromise;
  }
}
