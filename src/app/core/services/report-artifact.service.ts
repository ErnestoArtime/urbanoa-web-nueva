import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportArtifactService {
  private readonly _url = signal<string | null>(null);
  readonly url = this._url.asReadonly();
  private revokeTimer: ReturnType<typeof setTimeout> | undefined;

  set(blob: Blob): string {
    this.clear();
    const url = URL.createObjectURL(blob);
    this._url.set(url);
    this.revokeTimer = setTimeout(() => this.clear(), 60_000);
    return url;
  }

  clear(): void {
    const current = this._url();
    if (current) URL.revokeObjectURL(current);
    if (this.revokeTimer) clearTimeout(this.revokeTimer);
    this.revokeTimer = undefined;
    this._url.set(null);
  }
}
