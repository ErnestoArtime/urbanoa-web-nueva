import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { OpsSessionService } from '../api/ops-session.service';

@Injectable({ providedIn: 'root' })
export class ReportArtifactService {
  private readonly _url = signal<string | null>(null);
  readonly url = this._url.asReadonly();

  constructor() {
    const unsubscribe = inject(OpsSessionService).onChange(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      unsubscribe();
      this.clear();
    });
  }

  set(blob: Blob): string {
    this.clear();
    const url = URL.createObjectURL(blob);
    this._url.set(url);
    return url;
  }

  clear(): void {
    const current = this._url();
    if (current) URL.revokeObjectURL(current);
    this._url.set(null);
  }
}
